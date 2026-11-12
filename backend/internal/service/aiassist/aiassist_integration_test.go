package aiassist_test

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
	gomigrate "github.com/golang-migrate/migrate/v4"
	migratepgx "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/adapter/sanitizer"
	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/repository"
	"golearn/backend/internal/service/aiassist"
	"golearn/backend/internal/service/contentadmin"
	"golearn/backend/internal/service/courseadmin"
)

// openPool mirrors internal/repository's integration harness.
func openPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping integration tests")
	}
	sqlDB, err := sql.Open("pgx", url)
	require.NoError(t, err)
	defer sqlDB.Close()
	driver, err := migratepgx.WithInstance(sqlDB, &migratepgx.Config{})
	require.NoError(t, err)
	m, err := gomigrate.NewWithDatabaseInstance(
		"file://"+filepath.Join("..", "..", "..", "migrations"), "postgres", driver)
	require.NoError(t, err)
	if err := m.Up(); err != nil && !errors.Is(err, gomigrate.ErrNoChange) {
		require.NoError(t, err)
	}
	pool, err := pgxpool.New(context.Background(), url)
	require.NoError(t, err)
	t.Cleanup(pool.Close)
	return pool
}

type aiWorld struct {
	pool       *pgxpool.Pool
	svc        *aiassist.Service
	contentSvc *contentadmin.Service
	courseSvc  *courseadmin.Service
	actor      aiassist.Actor
}

func newAIWorld(t *testing.T) aiWorld {
	t.Helper()
	pool := openPool(t)
	ctx := context.Background()

	cleanHTML := sanitizer.New().SanitizeHTML
	audit := repository.NewAuditRepo(pool)
	txr := repository.NewTransactor(pool)
	posts := repository.NewBlogPostRepo(pool)
	courses := repository.NewCourseRepo(pool)
	sections := repository.NewSectionRepo(pool)
	lessons := repository.NewLessonRepo(pool)
	categories := repository.NewCategoryRepo(pool)
	instructors := repository.NewInstructorRepo(pool)
	reviews := repository.NewReviewRepo(pool)
	taxonomy := repository.NewTaxonomyRepo(pool)
	series := repository.NewSeriesRepo(pool)
	comments := repository.NewCommentRepo(pool)
	pages := repository.NewPageRepo(pool)
	faqs := repository.NewFAQRepo(pool)
	testimonials := repository.NewTestimonialRepo(pool)
	contacts := repository.NewContactRepo(pool)
	settingsRepo := repository.NewSettingsRepo(pool)
	analytics := repository.NewAnalyticsRepo(pool)
	aiRepo := repository.NewAIRepo(pool)

	contentSvc := contentadmin.NewService(contentadmin.Deps{
		Posts: posts, Series: series, Comments: comments, Taxonomy: taxonomy,
		Pages: pages, FAQs: faqs, Testimonials: testimonials, Contact: contacts,
		Audit: audit, TX: txr, Sanitize: cleanHTML,
	})
	courseSvc := courseadmin.NewService(courseadmin.Deps{
		Courses: courses, Sections: sections, Lessons: lessons,
		Categories: categories, Instructors: instructors, Reviews: reviews,
		Audit: audit, TX: txr, Sanitize: cleanHTML,
	})

	adminID := uuid.Must(uuid.NewV7())
	admin := &identity.User{
		ID: adminID, Mobile: "0912" + fmt.Sprintf("%07d", time.Now().UnixNano()%10_000_000),
		FullName: "مدیر دستیار", PasswordHash: "x", Status: identity.StatusActive,
	}
	require.NoError(t, repository.NewUserRepo(pool).Create(ctx, admin))

	svc := aiassist.NewService(aiassist.Deps{
		Settings: settingsRepo, Drafts: aiRepo, Usage: aiRepo,
		Posts: posts, Courses: courses, Cats: categories,
		Stats: repository.NewCourseStatsRepo(pool), Analytics: analytics,
		Content: contentSvc, CourseAdmin: courseSvc, Audit: audit,
		ServerSecret: "test-server-secret-long-enough!", Sanitize: cleanHTML,
	})

	raw, _ := json.Marshal(map[string]any{
		"enabled": true, "provider": "mock", "model": "mock",
		"temperature": 0.5, "max_tokens": 1000,
	})
	require.NoError(t, settingsRepo.Upsert(ctx, "ai", raw))

	return aiWorld{pool: pool, svc: svc, contentSvc: contentSvc, courseSvc: courseSvc,
		actor: aiassist.Actor{ID: adminID}}
}

