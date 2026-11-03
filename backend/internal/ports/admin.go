// Admin-support ports: analytics aggregates, settings, user management.
package ports

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/identity"
)

// AnalyticsSummary is the dashboard KPI block.
type AnalyticsSummary struct {
	RevenueRial       int64   `json:"revenue_rial"`
	OrdersCount       int     `json:"orders_count"`
	PaidOrders        int     `json:"paid_orders"`
	NewUsers          int     `json:"new_users"`
	PaymentSuccessPct float64 `json:"payment_success_pct"`
}

// AnalyticsRepo — read-only dashboard aggregates.
type AnalyticsRepo interface {
	Summary(ctx context.Context, days int) (*AnalyticsSummary, error)
	// TopCourses by active entitlements.
	TopCourses(ctx context.Context, limit int) ([]CourseStat, error)
}

// CourseStat is one row of the course performance table.
type CourseStat struct {
	CourseID    uuid.UUID `json:"course_id"`
	Slug        string    `json:"slug"`
	Title       string    `json:"title"`
	Enrollments int       `json:"enrollments"`
	RevenueRial int64     `json:"revenue_rial"`
}

// CourseStatsFilter narrows the admin course-statistics list.
type CourseStatsFilter struct {
	Q              string
	Status         string
	Level          string
	CategorySlug   string
	MinEnrollments int
	Sort           string
}

// CourseStatsIdentity is the catalog part of a course: the fields that
// identify it, shared by the list row and the detail page.
type CourseStatsIdentity struct {
	CourseID     uuid.UUID  `json:"course_id"`
	Slug         string     `json:"slug"`
	Title        string     `json:"title"`
	Summary      string     `json:"summary"`
	Level        string     `json:"level"`
	Status       string     `json:"status"`
	PriceRial    int64      `json:"price_rial"`
	CoverMediaID *uuid.UUID `json:"cover_media_id"`
	CoverURL     string     `json:"cover_url"`
	PublishedAt  *time.Time `json:"published_at"`
}

// CourseStatsMetrics is what a course earned and how its learners engaged.
type CourseStatsMetrics struct {
	Enrollments        int        `json:"enrollments"`
	PaidEnrollments    int        `json:"paid_enrollments"`
	GrantedEnrollments int        `json:"granted_enrollments"`
	Orders             int        `json:"orders"`
	Buyers             int        `json:"buyers"`
	RevenueRial        int64      `json:"revenue_rial"`
	RefundRial         int64      `json:"refund_rial"`
	NetRevenueRial     int64      `json:"net_revenue_rial"`
	AvgRating          float64    `json:"avg_rating"`
	ReviewCount        int        `json:"review_count"`
	PendingReviews     int        `json:"pending_reviews"`
	Lessons            int        `json:"lessons"`
	Sections           int        `json:"sections"`
	DurationSeconds    int        `json:"duration_seconds"`
	StartedLearners    int        `json:"started_learners"`
	ActiveLearners     int        `json:"active_learners"`
	CompletedLessons   int        `json:"completed_lessons"`
	CompletionPct      float64    `json:"completion_pct"`
	WatchSeconds       int64      `json:"watch_seconds"`
	WatchLearners      int        `json:"watch_learners"`
	LastActivityAt     *time.Time `json:"last_activity_at"`
}

// CourseStatsRow is one course in the admin statistics table.
type CourseStatsRow struct {
	CourseStatsIdentity
	CourseStatsMetrics
}

// CourseStatsSeries is the daily trend behind one course.
type CourseStatsSeries struct {
	Days           []string `json:"days"`
	Enrollments    []int    `json:"enrollments"`
	RevenueRial    []int64  `json:"revenue_rial"`
	WatchSeconds   []int64  `json:"watch_seconds"`
	ActiveLearners []int    `json:"active_learners"`
}

// CourseLessonStat is one lesson's engagement inside a course.
type CourseLessonStat struct {
	LessonID        uuid.UUID `json:"lesson_id"`
	Title           string    `json:"title"`
	SectionTitle    string    `json:"section_title"`
	SectionPosition int       `json:"section_position"`
	Position        int       `json:"position"`
	Status          string    `json:"status"`
	DurationSeconds int       `json:"duration_seconds"`
	Started         int       `json:"started"`
	Completed       int       `json:"completed"`
	CompletionPct   float64   `json:"completion_pct"`
	WatchSeconds    int64     `json:"watch_seconds"`
	AvgPositionPct  float64   `json:"avg_position_pct"`
}

// CourseStatsReview is one learner review left on the course.
type CourseStatsReview struct {
	ID        uuid.UUID `json:"id"`
	UserName  string    `json:"user_name"`
	Rating    int       `json:"rating"`
	Body      string    `json:"body"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// CourseStatsDetail is the full statistics payload of one course.
type CourseStatsDetail struct {
	Course  CourseStatsIdentity `json:"course"`
	Metrics CourseStatsMetrics  `json:"metrics"`
	Series  CourseStatsSeries   `json:"series"`
	Lessons []CourseLessonStat  `json:"lessons"`
	Sources map[string]int      `json:"sources"`
	Reviews []CourseStatsReview `json:"reviews"`
}

// CourseStatsRepo — per-course performance aggregates for the admin console.
type CourseStatsRepo interface {
	// List returns one page of courses with their metrics.
	List(ctx context.Context, f CourseStatsFilter, page, perPage int) ([]CourseStatsRow, int, error)
	// Detail returns the metrics, trends and per-lesson engagement of one course.
	Detail(ctx context.Context, courseID uuid.UUID, days int) (*CourseStatsDetail, error)
}

// SettingsRepo — keyed site configuration (settings table).
type SettingsRepo interface {
	All(ctx context.Context) (map[string]json.RawMessage, error)
	Upsert(ctx context.Context, key string, value json.RawMessage) error
}

// UserAdminFilter narrows the admin user list.
type UserAdminFilter struct {
	Q      string
	Status string
	Sort   string
}

// UserAdminRepo — listing + moderation for the admin panel.
type UserAdminRepo interface {
	List(ctx context.Context, f UserAdminFilter, page, perPage int) ([]*identity.User, int, error)
	SetStatus(ctx context.Context, userID uuid.UUID, status identity.Status) error
	UpdateProfile(ctx context.Context, userID uuid.UUID, fullName, email *string) error
	AddRole(ctx context.Context, userID uuid.UUID, role identity.Role) error
	RemoveRole(ctx context.Context, userID uuid.UUID, role identity.Role) error
}
