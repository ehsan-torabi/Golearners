package repository_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"

	"golearn/backend/internal/domain/content"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/repository"
)

type repoHelper struct{ pool *pgxpool.Pool }

func newRepoHelper(pool *pgxpool.Pool) repoHelper { return repoHelper{pool} }
func newCourseHelper(pool *pgxpool.Pool) *repository.CourseRepo {
	return repository.NewCourseRepo(pool)
}
func newSectionHelper(pool *pgxpool.Pool) *repository.SectionRepo {
	return repository.NewSectionRepo(pool)
}
func newLessonHelper(pool *pgxpool.Pool) *repository.LessonRepo {
	return repository.NewLessonRepo(pool)
}
func newPostHelper(pool *pgxpool.Pool) *repository.BlogPostRepo {
	return repository.NewBlogPostRepo(pool)
}
func newTaxonomyHelper(pool *pgxpool.Pool) *repository.TaxonomyRepo {
	return repository.NewTaxonomyRepo(pool)
}

// identityUser builds a minimal active user for FK targets.
func identityUser(id uuid.UUID, mobile string) identity.User {
	return identity.User{ID: id, Mobile: mobile, FullName: "tester", Status: identity.StatusActive}
}

func (h repoHelper) mustCreateUser(t *testing.T, ctx context.Context, id uuid.UUID, mobile string) {
	t.Helper()
	users := repository.NewUserRepo(h.pool)
	u := identityUser(id, mobile)
	require.NoError(t, users.Create(ctx, &u))
}

func (h repoHelper) mustUpsertInstructor(t *testing.T, ctx context.Context, userID uuid.UUID) {
	t.Helper()
	require.NoError(t, repository.NewInstructorRepo(h.pool).Upsert(ctx, &course.Instructor{
		UserID: userID, Headline: "teacher", BioHTML: "<p>bio</p>",
	}))
}

type blogCategoryRow = content.BlogCategory

func newPostRow(author uuid.UUID, slug string, catID *uuid.UUID) *content.BlogPost {
	return &content.BlogPost{
		ID: uuid.Must(uuid.NewV7()), Slug: slug, AuthorID: author,
		Title: slug, Status: content.PostDraft, CategoryID: catID,
	}
}
