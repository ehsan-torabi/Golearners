// Package content is the content-context domain: blog, pages, FAQs,
// testimonials, contact inbox (docs/03 §3 content).
package content

import (
	"time"

	"github.com/google/uuid"
)

// PostStatus is the blog post lifecycle.
type PostStatus string

// Post statuses.
const (
	PostDraft     PostStatus = "draft"
	PostPublished PostStatus = "published"
)

// ContactStatus is the contact inbox state.
type ContactStatus string

// Contact statuses.
const (
	ContactNew     ContactStatus = "new"
	ContactRead    ContactStatus = "read"
	ContactReplied ContactStatus = "replied"
)

// BlogPost is a blog article.
type BlogPost struct {
	ID              uuid.UUID
	Slug            string
	AuthorID        uuid.UUID
	Title           string
	Excerpt         string
	BodyHTML        string
	CoverMediaID    *uuid.UUID
	CategoryID      *uuid.UUID
	Status          PostStatus
	PublishedAt     *time.Time
	ReadingMinutes  int
	MetaTitle       *string
	MetaDescription *string
	OGImageMediaID  *uuid.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Taxonomy is a shared shape for blog categories and tags.
type Taxonomy struct {
	ID       uuid.UUID
	Slug     string
	Title    string
	Position int
}

// BlogCategory is a blog taxonomy term.
type BlogCategory struct {
	ID       uuid.UUID
	Slug     string
	Title    string
	Position int
}

// BlogTag is a blog tag.
type BlogTag struct {
	ID    uuid.UUID
	Slug  string
	Title string
}

// Page is an editable static page (about, privacy, ...).
type Page struct {
	ID              uuid.UUID `json:"id"`
	Slug            string    `json:"slug"`
	Title           string    `json:"title"`
	BodyHTML        string    `json:"body_html"`
	MetaTitle       *string   `json:"meta_title"`
	MetaDescription *string   `json:"meta_description"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// FAQ is a question/answer entry.
type FAQ struct {
	ID          uuid.UUID `json:"id"`
	Question    string    `json:"question"`
	Answer      string    `json:"answer"`
	Position    int       `json:"position"`
	IsPublished bool      `json:"is_published"`
}

// Testimonial is a displayed social proof quote.
type Testimonial struct {
	ID            uuid.UUID  `json:"id"`
	AuthorName    string     `json:"author_name"`
	AuthorRole    string     `json:"author_role"`
	Body          string     `json:"body"`
	Rating        *int       `json:"rating"`
	AvatarMediaID *uuid.UUID `json:"avatar_media_id"`
	Position      int        `json:"position"`
	IsPublished   bool       `json:"is_published"`
}

// ContactMessage is an inbox entry from the public contact form.
type ContactMessage struct {
	ID        uuid.UUID
	UserID    *uuid.UUID
	Name      string
	Contact   string
	Subject   string
	Body      string
	Status    ContactStatus
	CreatedAt time.Time
}
