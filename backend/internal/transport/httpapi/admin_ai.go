// Admin AI assistant handlers: provider settings, generation, and the
// draft decision endpoints. Everything sits behind requireRoles(Admin,Owner)
// and the standard CSRF gate; generation is rate-limited because each call
// spends provider tokens.
package httpapi

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/aiassist"
)

// GET /api/v1/admin/ai/settings
func (a *App) handleAISettingsGet(w http.ResponseWriter, r *http.Request) {
	settings, err := a.AI.GetSettings(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, settings)
}

type aiSettingsPayload struct {
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

// PUT /api/v1/admin/ai/settings
func (a *App) handleAISettingsPut(w http.ResponseWriter, r *http.Request) {
	var in aiSettingsPayload
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	settings, err := a.AI.SaveSettings(r.Context(), contentActor(r), aiassist.SettingsUpdate(in))
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, settings)
}

// POST /api/v1/admin/ai/settings/test
func (a *App) handleAISettingsTest(w http.ResponseWriter, r *http.Request) {
	out, err := a.AI.TestConnection(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, out)
}

// GET /api/v1/admin/ai/models — best-effort autocomplete source.
func (a *App) handleAIModels(w http.ResponseWriter, r *http.Request) {
	models, err := a.AI.ListModels(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, models)
}

type aiGeneratePayload struct {
	Kind         string     `json:"kind"`
	TargetType   string     `json:"target_type"`
	TargetID     *uuid.UUID `json:"target_id"`
	Instructions string     `json:"instructions"`
}

// POST /api/v1/admin/ai/generate — synchronous; returns the stored draft.
func (a *App) handleAIGenerate(w http.ResponseWriter, r *http.Request) {
	var in aiGeneratePayload
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	draft, err := a.AI.Generate(r.Context(), contentActor(r), aiassist.GenerateRequest(in))
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, draft)
}

func aiDraftFilter(r *http.Request) ports.AIDraftFilter {
	return ports.AIDraftFilter{
		Status: r.URL.Query().Get("status"),
		Kind:   r.URL.Query().Get("kind"),
	}
}

// GET /api/v1/admin/ai/drafts?status=&kind=&page=
func (a *App) handleAIDraftsList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	f := aiDraftFilter(r)
	drafts, total, err := a.AI.List(r.Context(), f, page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data": drafts, "meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

// GET /api/v1/admin/ai/drafts/{id}
func (a *App) handleAIDraftGet(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	draft, err := a.AI.ByID(r.Context(), id)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, draft)
}

// POST /api/v1/admin/ai/drafts/{id}/approve — applies the shown diff.
func (a *App) handleAIDraftApprove(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	draft, err := a.AI.Approve(r.Context(), contentActor(r), id)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, draft)
}

// POST /api/v1/admin/ai/drafts/{id}/reject
func (a *App) handleAIDraftReject(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	draft, err := a.AI.Reject(r.Context(), contentActor(r), id)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, draft)
}

// DELETE /api/v1/admin/ai/drafts/{id} — remove from the worklist.
func (a *App) handleAIDraftDelete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.AI.Delete(r.Context(), contentActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/v1/admin/ai/usage?days=30
func (a *App) handleAIUsage(w http.ResponseWriter, r *http.Request) {
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	sum, daily, err := a.AI.Usage(r.Context(), days)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, map[string]any{"summary": sum, "daily": daily})
}
