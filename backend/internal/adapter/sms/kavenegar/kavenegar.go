// Package kavenegar is the production SMS adapter scaffold.
//
// TODO(kavenegar-docs): confirm the exact REST path and parameter names for
// OTP template delivery (verify/lookup), sender line, and error semantics
// against official Kavenegar docs + the owner's account. Until an API key is
// configured, every Send returns ErrNotConfigured so misconfiguration fails
// loudly instead of silently dropping OTPs.
package kavenegar

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

var ErrNotConfigured = errors.New("kavenegar: KAVENEGAR_API_KEY is not set")

type SMS struct {
	apiKey string
	client *http.Client
}

func NewFromEnv() *SMS {
	return &SMS{
		apiKey: os.Getenv("KAVENEGAR_API_KEY"),
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *SMS) Send(ctx context.Context, mobile, text string) error {
	if s.apiKey == "" {
		return ErrNotConfigured
	}
	// TODO(kavenegar-docs): replace this placeholder request with the official
	// verify/lookup endpoint and template parameters once docs are confirmed.
	endpoint := fmt.Sprintf("https://api.kavenegar.com/v1/%s/sms/send.json", url.PathEscape(s.apiKey))
	form := url.Values{"receptor": {mobile}, "message": {text}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, nil)
	if err != nil {
		return fmt.Errorf("kavenegar: %w", err)
	}
	// kavenegar expects POST form params; kept minimal pending doc confirmation.
	req.URL.RawQuery = form.Encode()
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("kavenegar: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("kavenegar: unexpected status %d", resp.StatusCode)
	}
	return nil
}
