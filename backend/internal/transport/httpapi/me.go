package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
	idsvc "golearn/backend/internal/service/identity"
)

type userResponse struct {
	ID        string    `json:"id"`
	Mobile    string    `json:"mobile"`
	Email     *string   `json:"email"`
	FullName  string    `json:"full_name"`
	Roles     []string  `json:"roles"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

func (a *App) userPayload(ctx context.Context, u *identity.User) userResponse {
	roles, err := a.Auth.Roles(ctx, u.ID)
	if err != nil {
		roles = nil
	}
	out := userResponse{
		ID: u.ID.String(), Mobile: u.Mobile, Email: u.Email, FullName: u.FullName,
		Status: string(u.Status), CreatedAt: u.CreatedAt, Roles: []string{},
	}
	for _, r := range roles {
		out.Roles = append(out.Roles, string(r))
	}
	return out
}

// GET /api/v1/me
func (a *App) handleMe(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	u, err := a.Auth.Me(r.Context(), actor.ID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, a.userPayload(r.Context(), u))
}

type passwordChangeRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// POST /api/v1/auth/password/change — authed; revokes all sessions (re-login required).
func (a *App) handlePasswordChange(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	var in passwordChangeRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	err := a.Auth.ChangePassword(r.Context(), idsvc.ChangePasswordInput{
		UserID: actor.ID, CurrentPassword: in.CurrentPassword, NewPassword: in.NewPassword,
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	clearSessionCookies(w, a.Cfg)
	writeJSON(w, http.StatusOK, map[string]any{"message": "رمز عبور تغییر کرد؛ دوباره وارد شوید."})
}

// decodeJSON parses a bounded JSON body (64 KiB cap, unknown fields rejected).
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<16)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return apperr.ErrValidation.Wrap(err)
	}
	return nil
}
