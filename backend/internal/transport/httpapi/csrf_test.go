// CSRF hardening regression tests: the gl_csrf cookie must carry a signature
// this server produced, and a foreign Origin must be refused even when the
// double-submit pair matches.
package httpapi_test

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCSRFCookieWithoutServerSignatureRejected(t *testing.T) {
	e := newEnv(t)
	cookies := e.registerAndVerify(t, "09121234567")

	forged := make([]*http.Cookie, 0, len(cookies))
	for _, c := range cookies {
		if c.Name == "gl_csrf" {
			// header matches the cookie exactly, but the value is not ours
			forged = append(forged, &http.Cookie{Name: "gl_csrf", Value: "forged"})
		} else {
			forged = append(forged, c)
		}
	}

	rec := e.do(t, "POST", "/api/v1/auth/password/change",
		`{"current_password":"secret123","new_password":"newpass456"}`,
		http.Header{"X-CSRF-Token": []string{"forged"}}, forged)
	require.Equal(t, http.StatusForbidden, rec.Code, rec.Body.String())
	require.Contains(t, rec.Body.String(), "CSRF_INVALID")
}

func TestCSRFRejectsForeignOrigin(t *testing.T) {
	e := newEnv(t)
	cookies := e.registerAndVerify(t, "09121234567")
	csrf := cookieByName(cookies, "gl_csrf")
	body := `{"current_password":"secret123","new_password":"newpass456"}`

	rec := e.do(t, "POST", "/api/v1/auth/password/change", body,
		http.Header{"X-CSRF-Token": []string{csrf}, "Origin": []string{"https://evil.example"}},
		cookies)
	require.Equal(t, http.StatusForbidden, rec.Code, rec.Body.String())
	require.Contains(t, rec.Body.String(), "CSRF_INVALID")

	// the site's own origin (the public base URL) is accepted
	rec = e.do(t, "POST", "/api/v1/auth/password/change", body,
		http.Header{"X-CSRF-Token": []string{csrf}, "Origin": []string{"http://localhost:3000"}},
		cookies)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
}
