package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
)

type healthStatus struct {
	Status string `json:"status"`
}

type checkResult struct {
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}

// handleHealthz is liveness: the process is up. It must never touch dependencies.
func handleHealthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, healthStatus{Status: "ok"})
}

// handleReadyz is readiness: every dependency the API needs is reachable.
// A nil dependency is reported as "skipped" (used by tests; main always wires all).
func (a *App) handleReadyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	checks := map[string]checkResult{}
	ok := true

	var pingDB func(context.Context) error
	if a.DB != nil {
		pingDB = a.DB.Ping
	}
	var pingRedis func(context.Context) error
	if a.Redis != nil {
		pingRedis = func(ctx context.Context) error { return a.Redis.Ping(ctx).Err() }
	}
	var pingStorage func(context.Context) error
	if a.Storage != nil {
		pingStorage = a.Storage.Ping
	}

	runCheck := func(name string, fn func(context.Context) error) {
		if fn == nil {
			checks[name] = checkResult{Status: "skipped"}
			return
		}
		if err := fn(ctx); err != nil {
			ok = false
			checks[name] = checkResult{Status: "fail", Error: err.Error()}
			return
		}
		checks[name] = checkResult{Status: "ok"}
	}

	runCheck("postgres", pingDB)
	runCheck("redis", pingRedis)
	runCheck("storage", pingStorage)

	status, code := "ok", http.StatusOK
	if !ok {
		status, code = "unavailable", http.StatusServiceUnavailable
		a.Log.Warn("readiness check failed", "checks", checks)
	}
	writeJSON(w, code, map[string]any{"status": status, "checks": checks})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
