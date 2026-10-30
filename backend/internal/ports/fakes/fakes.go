// Package fakes provides in-memory implementations of the ports for unit
// tests that must not touch postgres/redis. NOT for production use.
package fakes

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
)

// --- user repo ---

type UserRepo struct {
	mu    sync.Mutex
	byID  map[uuid.UUID]*identity.User
	roles map[uuid.UUID][]identity.Role
}

func NewUserRepo() *UserRepo {
	return &UserRepo{byID: map[uuid.UUID]*identity.User{}, roles: map[uuid.UUID][]identity.Role{}}
}

func (f *UserRepo) Create(_ context.Context, u *identity.User) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, have := range f.byID {
		if have.Mobile == u.Mobile {
			return fmt.Errorf("duplicate mobile")
		}
	}
	clone := *u
	f.byID[u.ID] = &clone
	f.roles[u.ID] = []identity.Role{identity.RoleLearner}
	return nil
}

func (f *UserRepo) ByMobile(_ context.Context, mobile string) (*identity.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, u := range f.byID {
		if u.Mobile == mobile {
			clone := *u
			return &clone, nil
		}
	}
	return nil, ports.ErrNotFound
}

func (f *UserRepo) ByID(_ context.Context, id uuid.UUID) (*identity.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.byID[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *u
	return &clone, nil
}

func (f *UserRepo) Roles(_ context.Context, id uuid.UUID) ([]identity.Role, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := append([]identity.Role(nil), f.roles[id]...)
	return out, nil
}

func (f *UserRepo) AddRole(_ context.Context, id uuid.UUID, role identity.Role) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.roles[id] = append(f.roles[id], role)
	return nil
}

func (f *UserRepo) SetMobileVerified(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.byID[id]
	if !ok {
		return ports.ErrNotFound
	}
	now := time.Now()
	u.MobileVerifiedAt = &now
	return nil
}

func (f *UserRepo) UpdatePassword(_ context.Context, id uuid.UUID, hash string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.byID[id]
	if !ok {
		return ports.ErrNotFound
	}
	u.PasswordHash = hash
	return nil
}

func (f *UserRepo) TouchLogin(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.byID[id]
	if !ok {
		return ports.ErrNotFound
	}
	now := time.Now()
	u.LastLoginAt = &now
	return nil
}

// --- otp repo ---

type OTPRepo struct {
	mu   sync.Mutex
	list []*identity.OTP
}

func NewOTPRepo() *OTPRepo { return &OTPRepo{} }

func (f *OTPRepo) Create(_ context.Context, o *identity.OTP) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	clone := *o
	f.list = append(f.list, &clone)
	return nil
}

func (f *OTPRepo) Latest(_ context.Context, mobile string, p identity.Purpose) (*identity.OTP, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for i := len(f.list) - 1; i >= 0; i-- {
		o := f.list[i]
		if o.Mobile == mobile && o.Purpose == p && o.ConsumedAt == nil {
			clone := *o
			return &clone, nil
		}
	}
	return nil, ports.ErrNotFound
}

func (f *OTPRepo) LatestAny(_ context.Context, mobile string, p identity.Purpose) (*identity.OTP, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for i := len(f.list) - 1; i >= 0; i-- {
		o := f.list[i]
		if o.Mobile == mobile && o.Purpose == p {
			clone := *o
			return &clone, nil
		}
	}
	return nil, ports.ErrNotFound
}

func (f *OTPRepo) Consume(_ context.Context, id uuid.UUID) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, o := range f.list {
		if o.ID == id {
			if o.ConsumedAt != nil {
				return false, nil
			}
			now := time.Now()
			o.ConsumedAt = &now
			return true, nil
		}
	}
	return false, ports.ErrNotFound
}

func (f *OTPRepo) IncrementAttempts(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, o := range f.list {
		if o.ID == id {
			o.Attempts++
			return nil
		}
	}
	return ports.ErrNotFound
}

// --- refresh token repo ---

type TokenRepo struct {
	mu     sync.Mutex
	byHash map[string]*identity.RefreshToken
}

func NewTokenRepo() *TokenRepo { return &TokenRepo{byHash: map[string]*identity.RefreshToken{}} }

func (f *TokenRepo) Create(_ context.Context, t *identity.RefreshToken) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	clone := *t
	f.byHash[t.TokenHash] = &clone
	return nil
}

func (f *TokenRepo) ByHash(_ context.Context, hash string) (*identity.RefreshToken, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	t, ok := f.byHash[hash]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *t
	return &clone, nil
}

