package httpapi

import (
	"net/http"
	"time"

	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/service/identity"
)

// Cookie contract (docs/04): httpOnly SameSite=Lax; Secure outside development.
// The refresh cookie is path-scoped to the auth endpoints only.
const (
	cookieAccess  = "gl_at"
	cookieRefresh = "gl_rt"
	cookieCSRF    = "gl_csrf"
)

func setSessionCookies(w http.ResponseWriter, cfg config.Config, s *identity.Session) {
	secure := cfg.Env == "production"
	http.SetCookie(w, &http.Cookie{
		// Path=/ so page navigations (/dashboard, /admin, ...) carry the access
		// cookie; SSR reads it from the request. /api/v1 scope would hide it
		// from every non-API route and break all server-rendered auth pages.
		Name: cookieAccess, Value: s.AccessToken, Path: "/",
		MaxAge:   int(time.Until(s.AccessExpiresAt).Seconds()),
		HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name: cookieRefresh, Value: s.RefreshToken, Path: "/api/v1/auth",
		MaxAge:   int(time.Until(s.RefreshExpiresAt).Seconds()),
		HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		// CSRF cookie must be readable by document.cookie on every page that
		// sends client-side mutations (/checkout, /admin, ...), not just /api/v1.
		Name: cookieCSRF, Value: s.CSRFToken, Path: "/",
		HttpOnly: false, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
}

func clearSessionCookies(w http.ResponseWriter, cfg config.Config) {
	secure := cfg.Env == "production"
	http.SetCookie(w, &http.Cookie{Name: cookieAccess, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode})
	http.SetCookie(w, &http.Cookie{Name: cookieAccess, Value: "", Path: "/api/v1", MaxAge: -1, HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode})
	http.SetCookie(w, &http.Cookie{Name: cookieRefresh, Value: "", Path: "/api/v1/auth", MaxAge: -1, HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode})
	http.SetCookie(w, &http.Cookie{Name: cookieCSRF, Value: "", Path: "/", MaxAge: -1, Secure: secure, SameSite: http.SameSiteLaxMode})
	// also clear the old /api/v1-scoped value from sessions issued before the path fix
	http.SetCookie(w, &http.Cookie{Name: cookieCSRF, Value: "", Path: "/api/v1", MaxAge: -1, Secure: secure, SameSite: http.SameSiteLaxMode})
}
