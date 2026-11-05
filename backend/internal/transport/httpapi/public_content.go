// Public content handlers: blog, pages, FAQs, testimonials, contact form.
package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/content"
	"golearn/backend/internal/ports"
)

// postJSON renders a post; cat (optional) attaches the category title/slug so
// the blog cards and the post header can name it without a second request.
func postJSON(p *content.BlogPost, cat *content.BlogCategory) map[string]any {
	out := map[string]any{
		"id": p.ID, "slug": p.Slug, "title": p.Title, "excerpt": p.Excerpt,
		"status": p.Status, "cover_media_id": p.CoverMediaID, "cover_url": mediaRef(p.CoverMediaID),
		"og_image_url": mediaRef(ogImageRef(p)),
		"category_id":     p.CategoryID,
		"series_id":       p.SeriesID, "series_part": p.SeriesPart,
		"featured": p.Featured, "views": p.Views, "author_id": p.AuthorID,
		"reading_minutes": p.ReadingMinutes, "published_at": p.PublishedAt,
		"meta_title": p.MetaTitle, "meta_description": p.MetaDescription,
	}
	if cat != nil {
		out["category"] = map[string]any{"slug": cat.Slug, "title": cat.Title}
	}
	return out
}

// ogImageRef falls back to the cover when no dedicated OG image is set.
func ogImageRef(p *content.BlogPost) *uuid.UUID {
	if p.OGImageMediaID != nil {
		return p.OGImageMediaID
	}
	return p.CoverMediaID
}

// blogCategoryMap resolves category ids to their taxonomy rows once per request.
func (a *App) blogCategoryMap(r *http.Request) map[uuid.UUID]*content.BlogCategory {
	cats, err := a.Taxonomy.ListCategories(r.Context())
	if err != nil {
		return nil
	}
	m := make(map[uuid.UUID]*content.BlogCategory, len(cats))
	for _, c := range cats {
		m[c.ID] = c
	}
	return m
}

