// Package fakes provides in-memory implementations of the ports for unit
// tests that must not touch postgres/redis. NOT for production use.
package fakes

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"net/url"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/domain/course"
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
	// NOTE: no implicit learner role — identity service grants it (single source of truth)
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

// --- media/playback fakes ---

type Storage struct {
	mu      sync.Mutex
	objects map[string]int64
}

func NewStorage() *Storage { return &Storage{objects: map[string]int64{}} }

func (f *Storage) Put(key string, size int64) {
	f.mu.Lock()
	f.objects[key] = size
	f.mu.Unlock()
}

func (f *Storage) PresignPut(_ context.Context, key, _ string, _ time.Duration) (string, error) {
	return "http://put/" + key, nil
}

func (f *Storage) PresignGet(_ context.Context, key string, _ time.Duration) (string, string, error) {
	f.mu.Lock()
	_, ok := f.objects[key]
	f.mu.Unlock()
	if !ok {
		return "", "", ports.ErrNotFound
	}
	return "http://get/" + key, "", nil
}

// Get returns the fake body sized like the stored object.
func (f *Storage) Get(_ context.Context, key string) (io.ReadCloser, int64, error) {
	f.mu.Lock()
	size, ok := f.objects[key]
	f.mu.Unlock()
	if !ok {
		return nil, 0, ports.ErrNotFound
	}
	return io.NopCloser(bytes.NewReader(make([]byte, size))), size, nil
}

func (f *Storage) Stat(_ context.Context, key string) (ports.ObjectInfo, error) {
	f.mu.Lock()
	size, ok := f.objects[key]
	f.mu.Unlock()
	if !ok {
		return ports.ObjectInfo{}, ports.ErrNotFound
	}
	return ports.ObjectInfo{SizeBytes: size, ETag: "e"}, nil
}

func (f *Storage) Delete(_ context.Context, key string) error {
	f.mu.Lock()
	delete(f.objects, key)
	f.mu.Unlock()
	return nil
}

type VideoPlatform struct{ Name_ string }

func (f VideoPlatform) Name() string { return f.Name_ }

func (f VideoPlatform) Ingest(_ context.Context, key string) (string, error) {
	return "remote-" + key, nil
}

func (f VideoPlatform) Status(context.Context, string) (ports.VideoStatus, error) {
	return ports.VideoReady, nil
}

func (f VideoPlatform) Playback(_ context.Context, remoteID string, _ ports.PlaybackOptions) (string, time.Time, error) {
	return "http://play/" + remoteID, time.Now().Add(5 * time.Minute), nil
}

func (f VideoPlatform) Delete(context.Context, string) error { return nil }

type MediaRepo struct {
	mu   sync.Mutex
	byID map[uuid.UUID]*course.MediaAsset
}

func NewMediaRepo() *MediaRepo { return &MediaRepo{byID: map[uuid.UUID]*course.MediaAsset{}} }

func (f *MediaRepo) Add(m *course.MediaAsset) {
	f.mu.Lock()
	clone := *m
	f.byID[m.ID] = &clone
	f.mu.Unlock()
}

func (f *MediaRepo) Create(_ context.Context, m *course.MediaAsset) error { f.Add(m); return nil }

