// Phase 4 integration tests (TEST_DATABASE_URL-guarded, like identity's).
package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"golearn/backend/internal/domain/course"
)

func TestCourseCRUDAndPublishFlow(t *testing.T) {
	pool := openTestDB(t)
	ctx := context.Background()

	users := newRepoHelper(pool)
	courses := newCourseHelper(pool)
	sections := newSectionHelper(pool)
	lessons := newLessonHelper(pool)

	uid := uuid.Must(uuid.NewV7())
	users.mustCreateUser(t, ctx, uid, "09121110000")
	users.mustUpsertInstructor(t, ctx, uid)

	c := &course.Course{
		ID: uuid.Must(uuid.NewV7()), Slug: "go-advance", InstructorID: uid,
		Title: "advance test", Level: course.LevelBeginner, Status: course.StatusDraft,
		PriceRial: 1000000, Outcomes: []string{"a", "b"},
	}
	require.NoError(t, courses.Create(ctx, c))

	got, err := courses.BySlug(ctx, "go-advance")
	require.NoError(t, err)
	require.Equal(t, []string{"a", "b"}, got.Outcomes)

	exists, err := courses.SlugExists(ctx, "go-advance", c.ID)
	require.NoError(t, err)
	require.False(t, exists, "same ID excluded")
	exists, err = courses.SlugExists(ctx, "go-advance", uuid.Must(uuid.NewV7()))
	require.NoError(t, err)
	require.True(t, exists)

	// publish blocked check is service-level; repo publish flips status
	sec := &course.Section{ID: uuid.Must(uuid.NewV7()), CourseID: c.ID, Title: "s1", Position: 1}
	require.NoError(t, sections.Create(ctx, sec))
	l := &course.Lesson{
		ID: uuid.Must(uuid.NewV7()), SectionID: sec.ID, Title: "l1",
		Position: 1, Status: course.LessonReady,
	}
	require.NoError(t, lessons.Create(ctx, l))
	ready, err := lessons.CountReady(ctx, c.ID)
	require.NoError(t, err)
	require.Equal(t, 1, ready)

	require.NoError(t, courses.Publish(ctx, c.ID))
	got, err = courses.BySlug(ctx, "go-advance")
	require.NoError(t, err)
	require.Equal(t, course.StatusPublished, got.Status)
	require.NotNil(t, got.PublishedAt)
}

func TestBlogPublishAndRelated(t *testing.T) {
	pool := openTestDB(t)
	ctx := context.Background()

	users := newRepoHelper(pool)
	posts := newPostHelper(pool)
	taxonomy := newTaxonomyHelper(pool)

	uid := uuid.Must(uuid.NewV7())
	users.mustCreateUser(t, ctx, uid, "09121110001")

	cat := &blogCategoryRow{ID: uuid.Must(uuid.NewV7()), Slug: "tut", Title: "Tutorials"}
	require.NoError(t, taxonomy.CreateCategory(ctx, cat))

	p1 := newPostRow(uid, "post-one", &cat.ID)
	require.NoError(t, posts.Create(ctx, p1))
	p2 := newPostRow(uid, "post-two", &cat.ID)
	require.NoError(t, posts.Create(ctx, p2))

	require.NoError(t, posts.Publish(ctx, p1.ID))
	got, err := posts.BySlug(ctx, "post-one")
	require.NoError(t, err)
	require.NotNil(t, got.PublishedAt)

	// related only counts published posts
	rel, err := posts.Related(ctx, p1.ID, 5)
	require.NoError(t, err)
	require.Empty(t, rel, "p2 still draft")

	require.NoError(t, posts.Publish(ctx, p2.ID))
	rel, err = posts.Related(ctx, p1.ID, 5)
	require.NoError(t, err)
	require.Len(t, rel, 1)
	require.Equal(t, p2.ID, rel[0].ID)

	tag, err := taxonomy.EnsureTagByTitle(ctx, "golang")
	require.NoError(t, err)
	require.NoError(t, posts.SetTags(ctx, p1.ID, []uuid.UUID{tag.ID}))
	tags, err := posts.TagsOf(ctx, p1.ID)
	require.NoError(t, err)
	require.Len(t, tags, 1)
	require.Equal(t, "golang", tags[0].Title)

	_ = time.Now
}
