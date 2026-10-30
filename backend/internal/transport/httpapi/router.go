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

	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/platform/storage"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/catalog"
	"golearn/backend/internal/service/contentadmin"
	"golearn/backend/internal/service/courseadmin"
	idsvc "golearn/backend/internal/service/identity"
	mediasvc "golearn/backend/internal/service/media"
	"golearn/backend/internal/service/playback"
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

	Catalog      *catalog.Service
	CourseAdmin  *courseadmin.Service
	Content      *contentadmin.Service
	MediaService *mediasvc.Service
	Playback     *playback.Service
	Instructors  ports.InstructorRepo
	Media        ports.MediaRepo
	Audit        ports.AuditRepo

	CoursesRepo  ports.CourseRepo
	Sections     ports.SectionRepo
	Lessons      ports.LessonRepo
	Categories   ports.CategoryRepo
	Attachments  ports.AttachmentRepo
	Entitlements ports.EntitlementRepo
	StoragePort  ports.Storage
	Posts        ports.BlogPostRepo
	Taxonomy     ports.TaxonomyRepo
	Pages        ports.PageRepo
	FAQs         ports.FAQRepo
	Testimonials ports.TestimonialRepo
	Contacts     ports.ContactRepo
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
			r.With(a.rateLimit("review", 10, time.Hour)).Post("/courses/{slug}/reviews", a.handleReviewSubmit)
		})

		// playback: optional auth, anonymous previews legal, per-IP issuance limit
		r.Group(func(r chi.Router) {
			r.Use(a.optionalAuth)
			r.With(a.rateLimit("playback", 60, time.Minute)).Get("/playback/lessons/{lesson_id}", a.handlePlaybackLesson)
			r.With(a.rateLimit("playback", 30, time.Minute)).Get("/playback/attachments/{id}", a.handlePlaybackAttachment)
		})

		// public reads (ISR-cacheable)
		r.Get("/courses", a.handleCourseList)
		r.Get("/courses/{slug}", a.handleCourseDetail)
		r.Get("/categories", a.handleCategoryList)
		r.Get("/instructor", a.handleInstructor)
		r.Get("/blog/posts", a.handleBlogList)
		r.Get("/blog/posts/{slug}", a.handleBlogDetail)
		r.Get("/blog/categories", a.handleBlogCategories)
		r.Get("/blog/tags", a.handleBlogTags)
		r.Get("/pages/{slug}", a.handlePage)
		r.Get("/faqs", a.handleFAQs)
		r.Get("/testimonials", a.handleTestimonials)
		r.With(a.rateLimit("contact", 5, time.Hour)).Post("/contact", a.handleContact)

		// admin (RBAC at the boundary; mutations audited in services)
		r.Group(func(r chi.Router) {
			r.Use(a.requireAuth)
			r.Use(a.requireRoles(identity.RoleAdmin, identity.RoleOwner))

			r.Post("/admin/courses", a.handleAdminCourseCreate)
			r.Get("/admin/courses", a.handleAdminCourseList)
			r.Put("/admin/courses/{id}", a.handleAdminCourseUpdate)
			r.Delete("/admin/courses/{id}", a.handleAdminCourseDelete)
			r.Post("/admin/courses/{id}/publish", a.handleAdminCoursePublish(true))
			r.Post("/admin/courses/{id}/unpublish", a.handleAdminCoursePublish(false))
			r.Get("/admin/courses/{id}/curriculum", a.handleAdminCurriculum)
			r.Post("/admin/courses/{id}/sections", a.handleAdminSectionCreate)
			r.Post("/admin/courses/{id}/sections/reorder", a.handleAdminSectionReorder)
			r.Post("/admin/sections/{id}/lessons", a.handleAdminLessonCreate)
			r.Post("/admin/sections/{id}/lessons/reorder", a.handleAdminLessonReorder)
			r.Put("/admin/sections/{id}", a.handleAdminSectionUpdate)
			r.Delete("/admin/sections/{id}", a.handleAdminSectionDelete)
			r.Put("/admin/lessons/{id}", a.handleAdminLessonUpdate)
			r.Delete("/admin/lessons/{id}", a.handleAdminLessonDelete)

			r.Post("/admin/media/presign", a.handleAdminMediaPresign)
			r.Post("/admin/media", a.handleAdminMediaRegister)
			r.Get("/admin/media", a.handleAdminMediaList)
			r.Delete("/admin/media/{id}", a.handleAdminMediaDelete)

			r.Post("/admin/categories", a.handleAdminCategoryCreate)
			r.Put("/admin/categories/{id}", a.handleAdminCategoryUpdate)
			r.Delete("/admin/categories/{id}", a.handleAdminCategoryDelete)

			r.Post("/admin/posts", a.handleAdminPostCreate)
			r.Get("/admin/posts", a.handleAdminPostList)
			r.Put("/admin/posts/{id}", a.handleAdminPostUpdate)
			r.Delete("/admin/posts/{id}", a.handleAdminPostDelete)
			r.Post("/admin/posts/{id}/publish", a.handleAdminPostPublish(true))
			r.Post("/admin/posts/{id}/unpublish", a.handleAdminPostPublish(false))

			r.Post("/admin/pages", a.handleAdminPageUpsert)
			r.Post("/admin/faqs", a.handleAdminFAQUpsert)
			r.Post("/admin/testimonials", a.handleAdminTestimonialUpsert)
			r.Get("/admin/messages", a.handleAdminMessages)
			r.Post("/admin/messages/{id}/status", a.handleAdminMessageStatus)
			r.Post("/admin/reviews/{id}/moderate", a.handleAdminReviewModerate)
			r.Get("/admin/audit-logs", a.handleAdminAuditLogs)
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
