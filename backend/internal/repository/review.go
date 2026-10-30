package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// ReviewRepo implements ports.ReviewRepo.
type ReviewRepo struct{ pool *pgxpool.Pool }

func NewReviewRepo(pool *pgxpool.Pool) *ReviewRepo { return &ReviewRepo{pool: pool} }

func scanReview(row pgx.Row) (*course.Review, error) {
	rv := &course.Review{}
	var status string
	err := row.Scan(&rv.ID, &rv.CourseID, &rv.UserID, &rv.Rating, &rv.Body, &status, &rv.ApprovedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan review: %w", err)
	}
	rv.Status = course.ReviewStatus(status)
	return rv, nil
}

// Upsert sets the user's review (re-submitting resets it to pending).
func (r *ReviewRepo) Upsert(ctx context.Context, rv *course.Review) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO reviews (id, course_id, user_id, rating, body, status)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 ON CONFLICT (course_id, user_id) DO UPDATE
		 SET rating=$4, body=$5, status='pending', approved_at=NULL, updated_at=now()`,
		rv.ID, rv.CourseID, rv.UserID, rv.Rating, rv.Body, string(rv.Status))
	if err != nil {
		return fmt.Errorf("upsert review: %w", err)
	}
	return nil
}

func (r *ReviewRepo) ApprovedByCourse(ctx context.Context, courseID uuid.UUID, page, perPage int) ([]*course.Review, int, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, course_id, user_id, rating, body, status, approved_at
		 FROM reviews WHERE course_id=$1 AND status='approved'
		 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, courseID, perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, fmt.Errorf("list reviews: %w", err)
	}
	defer rows.Close()
	var out []*course.Review
	for rows.Next() {
		rv, err := scanReview(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, rv)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM reviews WHERE course_id=$1 AND status='approved'`, courseID).Scan(&total)
	return out, total, err
}

func (r *ReviewRepo) SetStatus(ctx context.Context, id uuid.UUID, s course.ReviewStatus) error {
	approved := "NULL"
	if s == course.ReviewApproved {
		approved = "now()"
	}
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE reviews SET status=$2, approved_at=`+approved+` WHERE id=$1`, id, string(s))
	if err != nil {
		return fmt.Errorf("set review status: %w", err)
	}
	return nil
}

func (r *ReviewRepo) SummaryFor(ctx context.Context, courseID uuid.UUID) (float64, int, error) {
	var avg float64
	var n int
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT coalesce(avg(rating), 0), count(*) FROM reviews
		 WHERE course_id=$1 AND status='approved'`, courseID).Scan(&avg, &n)
	return avg, n, err
}

// EntitlementRepo implements ports.EntitlementRepo.
type EntitlementRepo struct{ pool *pgxpool.Pool }

func NewEntitlementRepo(pool *pgxpool.Pool) *EntitlementRepo { return &EntitlementRepo{pool: pool} }

func (r *EntitlementRepo) HasActive(ctx context.Context, userID, courseID uuid.UUID) (bool, error) {
	var has bool
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM entitlements
		 WHERE user_id=$1 AND course_id=$2 AND revoked_at IS NULL
		 AND (expires_at IS NULL OR expires_at > now()))`, userID, courseID).Scan(&has)
	return has, err
}

func (r *EntitlementRepo) Grant(ctx context.Context, e *course.Entitlement) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO entitlements (id, user_id, course_id, source, granted_at, expires_at, order_id)
		 VALUES ($1,$2,$3,$4,coalesce($5, now()),$6,$7)
		 ON CONFLICT (user_id, course_id) WHERE revoked_at IS NULL DO NOTHING`,
		e.ID, e.UserID, e.CourseID, string(e.Source), e.GrantedAt, e.ExpiresAt, e.OrderID)
	if err != nil {
		return fmt.Errorf("grant entitlement: %w", err)
	}
	return nil
}

// RevokeByOrder revokes entitlements created by a refunded order.
func (r *EntitlementRepo) RevokeByOrder(ctx context.Context, orderID uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE entitlements SET revoked_at = now(), updated_at = now()
		 WHERE order_id = $1 AND revoked_at IS NULL`, orderID)
	if err != nil {
		return fmt.Errorf("revoke by order: %w", err)
	}
	return nil
}
