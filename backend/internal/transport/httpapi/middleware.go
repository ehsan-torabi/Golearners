package httpapi

import (
	"context"
	"crypto/subtle"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
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
// X-CSRF-Token header must match the readable gl_csrf cookie, and the cookie
// must carry a signature this server produced. Pre-auth endpoints (no gl_at
// cookie) are exempt — SameSite=Lax already prevents their cross-site abuse.
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
		// A browser attaches Origin to every cross-site state-changing request.
		// Ours must be the site's own origin; a mismatch means the request did
		// not come from our pages, whatever the cookies say.
		if origin := r.Header.Get("Origin"); origin != "" && !a.originAllowed(origin) {
			a.writeError(w, r, apperr.ErrCSRFInvalid)
			return
		}
		ck, err := r.Cookie(cookieCSRF)
		hdr := r.Header.Get("X-CSRF-Token")
		if err != nil || ck.Value == "" || hdr == "" ||
			!identity.VerifyCSRFToken(ck.Value, a.Cfg.JWTSecret) ||
			subtle.ConstantTimeCompare([]byte(ck.Value), []byte(hdr)) != 1 {
			a.writeError(w, r, apperr.ErrCSRFInvalid)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// originAllowed reports whether an Origin header names this site. The API is
// reached through the storefront's same-origin proxy, so the browser's origin
// is the public site origin, not the API's own host.
func (a *App) originAllowed(origin string) bool {
	u, err := url.Parse(origin)
	if err != nil || u.Host == "" {
		return false
	}
	base, err := url.Parse(a.Cfg.BaseURL)
	if err != nil {
		return false
	}
	return strings.EqualFold(u.Scheme, base.Scheme) && strings.EqualFold(u.Host, base.Host)
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

// clientIP resolves the caller's address.
//
// The API sits behind a reverse proxy that appends the real peer address to
// X-Forwarded-For, so the LAST entry is the one the trusted hop observed.
// Reading the first entry instead would trust a value the client chose, which
// would let anyone mint a fresh rate-limit key per request and forge the
// address recorded in the audit log.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if ip := lastForwardedIP(xff); ip != "" {
			return ip
		}
	}
	if rip := r.Header.Get("X-Real-IP"); rip != "" {
		if ip := net.ParseIP(strings.TrimSpace(rip)); ip != nil {
			return ip.String()
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// lastForwardedIP returns the right-most valid address in an
// X-Forwarded-For list, or "" when the list holds no valid address.
func lastForwardedIP(xff string) string {
	parts := strings.Split(xff, ",")
	for i := len(parts) - 1; i >= 0; i-- {
		ip := net.ParseIP(strings.TrimSpace(parts[i]))
		if ip == nil {
			continue
		}
		return ip.String()
	}
	return ""
}

// withActor stores the actor in the request context.
func withActor(r *http.Request, actor identity.Actor) context.Context {
	return context.WithValue(r.Context(), ctxKey{}, actor)
}
