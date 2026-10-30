package httpapi

import (
	"errors"
	"net/http"

	chimw "github.com/go-chi/chi/v5/middleware"

	"golearn/backend/internal/apperr"
)

// writeError maps any error to the API error envelope (docs/04). Unknown
// errors become a generic 500 — internals never leak to clients.
func (a *App) writeError(w http.ResponseWriter, r *http.Request, err error) {
	var ae *apperr.AppError
	if !errors.As(err, &ae) {
		a.Log.Error("internal error",
			"err", err,
			"path", r.URL.Path,
			"request_id", chimw.GetReqID(r.Context()),
		)
		ae = apperr.ErrInternal
	}
	writeJSON(w, ae.Status, map[string]any{"error": ae})
}
