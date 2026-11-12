package aiassist

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/platform/aiprovider"
	"golearn/backend/internal/ports"
)

// GenerateRequest is the panel payload for one assistant run.
type GenerateRequest struct {
	Kind         string     `json:"kind"`
	TargetType   string     `json:"target_type"` // "" | post | course
	TargetID     *uuid.UUID `json:"target_id"`
	Instructions string     `json:"instructions"`
}

const (
	// generationTimeout bounds one provider call; the panel keeps the
	// request open until this fires.
	generationTimeout = 120 * time.Second
	// contextBodyCap keeps huge posts from blowing the provider budget.
	contextBodyCap = 6000
)

// Generate runs one provider call and stores the result as a draft. Content
// kinds land as "pending" for the approval flow; report kinds land as
// "ready" and never mutate anything.
func (s *Service) Generate(ctx context.Context, actor Actor, req GenerateRequest) (*ports.AIDraft, error) {
	settings, err := s.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	if !settings.Enabled {
		return nil, apperr.ErrAIDisabled
	}
	cfg, _, err := s.providerConfig(ctx)
	if err != nil {
		return nil, err
	}
	client, err := aiprovider.New(*cfg)
	if err != nil {
		return nil, apperr.ErrValidation.Wrap(err)
	}

	build := s.builderFor(req)
	if build == nil {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("kind %q", req.Kind))
	}
	plan, err := build(ctx, req)
	if err != nil {
		return nil, err
	}

	genCtx, cancel := context.WithTimeout(ctx, generationTimeout)
	defer cancel()
	start := time.Now()
	resp, callErr := client.Chat(genCtx, aiprovider.Request{
		System:      s.systemPrompt(settings.Persona),
		User:        plan.userPrompt,
		Temperature: cfg.Temperature,
		MaxTokens:   cfg.MaxTokens,
	})
	duration := int(time.Since(start).Milliseconds())

	usageErr := ""
	if callErr != nil {
		usageErr = callErr.Error()
		if len(usageErr) > 400 {
			usageErr = usageErr[:400]
		}
	}
	_ = s.d.Usage.Insert(ctx, req.Kind, settings.Provider, cfg.Model, callErr == nil,
		resp.PromptTokens, resp.CompletionTokens, duration, usageErr)
	if callErr != nil {
		return nil, apperr.ErrAIProviderFailed.Wrap(callErr)
	}

	draft, err := s.buildDraft(ctx, actor, req, plan, resp, settings, cfg.Model)
	if err != nil {
		return nil, err
	}
	if err := s.d.Drafts.Create(ctx, draft); err != nil {
		return nil, err
	}
	s.audit(ctx, actor, "ai.draft.generate", draft.ID, map[string]any{
		"kind": draft.Kind, "action": draft.Action, "target_id": draft.TargetID,
	})
	return draft, nil
}

// buildDraft turns the provider reply into a stored draft: strict-enough
// parsing, sanitization, and a no-op guard against "identical content".
func (s *Service) buildDraft(ctx context.Context, actor Actor, req GenerateRequest, plan genPlan,
	resp aiprovider.Response, settings Settings, model string) (*ports.AIDraft, error) {

	obj, err := aiprovider.ExtractJSONObject(resp.Text)
	if err != nil {
		return nil, apperr.ErrAIProviderFailed.Wrap(err)
	}
	var reply struct {
		ChangeSummary string `json:"change_summary"`
		ChangeNotes   string `json:"change_notes"`
	}
	_ = json.Unmarshal(obj, &reply)

	proposed, status, err := s.normalizeKind(ctx, req, plan, obj)
	if err != nil {
		return nil, err
	}
	summary := strings.TrimSpace(reply.ChangeSummary)
	if summary == "" {
		summary = kindDefaultSummary(req.Kind)
	}

	action := "none"
	switch req.Kind {
	case ports.AIKindBlogPost:
		if plan.original != nil {
			action = "update"
		} else {
			action = "create"
		}
	case ports.AIKindCourseCopy:
		action = "update"
	case ports.AIKindSEO:
		action = "update"
	}

	draft := &ports.AIDraft{
		Kind: req.Kind, Action: action,
		TargetType: plan.targetType, TargetID: req.TargetID,
		TargetLabel: plan.targetLabel, Status: status,
		Summary: truncate(summary, 300),
		Notes:   truncate(strings.TrimSpace(reply.ChangeNotes), 1000),
		Instructions: truncate(strings.TrimSpace(req.Instructions), 2000),
		Proposed: proposed,
		Provider: settings.Provider, Model: model,
		PromptTokens: resp.PromptTokens, CompletionTokens: resp.CompletionTokens,
		CreatedBy: &actor.ID,
	}
	if plan.original != nil {
		draft.Original = plan.original
	}
	return draft, nil
}

