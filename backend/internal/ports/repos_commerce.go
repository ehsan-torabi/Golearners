// Commerce repository ports.
package ports

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/commerce"
)

// OrderRepo — order persistence; Create is atomic with its items.
type OrderRepo interface {
	Create(ctx context.Context, o *commerce.Order, items []commerce.OrderItem) error
	// ItemsOf returns the line items of an order.
	ItemsOf(ctx context.Context, orderID uuid.UUID) ([]commerce.OrderItem, error)
	ByID(ctx context.Context, id uuid.UUID) (*commerce.Order, error)
	ListForUser(ctx context.Context, userID uuid.UUID, page, perPage int) ([]*commerce.Order, int, error)
	ListAdmin(ctx context.Context, status string, page, perPage int) ([]*commerce.Order, int, error)
	// MarkPaid transitions awaiting_payment → paid conditionally.
	MarkPaid(ctx context.Context, id uuid.UUID) (bool, error)
	Expire(ctx context.Context, id uuid.UUID) error
	Cancel(ctx context.Context, id uuid.UUID) error
	MarkRefunded(ctx context.Context, id uuid.UUID) error
	// ExpireDue flips every stale awaiting_payment order; returns affected count.
	ExpireDue(ctx context.Context, now time.Time) (int64, error)
}

// CouponRepo — discount codes + redemption counting.
type CouponRepo interface {
	Create(ctx context.Context, c *commerce.Coupon) error
	ByID(ctx context.Context, id uuid.UUID) (*commerce.Coupon, error)
	ByCode(ctx context.Context, code string) (*commerce.Coupon, error)
	Update(ctx context.Context, c *commerce.Coupon) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, page, perPage int) ([]*commerce.Coupon, int, error)
	CountUses(ctx context.Context, couponID uuid.UUID) (int, error)
	CountUsesByUser(ctx context.Context, couponID, userID uuid.UUID) (int, error)
	// Redeem inserts a redemption row; unique (coupon, order) keeps it idempotent.
	Redeem(ctx context.Context, couponID, userID, orderID uuid.UUID) error
}

// PaymentRepo — gateway attempts with idempotent state transitions.
type PaymentRepo interface {
	Create(ctx context.Context, p *commerce.Payment) error
	ByID(ctx context.Context, id uuid.UUID) (*commerce.Payment, error)
	ByGatewayRef(ctx context.Context, g commerce.Gateway, ref string) (*commerce.Payment, error)
	// ActiveForOrder returns the single in-flight payment, if any.
	ActiveForOrder(ctx context.Context, orderID uuid.UUID) (*commerce.Payment, error)
	// ListForOrder returns every attempt (newest first) for receipts/refunds.
	ListForOrder(ctx context.Context, orderID uuid.UUID) ([]*commerce.Payment, error)
	MarkRedirected(ctx context.Context, id uuid.UUID, gatewayRef string) error
	// MarkVerified transitions redirected → verified; false = someone else won.
	MarkVerified(ctx context.Context, id uuid.UUID, cardMasked string) (bool, error)
	MarkFailed(ctx context.Context, id uuid.UUID, reason string) error
	MarkReversed(ctx context.Context, id uuid.UUID) error
	// StuckForReconcile lists redirected payments older than the duration.
	StuckForReconcile(ctx context.Context, olderThan time.Duration, limit int) ([]*commerce.Payment, error)
}

// PaymentEventRepo — append-only gateway interaction ledger.
type PaymentEventRepo interface {
	Insert(ctx context.Context, e *commerce.PaymentEvent) error
	ListForPayment(ctx context.Context, paymentID uuid.UUID) ([]*commerce.PaymentEvent, error)
}

// RefundRepo — repayment records.
type RefundRepo interface {
	Create(ctx context.Context, r *commerce.Refund) error
	ForPayment(ctx context.Context, paymentID uuid.UUID) (*commerce.Refund, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, s commerce.RefundStatus, gatewayRef *string) error
}

// EntitlementRepo extensions for commerce (grant + revoke).
type EntitlementGranter interface {
	Grant(ctx context.Context, e *Entitlement) error
	RevokeByOrder(ctx context.Context, orderID uuid.UUID) error
}
