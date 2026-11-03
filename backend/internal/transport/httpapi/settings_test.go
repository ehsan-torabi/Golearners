// Settings upsert regression tests: only known keys with a known shape are
// writable, and gateway settings stay owner-only (docs/07 threat model).
package httpapi_test

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
)

// stubSettingsRepo satisfies ports.SettingsRepo for handler tests.
type stubSettingsRepo struct{ data map[string]json.RawMessage }

func newStubSettingsRepo() *stubSettingsRepo {
	return &stubSettingsRepo{data: map[string]json.RawMessage{}}
}

func (s *stubSettingsRepo) All(_ context.Context) (map[string]json.RawMessage, error) {
	out := map[string]json.RawMessage{}
	for k, v := range s.data {
		out[k] = v
	}
	return out, nil
}

func (s *stubSettingsRepo) Upsert(_ context.Context, key string, value json.RawMessage) error {
	s.data[key] = value
	return nil
}

// stubAuditSink satisfies ports.AuditRepo including Insert, which the settings
// handler calls on every successful write.
type stubAuditSink struct{ ports.AuditRepo }

func (stubAuditSink) Insert(context.Context, *ports.AuditEntry) error { return nil }

func (e *testEnv) loginAsRole(t *testing.T, mobile string, role identity.Role) []*http.Cookie {
	t.Helper()
	cookies := e.registerAndVerify(t, mobile)
	u, ok := e.users.FindByMobileForTest(mobile)
	require.True(t, ok)
	require.NoError(t, e.users.AddRole(context.Background(), u.ID, role))
	return cookies
}

func (e *testEnv) patchSettings(t *testing.T, cookies []*http.Cookie, body string) *int {
	t.Helper()
	hdr := http.Header{"X-CSRF-Token": []string{cookieByName(cookies, "gl_csrf")}}
	rec := e.do(t, "PATCH", "/api/v1/admin/settings", body, hdr, cookies)
	return &rec.Code
}

func TestSettingsPatchRejectsUnknownKey(t *testing.T) {
	e := newEnv(t)
	e.app.SettingsRepo = newStubSettingsRepo()
	e.app.Audit = stubAuditSink{}
	cookies := e.loginAsRole(t, "09121234567", identity.RoleAdmin)

	code := e.patchSettings(t, cookies, `{"site":{"title":"گوLearn"}}`)
	require.Equal(t, http.StatusOK, *code)

	code = e.patchSettings(t, cookies, `{"some_other_key":{}}`)
	require.Equal(t, http.StatusBadRequest, *code)
}

func TestSettingsPatchRejectsWrongShape(t *testing.T) {
	e := newEnv(t)
	e.app.SettingsRepo = newStubSettingsRepo()
	e.app.Audit = stubAuditSink{}
	cookies := e.loginAsRole(t, "09121234567", identity.RoleAdmin)

	for _, body := range []string{
		`{"site":"not an object"}`,
		`{"site":{"title":"ok","surprise":true}}`, // unknown field inside the shape
		`{"seo":{"meta_description":123}}`,
	} {
		code := e.patchSettings(t, cookies, body)
		require.Equal(t, http.StatusBadRequest, *code, body)
	}
}

func TestSettingsGatewaysAreOwnerOnly(t *testing.T) {
	e := newEnv(t)
	e.app.SettingsRepo = newStubSettingsRepo()
	e.app.Audit = stubAuditSink{}
	admin := e.loginAsRole(t, "09121234567", identity.RoleAdmin)
	owner := e.loginAsRole(t, "09129876543", identity.RoleOwner)

	code := e.patchSettings(t, admin, `{"gateways":{"default":"zarinpal","enabled":["zarinpal"]}}`)
	require.Equal(t, http.StatusForbidden, *code, "an admin must not switch payment gateways")

	code = e.patchSettings(t, owner, `{"gateways":{"default":"zarinpal","enabled":["zarinpal"]}}`)
	require.Equal(t, http.StatusOK, *code)
}

func TestSettingsGatewaysRejectUnknownGateway(t *testing.T) {
	e := newEnv(t)
	e.app.SettingsRepo = newStubSettingsRepo()
	e.app.Audit = stubAuditSink{}
	owner := e.loginAsRole(t, "09121234567", identity.RoleOwner)

	for _, body := range []string{
		`{"gateways":{"default":"not-a-gateway"}}`,
		`{"gateways":{"enabled":["zarinpal","hackpay"]}}`,
		`{"gateways":{"enabled":["zarinpal","zarinpal"]}}`,
	} {
		code := e.patchSettings(t, owner, body)
		require.Equal(t, http.StatusBadRequest, *code, body)
	}
}
