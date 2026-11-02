// Admin media grid handlers + public playback endpoints.
package httpapi

import (
	"net/http"
	"time"

	"golearn/backend/internal/domain/course"

	"github.com/go-chi/chi/v5"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/media"
)

// mediaActor builds the media-service audit actor.
func mediaActor(r *http.Request) media.Actor {
	actor, _ := actorFrom(r.Context())
	return media.Actor{ID: actor.ID, IP: clientIP(r), UserAgent: r.UserAgent()}
}

type presignRequest struct {
	Mime      string `json:"mime"`
	SizeBytes int64  `json:"size_bytes"`
	Filename  string `json:"filename"`
}

// POST /api/v1/admin/media/presign
func (a *App) handleAdminMediaPresign(w http.ResponseWriter, r *http.Request) {
	var in presignRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	ticket, err := a.MediaService.PresignUpload(r.Context(), mediaActor(r), in.Mime, in.SizeBytes, in.Filename)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, ticket)
}

type mediaRegisterRequest struct {
	StorageKey string `json:"storage_key"`
	Filename   string `json:"filename"`
	Mime       string `json:"mime"`
	SizeBytes  int64  `json:"size_bytes"`
	Checksum   string `json:"checksum"`
}

// POST /api/v1/admin/media — register after the browser finished the PUT.
func (a *App) handleAdminMediaRegister(w http.ResponseWriter, r *http.Request) {
	var in mediaRegisterRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	m, err := a.MediaService.Register(r.Context(), mediaActor(r), media.RegisterInput{
		StorageKey: in.StorageKey, Filename: in.Filename,
		Mime: in.Mime, SizeBytes: in.SizeBytes, Checksum: in.Checksum,
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, mediaJSON(m))
}

// GET /api/v1/admin/media
func (a *App) handleAdminMediaList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.MediaService.List(r.Context(), ports.MediaFilter{
		Page: page, PerPage: perPage,
		Kind:   r.URL.Query().Get("kind"),
		Status: r.URL.Query().Get("status"),
		Q:      r.URL.Query().Get("q"),
		Sort:   r.URL.Query().Get("sort"),
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, m := range list {
		items = append(items, mediaJSON(m))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": items, "meta": map[string]any{"page": page, "per_page": perPage, "total": total}})
}

func (a *App) handleAdminMediaDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.MediaService.Delete(r.Context(), mediaActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func mediaJSON(m *course.MediaAsset) map[string]any {
	return map[string]any{
		"id": m.ID, "kind": m.Kind, "storage_key": m.StorageKey, "filename": m.Filename,
		"mime": m.Mime, "size_bytes": m.SizeBytes, "status": m.Status,
		"duration_seconds": m.DurationSecs,
		"vod_provider":     m.VODProvider, "vod_remote_id": m.VODRemoteID,
		"error_message": m.ErrorMessage, "created_at": m.CreatedAt,
		"url": mediaURL(m),
	}
}

// mediaURL is the public read path for image assets; other kinds keep their
// dedicated endpoints (playback for video, attachments for pdf).
func mediaURL(m *course.MediaAsset) any {
	if m.Kind != course.MediaImage {
		return nil
	}
	return "/api/v1/media/" + m.ID.String()
}

var _ = time.Second
var _ = chi.URLParam
