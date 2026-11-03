// Admin-support repositories: analytics aggregates, settings, user admin.
package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
)

// AnalyticsRepo implements ports.AnalyticsRepo.
type AnalyticsRepo struct{ pool *pgxpool.Pool }

func NewAnalyticsRepo(pool *pgxpool.Pool) *AnalyticsRepo { return &AnalyticsRepo{pool: pool} }

func (r *AnalyticsRepo) Summary(ctx context.Context, days int) (*ports.AnalyticsSummary, error) {
	s := &ports.AnalyticsSummary{}
	q := func(query string, dst ...any) error {
		return r.pool.QueryRow(ctx, query, days).Scan(dst...)
	}
	if err := q(`SELECT coalesce(sum(total_rial),0), count(*) FILTER (WHERE status='paid'), count(*)
		FROM orders WHERE created_at > now() - make_interval(days => $1::int)`,
		&s.RevenueRial, &s.PaidOrders, &s.OrdersCount); err != nil {
		return nil, fmt.Errorf("orders summary: %w", err)
	}
	if err := q(`SELECT count(*) FROM users WHERE created_at > now() - make_interval(days => $1::int)`,
		&s.NewUsers); err != nil {
		return nil, fmt.Errorf("users summary: %w", err)
	}
	// payment success rate over all attempts in the window
	var verified, failed int
	if err := q(`SELECT count(*) FILTER (WHERE status='verified'), count(*) FILTER (WHERE status='failed')
		FROM payments WHERE created_at > now() - make_interval(days => $1::int)`, &verified, &failed); err != nil {
		return nil, fmt.Errorf("payments summary: %w", err)
	}
	if verified+failed > 0 {
		s.PaymentSuccessPct = float64(verified) * 100 / float64(verified+failed)
	}
	return s, nil
}

