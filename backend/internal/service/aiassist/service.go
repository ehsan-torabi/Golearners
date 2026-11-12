// Package aiassist implements the admin AI assistant: provider configuration
// (settings key "ai"), draft generation for blog/course/SEO content and
// read-only stats reports, and the approve→apply pipeline. Nothing touches
// posts or courses until an admin approves the shown diff (docs/04).
package aiassist

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/platform/aiprovider"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/contentadmin"
	"golearn/backend/internal/service/courseadmin"
)

// Deps wires the assistant to the rest of the app.
type Deps struct {
	Settings ports.SettingsRepo
	Drafts   ports.AIDraftRepo
	Usage    ports.AIUsageRepo

	Posts    ports.BlogPostRepo
	Courses  ports.CourseRepo
	Cats     ports.CategoryRepo
	Stats    ports.CourseStatsRepo
	Analytics ports.AnalyticsRepo

	Content     *contentadmin.Service
	CourseAdmin *courseadmin.Service
	Audit       ports.AuditRepo

	// ServerSecret is cfg.JWTSecret; the provider API key is sealed with it.
	ServerSecret string
	Sanitize     func(string) string
}

type Service struct{ d Deps }

func NewService(d Deps) *Service { return &Service{d: d} }

// Actor identifies the deciding admin for audit rows (same shape the content
// services use).
type Actor = contentadmin.Actor

// Settings is the panel-facing shape (masked: never carries the sealed key).
type Settings struct {
	Enabled     bool    `json:"enabled"`
	Provider    string  `json:"provider"`
	BaseURL     string  `json:"base_url"`
	APIKeySet   bool    `json:"api_key_set"`
	APIKeyLast4 string  `json:"api_key_last4"`
	Model       string  `json:"model"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"max_tokens"`
	Persona     string  `json:"persona"`
}

// storedSettings is the settings-KV shape; APIKeyEnc never leaves the server.
type storedSettings struct {
	Enabled     bool    `json:"enabled"`
	Provider    string  `json:"provider"`
	BaseURL     string  `json:"base_url"`
	APIKeyEnc   string  `json:"api_key_enc,omitempty"`
	APIKeyLast4 string  `json:"api_key_last4,omitempty"`
	Model       string  `json:"model"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"max_tokens"`
	Persona     string  `json:"persona"`
}

const settingsKey = "ai"

func defaultSettings() Settings {
	return Settings{
		Provider:    aiprovider.ProviderOpenAI,
		Model:       "gpt-4o-mini",
		Temperature: 0.6,
		MaxTokens:   3000,
	}
}

// GetSettings loads and masks the assistant configuration.
func (s *Service) GetSettings(ctx context.Context) (Settings, error) {
	stored, err := s.loadStored(ctx)
	if err != nil {
		return Settings{}, err
	}
	out := defaultSettings()
	if stored != nil {
		out = Settings{
			Enabled: stored.Enabled, Provider: stored.Provider, BaseURL: stored.BaseURL,
			APIKeySet: stored.APIKeyEnc != "", APIKeyLast4: stored.APIKeyLast4,
			Model: stored.Model, Temperature: stored.Temperature,
			MaxTokens: stored.MaxTokens, Persona: stored.Persona,
		}
	}
	return out, nil
}

// SettingsUpdate is the PUT payload. APIKey empty = keep the stored one.
type SettingsUpdate struct {
	Enabled     bool    `json:"enabled"`
	Provider    string  `json:"provider"`
	BaseURL     string  `json:"base_url"`
	APIKey      string  `json:"api_key"`
	ClearAPIKey bool    `json:"clear_api_key"`
	Model       string  `json:"model"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"max_tokens"`
	Persona     string  `json:"persona"`
}

