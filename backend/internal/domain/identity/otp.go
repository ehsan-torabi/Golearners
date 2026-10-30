package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
)

// OTP policy (docs/01 US-A1): 6 digits, 2-minute TTL, max 5 attempts, 60 s resend.
const (
	OTPCodeLength  = 6
	OTPTTL         = 2 * time.Minute
	OTPMaxAttempts = 5
	OTPResendAfter = 60 * time.Second
)

type Purpose string

const (
	PurposeVerify Purpose = "verify"
	PurposeLogin  Purpose = "login"
	PurposeReset  Purpose = "reset"
)

func (p Purpose) Valid() bool {
	return p == PurposeVerify || p == PurposeLogin || p == PurposeReset
}

type OTP struct {
	ID         uuid.UUID
	Mobile     string
	CodeHash   string
	Purpose    Purpose
	ExpiresAt  time.Time
	Attempts   int
	ConsumedAt *time.Time
	CreatedAt  time.Time
}

func (o *OTP) Expired(now time.Time) bool { return now.After(o.ExpiresAt) }
func (o *OTP) Locked() bool               { return o.Attempts >= OTPMaxAttempts }

// GenerateCode returns a cryptographically random zero-padded 6-digit code.
func GenerateCode() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", fmt.Errorf("generate otp: %w", err)
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// HashOTP is an HMAC-style keyed hash: pepper = server secret (JWT secret
// today). Without it, a leaked DB row would be brute-forceable (10^6 space).
func HashOTP(code, pepper string) string {
	h := sha256.New()
	h.Write([]byte(pepper + ":" + code))
	return hex.EncodeToString(h.Sum(nil))
}

// EqualOTP compares in constant time.
func EqualOTP(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
