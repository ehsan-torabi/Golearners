// Package commerce is the commerce-context domain: orders, coupons,
// payments, refunds (docs/03 §3 + docs/05).
package commerce

import (
	"time"

	"github.com/google/uuid"
)

// OrderStatus is the order lifecycle (docs/03 §4).
type OrderStatus string

// Order statuses.
const (
	OrderAwaitingPayment OrderStatus = "awaiting_payment"
	OrderPaid            OrderStatus = "paid"
	OrderCanceled        OrderStatus = "canceled"
	OrderExpired         OrderStatus = "expired"
	OrderRefunded        OrderStatus = "refunded"
)

// PaymentStatus is the payment lifecycle.
type PaymentStatus string

// Payment statuses.
const (
	PaymentInitiated  PaymentStatus = "initiated"
	PaymentRedirected PaymentStatus = "redirected"
	PaymentVerified   PaymentStatus = "verified"
	PaymentFailed     PaymentStatus = "failed"
	PaymentReversed   PaymentStatus = "reversed"
)

// Gateway identifies a payment provider.
type Gateway string

// Gateways.
const (
	GatewayZarinpal Gateway = "zarinpal"
	GatewayDigipay  Gateway = "digipay"
	GatewaySnappay  Gateway = "snappay"
	GatewayMock     Gateway = "mock"
)

func (g Gateway) Valid() bool {
	switch g {
	case GatewayZarinpal, GatewayDigipay, GatewaySnappay, GatewayMock:
		return true
	}
	return false
}

// RefundKind distinguishes automatic gateway reversal from manual refunds.
type RefundKind string

// Refund kinds.
const (
	RefundGatewayReverse RefundKind = "gateway_reverse"
	RefundManual         RefundKind = "manual"
)

// RefundStatus is the refund lifecycle.
type RefundStatus string

// Refund statuses.
const (
	RefundRequested RefundStatus = "requested"
	RefundCompleted RefundStatus = "completed"
	RefundFailed    RefundStatus = "failed"
)

// OrderTTL — unpaid orders expire after 30 minutes (docs/01 US-C1).
const OrderTTL = 30 * time.Minute
