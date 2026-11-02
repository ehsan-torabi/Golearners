// Public playback endpoints (optional auth; anonymous previews allowed).
package httpapi

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
)

// GET /api/v1/playback/lessons/{lesson_id}
func (a *App) handlePlaybackLesson(w http.ResponseWriter, r *http.Request) {
	lessonID, err := uuid.Parse(chi.URLParam(r, "lesson_id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var viewer *uuid.UUID
	if actor, ok := actorFrom(r.Context()); ok {
		viewer = &actor.ID
	}
	p, err := a.Playback.ForLesson(r.Context(), viewer, lessonID, clientIP(r))
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"playback_url": p.URL, "expires_at": p.ExpiresAt, "lesson_id": p.LessonID,
	})
}

// GET /api/v1/playback/courses/{slug}/promo — public promo clip of a
// published course (no session row; see playback.Service.ForPromo).
func (a *App) handlePlaybackPromo(w http.ResponseWriter, r *http.Request) {
	p, err := a.Playback.ForPromo(r.Context(), chiSlug(r), clientIP(r))
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"playback_url": p.URL, "expires_at": p.ExpiresAt,
	})
}

// GET /api/v1/playback/attachments/{id} - downloadable lesson files.
func (a *App) handlePlaybackAttachment(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	att, err := a.Attachments.ByID(r.Context(), id)
	if err != nil {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	l, err := a.Lessons.ByID(r.Context(), att.LessonID)
	if err != nil {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	if !l.IsPreview {
		var viewer *uuid.UUID
		if actor, ok := actorFrom(r.Context()); ok {
			viewer = &actor.ID
		}
		if viewer == nil {
			a.writeError(w, r, apperr.ErrUnauthenticated)
			return
		}
		sec, err := a.Sections.ByID(r.Context(), l.SectionID)
		if err != nil {
			a.writeError(w, r, err)
			return
		}
		allowed, err := a.Entitlements.HasActive(r.Context(), *viewer, sec.CourseID)
		if err != nil {
			a.writeError(w, r, err)
			return
		}
		if !allowed {
			a.writeError(w, r, apperr.ErrForbidden)
			return
		}
	}
	m, err := a.Media.ByID(r.Context(), att.MediaID)
	if err != nil {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	url, _, err := a.StoragePort.PresignGet(r.Context(), m.StorageKey, 15*time.Minute)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	_ = course.PlaybackSession{} // attachment downloads are audited via access logs
	writeJSON(w, http.StatusOK, map[string]any{
		"download_url": url, "expires_at": time.Now().Add(15 * time.Minute),
	})
}
