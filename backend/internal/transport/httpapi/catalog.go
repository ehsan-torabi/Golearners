// Public catalog + content handlers (docs/04 public endpoints).
package httpapi

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

func pageParams(r *http.Request) (int, int) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return page, perPage
}

func courseJSON(c *course.Course) map[string]any {
	return map[string]any{
		"id": c.ID, "slug": c.Slug, "title": c.Title, "summary": c.Summary,
		"level": c.Level, "status": c.Status,
		"price_rial": c.PriceRial, "compare_at_price_rial": c.CompareAtPriceRial,
		"is_featured": c.IsFeatured, "published_at": c.PublishedAt,
		"cover_media_id": c.CoverMediaID, "meta_title": c.MetaTitle,
		"meta_description": c.MetaDescription, "created_at": c.CreatedAt,
	}
}

// GET /api/v1/courses
func (a *App) handleCourseList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	f := ports.CourseFilter{
		CategorySlug: r.URL.Query().Get("category"),
		Level:        r.URL.Query().Get("level"),
		Q:            r.URL.Query().Get("q"),
		Sort:         r.URL.Query().Get("sort"),
		Page:         page, PerPage: perPage,
	}
	list, total, err := a.Catalog.ListCourses(r.Context(), f)
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

// GET /api/v1/courses/{slug}
func (a *App) handleCourseDetail(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var viewer *uuid.UUID
	if actor, ok := actorFrom(r.Context()); ok {
		viewer = &actor.ID
	}
	d, err := a.Catalog.CourseDetail(r.Context(), slug, viewer)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	sections := make([]map[string]any, 0, len(d.Sections))
	for _, s := range d.Sections {
		sections = append(sections, map[string]any{
			"id": s.ID, "title": s.Title, "position": s.Position,
		})
	}
	lessons := make([]map[string]any, 0, len(d.Lessons))
	for _, l := range d.Lessons {
		lessons = append(lessons, map[string]any{
			"id": l.ID, "section_id": l.SectionID, "title": l.Title,
			"position": l.Position, "is_preview": l.IsPreview,
			"duration_seconds": l.DurationSeconds, "status": l.Status,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"course":             courseJSON(d.Course),
		"description_html":   d.Course.DescriptionHTML,
		"prerequisites_html": d.Course.PrerequisitesHTML,
		"outcomes":           d.Course.Outcomes,
		"sections":           sections, "lessons": lessons,
		"rating_avg": d.RatingAvg, "rating_count": d.RatingCount,
		"owned_by_viewer": d.OwnedByViewer,
	})
}

// GET /api/v1/categories
func (a *App) handleCategoryList(w http.ResponseWriter, r *http.Request) {
	list, err := a.Catalog.Categories(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

// GET /api/v1/instructor
func (a *App) handleInstructor(w http.ResponseWriter, r *http.Request) {
	p, err := a.Catalog.InstructorProfile(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

type reviewRequest struct {
	Rating int    `json:"rating"`
	Body   string `json:"body"`
}

// POST /api/v1/courses/{slug}/reviews — entitled learners only (service checks).
func (a *App) handleReviewSubmit(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	var in reviewRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.Catalog.SubmitReview(r.Context(), actor.ID, chiSlug(r), in.Rating, in.Body); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"message": "نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود."})
}