func (f *TokenRepo) Rotate(_ context.Context, oldID uuid.UUID, next *identity.RefreshToken) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, t := range f.byHash {
		if t.ID == oldID {
			if t.RevokedAt != nil {
				return errors.New("already revoked")
			}
			now := time.Now()
			t.RevokedAt = &now
			t.ReplacedBy = &next.ID
			clone := *next
			f.byHash[next.TokenHash] = &clone
			return nil
		}
	}
	return ports.ErrNotFound
}

func (f *TokenRepo) RevokeByHash(_ context.Context, hash string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if t, ok := f.byHash[hash]; ok && t.RevokedAt == nil {
		now := time.Now()
		t.RevokedAt = &now
	}
	return nil
}

func (f *TokenRepo) RevokeFamily(_ context.Context, familyID uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	now := time.Now()
	for _, t := range f.byHash {
		if t.FamilyID == familyID && t.RevokedAt == nil {
			t.RevokedAt = &now
		}
	}
	return nil
}

func (f *TokenRepo) RevokeAllForUser(_ context.Context, userID uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	now := time.Now()
	for _, t := range f.byHash {
		if t.UserID == userID && t.RevokedAt == nil {
			t.RevokedAt = &now
		}
	}
	return nil
}

// --- sms ---

type SMS struct {
	mu       sync.Mutex
	messages []string // "mobile:text"
}

func NewSMS() *SMS { return &SMS{} }

func (f *SMS) Send(_ context.Context, mobile, text string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.messages = append(f.messages, mobile+":"+text)
	return nil
}

func (f *SMS) Sent() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]string(nil), f.messages...)
}

// --- throttler (in-memory fixed window) ---

type Throttler struct {
	mu   sync.Mutex
	hits map[string][]time.Time
	now  func() time.Time
}

func NewThrottler() *Throttler { return &Throttler{hits: map[string][]time.Time{}, now: time.Now} }

func (f *Throttler) Hit(_ context.Context, key string, limit int, window time.Duration) (bool, time.Duration, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	now := f.now()
	keep := f.hits[key][:0]
	for _, t := range f.hits[key] {
		if now.Sub(t) < window {
			keep = append(keep, t)
		}
	}
	keep = append(keep, now)
	f.hits[key] = keep
	if len(keep) > limit {
		return false, window, nil
	}
	return true, 0, nil
}

func (f *Throttler) Blocked(_ context.Context, key string, limit int) (bool, time.Duration, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.hits[key]) >= limit, 0, nil
}

// --- token signer (deterministic, for handler tests) ---

type StaticSigner struct{}

func (StaticSigner) SignAccess(_ context.Context, userID uuid.UUID) (string, time.Time, error) {
	return "access:" + userID.String(), time.Now().Add(15 * time.Minute), nil
}

func (StaticSigner) ParseAccess(_ context.Context, token string) (uuid.UUID, error) {
	id, err := uuid.Parse(strings.TrimPrefix(token, "access:"))
	if err != nil {
		return uuid.Nil, errors.New("bad token")
	}
	return id, nil
}

// --- password hasher (fast, for tests only) ---

type PlainHasher struct{}

func (PlainHasher) Hash(password string) (string, error) { return "plain$" + password, nil }

func (PlainHasher) Verify(encoded, password string) (bool, error) {
	return encoded == "plain$"+password, nil
}

// --- test-only conveniences ---

// LastCode extracts the 6-digit code from the last message sent to a mobile
// (mirrors the real mock SMS adapter's helper used by tests).
func (f *SMS) LastCode(mobile string) string {
	f.mu.Lock()
	defer f.mu.Unlock()
	for i := len(f.messages) - 1; i >= 0; i-- {
		m := f.messages[i]
		if len(m) < len(mobile)+1 || m[:len(mobile)] != mobile {
			continue
		}
		text := m[len(mobile)+1:]
		var digits []byte
		for _, r := range text {
			if r >= '0' && r <= '9' {
				digits = append(digits, byte(r))
			}
		}
		if len(digits) >= 6 {
			return string(digits[len(digits)-6:])
		}
	}
	return ""
}

// SetStatusForTest flips a user's status directly (simulates admin block).
func (f *UserRepo) SetStatusForTest(id uuid.UUID, status identity.Status) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if u, ok := f.byID[id]; ok {
		u.Status = status
	}
}

// FindByMobileForTest returns the user with the given mobile, if present.
func (f *UserRepo) FindByMobileForTest(mobile string) (*identity.User, bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, u := range f.byID {
		if u.Mobile == mobile {
			clone := *u
			return &clone, true
		}
	}
	return nil, false
}
