// Package identity implements the auth use-cases: registration with mobile
// verification, password + OTP login, rotating refresh sessions, password
// reset, and RBAC role lookup (docs/01 Epic A).
package identity

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
)

// Login failure policy (docs/01 US-A2): 5 failures per 15 minutes per account.
const (
	loginFailLimit   = 5
	loginFailWindow  = 15 * time.Minute
	otpReqLimit      = 3 // per mobile per hour (docs/01 US-A1)
	otpReqWindow     = time.Hour
	otpVerifyLimit   = 10 // verification attempts per mobile per 15 min
	otpVerifyWindow  = 15 * time.Minute
	accessSessionTTL = 15 * time.Minute
)

type Deps struct {
	Users    ports.UserRepo
	OTPs     ports.OTPRepo
	Tokens   ports.RefreshTokenRepo
	SMS      ports.SMS
	Throttle ports.Throttler
	Hasher   ports.PasswordHasher
	Signer   ports.TokenSigner
	Pepper   string // HMAC pepper for OTP hashes (server secret; JWT secret today)
	// Now allows tests to control the clock; defaults to time.Now.
	Now func() time.Time
}

type Service struct {
	deps Deps
	now  func() time.Time
}

func NewService(d Deps) *Service {
	s := &Service{deps: d, now: time.Now}
	if d.Now != nil {
		s.now = d.Now
	}
	return s
}

// Session is everything a handler needs to set cookies after successful auth.
type Session struct {
	AccessToken      string
	AccessExpiresAt  time.Time
	RefreshToken     string
	RefreshExpiresAt time.Time
	CSRFToken        string
	User             *identity.User
}

type RegisterInput struct {
	Mobile    string
	Password  string
	FullName  string
	IP        string
	UserAgent string
}

// Register creates an unverified account and sends a verification OTP.
func (s *Service) Register(ctx context.Context, in RegisterInput) error {
	mobile := identity.NormalizeMobile(in.Mobile)
	if err := identity.ValidateMobile(mobile); err != nil {
		return apperr.ErrValidation.Wrap(err)
	}
	if err := identity.ValidatePassword(in.Password); err != nil {
		return apperr.ErrWeakPassword.Wrap(err)
	}
	if err := identity.ValidateFullName(in.FullName); err != nil {
		return apperr.ErrValidation.Wrap(err)
	}
	if _, err := s.deps.Users.ByMobile(ctx, mobile); err == nil {
		return apperr.ErrMobileTaken
	} else if !errors.Is(err, ports.ErrNotFound) {
		return err
	}
	hash, err := s.deps.Hasher.Hash(in.Password)
	if err != nil {
		return err
	}
	user := &identity.User{
		ID:           uuid.Must(uuid.NewV7()),
		Mobile:       mobile,
		FullName:     in.FullName,
		PasswordHash: hash,
		Status:       identity.StatusActive,
	}
	if err := s.deps.Users.Create(ctx, user); err != nil {
		return err
	}
	if err := s.deps.Users.AddRole(ctx, user.ID, identity.RoleLearner); err != nil {
		return err
	}
	return s.sendOTP(ctx, mobile, identity.PurposeVerify)
}

// RequestOTP sends a purpose-scoped OTP. Responses never reveal whether the
// account exists (silent skip for unknown mobiles, docs/07 §3).
func (s *Service) RequestOTP(ctx context.Context, mobileRaw string, purpose identity.Purpose, ip string) error {
	mobile := identity.NormalizeMobile(mobileRaw)
	if err := identity.ValidateMobile(mobile); err != nil {
		return apperr.ErrValidation.Wrap(err)
	}
	if !purpose.Valid() {
		return apperr.ErrValidation.Wrap(fmt.Errorf("unknown otp purpose %q", purpose))
	}

	if allowed, _, err := s.deps.Throttle.Hit(ctx, "otp:"+string(purpose)+":"+mobile, otpReqLimit, otpReqWindow); err != nil {
		return err
	} else if !allowed {
		return apperr.ErrOTPResendWait
	}
	if ip != "" {
		if allowed, _, err := s.deps.Throttle.Hit(ctx, "otpip:"+ip, 30, otpReqWindow); err != nil {
			return err
		} else if !allowed {
			return apperr.ErrRateLimited
		}
	}

	if _, err := s.deps.Users.ByMobile(ctx, mobile); err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil // silent: no account-existence oracle
		}
		return err
	}
	return s.sendOTP(ctx, mobile, purpose)
}

