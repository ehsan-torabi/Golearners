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
	Series       ports.SeriesRepo
	Comments     ports.CommentRepo
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
	Title           string     `json:"title"`
	Slug            string     `json:"slug"`
	Excerpt         string     `json:"excerpt"`
	BodyHTML        string     `json:"body_html"`
	CoverMediaID    *uuid.UUID `json:"cover_media_id"`
	CategoryID      *uuid.UUID `json:"category_id"`
	SeriesID        *uuid.UUID `json:"series_id"`
	SeriesPart      *int       `json:"series_part"`
	Featured        bool       `json:"featured"`
	OGImageMediaID  *uuid.UUID `json:"og_image_media_id"`
	MetaTitle       *string    `json:"meta_title"`
	MetaDescription *string    `json:"meta_description"`
	TagTitles       []string   `json:"tag_titles"`
	ReadingMinutes  int        `json:"reading_minutes"`
}

// estimateReadingMinutes approximates reading time (~150 wpm) when the
// admin left the field blank; HTML tags and whitespace are ignored.
func estimateReadingMinutes(html string) int {
	words, inTag := 0, false
	prevSpace := true
	for _, r := range html {
		switch {
		case r == '<':
			inTag = true
		case r == '>':
			inTag = false
			prevSpace = true
		case inTag:
		case r == ' ' || r == '\t' || r == '\n' || r == '\r':
			prevSpace = true
		default:
			if prevSpace {
				words++
			}
			prevSpace = false
		}
	}
	minutes := (words + 149) / 150
	if minutes < 1 {
		minutes = 1
	}
	return minutes
}

// applyPostInput copies the editable fields onto an existing post row,
// resolving the optional series reference and auto reading time.
func (s *Service) applyPostInput(ctx context.Context, p *content.BlogPost, in *PostInput) error {
	if in.SeriesID != nil && *in.SeriesID != uuid.Nil {
		if _, err := s.d.Series.ByID(ctx, *in.SeriesID); err != nil {
			if errorsIsNotFound(err) {
				return apperr.ErrValidation.Wrap(err)
			}
			return err
		}
		p.SeriesID = in.SeriesID
		p.SeriesPart = in.SeriesPart
	} else {
		p.SeriesID = nil
		p.SeriesPart = nil
	}
	p.Featured = in.Featured
	p.OGImageMediaID = in.OGImageMediaID
	p.ReadingMinutes = in.ReadingMinutes
	if p.ReadingMinutes <= 0 {
		p.ReadingMinutes = estimateReadingMinutes(p.BodyHTML)
	}
	return nil
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
	if err := s.applyPostInput(ctx, p, &in); err != nil {
		return nil, err
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
	p.MetaTitle = in.MetaTitle
	p.MetaDescription = in.MetaDescription
	if err := s.applyPostInput(ctx, p, &in); err != nil {
		return nil, err
	}

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

// --- Blog series -----------------------------------------------------------

// SeriesInput is the admin payload; slug optional (derived from title).
type SeriesInput struct {
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
}

func (s *Service) uniqueSeriesSlug(ctx context.Context, base string, exclude uuid.UUID) (string, error) {
	if strings.TrimSpace(base) == "" {
		base = "series"
	}
	slug, err := courseSlug.NormalizeSlug(base)
	if err != nil {
		return "", apperr.ErrValidation.Wrap(err)
	}
	for i := 0; i < 20; i++ {
		candidate := slug
		if i > 0 {
			candidate = fmt.Sprintf("%s-%d", slug, i+1)
		}
		exists, err := s.d.Series.SlugExists(ctx, candidate, exclude)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", apperr.ErrValidation.Wrap(fmt.Errorf("no unique series slug"))
}

// CreateSeries stores a new article series.
func (s *Service) CreateSeries(ctx context.Context, actor Actor, in SeriesInput) (*content.BlogSeries, error) {
	if len(in.Title) < 3 || len(in.Title) > 200 {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("series title length"))
	}
	slug, err := s.uniqueSeriesSlug(ctx, in.Slug, uuid.Nil)
	if err != nil {
		return nil, err
	}
	ser := &content.BlogSeries{ID: uuid.Must(uuid.NewV7()), Slug: slug,
		Title: in.Title, Description: in.Description}
	if err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Series.Create(ctx, ser); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.series.create", "blog_series", ser.ID.String(), ser)
	}); err != nil {
		return nil, err
	}
	return ser, nil
}

