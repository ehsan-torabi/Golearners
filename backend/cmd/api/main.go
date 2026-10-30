// Command api runs the GoLearn HTTP API server.
package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"golearn/backend/internal/adapter/passwordhasher"
	"golearn/backend/internal/adapter/ratelimit"
	"golearn/backend/internal/adapter/sanitizer"
	"golearn/backend/internal/adapter/sms/kavenegar"
	smsmock "golearn/backend/internal/adapter/sms/mock"
	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/platform/jwt"
	"golearn/backend/internal/platform/logger"
	"golearn/backend/internal/platform/postgres"
	"golearn/backend/internal/platform/redis"
	"golearn/backend/internal/platform/storage"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/repository"
	"golearn/backend/internal/service/catalog"
	"golearn/backend/internal/service/contentadmin"
	"golearn/backend/internal/service/courseadmin"
	idsvc "golearn/backend/internal/service/identity"
	httpapi "golearn/backend/internal/transport/httpapi"
)

// buildSMS picks the SMS provider from config; unconfigured providers fail loudly.
func buildSMS(cfg config.Config) ports.SMS {
	if cfg.SMSProvider == "kavenegar" {
		return kavenegar.NewFromEnv()
	}
	return smsmock.New()
}

func main() {
	if err := run(); err != nil {
		// Structured logging may not exist yet; stderr is correct before it does.
		_, _ = os.Stderr.WriteString("api: " + err.Error() + "\n")
		os.Exit(1)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		return err
	}
	log, err := logger.New(cfg.LogLevel)
	if err != nil {
		return err
	}

	pool, err := postgres.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	rdb, err := redis.New(ctx, cfg.RedisAddr)
	if err != nil {
		return err
	}
	defer rdb.Close()

	st, err := storage.New(ctx, cfg)
	if err != nil {
		return err
	}

	throttler := ratelimit.New(rdb)
	signer := jwt.New(cfg.JWTSecret, 15*time.Minute)
	authSvc := idsvc.NewService(idsvc.Deps{
		Users:    repository.NewUserRepo(pool),
		OTPs:     repository.NewOTPRepo(pool),
		Tokens:   repository.NewTokenRepo(pool),
		SMS:      buildSMS(cfg),
		Throttle: throttler,
		Hasher:   passwordhasher.New(),
		Signer:   signer,
		Pepper:   cfg.JWTSecret,
	})

	// content/catalog services (repos share the pool; ctx-carried tx for audit)
	courses := repository.NewCourseRepo(pool)
	sections := repository.NewSectionRepo(pool)
	lessons := repository.NewLessonRepo(pool)
	categories := repository.NewCategoryRepo(pool)
	reviews := repository.NewReviewRepo(pool)
	entitlements := repository.NewEntitlementRepo(pool)
	instructors := repository.NewInstructorRepo(pool)
	posts := repository.NewBlogPostRepo(pool)
	taxonomy := repository.NewTaxonomyRepo(pool)
	pages := repository.NewPageRepo(pool)
	faqs := repository.NewFAQRepo(pool)
	testimonials := repository.NewTestimonialRepo(pool)
	contacts := repository.NewContactRepo(pool)
	audit := repository.NewAuditRepo(pool)
	txr := repository.NewTransactor(pool)
	cleanHTML := sanitizer.New().SanitizeHTML

	catalogSvc := catalog.NewService(catalog.Deps{
		Courses: courses, Sections: sections, Lessons: lessons,
		Categories: categories, Reviews: reviews, Entitlements: entitlements,
		Instructors: instructors,
	})
	courseAdminSvc := courseadmin.NewService(courseadmin.Deps{
		Courses: courses, Sections: sections, Lessons: lessons,
		Categories: categories, Reviews: reviews, Audit: audit,
		TX: txr, Sanitize: cleanHTML,
	})
	contentAdminSvc := contentadmin.NewService(contentadmin.Deps{
		Posts: posts, Taxonomy: taxonomy, Pages: pages, FAQs: faqs,
		Testimonials: testimonials, Contact: contacts, Audit: audit,
		TX: txr, Sanitize: cleanHTML,
	})

	app := &httpapi.App{
		Cfg: cfg, Log: log, DB: pool, Redis: rdb, Storage: st,
		Auth: authSvc, Throttle: throttler, Signer: signer,
		Catalog: catalogSvc, CourseAdmin: courseAdminSvc, Content: contentAdminSvc,
		Instructors: instructors, Media: repository.NewMediaRepo(pool), Audit: audit,
		CoursesRepo: courses, Sections: sections, Lessons: lessons, Categories: categories,
		Posts: posts, Taxonomy: taxonomy, Pages: pages, FAQs: faqs,
		Testimonials: testimonials, Contacts: contacts,
	}

	srv := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           httpapi.NewRouter(app),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() { errCh <- srv.ListenAndServe() }()
	log.Info("api listening", "port", cfg.HTTPPort, "env", cfg.Env)

	select {
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
		log.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	}
}
