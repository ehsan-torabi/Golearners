// clientIP must resolve the address the trusted proxy observed, never a value
// the client chose for itself.
package httpapi

import (
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestClientIPTakesLastForwardedHop(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	require.Equal(t, "192.0.2.1", clientIP(req), "falls back to RemoteAddr")

	req.Header.Set("X-Forwarded-For", "6.6.6.6, 10.0.0.9")
	require.Equal(t, "10.0.0.9", clientIP(req))

	// a client-supplied prefix must not win over the proxy's own observation
	req.Header.Set("X-Forwarded-For", "6.6.6.6, 10.0.0.9")
	req.Header.Set("X-Real-IP", "7.7.7.7")
	require.Equal(t, "10.0.0.9", clientIP(req))

	req.Header.Set("X-Forwarded-For", "not-an-ip")
	require.Equal(t, "7.7.7.7", clientIP(req), "falls back to X-Real-IP when XFF is unusable")

	req.Header.Set("X-Forwarded-For", "")
	req.Header.Set("X-Real-IP", "also not an ip")
	require.Equal(t, "192.0.2.1", clientIP(req))
}