func (s *Service) sendOTP(ctx context.Context, mobile string, purpose identity.Purpose) error {
	if last, err := s.deps.OTPs.LatestAny(ctx, mobile, purpose); err == nil {
		if s.now().Sub(last.CreatedAt) < identity.OTPResendAfter {
			return apperr.ErrOTPResendWait
		}
	} else if !errors.Is(err, ports.ErrNotFound) {
		return err
	}
	code, err := identity.GenerateCode()
	if err != nil {
		return err
	}
	otp := &identity.OTP{
		ID:        uuid.Must(uuid.NewV7()),
		Mobile:    mobile,
		CodeHash:  identity.HashOTP(code, s.deps.Pepper),
		Purpose:   purpose,
		ExpiresAt: s.now().Add(identity.OTPTTL),
		CreatedAt: s.now(),
	}
	if err := s.deps.OTPs.Create(ctx, otp); err != nil {
		return err
	}
	text := fmt.Sprintf("گوLearn\nکد تأیید شما: %s\nاعتبار: ۲ دقیقه", code)
	if err := s.deps.SMS.Send(ctx, mobile, text); err != nil {
		return apperr.ErrSMSFailed.Wrap(err)
	}
	return nil
}

// VerifyOTP consumes a verify|login code and, on success, issues a session.
// Password reset uses ResetPassword (code + new password in one step).
func (s *Service) VerifyOTP(ctx context.Context, mobileRaw, code string, purpose identity.Purpose, ip, userAgent string) (*Session, error) {
	mobile := identity.NormalizeMobile(mobileRaw)
	if purpose != identity.PurposeVerify && purpose != identity.PurposeLogin {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("purpose %q not allowed on otp/verify", purpose))
	}
	if err := identity.ValidateMobile(mobile); err != nil {
		return nil, apperr.ErrValidation.Wrap(err)
	}
	if len(code) != identity.OTPCodeLength {
		return nil, apperr.ErrOTPInvalid
	}

	if allowed, _, err := s.deps.Throttle.Hit(ctx, "otpverify:"+mobile, otpVerifyLimit, otpVerifyWindow); err != nil {
		return nil, err
	} else if !allowed {
		return nil, apperr.ErrRateLimited
	}

	otp, err := s.deps.OTPs.Latest(ctx, mobile, purpose)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrOTPInvalid
		}
		return nil, err
	}
	if otp.Expired(s.now()) {
		return nil, apperr.ErrOTPInvalid
	}
	if otp.Locked() {
		return nil, apperr.ErrOTPLocked
	}
	if !identity.EqualOTP(identity.HashOTP(code, s.deps.Pepper), otp.CodeHash) {
		if err := s.deps.OTPs.IncrementAttempts(ctx, otp.ID); err != nil {
			return nil, err
		}
		return nil, apperr.ErrOTPInvalid
	}
	consumed, err := s.deps.OTPs.Consume(ctx, otp.ID)
	if err != nil {
		return nil, err
	}
	if !consumed {
		return nil, apperr.ErrOTPInvalid // concurrent replay lost the race
	}

	user, err := s.deps.Users.ByMobile(ctx, mobile)
	if err != nil {
		return nil, apperr.ErrOTPInvalid.Wrap(err) // do not leak state details
	}
	if purpose == identity.PurposeVerify {
		if err := s.deps.Users.SetMobileVerified(ctx, user.ID); err != nil {
			return nil, err
		}
	} else if user.MobileVerifiedAt == nil {
		return nil, apperr.ErrMobileNotVerified
	}
	if user.Status != identity.StatusActive {
		return nil, apperr.ErrAccountBlocked
	}
	return s.issueSession(ctx, user, ip, userAgent)
}

type LoginInput struct {
	Mobile    string
	Password  string
	IP        string
	UserAgent string
}

