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
	ID        uuid.UUID
	PaymentID uuid.UUID
	Type      string
	Payload   []byte
	CreatedAt time.Time
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
	ID         uuid.UUID
	PaymentID  uuid.UUID
	AmountRial int64
	Kind       RefundKind
	Reason     string
	Status     RefundStatus
	GatewayRef *string
	ActedBy    *uuid.UUID
	CreatedAt  time.Time
	UpdatedAt  time.Time
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
	ID            uuid.UUID
	Code          string
	Type          CouponType
	Value         int64 // percent (1..100) or fixed Rials
	MaxUses       *int
	PerUserLimit  *int
	MinAmountRial *int64
	StartsAt      *time.Time
	EndsAt        *time.Time
	CourseScope   *uuid.UUID
	Status        string // active | disabled
	CreatedAt     time.Time
	UpdatedAt     time.Time
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
