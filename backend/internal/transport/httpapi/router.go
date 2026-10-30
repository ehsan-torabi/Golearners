// Package httpapi hosts the HTTP transport layer: routing, middleware, and
// handlers. Handlers stay thin — validation and business rules live in
// services (added in later phases).
package httpapi

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"

	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/platform/storage"
	"golearn/backend/internal/ports"
	idsvc "golearn/backend/internal/service/identity"
)

// App carries the wired dependencies for HTTP handlers.
type App struct {
	Cfg      config.Config
	Log      *slog.Logger
	DB       *pgxpool.Pool
	Redis    *goredis.Client
	Storage  *storage.Client
	Auth     *idsvc.Service
	Throttle ports.Throttler
	Signer   ports.TokenSigner
}

// NewRouter builds the full middleware chain and routes.
func NewRouter(a *App) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(securityHeaders)
	r.Use(requestLogger(a.Log))
	r.Use(chimw.Timeout(30 * time.Second))

	r.Get("/healthz", handleHealthz)
	r.Get("/readyz", a.handleReadyz)

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(a.csrf)

		// pre-auth endpoints (individual per-IP limits)
		r.With(a.rateLimit("register", 10, time.Hour)).Post("/auth/register", a.handleRegister)
		r.With(a.rateLimit("otp-req", 30, time.Hour)).Post("/auth/otp/request", a.handleOTPRequest)
		r.With(a.rateLimit("otp-verify", 20, time.Hour)).Post("/auth/otp/verify", a.handleOTPVerify)
		r.With(a.rateLimit("login", 10, time.Minute)).Post("/auth/login", a.handleLogin)
		r.With(a.rateLimit("refresh", 30, time.Minute)).Post("/auth/refresh", a.handleRefresh)
		r.Post("/auth/logout", a.handleLogout)
		r.With(a.rateLimit("pw-reset", 10, time.Hour)).Post("/auth/password/reset", a.handlePasswordReset)

		// authenticated endpoints
		r.Group(func(r chi.Router) {
			r.Use(a.requireAuth)
			r.Get("/me", a.handleMe)
			r.Post("/auth/password/change", a.handlePasswordChange)
		})
	})

	return r
}

// securityHeaders applies the defensive baseline to every API response.
// The full CSP for HTML pages is the frontend's responsibility (docs/07 §3).
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		next.ServeHTTP(w, r)
	})
}

// requestLogger emits one structured access log line per request.
// Never log tokens, cookies, or bodies — request metadata only (docs/08 §2).
func requestLogger(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r)
			log.Info("http",
				"method", r.Method,
				"path", r.URL.Path,
				"status", ww.Status(),
				"duration_ms", time.Since(start).Milliseconds(),
				"request_id", chimw.GetReqID(r.Context()),
				"ip", r.RemoteAddr,
			)
		})
	}
}
