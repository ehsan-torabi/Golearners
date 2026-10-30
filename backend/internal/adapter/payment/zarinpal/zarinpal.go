// Package zarinpal implements ports.PaymentGateway against ZarinPal's official
// v4 REST API (https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html,
// verified 2026-10-30). Amounts are Rials; verify codes 100 (verified) and
// 101 (already verified — idempotent success) are both treated as paid.
package zarinpal

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/ports"
)

const (
	prodBase = "https://payment.zarinpal.com"
	sandBase = "https://sandbox.zarinpal.com"
	timeout  = 15 * time.Second
)

// Config for the adapter.
type Config struct {
	MerchantID string // 36-char UUID from the ZarinPal panel
	Sandbox    bool
}

type Gateway struct {
	cfg    Config
	apiURL string // base for API calls
	payURL string // base for the StartPay redirect
	client *http.Client
}

func New(cfg Config) *Gateway {
	base := prodBase
	if cfg.Sandbox {
		base = sandBase
	}
	return &Gateway{
		cfg:    cfg,
		apiURL: base + "/pg/v4",
		payURL: base + "/pg/StartPay/",
		client: &http.Client{Timeout: timeout},
	}
}

func (g *Gateway) Name() commerce.Gateway { return commerce.GatewayZarinpal }

// zarinResponse is the shared v4 envelope.
type zarinResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors json.RawMessage `json:"errors"`
}

type requestResponse struct {
	Code      int    `json:"code"`
	Message   string `json:"message"`
	Authority string `json:"authority"`
}

type verifyResponse struct {
	Code     int    `json:"code"`
	Message  string `json:"message"`
	RefID    int64  `json:"ref_id"`
	CardPAN  string `json:"card_pan"`
	CardHash string `json:"card_hash"`
}

// post issues a v4 JSON call and returns the envelope.
func (g *Gateway) post(ctx context.Context, path string, body any) (*zarinResponse, error) {
	raw, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.apiURL+path, bytes.NewReader(raw))
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call %s: %w", path, err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("zarinpal %s: http %d: %s", path, resp.StatusCode, truncate(data))
	}
	var env zarinResponse
	if err := json.Unmarshal(data, &env); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	return &env, nil
}

func truncate(b []byte) string {
	if len(b) > 200 {
		return string(b[:200])
	}
	return string(b)
}

// Initiate creates a payment session (official: POST /payment/request.json).
func (g *Gateway) Initiate(ctx context.Context, req ports.InitiateRequest) (ports.InitiateResult, error) {
	body := map[string]any{
		"merchant_id":  g.cfg.MerchantID,
		"amount":       req.AmountRial,
		"description":  req.Description,
		"callback_url": req.CallbackURL,
		"metadata": map[string]any{
			"order_id": req.OrderID.String(),
			"mobile":   req.Mobile,
		},
	}
	env, err := g.post(ctx, "/payment/request.json", body)
	if err != nil {
		return ports.InitiateResult{}, err
	}
	var rr requestResponse
	if err := json.Unmarshal(env.Data, &rr); err != nil {
		return ports.InitiateResult{}, fmt.Errorf("decode request.json data: %w (%s)", err, truncate(env.Errors))
	}
	if rr.Code != 100 || rr.Authority == "" {
		return ports.InitiateResult{}, fmt.Errorf("zarinpal request rejected: code=%d msg=%s errors=%s",
			rr.Code, rr.Message, truncate(env.Errors))
	}
	return ports.InitiateResult{
		RedirectURL: g.payURL + rr.Authority,
		GatewayRef:  rr.Authority,
	}, nil
}

// Verify confirms a payment (official: POST /payment/verify.json).
// Code 100 = verified now; 101 = already verified (idempotent success).
func (g *Gateway) Verify(ctx context.Context, req ports.VerifyRequest) (ports.VerifyResult, error) {
	body := map[string]any{
		"merchant_id": g.cfg.MerchantID,
		"amount":      req.AmountRial,
		"authority":   req.GatewayRef,
	}
	env, err := g.post(ctx, "/payment/verify.json", body)
	if err != nil {
		return ports.VerifyResult{}, err
	}
	var vr verifyResponse
	if err := json.Unmarshal(env.Data, &vr); err != nil {
		return ports.VerifyResult{}, fmt.Errorf("decode verify.json data: %w (%s)", err, truncate(env.Errors))
	}
	switch vr.Code {
	case 100:
		return ports.VerifyResult{OK: true, GatewayRef: req.GatewayRef, CardMasked: vr.CardPAN, Raw: env.Data}, nil
	case 101:
		return ports.VerifyResult{OK: true, AlreadyVerified: true, GatewayRef: req.GatewayRef, CardMasked: vr.CardPAN, Raw: env.Data}, nil
	default:
		return ports.VerifyResult{}, fmt.Errorf("zarinpal verify failed: code=%d msg=%s errors=%s",
			vr.Code, vr.Message, truncate(env.Errors))
	}
}

// Refund reverses a payment (official: POST /payment/reverse.json).
// Constraints per docs: within 30 minutes of payment, server IP whitelisted.
func (g *Gateway) Refund(ctx context.Context, req ports.RefundRequest) (ports.RefundResult, error) {
	body := map[string]any{
		"merchant_id": g.cfg.MerchantID,
		"authority":   req.GatewayRef,
	}
	env, err := g.post(ctx, "/payment/reverse.json", body)
	if err != nil {
		return ports.RefundResult{}, err
	}
	var rr struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(env.Data, &rr); err != nil {
		return ports.RefundResult{}, fmt.Errorf("decode reverse.json data: %w (%s)", err, truncate(env.Errors))
	}
	if rr.Code != 100 {
		return ports.RefundResult{}, fmt.Errorf("zarinpal reverse failed: code=%d msg=%s errors=%s",
			rr.Code, rr.Message, truncate(env.Errors))
	}
	return ports.RefundResult{OK: true, GatewayRef: req.GatewayRef, Raw: env.Data}, nil
}

// ParseCallback normalizes the browser redirect (Authority + Status=OK|NOK).
func (g *Gateway) ParseCallback(values url.Values) (ports.CallbackData, error) {
	ref := values.Get("Authority")
	if ref == "" {
		return ports.CallbackData{}, fmt.Errorf("missing Authority")
	}
	return ports.CallbackData{
		GatewayRef: ref,
		Status:     values.Get("Status"),
		Raw:        values,
	}, nil
}
