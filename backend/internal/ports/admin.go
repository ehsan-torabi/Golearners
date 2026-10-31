// Admin-support ports: analytics aggregates, settings, user management.
package ports

import (
	"context"
	"encoding/json"

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

// SettingsRepo — keyed site configuration (settings table).
type SettingsRepo interface {
	All(ctx context.Context) (map[string]json.RawMessage, error)
	Upsert(ctx context.Context, key string, value json.RawMessage) error
}

// UserAdminRepo — listing + moderation for the admin panel.
type UserAdminRepo interface {
	List(ctx context.Context, q string, page, perPage int) ([]*identity.User, int, error)
	SetStatus(ctx context.Context, userID uuid.UUID, status identity.Status) error
	AddRole(ctx context.Context, userID uuid.UUID, role identity.Role) error
	RemoveRole(ctx context.Context, userID uuid.UUID, role identity.Role) error
}
