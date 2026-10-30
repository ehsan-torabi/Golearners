package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
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

// NewCSRFToken returns a random double-submit CSRF token (cookie value == header).
func NewCSRFToken() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("generate csrf token: %w", err)
	}
	return hex.EncodeToString(raw), nil
}
