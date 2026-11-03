// Admin course-statistics handlers (RBAC-gated at the router).
package httpapi

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/ports"
)

// GET /api/v1/admin/course-stats?q=&status=&level=&category=&sort=&min_enrollments=&page=&per_page=
func (a *App) handleAdminCourseStatsList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	minEnrollments, _ := strconv.Atoi(r.URL.Query().Get("min_enrollments"))
	list, total, err := a.CourseStats.List(r.Context(), ports.CourseStatsFilter{
		Q:              r.URL.Query().Get("q"),
		Status:         r.URL.Query().Get("status"),
		Level:          r.URL.Query().Get("level"),
		CategorySlug:   r.URL.Query().Get("category"),
		MinEnrollments: minEnrollments,
		Sort:           r.URL.Query().Get("sort"),
	}, page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]ports.CourseStatsRow, 0, len(list))
	items = append(items, list...)
	writeJSON(w, http.StatusOK, map[string]any{
		"data": items,
		"meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

// GET /api/v1/admin/course-stats/{id}
func (a *App) handleAdminCourseStatsDetail(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	detail, err := a.CourseStats.Detail(r.Context(), id, days)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			a.writeError(w, r, apperr.ErrNotFound)
			return
		}
		a.writeError(w, r, err)
		return
	}
	writeData(w, detail)
}
