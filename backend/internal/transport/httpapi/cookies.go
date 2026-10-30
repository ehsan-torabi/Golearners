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
		Name: cookieAccess, Value: s.AccessToken, Path: "/api/v1",
		MaxAge:   int(time.Until(s.AccessExpiresAt).Seconds()),
		HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name: cookieRefresh, Value: s.RefreshToken, Path: "/api/v1/auth",
		MaxAge:   int(time.Until(s.RefreshExpiresAt).Seconds()),
		HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name: cookieCSRF, Value: s.CSRFToken, Path: "/api/v1",
		HttpOnly: false, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
}

func clearSessionCookies(w http.ResponseWriter, cfg config.Config) {
	secure := cfg.Env == "production"
	http.SetCookie(w, &http.Cookie{Name: cookieAccess, Value: "", Path: "/api/v1", MaxAge: -1, HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode})
	http.SetCookie(w, &http.Cookie{Name: cookieRefresh, Value: "", Path: "/api/v1/auth", MaxAge: -1, HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode})
	http.SetCookie(w, &http.Cookie{Name: cookieCSRF, Value: "", Path: "/api/v1", MaxAge: -1, Secure: secure, SameSite: http.SameSiteLaxMode})
}
