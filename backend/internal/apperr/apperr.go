// Package apperr defines the application error convention: a stable machine
// code, a Persian user-facing message, and an HTTP status (docs/04).
package apperr

import (
	"errors"
	"fmt"
	"net/http"
)

// AppError is the single error shape crossing the transport boundary.
type AppError struct {
	Status  int    `json:"-"`
	Code    string `json:"code"`
	Message string `json:"message"` // Persian, user-facing
	Err     error  `json:"-"`       // wrapped cause, for errors.Is/As and logs
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Code, e.Err)
	}
	return e.Code
}

func (e *AppError) Unwrap() error { return e.Err }

// Is matches by stable machine code, so wrapped clones still satisfy
// errors.Is(err, apperr.ErrXxx) at call sites.
func (e *AppError) Is(target error) bool {
	var t *AppError
	if errors.As(target, &t) {
		return t.Code == e.Code
	}
	return false
}

// New builds an AppError. Prefer the predefined vars + fmt with %w for causes.
func New(status int, code, message string) *AppError {
	return &AppError{Status: status, Code: code, Message: message}
}

func (e *AppError) Wrap(cause error) *AppError {
	clone := *e
	clone.Err = cause
	return &clone
}

// Predefined errors. Wrap causes with .Wrap(err); never mutate shared vars.
var (
	ErrValidation         = New(http.StatusBadRequest, "VALIDATION_ERROR", "اطلاعات ارسالی نامعتبر است.")
	ErrUnauthenticated    = New(http.StatusUnauthorized, "UNAUTHENTICATED", "برای این عملیات ابتدا وارد حساب خود شوید.")
	ErrInvalidCredentials = New(http.StatusUnauthorized, "INVALID_CREDENTIALS", "شماره موبایل یا رمز عبور نادرست است.")
	ErrRefreshInvalid     = New(http.StatusUnauthorized, "REFRESH_INVALID", "نشست شما منقضی شده است؛ دوباره وارد شوید.")
	ErrForbidden          = New(http.StatusForbidden, "FORBIDDEN", "شما به این بخش دسترسی ندارید.")
	ErrAccountBlocked     = New(http.StatusForbidden, "ACCOUNT_BLOCKED", "حساب شما مسدود شده است.")
	ErrMobileNotVerified  = New(http.StatusForbidden, "MOBILE_NOT_VERIFIED", "حساب شما تأیید نشده است؛ کد تأیید را وارد کنید.")
	ErrNotFound           = New(http.StatusNotFound, "NOT_FOUND", "موردی یافت نشد.")
	ErrMobileTaken        = New(http.StatusConflict, "MOBILE_TAKEN", "این شماره موبایل قبلاً ثبت شده است.")
	ErrRateLimited        = New(http.StatusTooManyRequests, "RATE_LIMITED", "درخواست‌های زیاد؛ لطفاً کمی بعد دوباره تلاش کنید.")
	ErrOTPResendWait      = New(http.StatusTooManyRequests, "OTP_RESEND_WAIT", "برای درخواست مجدد کد، کمی صبر کنید.")
	ErrOTPInvalid         = New(http.StatusBadRequest, "OTP_INVALID", "کد تأیید نامعتبر یا منقضی شده است.")
	ErrOTPLocked          = New(http.StatusLocked, "OTP_LOCKED", "تلاش‌های ناموفق زیاد بوده است؛ بعداً دوباره امتحان کنید.")
	ErrCSRFInvalid        = New(http.StatusForbidden, "CSRF_INVALID", "درخواست نامعتبر است؛ صفحه را تازه‌سازی کنید.")
	ErrWeakPassword       = New(http.StatusBadRequest, "WEAK_PASSWORD", "رمز عبور ضعیف است؛ حداقل ۸ کاراکتر شامل حرف و عدد.")
	ErrSMSFailed          = New(http.StatusBadGateway, "SMS_FAILED", "ارسال پیامک با خطا مواجه شد؛ دوباره تلاش کنید.")
	ErrInternal           = New(http.StatusInternalServerError, "INTERNAL_ERROR", "خطای غیرمنتظره رخ داد؛ لطفاً دوباره تلاش کنید.")

	ErrOrderExpired         = New(http.StatusGone, "ORDER_EXPIRED", "مهلت پرداخت این سفارش گذشته است؛ سفارش جدید بسازید.")
	ErrOrderNotPayable      = New(http.StatusConflict, "ORDER_NOT_PAYABLE", "این سفارش قابل پرداخت نیست.")
	ErrAlreadyOwned         = New(http.StatusConflict, "ALREADY_OWNED", "شما قبلاً این دوره را خریده‌اید.")
	ErrCouponInvalid        = New(http.StatusBadRequest, "COUPON_INVALID", "کد تخفیف معتبر نیست یا شرایط آن برقرار نیست.")
	ErrGatewayNotConfigured = New(http.StatusServiceUnavailable, "GATEWAY_NOT_CONFIGURED", "این درگاه پرداخت در دسترس نیست.")
	ErrRefundFailed         = New(http.StatusConflict, "REFUND_FAILED", "استرداد پرداخت ممکن نشد؛ در پنل درگاه بررسی کنید.")
)