func (r *AnalyticsRepo) TopCourses(ctx context.Context, limit int) ([]ports.CourseStat, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT c.id, c.slug, c.title, count(e.id),
			coalesce((SELECT sum(o.total_rial) FROM orders o
				JOIN order_items oi ON oi.order_id = o.id AND o.status = 'paid'
				WHERE oi.course_id = c.id), 0)
		 FROM courses c
		 LEFT JOIN entitlements e ON e.course_id = c.id AND e.revoked_at IS NULL
		 WHERE c.deleted_at IS NULL
		 GROUP BY c.id, c.slug, c.title
		 ORDER BY count(e.id) DESC, c.created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, fmt.Errorf("top courses: %w", err)
	}
	defer rows.Close()
	var out []ports.CourseStat
	for rows.Next() {
		var s ports.CourseStat
		if err := rows.Scan(&s.CourseID, &s.Slug, &s.Title, &s.Enrollments, &s.RevenueRial); err != nil {
			return nil, fmt.Errorf("scan course stat: %w", err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// SettingsRepo implements ports.SettingsRepo.
type SettingsRepo struct{ pool *pgxpool.Pool }

func NewSettingsRepo(pool *pgxpool.Pool) *SettingsRepo { return &SettingsRepo{pool: pool} }

func (r *SettingsRepo) All(ctx context.Context) (map[string]json.RawMessage, error) {
	rows, err := r.pool.Query(ctx, `SELECT key, value FROM settings`)
	if err != nil {
		return nil, fmt.Errorf("list settings: %w", err)
	}
	defer rows.Close()
	out := map[string]json.RawMessage{}
	for rows.Next() {
		var k string
		var v json.RawMessage
		if err := rows.Scan(&k, &v); err != nil {
			return nil, fmt.Errorf("scan setting: %w", err)
		}
		out[k] = v
	}
	return out, rows.Err()
}

func (r *SettingsRepo) Upsert(ctx context.Context, key string, value json.RawMessage) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO settings (key, value) VALUES ($1, $2)
		 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`, key, value)
	if err != nil {
		return fmt.Errorf("upsert setting: %w", err)
	}
	return nil
}

// UserAdminRepo implements ports.UserAdminRepo.
type UserAdminRepo struct{ pool *pgxpool.Pool }

func NewUserAdminRepo(pool *pgxpool.Pool) *UserAdminRepo { return &UserAdminRepo{pool: pool} }

func (r *UserAdminRepo) List(ctx context.Context, f ports.UserAdminFilter, page, perPage int) ([]*identity.User, int, error) {
	where := "status <> 'deleted'"
	args := []any{}
	if f.Q != "" {
		args = append(args, f.Q)
		where += fmt.Sprintf(" AND (full_name ILIKE '%%'||$%d||'%%' OR mobile LIKE '%%'||$%d||'%%')",
			len(args), len(args))
	}
	if f.Status != "" {
		args = append(args, f.Status)
		where += fmt.Sprintf(" AND status = $%d", len(args))
	}
	order := "created_at DESC"
	switch f.Sort {
	case "oldest":
		order = "created_at ASC"
	case "name":
		order = "full_name ASC"
	case "mobile":
		order = "mobile ASC"
	case "login":
		order = "last_login_at DESC NULLS LAST"
	}
	rows, err := r.pool.Query(ctx,
		`SELECT id, mobile, email, full_name, password_hash, status,
			mobile_verified_at, last_login_at, created_at, updated_at
		 FROM users WHERE `+where+` ORDER BY `+order+` LIMIT $`+
			fmt.Sprint(len(args)+1)+` OFFSET $`+fmt.Sprint(len(args)+2),
		append(args, perPage, (page-1)*perPage)...)
	if err != nil {
		return nil, 0, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()
	var out []*identity.User
	for rows.Next() {
		u := &identity.User{}
		var status string
		if err := rows.Scan(&u.ID, &u.Mobile, &u.Email, &u.FullName, &u.PasswordHash,
			&status, &u.MobileVerifiedAt, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan user: %w", err)
		}
		u.Status = identity.Status(status)
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = r.pool.QueryRow(ctx, `SELECT count(*) FROM users WHERE `+where, args...).Scan(&total)
	return out, total, err
}

// UpdateProfile rewrites the admin-editable profile fields; a nil field is
// left alone. The mobile stays read-only: it is the identity anchor (OTP
// login, unique index).
func (r *UserAdminRepo) UpdateProfile(ctx context.Context, userID uuid.UUID, fullName, email *string) error {
	sets := []string{}
	args := []any{userID}
	if fullName != nil {
		args = append(args, *fullName)
		sets = append(sets, fmt.Sprintf("full_name=$%d", len(args)))
	}
	if email != nil {
		args = append(args, *email)
		sets = append(sets, fmt.Sprintf("email=NULLIF($%d,'')", len(args)))
	}
	if len(sets) == 0 {
		return nil
	}
	sets = append(sets, "updated_at=now()")
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET `+strings.Join(sets, ", ")+` WHERE id=$1`, args...)
	if err != nil {
		return fmt.Errorf("update user profile: %w", err)
	}
	return nil
}

func (r *UserAdminRepo) SetStatus(ctx context.Context, userID uuid.UUID, status identity.Status) error {
	_, err := r.pool.Exec(ctx, `UPDATE users SET status=$2, updated_at=now() WHERE id=$1`,
		userID, string(status))
	if err != nil {
		return fmt.Errorf("set user status: %w", err)
	}
	return nil
}

func (r *UserAdminRepo) AddRole(ctx context.Context, userID uuid.UUID, role identity.Role) error {
	_, err := r.pool.Exec(ctx, "INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		userID, string(role))
	return err
}

func (r *UserAdminRepo) RemoveRole(ctx context.Context, userID uuid.UUID, role identity.Role) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM user_roles WHERE user_id=$1 AND role=$2`,
		userID, string(role))
	if err != nil {
		return fmt.Errorf("remove role: %w", err)
	}
	return nil
}

var (
	_ = errors.Is
	_ pgx.Row
)
