// Integration test for the course-statistics aggregates.
package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/repository"
)

func TestCourseStatsCountsWhatActuallyHappened(t *testing.T) {
	pool := openTestDB(t)
	ctx := context.Background()

	users := newRepoHelper(pool)
	suffix := uniqueSuffix()

	buyerID := uuid.Must(uuid.NewV7())
	users.mustCreateUser(t, ctx, buyerID, uniqueMobile())
	users.mustUpsertInstructor(t, ctx, buyerID)

	c := &course.Course{
		ID: uuid.Must(uuid.NewV7()), Slug: "stats-" + suffix, InstructorID: buyerID,
		Title: "course stats", Level: course.LevelBeginner, Status: course.StatusDraft,
		PriceRial: 250000, Outcomes: []string{},
	}
	require.NoError(t, newCourseHelper(pool).Create(ctx, c))

	sec := &course.Section{ID: uuid.Must(uuid.NewV7()), CourseID: c.ID, Title: "بخش", Position: 1}
	require.NoError(t, newSectionHelper(pool).Create(ctx, sec))
	lesson := &course.Lesson{
		ID: uuid.Must(uuid.NewV7()), SectionID: sec.ID, Title: "درس",
		Position: 1, Status: course.LessonReady, DurationSeconds: 600,
	}
	require.NoError(t, newLessonHelper(pool).Create(ctx, lesson))

	// one purchase: an entitlement, a paid order and its line item
	order := &commerce.Order{
		ID: uuid.Must(uuid.NewV7()), UserID: buyerID, Status: commerce.OrderAwaitingPayment,
		SubtotalRial: 250000, TotalRial: 250000, ExpiresAt: time.Now().Add(time.Hour),
	}
	require.NoError(t, repository.NewOrderRepo(pool).Create(ctx, order, []commerce.OrderItem{{
		ID: uuid.Must(uuid.NewV7()), OrderID: order.ID, CourseID: c.ID,
		TitleSnapshot: c.Title, UnitPriceRial: 250000,
	}}))
	paid, err := repository.NewOrderRepo(pool).MarkPaid(ctx, order.ID)
	require.NoError(t, err)
	require.True(t, paid)

	require.NoError(t, repository.NewEntitlementRepo(pool).Grant(ctx, &course.Entitlement{
		ID: uuid.Must(uuid.NewV7()), UserID: buyerID, CourseID: c.ID,
		Source: course.EntitlementPurchase, GrantedAt: time.Now(),
	}))

	require.NoError(t, repository.NewReviewRepo(pool).Upsert(ctx, &course.Review{
		ID: uuid.Must(uuid.NewV7()), CourseID: c.ID, UserID: buyerID,
		Rating: 4, Body: "خوب بود", Status: course.ReviewApproved,
	}))

	// watch time and progress
	require.NoError(t, repository.NewWatchRepo(pool).Record(ctx, buyerID, lesson.ID, 60))
	completed := time.Now()
	require.NoError(t, repository.NewLearningRepo(pool).Upsert(ctx, &ports.LessonProgress{
		UserID: buyerID, LessonID: lesson.ID, PositionSeconds: 600, CompletedAt: &completed,
	}))

	stats := repository.NewCourseStatsRepo(pool)

	list, total, err := stats.List(ctx, ports.CourseStatsFilter{Q: "stats-" + suffix}, 1, 20)
	require.NoError(t, err)
	require.Equal(t, 1, total)
	require.Len(t, list, 1)

	row := list[0]
	require.Equal(t, c.ID, row.CourseID)
	require.Equal(t, 1, row.Enrollments)
	require.Equal(t, 1, row.PaidEnrollments)
	require.Equal(t, 1, row.Orders)
	require.Equal(t, int64(250000), row.RevenueRial)
	require.Equal(t, int64(250000), row.NetRevenueRial)
	require.Equal(t, 4.0, row.AvgRating)
	require.Equal(t, 1, row.ReviewCount)
	require.Equal(t, 1, row.Lessons)
	require.Equal(t, int64(60), row.WatchSeconds)
	require.Equal(t, 1, row.WatchLearners)
	require.Equal(t, 1, row.StartedLearners)

	// the filter narrows the list
	_, none, err := stats.List(ctx, ports.CourseStatsFilter{Q: "stats-" + suffix, Status: "archived"}, 1, 20)
	require.NoError(t, err)
	require.Equal(t, 0, none)

	detail, err := stats.Detail(ctx, c.ID, 60)
	require.NoError(t, err)
	require.Equal(t, c.Title, detail.Course.Title)
	require.Len(t, detail.Series.Days, 60)
	require.Len(t, detail.Series.Enrollments, 60)
	require.Len(t, detail.Series.RevenueRial, 60)
	require.Len(t, detail.Series.WatchSeconds, 60)
	require.Len(t, detail.Lessons, 1)
	require.Equal(t, int64(60), detail.Lessons[0].WatchSeconds)
	require.Equal(t, 1, detail.Sources["purchase"])
	require.Len(t, detail.Reviews, 1)
	require.Equal(t, 4, detail.Reviews[0].Rating)

	// an unknown course is a not-found, not an empty page
	_, err = stats.Detail(ctx, uuid.Must(uuid.NewV7()), 60)
	require.ErrorIs(t, err, ports.ErrNotFound)
}