// GET /api/v1/blog/posts (category, tag, q, author, featured, sort=newest|popular|random)
func (a *App) handleBlogList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	q := r.URL.Query()
	list, total, err := a.Posts.ListPublic(r.Context(), ports.PublicPostFilter{
		CategorySlug: q.Get("category"), TagSlug: q.Get("tag"), Q: q.Get("q"),
		AuthorID: q.Get("author"), FeaturedOnly: q.Get("featured") == "1",
		Sort: q.Get("sort"), Page: page, PerPage: perPage,
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	catMap := a.blogCategoryMap(r)
	for _, p := range list {
		items = append(items, postJSON(p, catMap[derefCategoryID(p.CategoryID)]))
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data": items,
		"meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

// derefCategoryID turns an optional category id into a map key (nil → zero).
func derefCategoryID(id *uuid.UUID) uuid.UUID {
	if id == nil {
		return uuid.Nil
	}
	return *id
}

// GET /api/v1/blog/posts/{slug}
func (a *App) handleBlogDetail(w http.ResponseWriter, r *http.Request) {
	p, err := a.Posts.BySlug(r.Context(), chiSlug(r))
	if err != nil || p.Status != content.PostPublished {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	tags, _ := a.Posts.TagsOf(r.Context(), p.ID)
	related, _ := a.Posts.Related(r.Context(), p.ID, 4)
	tagOut := make([]map[string]any, 0, len(tags))
	for _, t := range tags {
		tagOut = append(tagOut, map[string]any{"slug": t.Slug, "title": t.Title})
	}
	catMap := a.blogCategoryMap(r)
	relOut := make([]map[string]any, 0, len(related))
	for _, rel := range related {
		relOut = append(relOut, postJSON(rel, catMap[derefCategoryID(rel.CategoryID)]))
	}
	out := postJSON(p, catMap[derefCategoryID(p.CategoryID)])
	out["body_html"] = p.BodyHTML
	out["tags"] = tagOut
	out["related"] = relOut
	if p.SeriesID != nil {
		if ser, err := a.Series.ByID(r.Context(), *p.SeriesID); err == nil {
			parts, _ := a.Posts.BySeries(r.Context(), ser.ID)
			partsOut := make([]map[string]any, 0, len(parts))
			prev, next := "", ""
			for i, part := range parts {
				if part.Slug == p.Slug {
					if i > 0 {
						prev = parts[i-1].Slug
					}
					if i+1 < len(parts) {
						next = parts[i+1].Slug
					}
				}
				partsOut = append(partsOut, map[string]any{
					"slug": part.Slug, "title": part.Title, "series_part": part.SeriesPart,
				})
			}
			out["series"] = map[string]any{
				"slug": ser.Slug, "title": ser.Title, "parts": partsOut,
				"prev": prev, "next": next,
			}
		}
	}
	if author, err := a.Users.ByID(r.Context(), p.AuthorID); err == nil && author != nil {
		out["author"] = map[string]any{"id": author.ID, "name": author.FullName}
	}
	writeJSON(w, http.StatusOK, out)
}

// GET /api/v1/blog/categories + /blog/tags
func (a *App) handleBlogCategories(w http.ResponseWriter, r *http.Request) {
	list, err := a.Taxonomy.ListCategories(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

func (a *App) handleBlogTags(w http.ResponseWriter, r *http.Request) {
	list, err := a.Taxonomy.ListTags(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

// GET /api/v1/blog/series
func (a *App) handleBlogSeries(w http.ResponseWriter, r *http.Request) {
	list, err := a.Series.List(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

// seriesParts renders published parts for a series detail payload.
func (a *App) seriesParts(r *http.Request, seriesID uuid.UUID) []map[string]any {
	parts, _ := a.Posts.BySeries(r.Context(), seriesID)
	catMap := a.blogCategoryMap(r)
	out := make([]map[string]any, 0, len(parts))
	for _, p := range parts {
		item := postJSON(p, catMap[derefCategoryID(p.CategoryID)])
		item["series_part"] = p.SeriesPart
		out = append(out, item)
	}
	return out
}

// GET /api/v1/blog/series/{slug}
func (a *App) handleBlogSeriesDetail(w http.ResponseWriter, r *http.Request) {
	ser, err := a.Series.BySlug(r.Context(), chiSlug(r))
	if err != nil {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"id": ser.ID, "slug": ser.Slug, "title": ser.Title,
		"description": ser.Description, "parts": a.seriesParts(r, ser.ID),
	})
}

// POST /api/v1/blog/posts/{slug}/view — fire-and-forget beacon (rate-limited).
func (a *App) handleBlogView(w http.ResponseWriter, r *http.Request) {
	p, err := a.Posts.BySlug(r.Context(), chiSlug(r))
	if err != nil || p.Status != content.PostPublished {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	if err := a.Posts.IncrViews(r.Context(), p.ID); err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type commentRequest struct {
	AuthorName string     `json:"author_name"`
	Email      string     `json:"email"`
	Body       string     `json:"body"`
	ParentID   *uuid.UUID `json:"parent_id"`
	Website    string     `json:"website"` // honeypot — humans never see it
}

// GET /api/v1/blog/posts/{slug}/comments — approved only, one reply level.
func (a *App) handleCommentList(w http.ResponseWriter, r *http.Request) {
	p, err := a.Posts.BySlug(r.Context(), chiSlug(r))
	if err != nil || p.Status != content.PostPublished {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	list, err := a.Comments.ListApprovedByPost(r.Context(), p.ID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	render := func(c *content.BlogComment) map[string]any {
		return map[string]any{"id": c.ID, "author_name": c.AuthorName,
			"body": c.Body, "created_at": c.CreatedAt, "replies": []map[string]any{}}
	}
	roots := make([]*content.BlogComment, 0)
	kids := map[uuid.UUID][]*content.BlogComment{}
	for _, c := range list {
		if c.ParentID == nil {
			roots = append(roots, c)
			continue
		}
		kids[*c.ParentID] = append(kids[*c.ParentID], c)
	}
	out := make([]map[string]any, 0, len(roots))
	for _, c := range roots {
		row := render(c)
		for _, k := range kids[c.ID] {
			row["replies"] = append(row["replies"].([]map[string]any), render(k))
		}
		out = append(out, row)
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": out})
}

// POST /api/v1/blog/posts/{slug}/comments — guest comment, pending moderation.
func (a *App) handleCommentCreate(w http.ResponseWriter, r *http.Request) {
	p, err := a.Posts.BySlug(r.Context(), chiSlug(r))
	if err != nil || p.Status != content.PostPublished {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	var in commentRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if in.Website != "" { // honeypot: pretend success, store nothing
		writeJSON(w, http.StatusAccepted, map[string]any{"queued": true})
		return
	}
	if _, err := a.Content.CreateComment(r.Context(), p.ID, in.ParentID, in.AuthorName, in.Email, in.Body); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"queued": true})
}

// GET /api/v1/pages/{slug}
func (a *App) handlePage(w http.ResponseWriter, r *http.Request) {
	p, err := a.Pages.BySlug(r.Context(), chiSlug(r))
	if err != nil {
		a.writeError(w, r, apperr.ErrNotFound)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"id": p.ID, "slug": p.Slug, "title": p.Title, "body_html": p.BodyHTML,
		"meta_title": p.MetaTitle, "meta_description": p.MetaDescription,
	})
}

// GET /api/v1/faqs
func (a *App) handleFAQs(w http.ResponseWriter, r *http.Request) {
	list, err := a.FAQs.List(r.Context(), true)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

// GET /api/v1/testimonials
func (a *App) handleTestimonials(w http.ResponseWriter, r *http.Request) {
	list, err := a.Testimonials.List(r.Context(), true)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

type contactRequest struct {
	Name    string `json:"name"`
	Contact string `json:"contact"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
	Website string `json:"website"` // honeypot — bots fill it, humans never see it
}

// POST /api/v1/contact — rate-limited at the router; honeypot field "website".
func (a *App) handleContact(w http.ResponseWriter, r *http.Request) {
	var in contactRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if in.Website != "" { // honeypot: pretend success, store nothing
		writeJSON(w, http.StatusOK, map[string]any{"received": true})
		return
	}
	if len(in.Name) < 2 || len(in.Contact) < 5 || len(in.Body) < 10 {
		a.writeError(w, r, apperr.ErrValidation)
		return
	}
	m := &content.ContactMessage{
		ID: uuid.Must(uuid.NewV7()), Name: in.Name, Contact: in.Contact,
		Subject: in.Subject, Body: in.Body, Status: content.ContactNew,
	}
	if actor, ok := actorFrom(r.Context()); ok {
		m.UserID = &actor.ID
	}
	if err := a.Contacts.Create(r.Context(), m); err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"received": true})
}

func chiSlug(r *http.Request) string { return chi.URLParam(r, "slug") }

var _ = ports.ErrNotFound
