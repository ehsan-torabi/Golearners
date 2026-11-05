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

// PostFilter shapes the admin blog list.
type PostFilter struct {
	Q          string // title/slug substring
	Status     string // draft | published
	CategoryID string
	TagSlug    string
	Sort       string // newest | oldest | title
	Page       int
	PerPage    int
}

// PublicPostFilter shapes the public blog list (widgets included).
type PublicPostFilter struct {
	CategorySlug string
	TagSlug      string
	Q            string
	AuthorID     string // author user id
	FeaturedOnly bool
	Sort         string // "" newest | popular | random
	Page         int
	PerPage      int
}

// BlogPostRepo — blog article persistence.
type BlogPostRepo interface {
	Create(ctx context.Context, p *content.BlogPost) error
	ByID(ctx context.Context, id uuid.UUID) (*content.BlogPost, error)
	BySlug(ctx context.Context, slug string) (*content.BlogPost, error)
	Update(ctx context.Context, p *content.BlogPost) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListPublic(ctx context.Context, f PublicPostFilter) ([]*content.BlogPost, int, error)
	ListAdmin(ctx context.Context, f PostFilter) ([]*content.BlogPost, int, error)
	// BySeries lists published parts of a series, ordered by part then date.
	BySeries(ctx context.Context, seriesID uuid.UUID) ([]*content.BlogPost, error)
	// IncrViews bumps the view counter once (public beacon).
	IncrViews(ctx context.Context, postID uuid.UUID) error
	// SlugExists checks slug uniqueness excluding excludeID.
	SlugExists(ctx context.Context, slug string, excludeID uuid.UUID) (bool, error)
	Publish(ctx context.Context, postID uuid.UUID) error
	Unpublish(ctx context.Context, postID uuid.UUID) error
	SetTags(ctx context.Context, postID uuid.UUID, tagIDs []uuid.UUID) error
	TagsOf(ctx context.Context, postID uuid.UUID) ([]*content.BlogTag, error)
	Related(ctx context.Context, postID uuid.UUID, limit int) ([]*content.BlogPost, error)
}

// SeriesRepo — multi-part blog series.
type SeriesRepo interface {
	Create(ctx context.Context, s *content.BlogSeries) error
	Update(ctx context.Context, s *content.BlogSeries) error
	Delete(ctx context.Context, id uuid.UUID) error
	ByID(ctx context.Context, id uuid.UUID) (*content.BlogSeries, error)
	BySlug(ctx context.Context, slug string) (*content.BlogSeries, error)
	List(ctx context.Context) ([]*content.BlogSeries, error)
	SlugExists(ctx context.Context, slug string, excludeID uuid.UUID) (bool, error)
	// PostsCount reports how many posts (any status) use the series.
	PostsCount(ctx context.Context, id uuid.UUID) (int, error)
}

// CommentFilter shapes the admin moderation list.
type CommentFilter struct {
	Status  string
	PostID  string
	Q       string
	Page    int
	PerPage int
}

// CommentRepo — guest comment persistence and moderation.
type CommentRepo interface {
	Create(ctx context.Context, c *content.BlogComment) error
	ByID(ctx context.Context, id uuid.UUID) (*content.BlogComment, error)
	ListApprovedByPost(ctx context.Context, postID uuid.UUID) ([]*content.BlogComment, error)
	ListAdmin(ctx context.Context, f CommentFilter) ([]*content.CommentRow, int, error)
	// CountByStatus returns pending/approved/spam totals for badges.
	CountByStatus(ctx context.Context) (map[string]int, error)
	Approve(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error
	SetStatus(ctx context.Context, id uuid.UUID, s content.CommentStatus) error
	Delete(ctx context.Context, id uuid.UUID) error
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
	List(ctx context.Context, status string, page, perPage int) ([]*content.ContactMessage, int, error)
	SetStatus(ctx context.Context, id uuid.UUID, s content.ContactStatus) error
}
