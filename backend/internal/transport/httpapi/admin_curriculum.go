// Admin curriculum, category, blog, and misc management handlers.
package httpapi

import (
	"net/http"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/service/courseadmin"
)

// POST /api/v1/admin/courses/{id}/sections
func (a *App) handleAdminSectionCreate(w http.ResponseWriter, r *http.Request) {
	courseID, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in courseadmin.SectionInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	sec, err := a.CourseAdmin.CreateSection(r.Context(), adminActor(r), courseID, in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, sec)
}

// PUT /api/v1/admin/sections/{id} — PUT /api/v1/admin/sections/{id}/reorder is on sections route too.
func (a *App) handleAdminSectionUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in courseadmin.SectionInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.CourseAdmin.UpdateSection(r.Context(), adminActor(r), id, in); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *App) handleAdminSectionDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.CourseAdmin.DeleteSection(r.Context(), adminActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type reorderRequest struct {
	IDs []uuid.UUID `json:"ids"`
}

func (a *App) handleAdminSectionReorder(w http.ResponseWriter, r *http.Request) {
	courseID, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in reorderRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.CourseAdmin.ReorderSections(r.Context(), adminActor(r), courseID, in.IDs); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/v1/admin/sections/{id}/lessons
func (a *App) handleAdminLessonCreate(w http.ResponseWriter, r *http.Request) {
	sectionID, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in courseadmin.LessonInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	l, err := a.CourseAdmin.CreateLesson(r.Context(), adminActor(r), sectionID, in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, l)
}

// PUT /api/v1/admin/lessons/{id}
func (a *App) handleAdminLessonUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in courseadmin.LessonInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.CourseAdmin.UpdateLesson(r.Context(), adminActor(r), id, in); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *App) handleAdminLessonDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.CourseAdmin.DeleteLesson(r.Context(), adminActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *App) handleAdminLessonReorder(w http.ResponseWriter, r *http.Request) {
	sectionID, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in reorderRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.CourseAdmin.ReorderLessons(r.Context(), adminActor(r), sectionID, in.IDs); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/v1/admin/courses/{id}/curriculum — sections + lessons for the editor.
func (a *App) handleAdminCurriculum(w http.ResponseWriter, r *http.Request) {
	courseID, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	sections, err := a.Sections.ListByCourse(r.Context(), courseID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	lessons, err := a.Lessons.ListByCourse(r.Context(), courseID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"sections": sections, "lessons": lessons})
}

// GET /api/v1/admin/categories — the course taxonomy for the admin console.
func (a *App) handleAdminCategoryList(w http.ResponseWriter, r *http.Request) {
	list, err := a.Categories.List(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": categoryJSONList(list)})
}

// POST /api/v1/admin/categories
func (a *App) handleAdminCategoryCreate(w http.ResponseWriter, r *http.Request) {
	var in courseadmin.CategoryInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	c, err := a.CourseAdmin.CreateCategory(r.Context(), adminActor(r), in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

// PUT /api/v1/admin/categories/{id}
func (a *App) handleAdminCategoryUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in courseadmin.CategoryInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.CourseAdmin.UpdateCategory(r.Context(), adminActor(r), id, in); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *App) handleAdminCategoryDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.CourseAdmin.DeleteCategory(r.Context(), adminActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

var _ = course.StatusDraft
