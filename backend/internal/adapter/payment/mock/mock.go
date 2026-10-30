// Package mock is a payment gateway adapter for dev/tests, paired with
// cmd/mockgateway (an in-memory fake IPG with pay/fail buttons).
package mock

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/ports"
)

// DefaultBaseURL for the mock gateway app.
const DefaultBaseURL = "http://localhost:8082"

type Gateway struct {
	base   string
	client *http.Client
}

func NewFromEnv() *Gateway {
	base := os.Getenv("PAYMENT_MOCK_BASE_URL")
	if base == "" {
		base = DefaultBaseURL
	}
	return &Gateway{base: base, client: &http.Client{Timeout: 10 * time.Second}}
}

func (g *Gateway) Name() commerce.Gateway { return commerce.GatewayMock }

// Initiate registers the session at the mock app and returns its /start URL.
func (g *Gateway) Initiate(ctx context.Context, req ports.InitiateRequest) (ports.InitiateResult, error) {
	var out struct {
		RedirectURL string `json:"redirect_url"`
	}
	err := g.postJSON(ctx, "/api/start", map[string]any{
		"ref":      req.OrderID.String(),
		"amount":   req.AmountRial,
		"callback": req.CallbackURL,
	}, &out)
	if err != nil {
		return ports.InitiateResult{}, err
	}
	return ports.InitiateResult{RedirectURL: out.RedirectURL, GatewayRef: req.OrderID.String()}, nil
}

// Verify asks the mock app to confirm ref+amount (server-side, mandatory).
func (g *Gateway) Verify(ctx context.Context, req ports.VerifyRequest) (ports.VerifyResult, error) {
	var out struct {
		OK      bool   `json:"ok"`
		Card    string `json:"card"`
		Already bool   `json:"already"`
	}
	err := g.postJSON(ctx, "/api/verify", map[string]any{
		"ref": req.GatewayRef, "amount": req.AmountRial,
	}, &out)
	if err != nil {
		return ports.VerifyResult{}, err
	}
	if !out.OK {
		return ports.VerifyResult{}, fmt.Errorf("mock verify rejected")
	}
	return ports.VerifyResult{OK: true, AlreadyVerified: out.Already, GatewayRef: req.GatewayRef, CardMasked: out.Card}, nil
}

// Refund reverses at the mock app.
func (g *Gateway) Refund(ctx context.Context, req ports.RefundRequest) (ports.RefundResult, error) {
	var out struct {
		OK bool `json:"ok"`
	}
	err := g.postJSON(ctx, "/api/refund", map[string]any{"ref": req.GatewayRef}, &out)
	if err != nil {
		return ports.RefundResult{}, err
	}
	return ports.RefundResult{OK: out.OK, GatewayRef: req.GatewayRef}, nil
}

// ParseCallback reads ref + Status from the redirect query.
func (g *Gateway) ParseCallback(values url.Values) (ports.CallbackData, error) {
	ref := values.Get("ref")
	if ref == "" {
		return ports.CallbackData{}, fmt.Errorf("missing ref")
	}
	return ports.CallbackData{GatewayRef: ref, Status: values.Get("Status"), Raw: values}, nil
}

func (g *Gateway) postJSON(ctx context.Context, path string, body, out any) error {
	raw, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.base+path, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := g.client.Do(req)
	if err != nil {
		return fmt.Errorf("mock gateway %s: %w", path, err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("mock gateway %s: http %d: %s", path, resp.StatusCode, data)
	}
	return json.Unmarshal(data, out)
}
