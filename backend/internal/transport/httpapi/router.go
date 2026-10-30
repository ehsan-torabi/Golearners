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
)

// App carries the wired dependencies for HTTP handlers.
type App struct {
	Cfg     config.Config
	Log     *slog.Logger
	DB      *pgxpool.Pool
	Redis   *goredis.Client
	Storage *storage.Client
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
