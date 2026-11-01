// Admin content + catalog management handlers (RBAC-gated at the router).
package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/courseadmin"
)

// adminActor builds the audit actor from the authenticated request.
func adminActor(r *http.Request) courseadmin.Actor {
	actor, _ := actorFrom(r.Context())
	return courseadmin.Actor{ID: actor.ID, IP: clientIP(r), UserAgent: r.UserAgent()}
}

func uuidParam(r *http.Request, name string) (uuid.UUID, error) {
	return uuid.Parse(chi.URLParam(r, name))
}

func writeData(w http.ResponseWriter, v any) {
	writeJSON(w, http.StatusOK, map[string]any{"data": v})
}

// POST /api/v1/admin/courses
func (a *App) handleAdminCourseCreate(w http.ResponseWriter, r *http.Request) {
	var in courseadmin.CourseInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	ins, err := a.Instructors.Primary(r.Context())
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	c, err := a.CourseAdmin.CreateCourse(r.Context(), adminActor(r), in, ins.UserID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, courseJSON(c))
}

// PUT /api/v1/admin/courses/{id}
func (a *App) handleAdminCourseUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in courseadmin.CourseInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	c, err := a.CourseAdmin.UpdateCourse(r.Context(), adminActor(r), id, in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, courseJSON(c))
}

// DELETE /api/v1/admin/courses/{id}
func (a *App) handleAdminCourseDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.CourseAdmin.DeleteCourse(r.Context(), adminActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/v1/admin/courses/{id}/publish | /unpublish
func (a *App) handleAdminCoursePublish(publish bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := uuidParam(r, "id")
		if err != nil {
			a.writeError(w, r, apperr.ErrValidation.Wrap(err))
			return
		}
		if publish {
			err = a.CourseAdmin.PublishCourse(r.Context(), adminActor(r), id)
		} else {
			err = a.CourseAdmin.UnpublishCourse(r.Context(), adminActor(r), id)
		}
		if err != nil {
			a.writeError(w, r, err)
			return
		}
		writeData(w, map[string]any{"ok": true})
	}
}

// GET /api/v1/admin/courses
func (a *App) handleAdminCourseList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.CoursesRepo.ListAdmin(r.Context(), ports.CourseFilter{
		Page: page, PerPage: perPage,
		CategorySlug: r.URL.Query().Get("category"),
		Level:        r.URL.Query().Get("level"),
		Status:       r.URL.Query().Get("status"),
		Q:            r.URL.Query().Get("q"),
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, c := range list {
		items = append(items, courseJSON(c))
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data": items,
		"meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

// GET /api/v1/admin/courses/{id} — the full editable payload.
func (a *App) handleAdminCourseDetail(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	c, err := a.CoursesRepo.ByID(r.Context(), id)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	cats, err := a.Categories.ForCourse(r.Context(), id)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	categoryIDs := make([]uuid.UUID, 0, len(cats))
	for _, c := range cats {
		categoryIDs = append(categoryIDs, c.ID)
	}
	out := courseJSON(c)
	out["description_html"] = c.DescriptionHTML
	out["prerequisites_html"] = c.PrerequisitesHTML
	out["outcomes"] = c.Outcomes
	out["promo_video_media_id"] = c.PromoVideoMediaID
	out["category_ids"] = categoryIDs
	out["updated_at"] = c.UpdatedAt
	writeData(w, out)
}

var _ = json.Marshal
var _ = course.StatusDraft