func (f *MediaRepo) ByID(_ context.Context, id uuid.UUID) (*course.MediaAsset, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	m, ok := f.byID[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *m
	return &clone, nil
}

func (f *MediaRepo) List(context.Context, ports.MediaFilter) ([]*course.MediaAsset, int, error) {
	return nil, 0, nil
}

func (f *MediaRepo) Delete(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	delete(f.byID, id)
	f.mu.Unlock()
	return nil
}

func (f *MediaRepo) SetStatus(_ context.Context, id uuid.UUID, s course.MediaStatus, _ string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if m, ok := f.byID[id]; ok {
		m.Status = s
	}
	return nil
}

func (f *MediaRepo) SetIngested(_ context.Context, id uuid.UUID, p, r string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if m, ok := f.byID[id]; ok {
		m.VODProvider, m.VODRemoteID = &p, &r
	}
	return nil
}

type LessonRepo struct {
	mu   sync.Mutex
	byID map[uuid.UUID]*course.Lesson
}

func NewLessonRepo() *LessonRepo { return &LessonRepo{byID: map[uuid.UUID]*course.Lesson{}} }

func (f *LessonRepo) Add(l *course.Lesson) {
	f.mu.Lock()
	clone := *l
	f.byID[l.ID] = &clone
	f.mu.Unlock()
}

func (f *LessonRepo) ByID(_ context.Context, id uuid.UUID) (*course.Lesson, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	l, ok := f.byID[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *l
	return &clone, nil
}

func (f *LessonRepo) Create(context.Context, *course.Lesson) error          { return nil }
func (f *LessonRepo) Update(context.Context, *course.Lesson) error          { return nil }
func (f *LessonRepo) Delete(context.Context, uuid.UUID) error               { return nil }
func (f *LessonRepo) Reorder(context.Context, uuid.UUID, []uuid.UUID) error { return nil }

func (f *LessonRepo) ListByCourse(context.Context, uuid.UUID) ([]*course.Lesson, error) {
	return nil, nil
}

func (f *LessonRepo) CountReady(context.Context, uuid.UUID) (int, error) { return 0, nil }

type SectionRepo struct{ courseOf map[uuid.UUID]uuid.UUID }

func NewSectionRepo() *SectionRepo { return &SectionRepo{courseOf: map[uuid.UUID]uuid.UUID{}} }

func (f *SectionRepo) Link(sectionID, courseID uuid.UUID) { f.courseOf[sectionID] = courseID }

func (f *SectionRepo) ByID(_ context.Context, id uuid.UUID) (*course.Section, error) {
	courseID, ok := f.courseOf[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	return &course.Section{ID: id, CourseID: courseID}, nil
}

func (f *SectionRepo) Create(context.Context, *course.Section) error { return nil }
func (f *SectionRepo) Update(context.Context, *course.Section) error { return nil }
func (f *SectionRepo) Delete(context.Context, uuid.UUID) error       { return nil }

func (f *SectionRepo) ListByCourse(context.Context, uuid.UUID) ([]*course.Section, error) {
	return nil, nil
}

func (f *SectionRepo) Reorder(context.Context, uuid.UUID, []uuid.UUID) error { return nil }

type EntitlementRepo struct {
	mu             sync.Mutex
	active         map[[2]uuid.UUID]bool
	revokedByOrder map[uuid.UUID]bool
}

func NewEntitlementRepo() *EntitlementRepo {
	return &EntitlementRepo{active: map[[2]uuid.UUID]bool{}, revokedByOrder: map[uuid.UUID]bool{}}
}

// Grant implements ports.EntitlementRepo.
func (f *EntitlementRepo) Grant(_ context.Context, e *course.Entitlement) error {
	f.Allow(e.UserID, e.CourseID)
	return nil
}

// Allow grants directly (test helper).
func (f *EntitlementRepo) Allow(user, c uuid.UUID) {
	f.mu.Lock()
	f.active[[2]uuid.UUID{user, c}] = true
	f.mu.Unlock()
}

func (f *EntitlementRepo) HasActive(_ context.Context, user, c uuid.UUID) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.active[[2]uuid.UUID{user, c}], nil
}

func (f *EntitlementRepo) Grant2(context.Context, *course.Entitlement) error { return nil }

// GrantDirect is the test helper; Grant is the repo interface method.

type PlaybackSessions struct {
	mu    sync.Mutex
	count int
}

func (f *PlaybackSessions) Insert(context.Context, *course.PlaybackSession) error {
	f.mu.Lock()
	f.count++
	f.mu.Unlock()
	return nil
}

func (f *PlaybackSessions) Count() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.count
}

type Queue struct{ Ingests []uuid.UUID }

func (f *Queue) EnqueueIngest(_ context.Context, id uuid.UUID) error {
	f.Ingests = append(f.Ingests, id)
	return nil
}

func (f *Queue) EnqueuePoll(context.Context, uuid.UUID, int, time.Duration) error { return nil }

type AuditSink struct{ Entries int }

func (f *AuditSink) Insert(context.Context, *ports.AuditEntry) error { f.Entries++; return nil }

func (f *AuditSink) List(context.Context, int, int) ([]*ports.AuditEntry, int, error) {
	return nil, 0, nil
}

type Transactor struct{}

func (Transactor) WithinTx(ctx context.Context, fn func(context.Context) error) error { return fn(ctx) }

// RevokeByOrder marks entitlements of an order revoked (refund path).
func (f *EntitlementRepo) RevokeByOrder(_ context.Context, orderID uuid.UUID) error {
	f.mu.Lock()
	f.revokedByOrder[orderID] = true
	f.mu.Unlock()
	return nil
}

// --- commerce fakes ---

type OrderRepo struct {
	mu    sync.Mutex
	byID  map[uuid.UUID]*commerce.Order
	items map[uuid.UUID][]commerce.OrderItem
}

func NewOrderRepo() *OrderRepo {
	return &OrderRepo{byID: map[uuid.UUID]*commerce.Order{}, items: map[uuid.UUID][]commerce.OrderItem{}}
}

func (f *OrderRepo) Create(_ context.Context, o *commerce.Order, items []commerce.OrderItem) error {
	f.mu.Lock()
	clone := *o
	f.byID[o.ID] = &clone
	f.items[o.ID] = items
	f.mu.Unlock()
	return nil
}

func (f *OrderRepo) ByID(_ context.Context, id uuid.UUID) (*commerce.Order, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	o, ok := f.byID[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *o
	return &clone, nil
}

func (f *OrderRepo) ItemsOf(_ context.Context, orderID uuid.UUID) ([]commerce.OrderItem, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.items[orderID], nil
}

func (f *OrderRepo) MarkPaid(_ context.Context, id uuid.UUID) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	o, ok := f.byID[id]
	if !ok {
		return false, ports.ErrNotFound
	}
	if o.Status != commerce.OrderAwaitingPayment {
		return false, nil
	}
	o.Status = commerce.OrderPaid
	return true, nil
}

func (f *OrderRepo) MarkRefunded(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if o, ok := f.byID[id]; ok {
		o.Status = commerce.OrderRefunded
	}
	return nil
}

func (f *OrderRepo) Expire(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if o, ok := f.byID[id]; ok && o.Status == commerce.OrderAwaitingPayment {
		o.Status = commerce.OrderExpired
	}
	return nil
}

func (f *OrderRepo) Cancel(context.Context, uuid.UUID) error { return nil }

func (f *OrderRepo) ExpireDue(context.Context, time.Time) (int64, error) { return 0, nil }

func (f *OrderRepo) ListForUser(context.Context, uuid.UUID, int, int) ([]*commerce.Order, int, error) {
	return nil, 0, nil
}

func (f *OrderRepo) ListAdmin(context.Context, ports.OrderAdminFilter, int, int) ([]*commerce.Order, int, error) {
	return nil, 0, nil
}

type CouponRepo struct {
	mu     sync.Mutex
	byCode map[string]*commerce.Coupon
	byID   map[uuid.UUID]*commerce.Coupon
	uses   map[uuid.UUID]int
	perUsr map[[2]uuid.UUID]int
}

func NewCouponRepo() *CouponRepo {
	return &CouponRepo{byCode: map[string]*commerce.Coupon{}, byID: map[uuid.UUID]*commerce.Coupon{},
		uses: map[uuid.UUID]int{}, perUsr: map[[2]uuid.UUID]int{}}
}

func (f *CouponRepo) Add(c *commerce.Coupon) {
	f.mu.Lock()
	clone := *c
	f.byCode[c.Code] = &clone
	f.byID[c.ID] = &clone
	f.mu.Unlock()
}

func (f *CouponRepo) Create(context.Context, *commerce.Coupon) error { return nil }
func (f *CouponRepo) ByID(_ context.Context, id uuid.UUID) (*commerce.Coupon, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	c, ok := f.byID[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *c
	return &clone, nil
}

func (f *CouponRepo) ByCode(_ context.Context, code string) (*commerce.Coupon, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	c, ok := f.byCode[code]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *c
	return &clone, nil
}

func (f *CouponRepo) Update(context.Context, *commerce.Coupon) error { return nil }
func (f *CouponRepo) Delete(context.Context, uuid.UUID) error        { return nil }

func (f *CouponRepo) List(context.Context, string, int, int) ([]*commerce.Coupon, int, error) {
	return nil, 0, nil
}

func (f *CouponRepo) CountUses(_ context.Context, couponID uuid.UUID) (int, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.uses[couponID], nil
}

func (f *CouponRepo) CountUsesByUser(_ context.Context, couponID, userID uuid.UUID) (int, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.perUsr[[2]uuid.UUID{couponID, userID}], nil
}

func (f *CouponRepo) Redeem(_ context.Context, couponID, userID, _ uuid.UUID) error {
	f.mu.Lock()
	f.uses[couponID]++
	f.perUsr[[2]uuid.UUID{couponID, userID}]++
	f.mu.Unlock()
	return nil
}

func (f *CouponRepo) ReleaseRedemption(_ context.Context, couponID, userID, _ uuid.UUID) error {
	f.mu.Lock()
	delete(f.perUsr, [2]uuid.UUID{couponID, userID})
	if f.uses[couponID] > 0 {
		f.uses[couponID]--
	}
	f.mu.Unlock()
	return nil
}

func (f *CouponRepo) ListWithUses(context.Context, string, int, int) ([]*commerce.Coupon, int, error) {
	return nil, 0, nil
}

type PaymentRepo struct {
	mu       sync.Mutex
	byRef    map[string]*commerce.Payment
	byID     map[uuid.UUID]*commerce.Payment
	verifyOK bool // scriptable verify precondition
}

func NewPaymentRepo() *PaymentRepo {
	return &PaymentRepo{byRef: map[string]*commerce.Payment{}, byID: map[uuid.UUID]*commerce.Payment{}}
}

func (f *PaymentRepo) Create(_ context.Context, p *commerce.Payment) error {
	f.mu.Lock()
	clone := *p
	f.byID[p.ID] = &clone
	f.byID[p.ID] = &clone
	f.mu.Unlock()
	return nil
}

func (f *PaymentRepo) ByID(_ context.Context, id uuid.UUID) (*commerce.Payment, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	p, ok := f.byID[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *p
	return &clone, nil
}

func (f *PaymentRepo) ByGatewayRef(_ context.Context, _ commerce.Gateway, ref string) (*commerce.Payment, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	p, ok := f.byRef[ref]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *p
	return &clone, nil
}

func (f *PaymentRepo) ActiveForOrder(_ context.Context, orderID uuid.UUID) (*commerce.Payment, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, p := range f.byID {
		if p.OrderID == orderID && (p.Status == commerce.PaymentInitiated || p.Status == commerce.PaymentRedirected) {
			clone := *p
			return &clone, nil
		}
	}
	return nil, ports.ErrNotFound
}

func (f *PaymentRepo) MarkRedirected(_ context.Context, id uuid.UUID, ref string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if p, ok := f.byID[id]; ok {
		p.Status = commerce.PaymentRedirected
		p.GatewayRef = &ref
		f.byRef[ref] = p
	}
	return nil
}

func (f *PaymentRepo) MarkVerified(_ context.Context, id uuid.UUID, card string) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	p, ok := f.byID[id]
	if !ok {
		return false, ports.ErrNotFound
	}
	if p.Status != commerce.PaymentInitiated && p.Status != commerce.PaymentRedirected {
		return false, nil
	}
	p.Status = commerce.PaymentVerified
	return true, nil
}

func (f *PaymentRepo) MarkFailed(_ context.Context, id uuid.UUID, reason string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if p, ok := f.byID[id]; ok {
		p.Status = commerce.PaymentFailed
		p.FailureReason = &reason
	}
	return nil
}

func (f *PaymentRepo) MarkReversed(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if p, ok := f.byID[id]; ok {
		p.Status = commerce.PaymentReversed
	}
	return nil
}

func (f *PaymentRepo) ListForOrder(_ context.Context, orderID uuid.UUID) ([]*commerce.Payment, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []*commerce.Payment
	for _, p := range f.byID {
		if p.OrderID == orderID {
			clone := *p
			out = append(out, &clone)
		}
	}
	return out, nil
}

func (f *PaymentRepo) StuckForReconcile(context.Context, time.Duration, int) ([]*commerce.Payment, error) {
	return nil, nil
}

type PaymentEvents struct {
	mu sync.Mutex
	n  int
}

func (f *PaymentEvents) Insert(context.Context, *commerce.PaymentEvent) error {
	f.mu.Lock()
	f.n++
	f.mu.Unlock()
	return nil
}
func (f *PaymentEvents) ListForPayment(context.Context, uuid.UUID) ([]*commerce.PaymentEvent, error) {
	return nil, nil
}
func (f *PaymentEvents) Count() int { f.mu.Lock(); defer f.mu.Unlock(); return f.n }

type RefundRepo struct {
	mu    sync.Mutex
	byPay map[uuid.UUID]*commerce.Refund
}

func (f *RefundRepo) Create(_ context.Context, r *commerce.Refund) error {
	f.mu.Lock()
	clone := *r
	f.byPay[r.PaymentID] = &clone
	f.mu.Unlock()
	return nil
}

func (f *RefundRepo) ForPayment(_ context.Context, paymentID uuid.UUID) (*commerce.Refund, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	r, ok := f.byPay[paymentID]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *r
	return &clone, nil
}

func (f *RefundRepo) UpdateStatus(context.Context, uuid.UUID, commerce.RefundStatus, *string) error {
	return nil
}

// ScriptedGateway is a configurable ports.PaymentGateway for the scenario matrix.
type ScriptedGateway struct {
	Name_        commerce.Gateway
	VerifyResult ports.VerifyResult
	VerifyErr    error
	RefundOK     bool
	RefundErr    error
	VerifyCalls  int
}

func (f *ScriptedGateway) Name() commerce.Gateway { return f.Name_ }

func (f *ScriptedGateway) Initiate(context.Context, ports.InitiateRequest) (ports.InitiateResult, error) {
	return ports.InitiateResult{RedirectURL: "http://gw/start", GatewayRef: "ref-1"}, nil
}

func (f *ScriptedGateway) Verify(_ context.Context, req ports.VerifyRequest) (ports.VerifyResult, error) {
	f.VerifyCalls++
	if req.AmountRial != req.AmountRial { // never; keeps linters quiet
		return ports.VerifyResult{}, nil
	}
	return f.VerifyResult, f.VerifyErr
}

func (f *ScriptedGateway) Refund(context.Context, ports.RefundRequest) (ports.RefundResult, error) {
	if f.RefundErr != nil {
		return ports.RefundResult{}, f.RefundErr
	}
	return ports.RefundResult{OK: f.RefundOK, GatewayRef: "refund-1"}, nil
}

func (f *ScriptedGateway) ParseCallback(values url.Values) (ports.CallbackData, error) {
	return ports.CallbackData{GatewayRef: values.Get("ref"), Status: values.Get("Status"), Raw: values}, nil
}

type Registry struct {
	By map[commerce.Gateway]ports.PaymentGateway
}

func (r *Registry) Gateway(name commerce.Gateway) (ports.PaymentGateway, error) {
	g, ok := r.By[name]
	if !ok {
		return nil, ports.ErrNotConfigured
	}
	return g, nil
}

func NewRefundRepo() *RefundRepo { return &RefundRepo{byPay: map[uuid.UUID]*commerce.Refund{}} }

// CatalogCourses is a minimal ports.CourseRepo fake for checkout tests.
type CatalogCourses struct {
	ports.CourseRepo // embedded for unimplemented methods (panics if called)
	mu               sync.Mutex
	byID             map[uuid.UUID]*course.Course
}

func NewCatalogCourses() *CatalogCourses {
	return &CatalogCourses{byID: map[uuid.UUID]*course.Course{}}
}

func (f *CatalogCourses) Add(c *course.Course) {
	f.mu.Lock()
	clone := *c
	f.byID[c.ID] = &clone
	f.mu.Unlock()
}

func (f *CatalogCourses) ByID(_ context.Context, id uuid.UUID) (*course.Course, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	c, ok := f.byID[id]
	if !ok {
		return nil, ports.ErrNotFound
	}
	clone := *c
	return &clone, nil
}

func (f *CatalogCourses) BySlug(context.Context, string) (*course.Course, error) {
	return nil, ports.ErrNotFound
}

// ListForUser returns the fake's active entitlements for a user.
func (f *EntitlementRepo) ListForUser(_ context.Context, userID uuid.UUID) ([]*course.Entitlement, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []*course.Entitlement
	for key := range f.active {
		if key[0] == userID {
			out = append(out, &course.Entitlement{
				UserID: key[0], CourseID: key[1],
				Source: course.EntitlementPurchase,
			})
		}
	}
	return out, nil
}

// --- instructor repo ---

// InstructorRepo holds the single public teacher profile for unit tests.
type InstructorRepo struct {
	mu   sync.Mutex
	rows []*course.Instructor
}

func (f *InstructorRepo) Primary(_ context.Context) (*course.Instructor, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if len(f.rows) == 0 {
		return nil, ports.ErrNotFound
	}
	clone := *f.rows[0]
	return &clone, nil
}

func (f *InstructorRepo) Upsert(_ context.Context, i *course.Instructor) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.rows == nil {
		f.rows = []*course.Instructor{}
	}
	f.rows = []*course.Instructor{i}
	return nil
}