// TestAIDraftPipelineFullLoop drives the whole human-in-the-loop pipeline:
// generate → pending diff → approve → applied → the row actually changed.
func TestAIDraftPipelineFullLoop(t *testing.T) {
	w := newAIWorld(t)
	ctx := context.Background()
	posts := repository.NewBlogPostRepo(w.pool)

	// --- blog create: generate → approve → row exists ---
	draft, err := w.svc.Generate(ctx, w.actor, aiassist.GenerateRequest{
		Kind: "blog_post", Instructions: "یک نوشته دربارهٔ شروع زبان Go بنویس.",
	})
	require.NoError(t, err)
	require.Equal(t, "pending", draft.Status)
	require.Equal(t, "create", draft.Action)
	require.Empty(t, draft.Original)

	applied, err := w.svc.Approve(ctx, w.actor, draft.ID)
	require.NoError(t, err)
	require.Equal(t, "applied", applied.Status)

	var postID uuid.UUID
	var body string
	require.NoError(t, w.pool.QueryRow(ctx,
		`SELECT id, body_html FROM blog_posts WHERE title = 'آموزش گام‌به‌گام گو برای برنامه‌نویسان'
		 ORDER BY created_at DESC LIMIT 1`).Scan(&postID, &body))
	require.Contains(t, body, "دستیار هوشمند")

	// decided drafts refuse a second decision
	_, err = w.svc.Approve(ctx, w.actor, draft.ID)
	require.True(t, errors.Is(err, apperr.ErrAIDecided), "got %v", err)

	// --- blog update: hand-edit first so the mock proposal is a real diff ---
	post, err := posts.ByID(ctx, postID)
	require.NoError(t, err)
	handBody := "<p>بدنهٔ دستی ویراستار برای آزمون.</p>"
	_, err = w.contentSvc.UpdatePost(ctx, contentadmin.Actor{ID: w.actor.ID}, postID,
		contentadmin.PostInput{
			Title: post.Title, Slug: post.Slug, Excerpt: post.Excerpt,
			BodyHTML: handBody, TagTitles: []string{}, ReadingMinutes: 0,
		})
	require.NoError(t, err)

	draft2, err := w.svc.Generate(ctx, w.actor, aiassist.GenerateRequest{
		Kind: "blog_post", TargetType: "post", TargetID: &postID,
		Instructions: "مقدمه را روان‌تر کن.",
	})
	require.NoError(t, err)
	require.Equal(t, "update", draft2.Action)
	require.NotNil(t, draft2.Original)
	require.Contains(t, string(draft2.Original), "بدنهٔ دستی ویراستار")

	applied2, err := w.svc.Approve(ctx, w.actor, draft2.ID)
	require.NoError(t, err)
	require.Equal(t, "applied", applied2.Status)

	post2, err := posts.ByID(ctx, postID)
	require.NoError(t, err)
	require.NotEqual(t, handBody, post2.BodyHTML)
	require.Contains(t, post2.BodyHTML, "دستیار هوشمند")

	// --- course copy + seo on a fresh course ---
	require.NoError(t, repository.NewInstructorRepo(w.pool).Upsert(ctx,
		&course.Instructor{UserID: w.actor.ID, Headline: "مدرس آزمون"}))
	created, err := w.courseSvc.CreateCourse(ctx, courseadmin.Actor{ID: w.actor.ID},
		courseadmin.CourseInput{
			Title: "دورهٔ آزمون دستیار", Slug: "ai-test-" + fmt.Sprintf("%07d", time.Now().UnixNano()%10_000_000),
			Summary: "خلاصهٔ اصلی", DescriptionHTML: "<p>توضیح اصلی</p>",
			Level: course.LevelBeginner, PriceRial: 150000, Outcomes: []string{"نتیجهٔ اول"},
		}, w.actor.ID)
	require.NoError(t, err)
	cid := created.ID

	draft3, err := w.svc.Generate(ctx, w.actor, aiassist.GenerateRequest{
		Kind: "course_copy", TargetType: "course", TargetID: &cid,
	})
	require.NoError(t, err)
	require.Equal(t, "update", draft3.Action)
	applied3, err := w.svc.Approve(ctx, w.actor, draft3.ID)
	require.NoError(t, err)
	require.Equal(t, "applied", applied3.Status)

	courses := repository.NewCourseRepo(w.pool)
	c1, err := courses.ByID(ctx, cid)
	require.NoError(t, err)
	require.Equal(t, "دوره بازنویسی‌شده با دستیار", c1.Title)
	require.EqualValues(t, 150000, c1.PriceRial, "money must survive the AI overlay")

	draft4, err := w.svc.Generate(ctx, w.actor, aiassist.GenerateRequest{
		Kind: "seo", TargetType: "course", TargetID: &cid,
	})
	require.NoError(t, err)
	applied4, err := w.svc.Approve(ctx, w.actor, draft4.ID)
	require.NoError(t, err)
	require.Equal(t, "applied", applied4.Status)
	c2, err := courses.ByID(ctx, cid)
	require.NoError(t, err)
	require.NotNil(t, c2.MetaTitle)
	require.Equal(t, "عنوان متای پیشنهادی", *c2.MetaTitle)
}

