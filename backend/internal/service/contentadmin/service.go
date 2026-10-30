// Package contentadmin implements admin use-cases for blog, pages, FAQs,
// testimonials, and the contact inbox — sanitized on write, audited in-TX.
package contentadmin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"

	courseSlug "golearn/backend/internal/domain/course"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/content"
	"golearn/backend/internal/ports"
)

type Deps struct {
	Posts        ports.BlogPostRepo
	Taxonomy     ports.TaxonomyRepo
	Pages        ports.PageRepo
	FAQs         ports.FAQRepo
	Testimonials ports.TestimonialRepo
	Contact      ports.ContactRepo
	Audit        ports.AuditRepo
	TX           ports.Transactor
	Sanitize     func(string) string
}

type Service struct{ d Deps }

func NewService(d Deps) *Service { return &Service{d: d} }

// Actor identifies the admin for audit rows.
type Actor struct {
	ID        uuid.UUID
	IP        string
	UserAgent string
}

func (s *Service) audit(ctx context.Context, actor Actor, action, entityType string, entityID string, after any) error {
	return s.d.Audit.Insert(ctx, &ports.AuditEntry{
		ID: uuid.Must(uuid.NewV7()), ActorID: &actor.ID, Action: action,
		EntityType: entityType, EntityID: &entityID,
		After: mustJSON(after), IP: actor.IP, UserAgent: actor.UserAgent,
	})
}

func mustJSON(v any) []byte {
	b, _ := jsonMarshal(v)
	return b
}

func jsonMarshal(v any) (b []byte, err error) { return json.Marshal(v) }

// PostInput is the admin payload; slug optional (derived from title).
type PostInput struct {
	Title           string
	Slug            string
	Excerpt         string
	BodyHTML        string
	CoverMediaID    *uuid.UUID
	CategoryID      *uuid.UUID
	MetaTitle       *string
	MetaDescription *string
	TagTitles       []string
	ReadingMinutes  int
}

func (s *Service) validatePost(in *PostInput) error {
	if len(in.Title) < 3 || len(in.Title) > 200 {
		return apperr.ErrValidation.Wrap(fmt.Errorf("title length"))
	}
	return nil
}

func (s *Service) uniquePostSlug(ctx context.Context, base string, exclude uuid.UUID) (string, error) {
	slug, err := courseSlug.NormalizeSlug(base)
	if err != nil {
		return "", apperr.ErrValidation.Wrap(err)
	}
	for i := 0; i < 20; i++ {
		candidate := slug
		if i > 0 {
			candidate = fmt.Sprintf("%s-%d", slug, i+1)
		}
		exists, err := s.d.Posts.SlugExists(ctx, candidate, exclude)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", apperr.ErrValidation.Wrap(fmt.Errorf("no unique slug"))
}

// CreatePost stores a draft post with tags.
func (s *Service) CreatePost(ctx context.Context, actor Actor, in PostInput, authorID uuid.UUID) (*content.BlogPost, error) {
	if err := s.validatePost(&in); err != nil {
		return nil, err
	}
	slug, err := s.uniquePostSlug(ctx, in.Slug, uuid.Nil)
	if err != nil {
		return nil, err
	}
	p := &content.BlogPost{
		ID: uuid.Must(uuid.NewV7()), Slug: slug, AuthorID: authorID,
		Title: in.Title, Excerpt: in.Excerpt, BodyHTML: s.d.Sanitize(in.BodyHTML),
		CoverMediaID: in.CoverMediaID, CategoryID: in.CategoryID,
		Status: content.PostDraft, ReadingMinutes: in.ReadingMinutes,
		MetaTitle: in.MetaTitle, MetaDescription: in.MetaDescription,
	}
	if err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Posts.Create(ctx, p); err != nil {
			return err
		}
		if err := s.setTags(ctx, p.ID, in.TagTitles); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.create", "blog_post", p.ID.String(), p)
	}); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) setTags(ctx context.Context, postID uuid.UUID, titles []string) error {
	ids := make([]uuid.UUID, 0, len(titles))
	for _, title := range titles {
		title = strings.TrimSpace(title)
		if title == "" {
			continue
		}
		tag, err := s.d.Taxonomy.EnsureTagByTitle(ctx, title)
		if err != nil {
			return err
		}
		ids = append(ids, tag.ID)
	}
	return s.d.Posts.SetTags(ctx, postID, ids)
}

// UpdatePost re-fetches, sanitizes, updates tags, audits.
func (s *Service) UpdatePost(ctx context.Context, actor Actor, id uuid.UUID, in PostInput) (*content.BlogPost, error) {
	if err := s.validatePost(&in); err != nil {
		return nil, err
	}
	p, err := s.d.Posts.ByID(ctx, id)
	if err != nil {
		if errorsIsNotFound(err) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	slug, err := s.uniquePostSlug(ctx, in.Slug, id)
	if err != nil {
		return nil, err
	}
	p.Slug = slug
	p.Title = in.Title
	p.Excerpt = in.Excerpt
	p.BodyHTML = s.d.Sanitize(in.BodyHTML)
	p.CoverMediaID = in.CoverMediaID
	p.CategoryID = in.CategoryID
	p.ReadingMinutes = in.ReadingMinutes
	p.MetaTitle = in.MetaTitle
	p.MetaDescription = in.MetaDescription

	if err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Posts.Update(ctx, p); err != nil {
			return err
		}
		if err := s.setTags(ctx, id, in.TagTitles); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.update", "blog_post", id.String(), p)
	}); err != nil {
		return nil, err
	}
	return p, nil
}

func errorsIsNotFound(err error) bool {
	return errors.Is(err, ports.ErrNotFound)
}

// DeletePost removes a post and audits.
func (s *Service) DeletePost(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Posts.Delete(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.delete", "blog_post", id.String(), nil)
	})
}

// PublishPost flips a post to published.
func (s *Service) PublishPost(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Posts.Publish(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.publish", "blog_post", id.String(), "published")
	})
}

// UnpublishPost returns a post to draft.
func (s *Service) UnpublishPost(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Posts.Unpublish(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.unpublish", "blog_post", id.String(), "draft")
	})
}