// SaveSettings validates and persists the assistant configuration.
func (s *Service) SaveSettings(ctx context.Context, actor Actor, in SettingsUpdate) (Settings, error) {
	switch in.Provider {
	case aiprovider.ProviderOpenAI, aiprovider.ProviderAnthropic,
		aiprovider.ProviderGemini, aiprovider.ProviderMock:
	default:
		return Settings{}, apperr.ErrAIProvider
	}
	if in.Model == "" || len(in.Model) > 120 {
		return Settings{}, apperr.ErrAIModel
	}
	if in.Temperature < 0 || in.Temperature > 1.5 {
		return Settings{}, apperr.ErrAITemperature
	}
	if in.MaxTokens < 100 || in.MaxTokens > 16000 {
		return Settings{}, apperr.ErrAIMaxTokens
	}
	if in.BaseURL != "" && !strings.HasPrefix(in.BaseURL, "http://") &&
		!strings.HasPrefix(in.BaseURL, "https://") {
		return Settings{}, apperr.ErrAIBaseURL
	}
	if len(in.Persona) > 4000 {
		return Settings{}, apperr.ErrValidation.Wrap(fmt.Errorf("persona exceeds 4000 characters"))
	}

	stored, err := s.loadStored(ctx)
	if err != nil {
		return Settings{}, err
	}
	next := storedSettings{
		Enabled: in.Enabled, Provider: in.Provider, BaseURL: strings.TrimSpace(in.BaseURL),
		Model: strings.TrimSpace(in.Model), Temperature: in.Temperature,
		MaxTokens: in.MaxTokens, Persona: strings.TrimSpace(in.Persona),
	}
	if stored != nil && in.Provider == stored.Provider {
		// keep base/key across re-saves unless the admin replaced them
		if next.BaseURL == "" {
			next.BaseURL = stored.BaseURL
		}
	}
	switch {
	case in.ClearAPIKey:
		// leave both empty
	case in.APIKey != "":
		sealed, err := aiprovider.EncryptAPIKey(s.d.ServerSecret, strings.TrimSpace(in.APIKey))
		if err != nil {
			return Settings{}, apperr.ErrInternal.Wrap(err)
		}
		next.APIKeyEnc = sealed
		next.APIKeyLast4 = aiprovider.MaskAPIKey(in.APIKey)
	default:
		if stored != nil && in.Provider == stored.Provider {
			next.APIKeyEnc = stored.APIKeyEnc
			next.APIKeyLast4 = stored.APIKeyLast4
		}
	}
	raw, err := json.Marshal(next)
	if err != nil {
		return Settings{}, apperr.ErrInternal.Wrap(err)
	}
	if err := s.d.Settings.Upsert(ctx, settingsKey, raw); err != nil {
		return Settings{}, apperr.ErrInternal.Wrap(err)
	}
	if s.d.Audit != nil {
		aid := actor.ID
		_ = s.d.Audit.Insert(ctx, &ports.AuditEntry{
			ID: uuid.Must(uuid.NewV7()), ActorID: &aid,
			Action: "ai.settings.update", EntityType: "settings", EntityID: strPtr(settingsKey),
		})
	}
	out := Settings{
		Enabled: next.Enabled, Provider: next.Provider, BaseURL: next.BaseURL,
		APIKeySet: next.APIKeyEnc != "", APIKeyLast4: next.APIKeyLast4,
		Model: next.Model, Temperature: next.Temperature,
		MaxTokens: next.MaxTokens, Persona: next.Persona,
	}
	return out, nil
}

// TestConnection sends one tiny request with the stored configuration.
func (s *Service) TestConnection(ctx context.Context) (map[string]any, error) {
	cfg, provider, err := s.providerConfig(ctx)
	if err != nil {
		return nil, err
	}
	client, err := aiprovider.New(*cfg)
	if err != nil {
		return nil, apperr.ErrValidation.Wrap(err)
	}
	// bound the probe: a hanging gateway must not hang the panel button
	probeCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	start := time.Now()
	_, err = client.Chat(probeCtx, aiprovider.Request{
		System:      "یک کلمه پاسخ بده.",
		User:        "سلام",
		MaxTokens:   16,
		Temperature: 0,
	})
	latency := time.Since(start).Milliseconds()
	out := map[string]any{"ok": err == nil, "latency_ms": latency, "provider": provider, "model": cfg.Model}
	if err != nil {
		out["error"] = err.Error()
	}
	return out, nil
}

// ListModels feeds the settings autocomplete; failures degrade to empty.
func (s *Service) ListModels(ctx context.Context) ([]string, error) {
	cfg, _, err := s.providerConfig(ctx)
	if err != nil {
		return nil, err
	}
	client, err := aiprovider.New(*cfg)
	if err != nil {
		return nil, apperr.ErrValidation.Wrap(err)
	}
	return aiprovider.ListModels(ctx, client)
}

func (s *Service) providerConfig(ctx context.Context) (*aiprovider.Config, string, error) {
	settings, err := s.GetSettings(ctx)
	if err != nil {
		return nil, "", err
	}
	stored, err := s.loadStored(ctx)
	if err != nil {
		return nil, "", err
	}
	key := ""
	if stored != nil {
		key, err = aiprovider.DecryptAPIKey(s.d.ServerSecret, stored.APIKeyEnc)
		if err != nil {
			return nil, "", apperr.ErrInternal.Wrap(err)
		}
	}
	return &aiprovider.Config{
		Provider: settings.Provider, BaseURL: settings.BaseURL, APIKey: key,
		Model: settings.Model, Temperature: settings.Temperature, MaxTokens: settings.MaxTokens,
	}, settings.Provider, nil
}

func (s *Service) loadStored(ctx context.Context) (*storedSettings, error) {
	all, err := s.d.Settings.All(ctx)
	if err != nil {
		return nil, apperr.ErrInternal.Wrap(err)
	}
	raw, ok := all[settingsKey]
	if !ok || len(raw) == 0 {
		return nil, nil
	}
	var st storedSettings
	if err := json.Unmarshal(raw, &st); err != nil {
		return nil, apperr.ErrInternal.Wrap(fmt.Errorf("settings %s: %w", settingsKey, err))
	}
	return &st, nil
}

func strPtr(v string) *string { return &v }

func (s *Service) audit(ctx context.Context, actor Actor, action string, draftID int64, after any) {
	if s.d.Audit == nil {
		return
	}
	aid := actor.ID
	_ = s.d.Audit.Insert(ctx, &ports.AuditEntry{
		ID: uuid.Must(uuid.NewV7()), ActorID: &aid, Action: action,
		EntityType: "ai_draft", EntityID: strPtr(fmt.Sprint(draftID)),
		After: mustJSON(after),
	})
}

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

func isNotFound(err error) bool {
	return errors.Is(err, ports.ErrNotFound)
}
