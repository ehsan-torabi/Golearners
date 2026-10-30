// Commerce ports: repositories + the payment-gateway abstraction (docs/05 §1).
package ports

import (
	"context"
	"errors"
	"net/url"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/commerce"
)

// ErrRefundUnsupported is returned by gateways without refund capability.
var ErrRefundUnsupported = errors.New("gateway does not support refunds")

// ErrNotConfigured is returned by unconfigured adapters (digipay/snappay).
var ErrNotConfigured = errors.New("gateway is not configured")

// InitiateRequest starts a gateway session for an order.
type InitiateRequest struct {
	OrderID     uuid.UUID
	AmountRial  int64
	CallbackURL string
	Description string
	Mobile      string
}

// InitiateResult carries the redirect target + provider reference.
type InitiateResult struct {
	RedirectURL string
	GatewayRef  string
}

// VerifyRequest re-checks a payment server-side (never trust callbacks alone).
type VerifyRequest struct {
	GatewayRef string
	AmountRial int64
	Raw        url.Values
}

// VerifyResult is the verification verdict. AlreadyVerified covers idempotent
// replays (e.g. ZarinPal verify code 101).
type VerifyResult struct {
	OK              bool
	AlreadyVerified bool
	GatewayRef      string
	CardMasked      string
	Raw             []byte
}

// RefundRequest reverses a verified payment.
type RefundRequest struct {
	GatewayRef string
	AmountRial int64
}

// RefundResult reports the reversal outcome.
type RefundResult struct {
	OK         bool
	GatewayRef string
	Raw        []byte
}

// CallbackData is the normalized gateway redirect payload.
type CallbackData struct {
	GatewayRef string
	Status     string
	Raw        url.Values
}

// PaymentGateway is the provider seam — checkout logic never changes per gateway.
type PaymentGateway interface {
	Name() commerce.Gateway
	Initiate(ctx context.Context, req InitiateRequest) (InitiateResult, error)
	Verify(ctx context.Context, req VerifyRequest) (VerifyResult, error)
	Refund(ctx context.Context, req RefundRequest) (RefundResult, error)
	ParseCallback(values url.Values) (CallbackData, error)
}

// GatewayRegistry resolves configured gateways by name.
type GatewayRegistry interface {
	Gateway(name commerce.Gateway) (PaymentGateway, error)
}
