// Admin blog, taxonomy, pages, faqs, testimonials, inbox, and audit handlers.
package httpapi

import (
	"net/http"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/content"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/contentadmin"

	courseSlug "golearn/backend/internal/domain/course"
)

// taxonomyInput is the blog category/tag payload (title + optional position).
type taxonomyInput struct {
	Title    string `json:"title"`
	Position int    `json:"position"`
}

// contentActor builds the contentadmin audit actor.
func contentActor(r *http.Request) contentadmin.Actor {
	actor, _ := actorFrom(r.Context())
	return contentadmin.Actor{ID: actor.ID, IP: clientIP(r), UserAgent: r.UserAgent()}
}

// POST /api/v1/admin/posts
func (a *App) handleAdminPostCreate(w http.ResponseWriter, r *http.Request) {
	var in contentadmin.PostInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	actor, _ := actorFrom(r.Context())
	p, err := a.Content.CreatePost(r.Context(), contentadmin.Actor{
		ID: actor.ID, IP: clientIP(r), UserAgent: r.UserAgent(),
	}, in, actor.ID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, postJSON(p, nil))
}

// PUT /api/v1/admin/posts/{id}
func (a *App) handleAdminPostUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in contentadmin.PostInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	p, err := a.Content.UpdatePost(r.Context(), contentActor(r), id, in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, postJSON(p, nil))
}

func (a *App) handleAdminPostDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.Content.DeletePost(r.Context(), contentActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/v1/admin/posts/{id}/publish | /unpublish
func (a *App) handleAdminPostPublish(publish bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := uuidParam(r, "id")
		if err != nil {
			a.writeError(w, r, apperr.ErrValidation.Wrap(err))
			return
		}
		if publish {
			err = a.Content.PublishPost(r.Context(), contentActor(r), id)
		} else {
			err = a.Content.UnpublishPost(r.Context(), contentActor(r), id)
		}
		if err != nil {
			a.writeError(w, r, err)
			return
		}
		writeData(w, map[string]any{"ok": true})
	}
}

