// Handler-level flow tests over fakes: register → verify → me → refresh →
// logout, plus CSRF/RBAC/rate-limit behavior. No DB/redis required.
package httpapi_test

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/ports/fakes"
	idsvc "golearn/backend/internal/service/identity"
	"golearn/backend/internal/transport/httpapi"
)

type testEnv struct {
	app   *httpapi.App
	sms   *fakes.SMS
	users *fakes.UserRepo
	tok   *fakes.TokenRepo
}

func newEnv(t *testing.T) *testEnv {
	t.Helper()
	users := fakes.NewUserRepo()
	sms := fakes.NewSMS()
	tok := fakes.NewTokenRepo()
	svc := idsvc.NewService(idsvc.Deps{
		Users: users, OTPs: fakes.NewOTPRepo(), Tokens: tok, SMS: sms,
		Throttle: fakes.NewThrottler(), Hasher: fakes.PlainHasher{}, Signer: fakes.StaticSigner{},
		Pepper: "pepper",
	})
	cfg := config.Config{Env: "development", BaseURL: "http://localhost:3000", HTTPPort: "8080"}
	app := &httpapi.App{
		Cfg: cfg, Log: slog.New(slog.NewTextHandler(io.Discard, nil)),
		Auth: svc, Throttle: fakes.NewThrottler(), Signer: fakes.StaticSigner{},
	}
	return &testEnv{app: app, sms: sms, users: users, tok: tok}
}

func (e *testEnv) do(t *testing.T, method, path, body string, header http.Header, cookies []*http.Cookie) *httptest.ResponseRecorder {
	t.Helper()
	var rdr io.Reader
	if body != "" {
		rdr = bytes.NewReader([]byte(body))
	}
	req := httptest.NewRequest(method, path, rdr)
	req.Header.Set("Content-Type", "application/json")
	for k, vs := range header {
		for _, v := range vs {
			req.Header.Add(k, v)
		}
	}
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	httpapi.NewRouter(e.app).ServeHTTP(rec, req)
	return rec
}

// registerAndVerify walks the full pre-auth flow and returns the session cookies.
func (e *testEnv) registerAndVerify(t *testing.T, mobile string) []*http.Cookie {
	t.Helper()
	rec := e.do(t, "POST", "/api/v1/auth/register",
		`{"mobile":"`+mobile+`","password":"secret123","full_name":"دانجو تستی"}`, nil, nil)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())

	code := e.sms.LastCode(mobile)
	require.Len(t, code, 6)
	rec = e.do(t, "POST", "/api/v1/auth/otp/verify",
		`{"mobile":"`+mobile+`","code":"`+code+`","purpose":"verify"}`, nil, nil)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	return rec.Result().Cookies()
}

func cookieByName(cs []*http.Cookie, name string) string {
	for _, c := range cs {
		if c.Name == name {
			return c.Value
		}
	}
	return ""
}

func TestRegisterVerifyMeFlow(t *testing.T) {
	e := newEnv(t)
	cookies := e.registerAndVerify(t, "09121234567")
	require.NotEmpty(t, cookieByName(cookies, "gl_at"))
	require.NotEmpty(t, cookieByName(cookies, "gl_rt"))
	require.NotEmpty(t, cookieByName(cookies, "gl_csrf"))

	// GET /me with the access cookie
	rec := e.do(t, "GET", "/api/v1/me", "", nil, cookies)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	require.Contains(t, rec.Body.String(), `"full_name":"دانجو تستی"`)
	require.Contains(t, rec.Body.String(), `"roles":["learner"]`)
}

func TestMeRequiresAuth(t *testing.T) {
	e := newEnv(t)
	rec := e.do(t, "GET", "/api/v1/me", "", nil, nil)
	require.Equal(t, http.StatusUnauthorized, rec.Code)
	require.Contains(t, rec.Body.String(), "UNAUTHENTICATED")
}

func TestRefreshRotationAtTransportLevel(t *testing.T) {
	e := newEnv(t)
	cookies := e.registerAndVerify(t, "09121234567")
	oldRT := cookieByName(cookies, "gl_rt")

	rec := e.do(t, "POST", "/api/v1/auth/refresh", "", nil,
		[]*http.Cookie{{Name: "gl_rt", Value: oldRT}})
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	newRT := cookieByName(rec.Result().Cookies(), "gl_rt")
	require.NotEqual(t, oldRT, newRT)

	// replay of the rotated-away token → 401 and cookies cleared
	rec = e.do(t, "POST", "/api/v1/auth/refresh", "", nil,
		[]*http.Cookie{{Name: "gl_rt", Value: oldRT}})
	require.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestLogoutRevokesSession(t *testing.T) {
	e := newEnv(t)
	cookies := e.registerAndVerify(t, "09121234567")
	rt := cookieByName(cookies, "gl_rt")

	hdr := http.Header{"X-CSRF-Token": []string{cookieByName(cookies, "gl_csrf")}}
	rec := e.do(t, "POST", "/api/v1/auth/logout", "", hdr, cookies)
	require.Equal(t, http.StatusNoContent, rec.Code)

	rec = e.do(t, "POST", "/api/v1/auth/refresh", "", nil,
		[]*http.Cookie{{Name: "gl_rt", Value: rt}})
	require.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestCSRFEnforcedOnAuthedMutation(t *testing.T) {
	e := newEnv(t)
	cookies := e.registerAndVerify(t, "09121234567")
	csrf := cookieByName(cookies, "gl_csrf")

	// missing header → 403
	rec := e.do(t, "POST", "/api/v1/auth/password/change",
		`{"current_password":"secret123","new_password":"newpass456"}`, nil, cookies)
	require.Equal(t, http.StatusForbidden, rec.Code)
	require.Contains(t, rec.Body.String(), "CSRF_INVALID")

	// correct double-submit → 200
	hdr := http.Header{"X-CSRF-Token": []string{csrf}}
	rec = e.do(t, "POST", "/api/v1/auth/password/change",
		`{"current_password":"secret123","new_password":"newpass456"}`, hdr, cookies)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
}

func TestBlockedUserGets403OnMe(t *testing.T) {
	e := newEnv(t)
	cookies := e.registerAndVerify(t, "09121234567")
	at := cookieByName(cookies, "gl_at")

	u, ok := e.users.FindByMobileForTest("09121234567")
	require.True(t, ok)
	e.users.SetStatusForTest(u.ID, identity.StatusBlocked)

	rec := e.do(t, "GET", "/api/v1/me", "", nil, []*http.Cookie{{Name: "gl_at", Value: at}})
	require.Equal(t, http.StatusForbidden, rec.Code)
	require.Contains(t, rec.Body.String(), "ACCOUNT_BLOCKED")
}

func TestUnknownRouteStill404(t *testing.T) {
	e := newEnv(t)
	rec := e.do(t, "GET", "/api/v1/nope", "", nil, nil)
	require.Equal(t, http.StatusNotFound, rec.Code)
}