// TestAIRejectAndReports covers the decision guards and read-only kinds.
func TestAIRejectAndReports(t *testing.T) {
	w := newAIWorld(t)
	ctx := context.Background()

	draft, err := w.svc.Generate(ctx, w.actor, aiassist.GenerateRequest{
		Kind: "blog_post", Instructions: "نوشته‌ای برای کمپین دی ماه.",
	})
	require.NoError(t, err)
	require.Equal(t, "pending", draft.Status)

	// reports are read-only: approving is refused before any mutation
	report, err := w.svc.Generate(ctx, w.actor, aiassist.GenerateRequest{Kind: "stats_report"})
	require.NoError(t, err)
	require.Equal(t, "ready", report.Status)
	_, err = w.svc.Approve(ctx, w.actor, report.ID)
	require.True(t, errors.Is(err, apperr.ErrAIDecided), "want AI_DRAFT_DECIDED, got %v", err)

	rejected, err := w.svc.Reject(ctx, w.actor, draft.ID)
	require.NoError(t, err)
	require.Equal(t, "rejected", rejected.Status)

	_, err = w.svc.Reject(ctx, w.actor, draft.ID)
	require.True(t, errors.Is(err, apperr.ErrAIDecided))
	_, err = w.svc.Approve(ctx, w.actor, report.ID)
	require.True(t, errors.Is(err, apperr.ErrAIDecided))

	// decided drafts can leave the worklist
	require.NoError(t, w.svc.Delete(ctx, w.actor, draft.ID))
	_, err = w.svc.ByID(ctx, draft.ID)
	require.True(t, errors.Is(err, ports.ErrNotFound), "got %v", err)

	// pending drafts refuse deletion
	pending, err := w.svc.Generate(ctx, w.actor, aiassist.GenerateRequest{
		Kind: "blog_post", Instructions: "یکی دیگر.",
	})
	require.NoError(t, err)
	require.Error(t, w.svc.Delete(ctx, w.actor, pending.ID))

	// usage metering saw every provider call
	sum, daily, err := w.svc.Usage(ctx, 7)
	require.NoError(t, err)
	require.Positive(t, sum.Requests)
	require.NotEmpty(t, daily)
	require.Positive(t, sum.ByKind["freeform"])
}
