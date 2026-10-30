// Package digipay scaffolds the DigiPay adapter behind ports.PaymentGateway.
//
// TODO(digipay-docs): fill the marked integration points from DigiPay's
// official merchant API documentation + credentials before enabling:
//   - base URLs (sandbox + production) and auth scheme (API key vs OAuth)
//   - initiate/verify endpoint paths, amount unit (Rial vs Toman)
//   - callback parameter names and any signature scheme
//   - refund endpoint + idempotency semantics
//
// Until then every method returns ports.ErrNotConfigured so misconfiguration
// fails loudly instead of silently breaking checkout.
package digipay

import (
	"context"
	"net/url"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/ports"
)

type Gateway struct{}

func New() *Gateway { return &Gateway{} }

func (g *Gateway) Name() commerce.Gateway { return commerce.GatewayDigipay }

func (g *Gateway) Initiate(context.Context, ports.InitiateRequest) (ports.InitiateResult, error) {
	// TODO(digipay-docs): implement against official docs.
	return ports.InitiateResult{}, ports.ErrNotConfigured
}

func (g *Gateway) Verify(context.Context, ports.VerifyRequest) (ports.VerifyResult, error) {
	// TODO(digipay-docs): implement against official docs.
	return ports.VerifyResult{}, ports.ErrNotConfigured
}

func (g *Gateway) Refund(context.Context, ports.RefundRequest) (ports.RefundResult, error) {
	// TODO(digipay-docs): implement against official docs.
	return ports.RefundResult{}, ports.ErrRefundUnsupported
}

func (g *Gateway) ParseCallback(url.Values) (ports.CallbackData, error) {
	// TODO(digipay-docs): implement against official docs.
	return ports.CallbackData{}, ports.ErrNotConfigured
}
