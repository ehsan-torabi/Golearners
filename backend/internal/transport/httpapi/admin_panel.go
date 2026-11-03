// Admin dashboard analytics + settings + users handlers.
package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
)

func auditEntryNow(actor identity.Actor, action, entityType, entityID string) ports.AuditEntry {
	id := uuid.Must(uuid.NewV7())
	aid := actor.ID
	return ports.AuditEntry{ID: id, ActorID: &aid, Action: action,
		EntityType: entityType, EntityID: &entityID}
}

// GET /api/v1/admin/analytics/summary?days=30
func (a *App) handleAnalyticsSummary(w http.ResponseWriter, r *http.Request) {
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days <= 0 || days > 365 {
		days = 30
	}
	s, err := a.Analytics.Summary(r.Context(), days)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// GET /api/v1/admin/analytics/courses
func (a *App) handleAnalyticsCourses(w http.ResponseWriter, r *http.Request) {
	list, err := a.Analytics.TopCourses(r.Context(), 10)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, list)
}

// GET /api/v1/admin/settings
func (a *App) handleAdminSettings(w http.ResponseWriter, r *http.Request) {
	all, err := a.SettingsRepo.All(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, all)
}

// PATCH /api/v1/admin/settings {key: value, ...}
func (a *App) handleAdminSettingsPatch(w http.ResponseWriter, r *http.Request) {
	var in map[string]json.RawMessage
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	actor, _ := actorFrom(r.Context())
	for key, value := range in {
		if err := a.SettingsRepo.Upsert(r.Context(), key, value); err != nil {
			a.writeError(w, r, err)
			return
		}
		e := auditEntryNow(actor, "settings.update", "settings", key)
		_ = a.Audit.Insert(r.Context(), &e)
	}
	writeData(w, map[string]any{"ok": true})
}

// GET /api/v1/admin/users?q=&page=
func (a *App) handleAdminUsers(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.UserAdmin.List(r.Context(), ports.UserAdminFilter{
		Q:      r.URL.Query().Get("q"),
		Status: r.URL.Query().Get("status"),
		Sort:   r.URL.Query().Get("sort"),
	}, page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, u := range list {
		roles, _ := a.Auth.Roles(r.Context(), u.ID)
		roleOut := make([]string, 0, len(roles))
		for _, role := range roles {
			roleOut = append(roleOut, string(role))
		}
		items = append(items, map[string]any{
			"id": u.ID, "mobile": u.Mobile, "full_name": u.FullName,
			"email": u.Email, "status": u.Status, "roles": roleOut,
			"created_at": u.CreatedAt, "last_login_at": u.LastLoginAt,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data": items, "meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

type userPatchRequest struct {
	Status     *string        `json:"status"`
	FullName   *string        `json:"full_name"`
	Email      *string        `json:"email"`
	AddRole    *identity.Role `json:"add_role"`
	RemoveRole *identity.Role `json:"remove_role"`
}

// PATCH /api/v1/admin/users/{id}
func (a *App) handleAdminUserPatch(w http.ResponseWriter, r *http.Request) {
	// role grants are owner-only; status changes admin+
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in userPatchRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	actor, _ := actorFrom(r.Context())
	changed := false
	if in.Status != nil {
		switch identity.Status(*in.Status) {
		case identity.StatusActive, identity.StatusBlocked:
		default:
			a.writeError(w, r, apperr.ErrValidation)
			return
		}
		if err := a.UserAdmin.SetStatus(r.Context(), id, identity.Status(*in.Status)); err != nil {
			a.writeError(w, r, err)
			return
		}
		e := auditEntryNow(actor, "user.status", "user", id.String())
		_ = a.Audit.Insert(r.Context(), &e)
		changed = true
	}
	if in.FullName != nil || in.Email != nil {
		var name, email *string
		if in.FullName != nil {
			trimmed := strings.TrimSpace(*in.FullName)
			name = &trimmed
		}
		if in.Email != nil {
			trimmed := strings.TrimSpace(*in.Email)
			if trimmed != "" && !strings.Contains(trimmed, "@") {
				a.writeError(w, r, apperr.ErrValidation)
				return
			}
			email = &trimmed
		}
		if err := a.UserAdmin.UpdateProfile(r.Context(), id, name, email); err != nil {
			a.writeError(w, r, err)
			return
		}
		e := auditEntryNow(actor, "user.profile", "user", id.String())
		_ = a.Audit.Insert(r.Context(), &e)
		changed = true
	}
	if in.AddRole != nil || in.RemoveRole != nil {
		if !actor.HasRole(identity.RoleOwner) {
			a.writeError(w, r, apperr.ErrForbidden)
			return
		}
		if in.AddRole != nil {
			if err := a.UserAdmin.AddRole(r.Context(), id, *in.AddRole); err != nil {
				a.writeError(w, r, err)
				return
			}
		}
		if in.RemoveRole != nil {
			if err := a.UserAdmin.RemoveRole(r.Context(), id, *in.RemoveRole); err != nil {
				a.writeError(w, r, err)
				return
			}
		}
		e := auditEntryNow(actor, "user.roles", "user", id.String())
		_ = a.Audit.Insert(r.Context(), &e)
		changed = true
	}
	if !changed {
		a.writeError(w, r, apperr.ErrValidation)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
