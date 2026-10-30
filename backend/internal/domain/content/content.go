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
	ID              uuid.UUID
	Slug            string
	Title           string
	BodyHTML        string
	MetaTitle       *string
	MetaDescription *string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// FAQ is a question/answer entry.
type FAQ struct {
	ID          uuid.UUID
	Question    string
	Answer      string
	Position    int
	IsPublished bool
}

// Testimonial is a displayed social proof quote.
type Testimonial struct {
	ID            uuid.UUID
	AuthorName    string
	AuthorRole    string
	Body          string
	Rating        *int
	AvatarMediaID *uuid.UUID
	Position      int
	IsPublished   bool
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
