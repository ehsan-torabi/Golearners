package httpapi

import (
	"context"
	"crypto/subtle"
	"net"
	"net/http"
	"strconv"
	"time"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
)

type ctxKey struct{}

// actorFrom returns the authenticated principal, if any.
func actorFrom(ctx context.Context) (identity.Actor, bool) {
	actor, ok := ctx.Value(ctxKey{}).(identity.Actor)
	return actor, ok
}

// requireAuth authenticates via the gl_at access cookie and loads a fresh
// actor (status + roles) from the store, so blocks and role changes apply
// immediately. 401 without a valid session; 403 when blocked.
func (a *App) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(cookieAccess)
		if err != nil || c.Value == "" {
			a.writeError(w, r, apperr.ErrUnauthenticated)
			return
		}
		userID, err := a.Signer.ParseAccess(r.Context(), c.Value)
		if err != nil {
			a.writeError(w, r, apperr.ErrUnauthenticated)
			return
		}
		user, err := a.Auth.Me(r.Context(), userID)
		if err != nil {
			a.writeError(w, r, apperr.ErrUnauthenticated)
			return
		}
		if user.Status != identity.StatusActive {
			a.writeError(w, r, apperr.ErrAccountBlocked)
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

// requireRoles gates a route behind any-of the given roles (owner >= admin).
func (a *App) requireRoles(roles ...identity.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			actor, ok := actorFrom(r.Context())
			if !ok {
				a.writeError(w, r, apperr.ErrUnauthenticated)
				return
			}
			for _, want := range roles {
				if actor.HasRole(want) {
					next.ServeHTTP(w, r)
					return
				}
			}
			a.writeError(w, r, apperr.ErrForbidden)
		})
	}
}

// csrf enforces double-submit protection on authenticated mutations: the
// X-CSRF-Token header must match the readable gl_csrf cookie. Pre-auth
// endpoints (no gl_at cookie) are exempt — SameSite=Lax already prevents
// their cross-site abuse.
func (a *App) csrf(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		if _, err := r.Cookie(cookieAccess); err != nil {
			next.ServeHTTP(w, r) // not an authenticated mutation
			return
		}
		ck, err := r.Cookie(cookieCSRF)
		hdr := r.Header.Get("X-CSRF-Token")
		if err != nil || ck.Value == "" || hdr == "" ||
			subtle.ConstantTimeCompare([]byte(ck.Value), []byte(hdr)) != 1 {
			a.writeError(w, r, apperr.ErrCSRFInvalid)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// rateLimit throttles by client IP per route class.
func (a *App) rateLimit(name string, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			allowed, retryAfter, err := a.Throttle.Hit(r.Context(), name+":"+clientIP(r), limit, window)
			if err != nil {
				a.writeError(w, r, apperr.ErrInternal.Wrap(err))
				return
			}
			if !allowed {
				if retryAfter > 0 {
					w.Header().Set("Retry-After", strconv.FormatInt(int64(retryAfter.Seconds()), 10))
				}
				a.writeError(w, r, apperr.ErrRateLimited)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// withActor stores the actor in the request context.
func withActor(r *http.Request, actor identity.Actor) context.Context {
	return context.WithValue(r.Context(), ctxKey{}, actor)
}