// GET /api/v1/admin/posts
func (a *App) handleAdminPostList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.Posts.ListAdmin(r.Context(), ports.PostFilter{
		Page: page, PerPage: perPage,
		Status:     r.URL.Query().Get("status"),
		Q:          r.URL.Query().Get("q"),
		CategoryID: r.URL.Query().Get("category_id"),
		TagSlug:    r.URL.Query().Get("tag"),
		Sort:       r.URL.Query().Get("sort"),
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, p := range list {
		items = append(items, postJSON(p, nil))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": items, "meta": map[string]any{"page": page, "per_page": perPage, "total": total}})
}

// GET /api/v1/admin/posts/{id} — the full editable payload.
func (a *App) handleAdminPostDetail(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	p, err := a.Posts.ByID(r.Context(), id)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	tags, err := a.Posts.TagsOf(r.Context(), id)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	out := postJSON(p, nil)
	out["body_html"] = p.BodyHTML
	out["status"] = p.Status
	out["created_at"] = p.CreatedAt
	out["updated_at"] = p.UpdatedAt
	titles := make([]string, 0, len(tags))
	for _, t := range tags {
		titles = append(titles, t.Title)
	}
	out["tag_titles"] = titles
	out["og_image_media_id"] = p.OGImageMediaID
	writeData(w, out)
}

// --- Admin: blog series ----------------------------------------------------

// GET /api/v1/admin/series — with per-series post counts.
func (a *App) handleAdminSeriesList(w http.ResponseWriter, r *http.Request) {
	list, err := a.Series.List(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, s := range list {
		n, _ := a.Series.PostsCount(r.Context(), s.ID)
		items = append(items, map[string]any{
			"id": s.ID, "slug": s.Slug, "title": s.Title,
			"description": s.Description, "created_at": s.CreatedAt, "posts_count": n,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": items})
}

// POST /api/v1/admin/series
func (a *App) handleAdminSeriesCreate(w http.ResponseWriter, r *http.Request) {
	var in contentadmin.SeriesInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	ser, err := a.Content.CreateSeries(r.Context(), contentActor(r), in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": ser.ID, "slug": ser.Slug,
		"title": ser.Title, "description": ser.Description, "created_at": ser.CreatedAt})
}

// PUT /api/v1/admin/series/{id}
func (a *App) handleAdminSeriesUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in contentadmin.SeriesInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	ser, err := a.Content.UpdateSeries(r.Context(), contentActor(r), id, in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, map[string]any{"id": ser.ID, "slug": ser.Slug,
		"title": ser.Title, "description": ser.Description})
}

// DELETE /api/v1/admin/series/{id}
func (a *App) handleAdminSeriesDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.Content.DeleteSeries(r.Context(), contentActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Admin: comment moderation ----------------------------------------------

// GET /api/v1/admin/comments — status/post/q filters + status counts for badges.
func (a *App) handleAdminCommentList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.Comments.ListAdmin(r.Context(), ports.CommentFilter{
		Status: r.URL.Query().Get("status"), PostID: r.URL.Query().Get("post_id"),
		Q: r.URL.Query().Get("q"), Page: page, PerPage: perPage,
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, row := range list {
		items = append(items, map[string]any{
			"id": row.ID, "post_id": row.PostID, "post_slug": row.PostSlug,
			"post_title": row.PostTitle, "parent_id": row.ParentID,
			"author_name": row.AuthorName, "author_email": row.AuthorEmail,
			"body": row.Body, "status": row.Status, "created_at": row.CreatedAt,
		})
	}
	counts, _ := a.Comments.CountByStatus(r.Context())
	writeJSON(w, http.StatusOK, map[string]any{
		"data": items, "counts": counts,
		"meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

// POST /api/v1/admin/comments/{id}/approve | /unapprove | /spam
func (a *App) handleAdminCommentAction(action content.CommentStatus) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := uuidParam(r, "id")
		if err != nil {
			a.writeError(w, r, apperr.ErrValidation.Wrap(err))
			return
		}
		actor := contentActor(r)
		switch action {
		case content.CommentApproved:
			err = a.Content.ApproveComment(r.Context(), actor, id)
		case content.CommentPending:
			err = a.Content.UnapproveComment(r.Context(), actor, id)
		case content.CommentSpam:
			err = a.Content.MarkCommentSpam(r.Context(), actor, id)
		}
		if err != nil {
			a.writeError(w, r, err)
			return
		}
		writeData(w, map[string]any{"ok": true})
	}
}

// DELETE /api/v1/admin/comments/{id}
func (a *App) handleAdminCommentDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.Content.DeleteComment(r.Context(), contentActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/v1/admin/pages — upsert by slug
func (a *App) handleAdminPageUpsert(w http.ResponseWriter, r *http.Request) {
	var p content.Page
	if err := decodeJSON(w, r, &p); err != nil {
		a.writeError(w, r, err)
		return
	}
	if p.ID == uuid.Nil {
		p.ID = uuid.Must(uuid.NewV7())
	}
	if err := a.Content.UpsertPage(r.Context(), contentActor(r), &p); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (a *App) handleAdminFAQUpsert(w http.ResponseWriter, r *http.Request) {
	var f content.FAQ
	if err := decodeJSON(w, r, &f); err != nil {
		a.writeError(w, r, err)
		return
	}
	if f.ID == uuid.Nil {
		f.ID = uuid.Must(uuid.NewV7())
	}
	if err := a.Content.UpsertFAQ(r.Context(), contentActor(r), &f); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, f)
}

func (a *App) handleAdminTestimonialUpsert(w http.ResponseWriter, r *http.Request) {
	var t content.Testimonial
	if err := decodeJSON(w, r, &t); err != nil {
		a.writeError(w, r, err)
		return
	}
	if t.ID == uuid.Nil {
		t.ID = uuid.Must(uuid.NewV7())
	}
	if err := a.Content.UpsertTestimonial(r.Context(), contentActor(r), &t); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

// GET /api/v1/admin/blog-categories
func (a *App) handleAdminBlogCategoryList(w http.ResponseWriter, r *http.Request) {
	list, err := a.Taxonomy.ListCategories(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

// POST /api/v1/admin/blog-categories
func (a *App) handleAdminBlogCategoryCreate(w http.ResponseWriter, r *http.Request) {
	var in taxonomyInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	slug, err := courseSlug.NormalizeSlug(in.Title)
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	c := &content.BlogCategory{
		ID: uuid.Must(uuid.NewV7()), Slug: slug, Title: in.Title, Position: in.Position,
	}
	if err := a.Content.CreateBlogCategory(r.Context(), contentActor(r), c); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

// PUT /api/v1/admin/blog-categories/{id}
func (a *App) handleAdminBlogCategoryUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in taxonomyInput
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	slug, err := courseSlug.NormalizeSlug(in.Title)
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	c := &content.BlogCategory{ID: id, Slug: slug, Title: in.Title, Position: in.Position}
	if err := a.Content.UpdateBlogCategory(r.Context(), contentActor(r), c); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeData(w, c)
}

// DELETE /api/v1/admin/blog-categories/{id}
func (a *App) handleAdminBlogCategoryDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.Content.DeleteBlogCategory(r.Context(), contentActor(r), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/v1/admin/messages + POST /api/v1/admin/messages/{id}/status
func (a *App) handleAdminMessages(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.Contacts.List(r.Context(), r.URL.Query().Get("status"), page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list, "meta": map[string]any{"page": page, "per_page": perPage, "total": total}})
}

type contactStatusRequest struct {
	Status content.ContactStatus `json:"status"`
}

func (a *App) handleAdminMessageStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in contactStatusRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if !content.ValidContactStatus(in.Status) {
		a.writeError(w, r, apperr.ErrValidation)
		return
	}
	if err := a.Content.SetContactStatus(r.Context(), contentActor(r), id, in.Status); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/v1/admin/audit-logs
func (a *App) handleAdminAuditLogs(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.Audit.List(r.Context(), page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list, "meta": map[string]any{"page": page, "per_page": perPage, "total": total}})
}

// GET /api/v1/admin/reviews?course_id=&status=pending + POST /{id}/moderate
type moderateRequest struct {
	Approve bool `json:"approve"`
}

// GET /api/v1/admin/reviews?status=&page= — the moderation queue.
func (a *App) handleAdminReviewList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.CourseAdmin.ListReviews(r.Context(), r.URL.Query().Get("status"), page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data": list,
		"meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

func (a *App) handleAdminReviewModerate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in moderateRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if err := a.CourseAdmin.ModerateReview(r.Context(), adminActor(r), id, in.Approve); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
