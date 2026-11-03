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
		"category_id":     p.CategoryID,
		"reading_minutes": p.ReadingMinutes, "published_at": p.PublishedAt,
		"meta_title": p.MetaTitle, "meta_description": p.MetaDescription,
	}
	if cat != nil {
		out["category"] = map[string]any{"slug": cat.Slug, "title": cat.Title}
	}
	return out
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

// GET /api/v1/blog/posts
func (a *App) handleBlogList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.Posts.ListPublished(r.Context(),
		r.URL.Query().Get("category"), r.URL.Query().Get("tag"), r.URL.Query().Get("q"), page, perPage)
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
