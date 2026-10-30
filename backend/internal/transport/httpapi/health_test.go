package httpapi

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func testApp() *App {
	// All dependencies nil → readyz reports "skipped" per check; main always
	// wires every dependency, and per-dependency failure paths are covered by
	// integration tests in later phases.
	return &App{Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
}

func TestHealthzReturnsOK(t *testing.T) {
	srv := httptest.NewServer(NewRouter(testApp()))
	defer srv.Close()

	resp, err := srv.Client().Get(srv.URL + "/healthz")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusOK, resp.StatusCode)
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	require.JSONEq(t, `{"status":"ok"}`, string(body))
}

func TestReadyzWithoutDepsReportsSkipped(t *testing.T) {
	srv := httptest.NewServer(NewRouter(testApp()))
	defer srv.Close()

	resp, err := srv.Client().Get(srv.URL + "/readyz")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusOK, resp.StatusCode)
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	require.JSONEq(t, `{"status":"ok","checks":{"postgres":{"status":"skipped"},"redis":{"status":"skipped"},"storage":{"status":"skipped"}}}`, string(body))
}

func TestSecurityHeadersPresent(t *testing.T) {
	srv := httptest.NewServer(NewRouter(testApp()))
	defer srv.Close()

	resp, err := srv.Client().Get(srv.URL + "/healthz")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, "nosniff", resp.Header.Get("X-Content-Type-Options"))
	require.Equal(t, "DENY", resp.Header.Get("X-Frame-Options"))
	require.Equal(t, "strict-origin-when-cross-origin", resp.Header.Get("Referrer-Policy"))
	require.NotEmpty(t, resp.Header.Get("Content-Security-Policy"))
}

func TestUnknownRouteIs404(t *testing.T) {
	srv := httptest.NewServer(NewRouter(testApp()))
	defer srv.Close()

	resp, err := srv.Client().Get(srv.URL + "/nope")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusNotFound, resp.StatusCode)
}