// UpdateSeries rewrites slug/title/description and audits.
func (s *Service) UpdateSeries(ctx context.Context, actor Actor, id uuid.UUID, in SeriesInput) (*content.BlogSeries, error) {
	if len(in.Title) < 3 || len(in.Title) > 200 {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("series title length"))
	}
	ser, err := s.d.Series.ByID(ctx, id)
	if err != nil {
		if errorsIsNotFound(err) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	slug, err := s.uniqueSeriesSlug(ctx, in.Slug, id)
	if err != nil {
		return nil, err
	}
	ser.Slug, ser.Title, ser.Description = slug, in.Title, in.Description
	if err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Series.Update(ctx, ser); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.series.update", "blog_series", id.String(), ser)
	}); err != nil {
		return nil, err
	}
	return ser, nil
}

// DeleteSeries refuses while posts still reference the series.
func (s *Service) DeleteSeries(ctx context.Context, actor Actor, id uuid.UUID) error {
	n, err := s.d.Series.PostsCount(ctx, id)
	if err != nil {
		return err
	}
	if n > 0 {
		return apperr.ErrValidation.Wrap(fmt.Errorf("series has %d posts", n))
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Series.Delete(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.series.delete", "blog_series", id.String(), nil)
	})
}

// --- Comments --------------------------------------------------------------

// CreateComment stores a guest comment as pending for moderation.
func (s *Service) CreateComment(ctx context.Context, postID uuid.UUID, parentID *uuid.UUID, name, email, body string) (*content.BlogComment, error) {
	if len([]rune(name)) < 2 || len([]rune(name)) > 80 {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("comment name length"))
	}
	if !strings.Contains(email, "@") || len([]rune(email)) > 200 {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("comment email"))
	}
	if len([]rune(body)) < 5 || len([]rune(body)) > 4000 {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("comment body length"))
	}
	if parentID != nil {
		parent, err := s.d.Comments.ByID(ctx, *parentID)
		if err != nil {
			return nil, apperr.ErrNotFound
		}
		if parent.PostID != postID || parent.ParentID != nil {
			return nil, apperr.ErrValidation.Wrap(fmt.Errorf("bad parent"))
		}
	}
	c := &content.BlogComment{ID: uuid.Must(uuid.NewV7()), PostID: postID, ParentID: parentID,
		AuthorName: name, AuthorEmail: email, Body: body, Status: content.CommentPending}
	if err := s.d.Comments.Create(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

// ApproveComment publishes a pending comment (audited).
func (s *Service) ApproveComment(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Comments.Approve(ctx, id, actor.ID); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.comment.approve", "blog_comment", id.String(), "approved")
	})
}

// MarkCommentSpam hides a comment as spam (audited).
func (s *Service) MarkCommentSpam(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Comments.SetStatus(ctx, id, content.CommentSpam); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.comment.spam", "blog_comment", id.String(), "spam")
	})
}

// UnapproveComment returns an approved comment to the pending queue (audited).
func (s *Service) UnapproveComment(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Comments.SetStatus(ctx, id, content.CommentPending); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.comment.unapprove", "blog_comment", id.String(), "pending")
	})
}

// DeleteComment removes a comment (audited).
func (s *Service) DeleteComment(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Comments.Delete(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "blog.comment.delete", "blog_comment", id.String(), nil)
	})
}
