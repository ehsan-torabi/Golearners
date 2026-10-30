// Rate-limit middleware against a real fixed-window throttler on miniredis.
package httpapi_test

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/alicebob/miniredis/v2"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"

	"golearn/backend/internal/adapter/ratelimit"
	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/ports/fakes"
	idsvc "golearn/backend/internal/service/identity"
	"golearn/backend/internal/transport/httpapi"
)

func TestRateLimitReturns429WithRetryAfter(t *testing.T) {
	mr := miniredis.RunT(t)
	client := goredis.NewClient(&goredis.Options{Addr: mr.Addr()})
	defer client.Close()

	app := &httpapi.App{
		Cfg: config.Config{Env: "development"},
		Log: slog.New(slog.NewTextHandler(io.Discard, nil)),
		// Auth/Signer unused on the register route before rate limiting matters
		Auth: idsvc.NewService(idsvc.Deps{
			Users: fakes.NewUserRepo(), OTPs: fakes.NewOTPRepo(), Tokens: fakes.NewTokenRepo(),
			SMS: fakes.NewSMS(), Throttle: fakes.NewThrottler(),
			Hasher: fakes.PlainHasher{}, Signer: fakes.StaticSigner{}, Pepper: "p",
		}),
		Throttle: ratelimit.New(client),
		Signer:   fakes.StaticSigner{},
	}
	router := httpapi.NewRouter(app)

	body := `{"unknown_field":true}` // validation fails (400) but the hit still counts
	var last *httptest.ResponseRecorder
	for i := 0; i < 11; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		last = rec
	}
	require.Equal(t, http.StatusTooManyRequests, last.Code, last.Body.String())
	require.Equal(t, "3600", last.Header().Get("Retry-After"))
	require.Contains(t, last.Body.String(), "RATE_LIMITED")
}
