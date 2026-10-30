package httpapi

import (
	"errors"
	"net/http"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
	idsvc "golearn/backend/internal/service/identity"
)

type registerRequest struct {
	Mobile   string `json:"mobile"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

// POST /api/v1/auth/register — creates the account and sends a verify OTP.
func (a *App) handleRegister(w http.ResponseWriter, r *http.Request) {
	var in registerRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	err := a.Auth.Register(r.Context(), idsvc.RegisterInput{
		Mobile: in.Mobile, Password: in.Password, FullName: in.FullName,
		IP: clientIP(r), UserAgent: r.UserAgent(),
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"message": "کد تأیید به شماره شما پیامک شد.",
	})
}

type otpRequest struct {
	Mobile  string           `json:"mobile"`
	Purpose identity.Purpose `json:"purpose"`
}

// POST /api/v1/auth/otp/request — purpose-scoped OTP; never reveals account existence.
func (a *App) handleOTPRequest(w http.ResponseWriter, r *http.Request) {
	var in otpRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.Auth.RequestOTP(r.Context(), in.Mobile, in.Purpose, clientIP(r)); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"sent": true})
}

type otpVerifyRequest struct {
	Mobile  string           `json:"mobile"`
	Code    string           `json:"code"`
	Purpose identity.Purpose `json:"purpose"`
}

// POST /api/v1/auth/otp/verify — completes verification (purpose=verify) or
// logs in (purpose=login); sets session cookies on success.
func (a *App) handleOTPVerify(w http.ResponseWriter, r *http.Request) {
	var in otpVerifyRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	sess, err := a.Auth.VerifyOTP(r.Context(), in.Mobile, in.Code, in.Purpose, clientIP(r), r.UserAgent())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	a.finishLogin(w, r, sess)
}

type loginRequest struct {
	Mobile   string `json:"mobile"`
	Password string `json:"password"`
}

// POST /api/v1/auth/login
func (a *App) handleLogin(w http.ResponseWriter, r *http.Request) {
	var in loginRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	sess, err := a.Auth.Login(r.Context(), idsvc.LoginInput{
		Mobile: in.Mobile, Password: in.Password, IP: clientIP(r), UserAgent: r.UserAgent(),
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	a.finishLogin(w, r, sess)
}

// POST /api/v1/auth/refresh — rotates the refresh token family.
func (a *App) handleRefresh(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(cookieRefresh)
	if err != nil || c.Value == "" {
		a.writeError(w, r, apperr.ErrRefreshInvalid)
		return
	}
	sess, err := a.Auth.Refresh(r.Context(), c.Value, clientIP(r), r.UserAgent())
	if err != nil {
		clearSessionCookies(w, a.Cfg)
		a.writeError(w, r, err)
		return
	}
	a.finishLogin(w, r, sess)
}

// POST /api/v1/auth/logout
func (a *App) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(cookieRefresh); err == nil {
		if err := a.Auth.Logout(r.Context(), c.Value); err != nil && !errors.Is(err, apperr.ErrInternal) {
			a.Log.Warn("logout revoke failed", "err", err)
		}
	}
	clearSessionCookies(w, a.Cfg)
	w.WriteHeader(http.StatusNoContent)
}

type passwordResetRequest struct {
	Mobile      string `json:"mobile"`
	Code        string `json:"code"`
	NewPassword string `json:"new_password"`
}

// POST /api/v1/auth/password/reset
func (a *App) handlePasswordReset(w http.ResponseWriter, r *http.Request) {
	var in passwordResetRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	err := a.Auth.ResetPassword(r.Context(), idsvc.ResetPasswordInput{
		Mobile: in.Mobile, Code: in.Code, NewPassword: in.NewPassword, IP: clientIP(r),
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	clearSessionCookies(w, a.Cfg)
	writeJSON(w, http.StatusOK, map[string]any{"message": "رمز عبور تغییر کرد؛ دوباره وارد شوید."})
}

// finishLogin sets cookies and returns the user payload (shared by login/verify/refresh).
func (a *App) finishLogin(w http.ResponseWriter, r *http.Request, sess *idsvc.Session) {
	setSessionCookies(w, a.Cfg, sess)
	writeJSON(w, http.StatusOK, a.userPayload(r.Context(), sess.User))
}
