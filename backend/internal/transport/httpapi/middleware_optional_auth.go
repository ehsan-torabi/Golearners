package httpapi

import (
	"net/http"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
)

// optionalAuth attaches the actor when a valid access cookie is present but
// never rejects - used by playback endpoints where anonymous previews are legal.
func (a *App) optionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(cookieAccess)
		if err != nil || c.Value == "" {
			next.ServeHTTP(w, r)
			return
		}
		userID, err := a.Signer.ParseAccess(r.Context(), c.Value)
		if err != nil {
			next.ServeHTTP(w, r) // expired/garbage token means anonymous
			return
		}
		user, err := a.Auth.Me(r.Context(), userID)
		if err != nil || user.Status != identity.StatusActive {
			next.ServeHTTP(w, r)
			return
		}
		roles, err := a.Auth.Roles(r.Context(), userID)
		if err != nil {
			a.writeError(w, r, apperr.ErrInternal.Wrap(err))
			return
		}
		actor := identity.Actor{ID: user.ID, Status: user.Status, Roles: roles}
		next.ServeHTTP(w, r.WithContext(withActor(r, actor)))
	})
}
