// Service unit tests run fully offline via in-memory fakes (docs/09 §1).
package identity_test

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports/fakes"
	idsvc "golearn/backend/internal/service/identity"
)

// harness wires the service to in-memory fakes; tests never touch real infra.
type harness struct {
	svc      *idsvc.Service
	users    *fakes.UserRepo
	otps     *fakes.OTPRepo
	tokens   *fakes.TokenRepo
	sms      *fakes.SMS
	throttle *fakes.Throttler

	mu  sync.Mutex
	now time.Time
}

func newHarness() *harness {
	h := &harness{
		users:    fakes.NewUserRepo(),
		otps:     fakes.NewOTPRepo(),
		tokens:   fakes.NewTokenRepo(),
		sms:      fakes.NewSMS(),
		throttle: fakes.NewThrottler(),
	}
	h.now = time.Now()
	h.svc = idsvc.NewService(idsvc.Deps{
		Users: h.users, OTPs: h.otps, Tokens: h.tokens, SMS: h.sms,
		Throttle: h.throttle, Hasher: fakes.PlainHasher{}, Signer: fakes.StaticSigner{},
		Pepper: "test-pepper", Now: h.clock,
	})
	return h
}

func (h *harness) clock() time.Time {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.now
}

func (h *harness) advance(d time.Duration) {
	h.mu.Lock()
	h.now = h.now.Add(d)
	h.mu.Unlock()
}

func (h *harness) registerAndVerify(t *testing.T, mobile string) *idsvc.Session {
	t.Helper()
	ctx := context.Background()
	require.NoError(t, h.svc.Register(ctx, idsvc.RegisterInput{
		Mobile: mobile, Password: "secret123", FullName: "دانجو تستی",
	}))
	sess, err := h.svc.VerifyOTP(ctx, mobile, h.sms.LastCode(mobile), identity.PurposeVerify, "1.3.4.5", "ua")
	require.NoError(t, err)
	return sess
}

func TestRegisterThenVerifyIssuesSession(t *testing.T) {
	h := newHarness()
	ctx := context.Background()

	require.NoError(t, h.svc.Register(ctx, idsvc.RegisterInput{
		Mobile: "09121234567", Password: "secret123", FullName: "دانجو تستی",
	}))
	u, err := h.users.ByMobile(ctx, "09121234567")
	require.NoError(t, err)
	require.Nil(t, u.MobileVerifiedAt, "user must start unverified")
	require.Len(t, h.sms.Sent(), 1, "verification OTP sent")

	sess, err := h.svc.VerifyOTP(ctx, "09121234567", h.sms.LastCode("09121234567"), identity.PurposeVerify, "", "")
	require.NoError(t, err)
	require.NotEmpty(t, sess.AccessToken)
	require.NotEmpty(t, sess.RefreshToken)
	require.NotEmpty(t, sess.CSRFToken)

	u2, err := h.users.ByMobile(ctx, "09121234567")
	require.NoError(t, err)
	require.NotNil(t, u2.MobileVerifiedAt)
}

func TestRegisterDuplicateMobileRejected(t *testing.T) {
	h := newHarness()
	ctx := context.Background()
	in := idsvc.RegisterInput{Mobile: "09121234567", Password: "secret123", FullName: "اول"}
	require.NoError(t, h.svc.Register(ctx, in))
	err := h.svc.Register(ctx, idsvc.RegisterInput{Mobile: "09121234567", Password: "secret123", FullName: "دوم"})
	require.ErrorIs(t, err, apperr.ErrMobileTaken)
}

func TestRegisterValidationErrors(t *testing.T) {
	h := newHarness()
	ctx := context.Background()
	err := h.svc.Register(ctx, idsvc.RegisterInput{Mobile: "12345", Password: "secret123", FullName: "abc"})
	require.ErrorIs(t, err, apperr.ErrValidation)
	err = h.svc.Register(ctx, idsvc.RegisterInput{Mobile: "09121234567", Password: "short", FullName: "abc"})
	require.ErrorIs(t, err, apperr.ErrWeakPassword)
	err = h.svc.Register(ctx, idsvc.RegisterInput{Mobile: "09121234567", Password: "nodigitshere", FullName: "abc"})
	require.ErrorIs(t, err, apperr.ErrWeakPassword)
}

func TestLoginRequiresVerifiedMobile(t *testing.T) {
	h := newHarness()
	ctx := context.Background()
	require.NoError(t, h.svc.Register(ctx, idsvc.RegisterInput{
		Mobile: "09121234567", Password: "secret123", FullName: "دانجو",
	}))
	_, err := h.svc.Login(ctx, idsvc.LoginInput{Mobile: "09121234567", Password: "secret123"})
	require.ErrorIs(t, err, apperr.ErrMobileNotVerified)
}

func TestLoginWrongPasswordThenLockout(t *testing.T) {
	h := newHarness()
	h.registerAndVerify(t, "09121234567")
	ctx := context.Background()

	for i := 0; i < 5; i++ {
		_, err := h.svc.Login(ctx, idsvc.LoginInput{Mobile: "09121234567", Password: "wrongpass1"})
		require.ErrorIs(t, err, apperr.ErrInvalidCredentials, "attempt %d", i+1)
	}
	_, err := h.svc.Login(ctx, idsvc.LoginInput{Mobile: "09121234567", Password: "secret123"})
	require.ErrorIs(t, err, apperr.ErrRateLimited, "correct password is also rejected while locked out")
}

