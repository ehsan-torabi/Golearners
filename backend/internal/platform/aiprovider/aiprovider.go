// Package aiprovider is the pluggable transport to LLM providers. The admin
// picks provider + base URL + key + model in the panel; the assistant service
// only sees Chat(). All providers speak JSON-in/JSON-out for the draft
// pipeline, enforced by prompts and lenient extraction, not by vendor flags.
package aiprovider

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Known provider ids (settings key "ai" → provider).
const (
	ProviderOpenAI    = "openai"    // OpenAI-compatible /chat/completions (OpenAI, OpenRouter, Ollama, vLLM, …)
	ProviderAnthropic = "anthropic" // native /v1/messages
	ProviderGemini    = "gemini"    // generativelanguage generateContent
	ProviderMock      = "mock"      // deterministic local stub for tests/E2E
)

// Defaults per provider when base_url is left empty.
const (
	DefaultOpenAIBase    = "https://api.openai.com/v1"
	DefaultAnthropicBase = "https://api.anthropic.com"
	DefaultGeminiBase    = "https://generativelanguage.googleapis.com"
)

// Config is the provider-facing slice of the "ai" settings row.
type Config struct {
	Provider    string
	BaseURL     string
	APIKey      string
	Model       string
	Temperature float64
	MaxTokens   int
}

// Request is one assistant turn.
type Request struct {
	System      string
	User        string
	Temperature float64
	MaxTokens   int
}

// Response carries the text plus metering data.
type Response struct {
	Text             string
	PromptTokens     int
	CompletionTokens int
}

// Client is one configured provider.
type Client interface {
	Chat(ctx context.Context, req Request) (Response, error)
}

// New builds the client for cfg.Provider.
func New(cfg Config) (Client, error) {
	switch cfg.Provider {
	case ProviderOpenAI:
		return newOpenAI(cfg), nil
	case ProviderAnthropic:
		return newAnthropic(cfg), nil
	case ProviderGemini:
		return newGemini(cfg), nil
	case ProviderMock:
		return &mock{}, nil
	default:
		return nil, fmt.Errorf("unknown provider %q", cfg.Provider)
	}
}

// ModelSuggestions feeds the settings autocomplete per provider.
func ModelSuggestions(provider string) []string {
	switch provider {
	case ProviderOpenAI:
		return []string{"gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1", "gpt-4o",
			"o4-mini", "deepseek-chat", "meta-llama/llama-3.3-70b-instruct"}
	case ProviderAnthropic:
		return []string{"claude-sonnet-4-5", "claude-haiku-4-5", "claude-3-7-sonnet-latest"}
	case ProviderGemini:
		return []string{"gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"}
	case ProviderMock:
		return []string{"mock"}
	default:
		return nil
	}
}

// httpClient is shared; generation calls are long, transport is short.
var httpClient = &http.Client{Timeout: 150 * time.Second}

// parseProviderReply decodes a provider body into T. Gateways occasionally
// trail the JSON (SSE remnants, banners, encoding issues); when the strict
// decode fails we salvage the first JSON object, and the error always
// carries a body snippet so «تست اتصال» can show what actually came back.
func parseProviderReply[T any](raw []byte) (T, error) {
	var out T
	if err := json.Unmarshal(raw, &out); err == nil {
		return out, nil
	}
	if obj, xerr := ExtractJSONObject(string(raw)); xerr == nil {
		if err := json.Unmarshal(obj, &out); err == nil {
			return out, nil
		}
	}
	snippet := strings.TrimSpace(string(raw))
	if len(snippet) > 200 {
		snippet = snippet[:200]
	}
	return out, fmt.Errorf("پاسخ سرویس‌دهنده JSON معتبر نیست: %s", snippet)
}

// postJSON sends one provider request and returns the raw body. Provider
// errors surface with a body snippet so the panel can show the real cause.
func postJSON(ctx context.Context, url string, headers map[string]string, body any) ([]byte, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal provider request: %w", err)
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(payload)))
	if err != nil {
		return nil, fmt.Errorf("build provider request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		httpReq.Header.Set(k, v)
	}
	resp, err := httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("ارسال درخواست به سرویس‌دهنده ناموفق بود: %w", err)
	}
	defer resp.Body.Close()
	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read provider response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		snippet := string(bodyBytes)
		if len(snippet) > 300 {
			snippet = snippet[:300]
		}
		return nil, fmt.Errorf("سرویس‌دهنده خطای %d برگرداند: %s", resp.StatusCode, snippet)
	}
	return bodyBytes, nil
}

// ExtractJSONObject finds the first balanced JSON object in a model reply,
// tolerating code fences and chatter around it.
func ExtractJSONObject(text string) ([]byte, error) {
	start := strings.Index(text, "{")
	if start < 0 {
		return nil, fmt.Errorf("model reply holds no JSON object")
	}
	depth := 0
	inString := false
	escaped := false
	for i := start; i < len(text); i++ {
		c := text[i]
		if inString {
			switch {
			case escaped:
				escaped = false
			case c == '\\':
				escaped = true
			case c == '"':
				inString = false
			}
			continue
		}
		switch c {
		case '"':
			inString = true
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return []byte(text[start : i+1]), nil
			}
		}
	}
	return nil, fmt.Errorf("model reply holds an unterminated JSON object")
}
