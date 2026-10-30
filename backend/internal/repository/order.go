// OrderRepo implementation (docs/03 invariants: atomic items, conditional paid).
package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/ports"
)

// OrderRepo implements ports.OrderRepo.
type OrderRepo struct{ pool *pgxpool.Pool }

func NewOrderRepo(pool *pgxpool.Pool) *OrderRepo { return &OrderRepo{pool: pool} }

const orderColumns = `id, user_id, status, subtotal_rial, discount_rial, total_rial,
	coupon_id, expires_at, paid_at, created_at, updated_at`

func scanOrder(row pgx.Row) (*commerce.Order, error) {
	o := &commerce.Order{}
	var status string
	err := row.Scan(&o.ID, &o.UserID, &status, &o.SubtotalRial, &o.DiscountRial,
		&o.TotalRial, &o.CouponID, &o.ExpiresAt, &o.PaidAt, &o.CreatedAt, &o.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan order: %w", err)
	}
	o.Status = commerce.OrderStatus(status)
	return o, nil
}

// Create inserts the order + its items atomically.
func (r *OrderRepo) Create(ctx context.Context, o *commerce.Order, items []commerce.OrderItem) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin order tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	_, err = tx.Exec(ctx, `INSERT INTO orders
		(id, user_id, status, subtotal_rial, discount_rial, total_rial, coupon_id, expires_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		o.ID, o.UserID, string(o.Status), o.SubtotalRial, o.DiscountRial,
		o.TotalRial, o.CouponID, o.ExpiresAt)
	if err != nil {
		return fmt.Errorf("insert order: %w", err)
	}
	for i := range items {
		_, err = tx.Exec(ctx, `INSERT INTO order_items
			(id, order_id, course_id, title_snapshot, unit_price_rial)
			VALUES ($1,$2,$3,$4,$5)`,
			items[i].ID, o.ID, items[i].CourseID, items[i].TitleSnapshot, items[i].UnitPriceRial)
		if err != nil {
			return fmt.Errorf("insert order item: %w", err)
		}
	}
	return tx.Commit(ctx)
}

func (r *OrderRepo) ItemsOf(ctx context.Context, orderID uuid.UUID) ([]commerce.OrderItem, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, order_id, course_id, title_snapshot, unit_price_rial
		 FROM order_items WHERE order_id = $1`, orderID)
	if err != nil {
		return nil, fmt.Errorf("list order items: %w", err)
	}
	defer rows.Close()
	var out []commerce.OrderItem
	for rows.Next() {
		var it commerce.OrderItem
		if err := rows.Scan(&it.ID, &it.OrderID, &it.CourseID, &it.TitleSnapshot, &it.UnitPriceRial); err != nil {
			return nil, fmt.Errorf("scan order item: %w", err)
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func (r *OrderRepo) ByID(ctx context.Context, id uuid.UUID) (*commerce.Order, error) {
	return scanOrder(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+orderColumns+` FROM orders WHERE id = $1`, id))
}

func (r *OrderRepo) ListForUser(ctx context.Context, userID uuid.UUID, page, perPage int) ([]*commerce.Order, int, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+orderColumns+` FROM orders o WHERE o.user_id = $1
		 ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`, userID, perPage, (page-1)*perPage)
	orders, err := collectOrders(rows, err)
	if err != nil {
		return nil, 0, err
	}
	var total int
	err = r.pool.QueryRow(ctx, `SELECT count(*) FROM orders WHERE user_id = $1`, userID).Scan(&total)
	return orders, total, err
}

func collectOrders(rows pgx.Rows, err error) ([]*commerce.Order, error) {
	if err != nil {
		return nil, fmt.Errorf("list orders: %w", err)
	}
	defer rows.Close()
	var out []*commerce.Order
	for rows.Next() {
		o, err := scanOrder(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

// MarkPaid transitions awaiting_payment → paid (false = someone else did).
func (r *OrderRepo) MarkPaid(ctx context.Context, id uuid.UUID) (bool, error) {
	tag, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE orders SET status='paid', paid_at=now(), updated_at=now()
		 WHERE id=$1 AND status='awaiting_payment'`, id)
	if err != nil {
		return false, fmt.Errorf("mark paid: %w", err)
	}
	return tag.RowsAffected() == 1, nil
}

func (r *OrderRepo) MarkRefunded(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE orders SET status='refunded', updated_at=now() WHERE id=$1`, id)
	return err
}

func (r *OrderRepo) Cancel(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE orders SET status='canceled', updated_at=now()
		 WHERE id=$1 AND status='awaiting_payment'`, id)
	return err
}

func (r *OrderRepo) Expire(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE orders SET status='expired', updated_at=now()
		 WHERE id=$1 AND status='awaiting_payment'`, id)
	return err
}

// ExpireDue flips every stale awaiting_payment order to expired.
func (r *OrderRepo) ExpireDue(ctx context.Context, now time.Time) (int64, error) {
	tag, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE orders SET status='expired', updated_at=now()
		 WHERE status='awaiting_payment' AND expires_at < $1`, now)
	if err != nil {
		return 0, fmt.Errorf("expire due orders: %w", err)
	}
	return tag.RowsAffected(), nil
}

func (r *OrderRepo) ListAdmin(ctx context.Context, status string, page, perPage int) ([]*commerce.Order, int, error) {
	where := "TRUE"
	args := []any{}
	if status != "" {
		where = "o.status = $1"
		args = append(args, status)
	}
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+orderColumns+` FROM orders o WHERE `+where+
			` ORDER BY o.created_at DESC LIMIT $`+fmt.Sprint(len(args)+1)+
			` OFFSET $`+fmt.Sprint(len(args)+2),
		append(args, perPage, (page-1)*perPage)...)
	orders, err := collectOrders(rows, err)
	if err != nil {
		return nil, 0, err
	}
	var total int
	err = r.pool.QueryRow(ctx, `SELECT count(*) FROM orders o WHERE `+where, args...).Scan(&total)
	return orders, total, err
}