// Login authenticates with mobile + password and issues a session.
func (s *Service) Login(ctx context.Context, in LoginInput) (*Session, error) {
	mobile := identity.NormalizeMobile(in.Mobile)
	if err := identity.ValidateMobile(mobile); err != nil {
		return nil, apperr.ErrValidation.Wrap(err)
	}
	failKey := "loginfail:" + mobile
	if blocked, _, err := s.deps.Throttle.Blocked(ctx, failKey, loginFailLimit); err != nil {
		return nil, err
	} else if blocked {
		return nil, apperr.ErrRateLimited
	}

	user, err := s.deps.Users.ByMobile(ctx, mobile)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			// constant-time-ish: still run a hash verify against a dummy
			s.deps.Hasher.Verify("$argon2id$v=19$m=65536,t=3,p=2$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", in.Password)
			return nil, apperr.ErrInvalidCredentials
		}
		return nil, err
	}
	if user.Status != identity.StatusActive {
		return nil, apperr.ErrAccountBlocked
	}
	if user.PasswordHash == "" {
		return nil, apperr.ErrInvalidCredentials
	}
	ok, err := s.deps.Hasher.Verify(user.PasswordHash, in.Password)
	if err != nil {
		return nil, err
	}
	if !ok {
		_, _, _ = s.deps.Throttle.Hit(ctx, failKey, loginFailLimit, loginFailWindow)
		return nil, apperr.ErrInvalidCredentials
	}
	if user.MobileVerifiedAt == nil {
		return nil, apperr.ErrMobileNotVerified
	}
	if err := s.deps.Users.TouchLogin(ctx, user.ID); err != nil {
		return nil, err
	}
	// A password login is a full re-authentication: drop the sessions that
	// existed before it, so a refresh token captured earlier stops working
	// once the owner proves the password again.
	if err := s.deps.Tokens.RevokeAllForUser(ctx, user.ID); err != nil {
		return nil, err
	}
	return s.issueSession(ctx, user, in.IP, in.UserAgent)
}

// Refresh rotates a refresh token. Presenting a revoked token is treated as
// theft: the whole family is revoked (docs/01 US-A5).
func (s *Service) Refresh(ctx context.Context, plainRefreshToken, ip, userAgent string) (*Session, error) {
	if plainRefreshToken == "" {
		return nil, apperr.ErrRefreshInvalid
	}
	hash := identity.HashRefreshToken(plainRefreshToken)
	tok, err := s.deps.Tokens.ByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrRefreshInvalid
		}
		return nil, err
	}
	if tok.Revoked() {
		_ = s.deps.Tokens.RevokeFamily(ctx, tok.FamilyID)
		return nil, apperr.ErrRefreshInvalid
	}
	if tok.Expired(s.now()) {
		return nil, apperr.ErrRefreshInvalid
	}
	user, err := s.deps.Users.ByID(ctx, tok.UserID)
	if err != nil {
		return nil, apperr.ErrRefreshInvalid.Wrap(err)
	}
	if user.Status != identity.StatusActive {
		return nil, apperr.ErrAccountBlocked
	}
	next, plain, err := s.newRefreshToken(user.ID, tok.FamilyID, ip, userAgent)
	if err != nil {
		return nil, err
	}
	if err := s.deps.Tokens.Rotate(ctx, tok.ID, next); err != nil {
		return nil, err
	}
	return s.buildSession(ctx, user, next, plain)
}

// Logout revokes the presented refresh token (best effort) so the session dies
// server-side, not just in the browser.
func (s *Service) Logout(ctx context.Context, plainRefreshToken string) error {
	if plainRefreshToken == "" {
		return nil
	}
	return s.deps.Tokens.RevokeByHash(ctx, identity.HashRefreshToken(plainRefreshToken))
}

type ResetPasswordInput struct {
	Mobile      string
	Code        string
	NewPassword string
	IP          string
}

