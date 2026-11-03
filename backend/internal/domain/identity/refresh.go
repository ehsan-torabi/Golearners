package identity

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// RefreshTTL matches docs/01 US-A5: 30-day rotating refresh family.
const RefreshTTL = 30 * 24 * time.Hour

type RefreshToken struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	FamilyID   uuid.UUID
	TokenHash  string
	ExpiresAt  time.Time
	RevokedAt  *time.Time
	ReplacedBy *uuid.UUID
	IP         string
	UserAgent  string
	CreatedAt  time.Time
}

func (t *RefreshToken) Expired(now time.Time) bool { return now.After(t.ExpiresAt) }
func (t *RefreshToken) Revoked() bool              { return t.RevokedAt != nil }

// NewOpaqueRefreshToken returns (plaintext, hash). Only the hash is stored;
// the plaintext lives exclusively in the httpOnly cookie.
func NewOpaqueRefreshToken() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", fmt.Errorf("generate refresh token: %w", err)
	}
	plain := base64.RawURLEncoding.EncodeToString(raw)
	return plain, HashRefreshToken(plain), nil
}

func HashRefreshToken(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}

// NewCSRFToken returns a signed double-submit CSRF token: "<nonce>.<mac>".
//
// The cookie value is readable by JavaScript on purpose (the SPA copies it into
// the X-CSRF-Token header), so the server cannot trust its shape. Signing the
// nonce means a cookie value an attacker injected from another origin — a
// sibling subdomain, or any writer that can set cookies for this host — fails
// the signature check instead of matching a header the attacker also chose.
func NewCSRFToken(pepper string) (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("generate csrf token: %w", err)
	}
	nonce := hex.EncodeToString(raw)
	return nonce + "." + csrfMAC(pepper, nonce), nil
}

// VerifyCSRFToken reports whether token carries a valid signature for pepper.
func VerifyCSRFToken(token, pepper string) bool {
	nonce, mac, ok := strings.Cut(token, ".")
	if !ok || nonce == "" || mac == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(csrfMAC(pepper, nonce)), []byte(mac)) == 1
}

// csrfMAC signs the nonce with a CSRF-specific key derived from the pepper, so
// the CSRF signature can never be replayed as an OTP or token hash.
func csrfMAC(pepper, nonce string) string {
	mac := hmac.New(sha256.New, []byte(pepper))
	mac.Write([]byte("csrf-v1:" + nonce))
	return hex.EncodeToString(mac.Sum(nil))
}
