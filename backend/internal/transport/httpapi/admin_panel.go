// Admin dashboard analytics + settings + users handlers.
package httpapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/commerce"
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

// GET /api/v1/admin/settings — only the keys this endpoint owns. Other
// consumers (the AI assistant) store their config in the same KV table under
// their own key and serve it from their own masked endpoint, so echoing
// unknown keys here would both leak them and break the PATCH round-trip.
func (a *App) handleAdminSettings(w http.ResponseWriter, r *http.Request) {
	all, err := a.SettingsRepo.All(r.Context())
	if err != nil {
		a.writeError(w, r, apperr.ErrInternal.Wrap(err))
		return
	}
	owned := make(map[string]json.RawMessage, len(all))
	for _, key := range []string{settingsKeySite, settingsKeySEO, settingsKeyGateways} {
		if v, ok := all[key]; ok {
			owned[key] = v
		}
	}
	writeJSON(w, http.StatusOK, owned)
}

// Writable setting keys. Anything else is rejected: the settings table is a
// free-form key/value store, so without an allowlist an admin could store
// arbitrary keys that later code might read as configuration.
const (
	settingsKeySite     = "site"
	settingsKeySEO      = "seo"
	settingsKeyGateways = "gateways"
)

// ownerOnlySettings may only be written by an owner: the gateway switches
// decide which payment provider takes real money (docs/07 threat model).
var ownerOnlySettings = map[string]struct{}{
	settingsKeyGateways: {},
}

// siteSettings / seoSettings / gatewaySettings are the accepted shapes. A
// payload with an unknown field or a wrong type is rejected rather than
// stored.
type siteSettings struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	MaintenanceMode bool   `json:"maintenance_mode"`
}

type seoSettings struct {
	MetaTitle       string            `json:"meta_title"`
	MetaDescription string            `json:"meta_description"`
	OGImage         *string           `json:"og_image"`
	Socials         map[string]string `json:"socials"`
}

type gatewaySettings struct {
	Default string   `json:"default"`
	Enabled []string `json:"enabled"`
}

// knownGateways are the payment gateways the platform can name in settings.
var knownGateways = map[string]struct{}{
	string(commerce.GatewayZarinpal): {},
	string(commerce.GatewayDigipay):  {},
	string(commerce.GatewaySnappay):  {},
	string(commerce.GatewayMock):     {},
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
		if _, ownerOnly := ownerOnlySettings[key]; ownerOnly && !actor.HasRole(identity.RoleOwner) {
			a.writeError(w, r, apperr.ErrForbidden)
			return
		}
		if err := validateSetting(key, value); err != nil {
			a.writeError(w, r, apperr.ErrValidation.Wrap(err))
			return
		}
	}
	for key, value := range in {
		if err := a.SettingsRepo.Upsert(r.Context(), key, value); err != nil {
			a.writeError(w, r, apperr.ErrInternal.Wrap(err))
			return
		}
		e := auditEntryNow(actor, "settings.update", "settings", key)
		_ = a.Audit.Insert(r.Context(), &e)
	}
	writeData(w, map[string]any{"ok": true})
}

// validateSetting checks a single settings entry against its allowed shape.
func validateSetting(key string, value json.RawMessage) error {
	switch key {
	case settingsKeySite:
		var v siteSettings
		if err := strictUnmarshal(value, &v); err != nil {
			return fmt.Errorf("site: %w", err)
		}
		if len(v.Title) > 200 {
			return fmt.Errorf("site.title exceeds 200 characters")
		}
		if len(v.Description) > 1000 {
			return fmt.Errorf("site.description exceeds 1000 characters")
		}
	case settingsKeySEO:
		var v seoSettings
		if err := strictUnmarshal(value, &v); err != nil {
			return fmt.Errorf("seo: %w", err)
		}
		if len(v.MetaTitle) > 200 {
			return fmt.Errorf("seo.meta_title exceeds 200 characters")
		}
		if len(v.MetaDescription) > 500 {
			return fmt.Errorf("seo.meta_description exceeds 500 characters")
		}
		if v.OGImage != nil && len(*v.OGImage) > 500 {
			return fmt.Errorf("seo.og_image exceeds 500 characters")
		}
		if len(v.Socials) > 20 {
			return fmt.Errorf("seo.socials holds more than 20 entries")
		}
		for k, val := range v.Socials {
			if len(k) > 64 || len(val) > 200 {
				return fmt.Errorf("seo.socials entry exceeds its length limit")
			}
		}
	case settingsKeyGateways:
		var v gatewaySettings
		if err := strictUnmarshal(value, &v); err != nil {
			return fmt.Errorf("gateways: %w", err)
		}
		if v.Default != "" {
			if _, ok := knownGateways[v.Default]; !ok {
				return fmt.Errorf("gateways.default names an unknown gateway")
			}
		}
		if len(v.Enabled) > 10 {
			return fmt.Errorf("gateways.enabled holds more than 10 entries")
		}
		seen := map[string]struct{}{}
		for _, g := range v.Enabled {
			if _, ok := knownGateways[g]; !ok {
				return fmt.Errorf("gateways.enabled names an unknown gateway")
			}
			if _, dup := seen[g]; dup {
				return fmt.Errorf("gateways.enabled repeats a gateway")
			}
			seen[g] = struct{}{}
		}
	default:
		return fmt.Errorf("unknown settings key %q", key)
	}
	return nil
}

// strictUnmarshal decodes JSON into dst and rejects unknown fields.
func strictUnmarshal(raw json.RawMessage, dst any) error {
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
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