// ResetPassword consumes a purpose=reset OTP and rotates the password,
// revoking every active session of the account (docs/01 US-A4).
func (s *Service) ResetPassword(ctx context.Context, in ResetPasswordInput) error {
	mobile := identity.NormalizeMobile(in.Mobile)
	if err := identity.ValidateMobile(mobile); err != nil {
		return apperr.ErrValidation.Wrap(err)
	}
	if err := identity.ValidatePassword(in.NewPassword); err != nil {
		return apperr.ErrWeakPassword.Wrap(err)
	}
	failKey := "resetfail:" + mobile
	if blocked, _, err := s.deps.Throttle.Blocked(ctx, failKey, otpVerifyLimit); err != nil {
		return err
	} else if blocked {
		// the caller must be able to tell "blocked" from "reset done"
		return apperr.ErrRateLimited
	}

	otp, err := s.deps.OTPs.Latest(ctx, mobile, identity.PurposeReset)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return apperr.ErrOTPInvalid
		}
		return err
	}
	if otp.Expired(s.now()) || otp.Locked() ||
		!identity.EqualOTP(identity.HashOTP(in.Code, s.deps.Pepper), otp.CodeHash) {
		_, _, _ = s.deps.Throttle.Hit(ctx, failKey, otpVerifyLimit, otpVerifyWindow)
		return apperr.ErrOTPInvalid
	}
	consumed, err := s.deps.OTPs.Consume(ctx, otp.ID)
	if err != nil {
		return err
	}
	if !consumed {
		return apperr.ErrOTPInvalid
	}
	user, err := s.deps.Users.ByMobile(ctx, mobile)
	if err != nil {
		return apperr.ErrOTPInvalid.Wrap(err)
	}
	hash, err := s.deps.Hasher.Hash(in.NewPassword)
	if err != nil {
		return err
	}
	if err := s.deps.Users.UpdatePassword(ctx, user.ID, hash); err != nil {
		return err
	}
	return s.deps.Tokens.RevokeAllForUser(ctx, user.ID)
}

type ChangePasswordInput struct {
	UserID          uuid.UUID
	CurrentPassword string
	NewPassword     string
}

// ChangePassword requires the current password and revokes all sessions
// (including the caller's — the client re-authenticates).
func (s *Service) ChangePassword(ctx context.Context, in ChangePasswordInput) error {
	if err := identity.ValidatePassword(in.NewPassword); err != nil {
		return apperr.ErrWeakPassword.Wrap(err)
	}
	user, err := s.deps.Users.ByID(ctx, in.UserID)
	if err != nil {
		return err
	}
	if user.PasswordHash == "" {
		return apperr.ErrInvalidCredentials
	}
	ok, err := s.deps.Hasher.Verify(user.PasswordHash, in.CurrentPassword)
	if err != nil {
		return err
	}
	if !ok {
		return apperr.ErrInvalidCredentials
	}
	hash, err := s.deps.Hasher.Hash(in.NewPassword)
	if err != nil {
		return err
	}
	if err := s.deps.Users.UpdatePassword(ctx, user.ID, hash); err != nil {
		return err
	}
	return s.deps.Tokens.RevokeAllForUser(ctx, user.ID)
}

// Me returns the caller's profile.
func (s *Service) Me(ctx context.Context, userID uuid.UUID) (*identity.User, error) {
	return s.deps.Users.ByID(ctx, userID)
}

// Roles loads the user's roles fresh from the store (RBAC middleware).
func (s *Service) Roles(ctx context.Context, userID uuid.UUID) ([]identity.Role, error) {
	return s.deps.Users.Roles(ctx, userID)
}

// --- session helpers ---

func (s *Service) issueSession(ctx context.Context, user *identity.User, ip, userAgent string) (*Session, error) {
	refresh, plain, err := s.newRefreshToken(user.ID, uuid.Must(uuid.NewV7()), ip, userAgent)
	if err != nil {
		return nil, err
	}
	if err := s.deps.Tokens.Create(ctx, refresh); err != nil {
		return nil, err
	}
	return s.buildSession(ctx, user, refresh, plain)
}

func (s *Service) newRefreshToken(userID, familyID uuid.UUID, ip, userAgent string) (*identity.RefreshToken, string, error) {
	plain, hash, err := identity.NewOpaqueRefreshToken()
	if err != nil {
		return nil, "", err
	}
	return &identity.RefreshToken{
		ID:        uuid.Must(uuid.NewV7()),
		UserID:    userID,
		FamilyID:  familyID,
		TokenHash: hash,
		ExpiresAt: s.now().Add(identity.RefreshTTL),
		IP:        ip,
		UserAgent: userAgent,
	}, plain, nil
}

func (s *Service) buildSession(ctx context.Context, user *identity.User, refresh *identity.RefreshToken, plainRefresh string) (*Session, error) {
	access, accessExp, err := s.deps.Signer.SignAccess(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	csrf, err := identity.NewCSRFToken(s.deps.Pepper)
	if err != nil {
		return nil, err
	}
	return &Session{
		AccessToken:      access,
		AccessExpiresAt:  accessExp,
		RefreshToken:     plainRefresh,
		RefreshExpiresAt: refresh.ExpiresAt,
		CSRFToken:        csrf,
		User:             user,
	}, nil
}
