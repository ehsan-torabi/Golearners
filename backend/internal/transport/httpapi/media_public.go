// Public media delivery: course/blog cover images streamed from the private
// bucket. Videos stay behind playback (entitlement-checked) and PDFs behind
// lesson attachments; this endpoint only ever serves image assets.
package httpapi

import (
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
)

// mediaCacheAge: a media id is immutable content (replace = new asset), so
// covers may sit in shared caches for a day.
const mediaCacheAge = "public, max-age=86400"

// GET /api/v1/media/{id}
func (a *App) handleMediaGet(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	m, err := a.Media.ByID(r.Context(), id)
	if err != nil || m.Kind != course.MediaImage {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	etag := `"` + m.ID.String() + `"`
	w.Header().Set("ETag", etag)
	w.Header().Set("Cache-Control", mediaCacheAge)
	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	body, size, err := a.StoragePort.Get(r.Context(), m.StorageKey)
	if err != nil {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	defer body.Close()
	w.Header().Set("Content-Type", m.Mime)
	w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, body)
}
