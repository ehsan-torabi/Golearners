// Content-context repository interfaces (blog, pages, FAQs, testimonials,
// contact) plus the audit log sink and the transactor for same-TX audit writes.
package ports

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/content"
)

// AuditEntry is one admin-action record.
type AuditEntry struct {
	ID         uuid.UUID
	ActorID    *uuid.UUID
	Action     string
	EntityType string
	EntityID   *string
	Before     []byte // JSON or nil
	After      []byte
	IP         string
	UserAgent  string
	CreatedAt  time.Time
}

// AuditRepo is the append-only admin action sink.
type AuditRepo interface {
	Insert(ctx context.Context, e *AuditEntry) error
	List(ctx context.Context, page, perPage int) ([]*AuditEntry, int, error)
}

// Transactor runs fn inside one database transaction; the tx is carried in
// ctx so repositories join it (enables same-TX audit writes, docs/07 §3).
type Transactor interface {
	WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}

// BlogPostRepo — blog article persistence.
type BlogPostRepo interface {
	Create(ctx context.Context, p *content.BlogPost) error
	ByID(ctx context.Context, id uuid.UUID) (*content.BlogPost, error)
	BySlug(ctx context.Context, slug string) (*content.BlogPost, error)
	Update(ctx context.Context, p *content.BlogPost) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListPublished(ctx context.Context, categorySlug, tagSlug, q string, page, perPage int) ([]*content.BlogPost, int, error)
	ListAdmin(ctx context.Context, page, perPage int) ([]*content.BlogPost, int, error)
	// SlugExists checks slug uniqueness excluding excludeID.
	SlugExists(ctx context.Context, slug string, excludeID uuid.UUID) (bool, error)
	Publish(ctx context.Context, postID uuid.UUID) error
	Unpublish(ctx context.Context, postID uuid.UUID) error
	SetTags(ctx context.Context, postID uuid.UUID, tagIDs []uuid.UUID) error
	TagsOf(ctx context.Context, postID uuid.UUID) ([]*content.BlogTag, error)
	Related(ctx context.Context, postID uuid.UUID, limit int) ([]*content.BlogPost, error)
}

// TaxonomyRepo is shared by blog categories and tags (same table shape).
type TaxonomyRepo interface {
	CreateCategory(ctx context.Context, c *content.BlogCategory) error
	UpdateCategory(ctx context.Context, c *content.BlogCategory) error
	DeleteCategory(ctx context.Context, id uuid.UUID) error
	ListCategories(ctx context.Context) ([]*content.BlogCategory, error)
	CreateTag(ctx context.Context, t *content.BlogTag) error
	DeleteTag(ctx context.Context, id uuid.UUID) error
	ListTags(ctx context.Context) ([]*content.BlogTag, error)
	// EnsureTagByTitle creates-or-returns a tag by normalized title.
	EnsureTagByTitle(ctx context.Context, title string) (*content.BlogTag, error)
}

// PageRepo — editable static pages.
type PageRepo interface {
	Upsert(ctx context.Context, p *content.Page) error
	BySlug(ctx context.Context, slug string) (*content.Page, error)
	List(ctx context.Context) ([]*content.Page, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

// FAQRepo — question/answer entries.
type FAQRepo interface {
	Upsert(ctx context.Context, f *content.FAQ) error
	List(ctx context.Context, publishedOnly bool) ([]*content.FAQ, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

// TestimonialRepo — social proof quotes.
type TestimonialRepo interface {
	Upsert(ctx context.Context, t *content.Testimonial) error
	List(ctx context.Context, publishedOnly bool) ([]*content.Testimonial, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

// ContactRepo — public contact inbox.
type ContactRepo interface {
	Create(ctx context.Context, m *content.ContactMessage) error
	List(ctx context.Context, page, perPage int) ([]*content.ContactMessage, int, error)
	SetStatus(ctx context.Context, id uuid.UUID, s content.ContactStatus) error
}
