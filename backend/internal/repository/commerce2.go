// Coupon, payment, event, and refund repositories.
package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/ports"
)

// CouponRepo implements ports.CouponRepo.
type CouponRepo struct{ pool *pgxpool.Pool }

func NewCouponRepo(pool *pgxpool.Pool) *CouponRepo { return &CouponRepo{pool: pool} }

const couponColumns = `id, code, type, value, max_uses, per_user_limit, min_amount_rial,
	starts_at, ends_at, course_scope, status, created_at, updated_at`

func scanCoupon(row pgx.Row) (*commerce.Coupon, error) {
	c := &commerce.Coupon{}
	var ctype, status string
	err := row.Scan(&c.ID, &c.Code, &ctype, &c.Value, &c.MaxUses, &c.PerUserLimit,
		&c.MinAmountRial, &c.StartsAt, &c.EndsAt, &c.CourseScope, &status,
		&c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan coupon: %w", err)
	}
	c.Type = commerce.CouponType(ctype)
	c.Status = status
	return c, nil
}

func (r *CouponRepo) Create(ctx context.Context, c *commerce.Coupon) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO coupons (id, code, type, value, max_uses, per_user_limit, min_amount_rial,
		 starts_at, ends_at, course_scope, status)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		c.ID, c.Code, string(c.Type), c.Value, c.MaxUses, c.PerUserLimit, c.MinAmountRial,
		c.StartsAt, c.EndsAt, c.CourseScope, c.Status)
	if err != nil {
		return fmt.Errorf("insert coupon: %w", err)
	}
	return nil
}

func (r *CouponRepo) ByID(ctx context.Context, id uuid.UUID) (*commerce.Coupon, error) {
	return scanCoupon(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+couponColumns+` FROM coupons WHERE id = $1`, id))
}

func (r *CouponRepo) ByCode(ctx context.Context, code string) (*commerce.Coupon, error) {
	return scanCoupon(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+couponColumns+` FROM coupons WHERE code = $1`, normalizeCode(code)))
}

func (r *CouponRepo) Update(ctx context.Context, c *commerce.Coupon) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE coupons SET type=$2, value=$3, max_uses=$4, per_user_limit=$5,
		 min_amount_rial=$6, starts_at=$7, ends_at=$8, course_scope=$9, status=$10, updated_at=now()
		 WHERE id=$1`,
		c.ID, string(c.Type), c.Value, c.MaxUses, c.PerUserLimit, c.MinAmountRial,
		c.StartsAt, c.EndsAt, c.CourseScope, c.Status)
	return err
}

func (r *CouponRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM coupons WHERE id=$1`, id)
	return err
}

func (r *CouponRepo) List(ctx context.Context, page, perPage int) ([]*commerce.Coupon, int, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+couponColumns+` FROM coupons ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, fmt.Errorf("list coupons: %w", err)
	}
	defer rows.Close()
	var out []*commerce.Coupon
	for rows.Next() {
		c, err := scanCoupon(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, c)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = r.pool.QueryRow(ctx, `SELECT count(*) FROM coupons`).Scan(&total)
	return out, total, err
}

func (r *CouponRepo) CountUses(ctx context.Context, couponID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT count(*) FROM coupon_redemptions WHERE coupon_id = $1`, couponID).Scan(&n)
	return n, err
}

func (r *CouponRepo) CountUsesByUser(ctx context.Context, couponID, userID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT count(*) FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2`,
		couponID, userID).Scan(&n)
	return n, err
}

func (r *CouponRepo) Redeem(ctx context.Context, couponID, userID, orderID uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id)
		 VALUES ($1,$2,$3,$4) ON CONFLICT (coupon_id, order_id) DO NOTHING`,
		uuid.Must(uuid.NewV7()), couponID, userID, orderID)
	if err != nil {
		return fmt.Errorf("redeem coupon: %w", err)
	}
	return nil
}

func normalizeCode(code string) string {
	out := ""
	for _, r := range code {
		if r != ' ' {
			out += string(r)
		}
	}
	return out
}

// PaymentRepo implements ports.PaymentRepo.
type PaymentRepo struct{ pool *pgxpool.Pool }

func NewPaymentRepo(pool *pgxpool.Pool) *PaymentRepo { return &PaymentRepo{pool: pool} }

const paymentColumns = `id, order_id, gateway, gateway_ref, amount_rial, status,
	idempotency_key, card_masked, failure_reason, initiated_at, verified_at,
	created_at, updated_at`

func scanPayment(row pgx.Row) (*commerce.Payment, error) {
	p := &commerce.Payment{}
	var gateway, status string
	err := row.Scan(&p.ID, &p.OrderID, &gateway, &p.GatewayRef, &p.AmountRial, &status,
		&p.IdempotencyKey, &p.CardMasked, &p.FailureReason, &p.InitiatedAt,
		&p.VerifiedAt, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan payment: %w", err)
	}
	p.Gateway = commerce.Gateway(gateway)
	p.Status = commerce.PaymentStatus(status)
	return p, nil
}

func (r *PaymentRepo) Create(ctx context.Context, p *commerce.Payment) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO payments (id, order_id, gateway, amount_rial, status, idempotency_key)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		p.ID, p.OrderID, string(p.Gateway), p.AmountRial, string(p.Status), p.IdempotencyKey)
	if err != nil {
		return fmt.Errorf("insert payment: %w", err)
	}
	return nil
}

func (r *PaymentRepo) ByID(ctx context.Context, id uuid.UUID) (*commerce.Payment, error) {
	return scanPayment(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+paymentColumns+` FROM payments WHERE id = $1`, id))
}

