// Commerce entities (money in integer Rials everywhere).
package commerce

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Order aggregates order items + discount into the payable amount.
type Order struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	Status       OrderStatus
	SubtotalRial int64
	DiscountRial int64
	TotalRial    int64
	CouponID     *uuid.UUID
	ExpiresAt    time.Time
	PaidAt       *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Items is the order's line items (one course per order in v1).
type OrderItem struct {
	ID            uuid.UUID
	OrderID       uuid.UUID
	CourseID      uuid.UUID
	TitleSnapshot string
	UnitPriceRial int64
}

// Expired reports whether the unpaid order passed its TTL.
func (o *Order) Expired(now time.Time) bool {
	return o.Status == OrderAwaitingPayment && now.After(o.ExpiresAt)
}

// Payable reports whether a payment may be initiated.
func (o *Order) Payable(now time.Time) bool {
	return o.Status == OrderAwaitingPayment && !now.After(o.ExpiresAt)
}

// Payment is one gateway attempt.
type Payment struct {
	ID             uuid.UUID
	OrderID        uuid.UUID
	Gateway        Gateway
	GatewayRef     *string
	AmountRial     int64
	Status         PaymentStatus
	IdempotencyKey string
	CardMasked     *string
	FailureReason  *string
	InitiatedAt    time.Time
	VerifiedAt     *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// PaymentEvent is the append-only gateway interaction ledger.
type PaymentEvent struct {
	ID        uuid.UUID `json:"id"`
	PaymentID uuid.UUID `json:"payment_id"`
	Type      string    `json:"type"`
	Payload   []byte    `json:"payload"`
	CreatedAt time.Time `json:"created_at"`
}

// Event type names.
const (
	EventRequestSent      = "request_sent"
	EventRequestOK        = "request_ok"
	EventRedirect         = "redirect"
	EventCallbackReceived = "callback_received"
	EventVerifyOK         = "verify_ok"
	EventVerifyFailed     = "verify_failed"
	EventReconciled       = "reconciled"
	EventReverseRequested = "reverse_requested"
	EventReverseOK        = "reverse_ok"
)

// Refund records a repayment to the buyer.
type Refund struct {
	ID         uuid.UUID    `json:"id"`
	PaymentID  uuid.UUID    `json:"payment_id"`
	AmountRial int64        `json:"amount_rial"`
	Kind       RefundKind   `json:"kind"`
	Reason     string       `json:"reason"`
	Status     RefundStatus `json:"status"`
	GatewayRef *string      `json:"gateway_ref"`
	ActedBy    *uuid.UUID   `json:"acted_by"`
	CreatedAt  time.Time    `json:"created_at"`
	UpdatedAt  time.Time    `json:"updated_at"`
}

// CouponType selects percent vs fixed-amount discounts.
type CouponType string

// Coupon types.
const (
	CouponPercent CouponType = "percent"
	CouponFixed   CouponType = "fixed"
)

// Coupon is a discount code.
type Coupon struct {
	ID            uuid.UUID  `json:"id"`
	Code          string     `json:"code"`
	Type          CouponType `json:"type"`
	Value         int64      `json:"value"` // percent (1..100) or fixed Rials
	MaxUses       *int       `json:"max_uses"`
	PerUserLimit  *int       `json:"per_user_limit"`
	MinAmountRial *int64     `json:"min_amount_rial"`
	StartsAt      *time.Time `json:"starts_at"`
	EndsAt        *time.Time `json:"ends_at"`
	CourseScope   *uuid.UUID `json:"course_scope"`
	Status        string     `json:"status"` // active | disabled
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// Active reports the window + status checks.
func (c *Coupon) Active(now time.Time) bool {
	if c.Status != "active" {
		return false
	}
	if c.StartsAt != nil && now.Before(*c.StartsAt) {
		return false
	}
	if c.EndsAt != nil && now.After(*c.EndsAt) {
		return false
	}
	return true
}

// DiscountFor computes the discount for a subtotal, or an error when the
// coupon cannot apply (min amount, bad percent value).
func (c *Coupon) DiscountFor(subtotal int64) (int64, error) {
	switch c.Type {
	case CouponPercent:
		if c.Value <= 0 || c.Value > 100 {
			return 0, fmt.Errorf("percent value %d out of range", c.Value)
		}
		return subtotal * c.Value / 100, nil
	case CouponFixed:
		if c.Value > subtotal {
			return subtotal, nil
		}
		return c.Value, nil
	}
	return 0, fmt.Errorf("unknown coupon type %q", c.Type)
}