func TestOTPWrongCodeLocksAfterMaxAttempts(t *testing.T) {
	h := newHarness()
	require.NoError(t, h.svc.Register(context.Background(), idsvc.RegisterInput{
		Mobile: "09121234567", Password: "secret123", FullName: "دانجو",
	}))
	ctx := context.Background()
	for i := 0; i < 5; i++ {
		_, err := h.svc.VerifyOTP(ctx, "09121234567", "000000", identity.PurposeVerify, "", "")
		require.ErrorIs(t, err, apperr.ErrOTPInvalid, "attempt %d", i+1)
	}
	_, err := h.svc.VerifyOTP(ctx, "09121234567", "000000", identity.PurposeVerify, "", "")
	require.ErrorIs(t, err, apperr.ErrOTPLocked)
}

func TestOTPExpiredRejected(t *testing.T) {
	h := newHarness()
	require.NoError(t, h.svc.Register(context.Background(), idsvc.RegisterInput{
		Mobile: "09121234567", Password: "secret123", FullName: "دانجو",
	}))
	h.advance(3 * time.Minute)

	_, err := h.svc.VerifyOTP(context.Background(), "09121234567", h.sms.LastCode("09121234567"), identity.PurposeVerify, "", "")
	require.ErrorIs(t, err, apperr.ErrOTPInvalid)
}

func TestOTPResendWindowEnforced(t *testing.T) {
	h := newHarness()
	require.NoError(t, h.svc.Register(context.Background(), idsvc.RegisterInput{
		Mobile: "09121234567", Password: "secret123", FullName: "دانجو",
	}))
	err := h.svc.RequestOTP(context.Background(), "09121234567", identity.PurposeVerify, "")
	require.ErrorIs(t, err, apperr.ErrOTPResendWait, "second request within 60s is rejected")

	// after the window, a new code goes out
	h.advance(identity.OTPResendAfter + time.Second)
	require.NoError(t, h.svc.RequestOTP(context.Background(), "09121234567", identity.PurposeVerify, ""))
	require.Len(t, h.sms.Sent(), 2)
}

func TestRequestOTPSilentForUnknownMobile(t *testing.T) {
	h := newHarness()
	err := h.svc.RequestOTP(context.Background(), "09351112233", identity.PurposeLogin, "")
	require.NoError(t, err, "no account-existence oracle")
	require.Empty(t, h.sms.Sent(), "no SMS actually sent")
}

func TestRefreshRotationAndReuseDetection(t *testing.T) {
	h := newHarness()
	sess1 := h.registerAndVerify(t, "09121234567")
	ctx := context.Background()

	sess2, err := h.svc.Refresh(ctx, sess1.RefreshToken, "", "")
	require.NoError(t, err)
	require.NotEqual(t, sess1.RefreshToken, sess2.RefreshToken, "token rotated")

	// reusing the rotated-away token must revoke the whole family
	_, err = h.svc.Refresh(ctx, sess1.RefreshToken, "", "")
	require.ErrorIs(t, err, apperr.ErrRefreshInvalid)

	_, err = h.svc.Refresh(ctx, sess2.RefreshToken, "", "")
	require.ErrorIs(t, err, apperr.ErrRefreshInvalid, "family revoked ⇒ successor dead too")
}

func TestPasswordResetRevokesSessionsAndRotatesPassword(t *testing.T) {
	h := newHarness()
	sess := h.registerAndVerify(t, "09121234567")
	ctx := context.Background()

	require.NoError(t, h.svc.RequestOTP(ctx, "09121234567", identity.PurposeReset, ""))
	require.NoError(t, h.svc.ResetPassword(ctx, idsvc.ResetPasswordInput{
		Mobile: "09121234567", Code: h.sms.LastCode("09121234567"), NewPassword: "newpass456",
	}))

	_, err := h.svc.Login(ctx, idsvc.LoginInput{Mobile: "09121234567", Password: "secret123"})
	require.ErrorIs(t, err, apperr.ErrInvalidCredentials)
	_, err = h.svc.Login(ctx, idsvc.LoginInput{Mobile: "09121234567", Password: "newpass456"})
	require.NoError(t, err)

	_, err = h.svc.Refresh(ctx, sess.RefreshToken, "", "")
	require.ErrorIs(t, err, apperr.ErrRefreshInvalid, "reset revoked all sessions")
}

func TestChangePasswordRevokesSessions(t *testing.T) {
	h := newHarness()
	sess := h.registerAndVerify(t, "09121234567")
	ctx := context.Background()

	require.NoError(t, h.svc.ChangePassword(ctx, idsvc.ChangePasswordInput{
		UserID: sess.User.ID, CurrentPassword: "secret123", NewPassword: "newpass456",
	}))
	_, err := h.svc.Refresh(ctx, sess.RefreshToken, "", "")
	require.ErrorIs(t, err, apperr.ErrRefreshInvalid)

	_, err = h.svc.Login(ctx, idsvc.LoginInput{Mobile: "09121234567", Password: "newpass456"})
	require.NoError(t, err)
}

func TestBlockedAccountCannotLoginOrRefresh(t *testing.T) {
	h := newHarness()
	sess := h.registerAndVerify(t, "09121234567")
	// simulate admin block directly in the fake
	h.users.SetStatusForTest(sess.User.ID, "blocked")

	_, err := h.svc.Login(context.Background(), idsvc.LoginInput{Mobile: "09121234567", Password: "secret123"})
	require.ErrorIs(t, err, apperr.ErrAccountBlocked)
	_, err = h.svc.Refresh(context.Background(), sess.RefreshToken, "", "")
	require.ErrorIs(t, err, apperr.ErrAccountBlocked)
}
