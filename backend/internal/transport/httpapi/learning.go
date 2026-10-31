// Learner-panel endpoints: my courses, curriculum, progress.
package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/service/learning"
)

// GET /api/v1/me/courses
func (a *App) handleMyCourses(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	list, err := a.Learning.MyCourses(r.Context(), actor.ID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, mc := range list {
		items = append(items, map[string]any{
			"course":           courseJSON(mc.Course),
			"granted_at":       mc.GrantedAt,
			"progress_pct":     mc.ProgressPct,
			"resume_lesson_id": mc.ResumeLesson,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": items})
}

// GET /api/v1/me/courses/{slug}/curriculum
func (a *App) handleMyCurriculum(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	sections, lessons, err := a.Learning.Curriculum(r.Context(), actor.ID, chi.URLParam(r, "slug"))
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	lessonOut := make([]map[string]any, 0, len(lessons))
	for _, cl := range lessons {
		lessonOut = append(lessonOut, map[string]any{
			"id": cl.Lesson.ID, "section_id": cl.Lesson.SectionID,
			"title": cl.Lesson.Title, "position": cl.Lesson.Position,
			"is_preview":       cl.Lesson.IsPreview,
			"duration_seconds": cl.Lesson.DurationSeconds,
			"accessible":       cl.Accessible,
			"position_seconds": cl.PositionSeconds,
			"completed":        cl.Completed,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"sections": sections, "lessons": lessonOut})
}

type progressRequest struct {
	PositionSeconds int   `json:"position_seconds"`
	Completed       *bool `json:"completed"`
}

// PUT /api/v1/me/progress/{lesson_id}
func (a *App) handleSetProgress(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	lessonID, err := uuid.Parse(chi.URLParam(r, "lesson_id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in progressRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.Learning.SetProgress(r.Context(), actor.ID, lessonID, learning.ProgressInput{
		PositionSeconds: in.PositionSeconds, Completed: in.Completed,
	}); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"saved": true})
}