func (r *PaymentRepo) ByGatewayRef(ctx context.Context, g commerce.Gateway, ref string) (*commerce.Payment, error) {
	return scanPayment(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+paymentColumns+` FROM payments WHERE gateway = $1 AND gateway_ref = $2`,
		string(g), ref))
}

func (r *PaymentRepo) ActiveForOrder(ctx context.Context, orderID uuid.UUID) (*commerce.Payment, error) {
	return scanPayment(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+paymentColumns+` FROM payments
		 WHERE order_id = $1 AND status IN ('initiated','redirected')
		 ORDER BY created_at DESC LIMIT 1`, orderID))
}

func (r *PaymentRepo) ListForOrder(ctx context.Context, orderID uuid.UUID) ([]*commerce.Payment, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+paymentColumns+` FROM payments WHERE order_id = $1 ORDER BY created_at DESC`, orderID)
	if err != nil {
		return nil, fmt.Errorf("list payments: %w", err)
	}
	defer rows.Close()
	var out []*commerce.Payment
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *PaymentRepo) MarkRedirected(ctx context.Context, id uuid.UUID, gatewayRef string) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE payments SET gateway_ref=$2, status='redirected', updated_at=now() WHERE id=$1`,
		id, gatewayRef)
	return err
}

// MarkVerified transitions redirected → verified; false = already handled.
func (r *PaymentRepo) MarkVerified(ctx context.Context, id uuid.UUID, cardMasked string) (bool, error) {
	var card *string
	if cardMasked != "" {
		card = &cardMasked
	}
	tag, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE payments SET status='verified', verified_at=now(), card_masked=$2, updated_at=now()
		 WHERE id=$1 AND status IN ('initiated','redirected')`, id, card)
	if err != nil {
		return false, fmt.Errorf("mark verified: %w", err)
	}
	return tag.RowsAffected() == 1, nil
}

func (r *PaymentRepo) MarkFailed(ctx context.Context, id uuid.UUID, reason string) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE payments SET status='failed', failure_reason=$2, updated_at=now() WHERE id=$1`,
		id, reason)
	return err
}

func (r *PaymentRepo) MarkReversed(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE payments SET status='reversed', updated_at=now() WHERE id=$1`, id)
	return err
}

func (r *PaymentRepo) StuckForReconcile(ctx context.Context, olderThan time.Duration, limit int) ([]*commerce.Payment, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+paymentColumns+` FROM payments
		 WHERE status = 'redirected' AND initiated_at < $1
		 ORDER BY initiated_at LIMIT $2`, time.Now().Add(-olderThan), limit)
	if err != nil {
		return nil, fmt.Errorf("stuck payments: %w", err)
	}
	defer rows.Close()
	var out []*commerce.Payment
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// PaymentEventRepo implements ports.PaymentEventRepo.
type PaymentEventRepo struct{ pool *pgxpool.Pool }

func NewPaymentEventRepo(pool *pgxpool.Pool) *PaymentEventRepo {
	return &PaymentEventRepo{pool: pool}
}

func (r *PaymentEventRepo) Insert(ctx context.Context, e *commerce.PaymentEvent) error {
	var payload []byte
	if len(e.Payload) > 0 {
		payload = e.Payload
	}
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO payment_events (id, payment_id, type, payload) VALUES ($1,$2,$3,$4)`,
		e.ID, e.PaymentID, e.Type, payload)
	if err != nil {
		return fmt.Errorf("insert payment event: %w", err)
	}
	return nil
}

func (r *PaymentEventRepo) ListForPayment(ctx context.Context, paymentID uuid.UUID) ([]*commerce.PaymentEvent, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, payment_id, type, payload, created_at FROM payment_events
		 WHERE payment_id = $1 ORDER BY created_at`, paymentID)
	if err != nil {
		return nil, fmt.Errorf("list payment events: %w", err)
	}
	defer rows.Close()
	var out []*commerce.PaymentEvent
	for rows.Next() {
		e := &commerce.PaymentEvent{}
		if err := rows.Scan(&e.ID, &e.PaymentID, &e.Type, &e.Payload, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan payment event: %w", err)
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

// RefundRepo implements ports.RefundRepo.
type RefundRepo struct{ pool *pgxpool.Pool }

func NewRefundRepo(pool *pgxpool.Pool) *RefundRepo { return &RefundRepo{pool: pool} }

func (r *RefundRepo) Create(ctx context.Context, rf *commerce.Refund) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO refunds (id, payment_id, amount_rial, kind, reason, status, gateway_ref, acted_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		rf.ID, rf.PaymentID, rf.AmountRial, string(rf.Kind), rf.Reason, string(rf.Status),
		rf.GatewayRef, rf.ActedBy)
	if err != nil {
		return fmt.Errorf("insert refund: %w", err)
	}
	return nil
}

func (r *RefundRepo) ForPayment(ctx context.Context, paymentID uuid.UUID) (*commerce.Refund, error) {
	rf := &commerce.Refund{}
	var kind, status string
	err := r.pool.QueryRow(ctx,
		`SELECT id, payment_id, amount_rial, kind, reason, status, gateway_ref, acted_by FROM refunds
		 WHERE payment_id = $1`, paymentID).
		Scan(&rf.ID, &rf.PaymentID, &rf.AmountRial, &kind, &rf.Reason, &status, &rf.GatewayRef, &rf.ActedBy)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan refund: %w", err)
	}
	rf.Kind = commerce.RefundKind(kind)
	rf.Status = commerce.RefundStatus(status)
	return rf, nil
}

func (r *RefundRepo) UpdateStatus(ctx context.Context, id uuid.UUID, s commerce.RefundStatus, gatewayRef *string) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE refunds SET status=$2, gateway_ref=$3, updated_at=now() WHERE id=$1`,
		id, string(s), gatewayRef)
	return err
}

var _ = json.Marshal