// normalizeKind maps the raw reply onto a typed payload per kind and returns
// the stored status (pending for mutations, ready for reports).
func (s *Service) normalizeKind(ctx context.Context, req GenerateRequest,
	plan genPlan, obj []byte) (json.RawMessage, string, error) {

	switch req.Kind {
	case ports.AIKindBlogPost:
		var p blogPayload
		if err := json.Unmarshal(obj, &p); err != nil {
			return nil, "", apperr.ErrAIProviderFailed.Wrap(err)
		}
		p.BodyHTML = s.d.Sanitize(p.BodyHTML)
		p.Title = strings.TrimSpace(p.Title)
		p.Slug = strings.TrimSpace(p.Slug)
		if plan.original == nil && len([]rune(p.Title)) < 3 {
			return nil, "", apperr.ErrAIProviderFailed.Wrap(fmt.Errorf("مدل عنوانی برنگرداند"))
		}
		return mustJSONRaw(p), ports.AIStatusPending, s.assertChanged(plan.original, &p, []string{"title", "excerpt", "body_html", "meta_title", "meta_description", "slug"})

	case ports.AIKindCourseCopy:
		var p coursePayload
		if err := json.Unmarshal(obj, &p); err != nil {
			return nil, "", apperr.ErrAIProviderFailed.Wrap(err)
		}
		p.DescriptionHTML = s.d.Sanitize(p.DescriptionHTML)
		p.Title = strings.TrimSpace(p.Title)
		return mustJSONRaw(p), ports.AIStatusPending, s.assertChanged(plan.original, &p, []string{"title", "summary", "description_html", "outcomes"})

	case ports.AIKindSEO:
		var p seoPayload
		if err := json.Unmarshal(obj, &p); err != nil {
			return nil, "", apperr.ErrAIProviderFailed.Wrap(err)
		}
		return mustJSONRaw(p), ports.AIStatusPending, s.assertChanged(plan.original, &p, []string{"meta_title", "meta_description"})

	case ports.AIKindStatsReport, ports.AIKindFreeform:
		var p reportPayload
		if err := json.Unmarshal(obj, &p); err != nil {
			return nil, "", apperr.ErrAIProviderFailed.Wrap(err)
		}
		if strings.TrimSpace(p.Markdown) == "" {
			return nil, "", apperr.ErrAIProviderFailed.Wrap(fmt.Errorf("مدل متنی برنگرداند"))
		}
		return mustJSONRaw(p), ports.AIStatusReady, nil

	default:
		return nil, "", apperr.ErrValidation.Wrap(fmt.Errorf("kind %q", req.Kind))
	}
}

// assertChanged refuses drafts identical to the current content on every
// meaningful field, so the worklist never fills with no-op proposals.
// Payload structs marshal with omitempty, so an untouched field is simply
// absent from the proposal.
func (s *Service) assertChanged(original json.RawMessage, proposed any, fields []string) error {
	if original == nil {
		return nil
	}
	var cur map[string]json.RawMessage
	_ = json.Unmarshal(original, &cur)
	propBytes, _ := json.Marshal(proposed)
	var prop map[string]json.RawMessage
	_ = json.Unmarshal(propBytes, &prop)
	for _, f := range fields {
		propVal, hasProp := prop[f]
		if !hasProp || jsonValueIsEmpty(propVal) {
			continue // the model left this field alone
		}
		origVal, hasOrig := cur[f]
		if !hasOrig || !equalJSON(origVal, propVal) {
			return nil // at least one meaningful change
		}
	}
	return apperr.ErrAINoChange
}

func jsonValueIsEmpty(raw json.RawMessage) bool {
	s := strings.TrimSpace(string(raw))
	return s == "" || s == `""` || s == "null" || s == "[]"
}

func equalJSON(a, b json.RawMessage) bool {
	return strings.TrimSpace(string(a)) == strings.TrimSpace(string(b))
}

func kindDefaultSummary(kind string) string {
	switch kind {
	case ports.AIKindBlogPost:
		return "پیشنهاد نوشتهٔ مجله ساخته شد."
	case ports.AIKindCourseCopy:
		return "پیشنهاد محتوای صفحهٔ دوره ساخته شد."
	case ports.AIKindSEO:
		return "پیشنهاد سئو ساخته شد."
	case ports.AIKindStatsReport:
		return "گزارش تحلیل آمار آماده شد."
	default:
		return "پاسخ دستیار آماده شد."
	}
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n-1]) + "…"
}

func mustJSONRaw(v any) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}

func capBody(html string) string {
	r := []rune(html)
	if len(r) <= contextBodyCap {
		return html
	}
	return string(r[:contextBodyCap]) + "… [کوتاه‌شده]"
}
