// Package ports defines the seams between services and the outside world
// (repositories, providers, crypto). Adapters implement them; services and
// tests depend only on these interfaces.
package ports

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/identity"
)

// ErrNotFound is returned by repositories when an entity does not exist.
var ErrNotFound = errors.New("not found")

// --- identity repositories ---

type UserRepo interface {
	Create(ctx context.Context, u *identity.User) error
	ByMobile(ctx context.Context, mobile string) (*identity.User, error)
	ByID(ctx context.Context, id uuid.UUID) (*identity.User, error)
	Roles(ctx context.Context, userID uuid.UUID) ([]identity.Role, error)
	AddRole(ctx context.Context, userID uuid.UUID, role identity.Role) error
	SetMobileVerified(ctx context.Context, userID uuid.UUID) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
	TouchLogin(ctx context.Context, userID uuid.UUID) error
}

type OTPRepo interface {
	Create(ctx context.Context, otp *identity.OTP) error
	// Latest returns the newest unconsumed OTP for (mobile, purpose).
	Latest(ctx context.Context, mobile string, p identity.Purpose) (*identity.OTP, error)
	// LatestAny returns the newest OTP regardless of consumption (resend window).
	LatestAny(ctx context.Context, mobile string, p identity.Purpose) (*identity.OTP, error)
	// Consume atomically marks the OTP used; false ⇒ already consumed.
	Consume(ctx context.Context, id uuid.UUID) (bool, error)
	IncrementAttempts(ctx context.Context, id uuid.UUID) error
}

type RefreshTokenRepo interface {
	Create(ctx context.Context, t *identity.RefreshToken) error
	ByHash(ctx context.Context, tokenHash string) (*identity.RefreshToken, error)
	// Rotate atomically revokes the old token (replaced_by = new.ID) and inserts the new one.
	Rotate(ctx context.Context, oldID uuid.UUID, next *identity.RefreshToken) error
	RevokeByHash(ctx context.Context, tokenHash string) error
	RevokeFamily(ctx context.Context, familyID uuid.UUID) error
	RevokeAllForUser(ctx context.Context, userID uuid.UUID) error
}

// --- infrastructure providers ---

type PasswordHasher interface {
	Hash(password string) (string, error)
	// Verify reports whether password matches the encoded Argon2id hash.
	Verify(encodedHash, password string) (bool, error)
}

type TokenSigner interface {
	// SignAccess issues a short-lived access token for the user.
	SignAccess(ctx context.Context, userID uuid.UUID) (token string, expiresAt time.Time, err error)
	// ParseAccess validates and returns the user id.
	ParseAccess(ctx context.Context, token string) (uuid.UUID, error)
}

type SMS interface {
	Send(ctx context.Context, mobile, text string) error
}

// Throttler is the rate-limiting primitive (fixed window). Used by middleware
// (per-IP) and the identity service (per-account failure counters).
type Throttler interface {
	// Hit records a hit and reports whether the key stays under the limit.
	Hit(ctx context.Context, key string, limit int, window time.Duration) (allowed bool, retryAfter time.Duration, err error)
	// Blocked reports whether the key already exceeded limit, without recording a hit.
	Blocked(ctx context.Context, key string, limit int) (blocked bool, retryAfter time.Duration, err error)
}
