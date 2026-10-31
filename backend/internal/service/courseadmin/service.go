// Package courseadmin implements admin course use-cases with sanitization on
// write and same-transaction audit entries (docs/07 §3, docs/08 §5).
package courseadmin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

type Deps struct {
	Courses    ports.CourseRepo
	Sections   ports.SectionRepo
	Lessons    ports.LessonRepo
	Categories ports.CategoryRepo
	Reviews    ports.ReviewRepo
	Audit      ports.AuditRepo
	TX         ports.Transactor
	Sanitize   func(string) string
}

type Service struct{ d Deps }

func NewService(d Deps) *Service { return &Service{d: d} }

// Actor is the admin performing the action (for audit rows).
type Actor struct {
	ID        uuid.UUID
	IP        string
	UserAgent string
}

// CourseInput is the full admin payload (PUT-style; partial updates later).
type CourseInput struct {
	Title              string       `json:"title"`
	Slug               string       `json:"slug"`
	Summary            string       `json:"summary"`
	DescriptionHTML    string       `json:"description_html"`
	Level              course.Level `json:"level"`
	PriceRial          int64        `json:"price_rial"`
	CompareAtPriceRial *int64       `json:"compare_at_price_rial"`
	PrerequisitesHTML  string       `json:"prerequisites_html"`
	Outcomes           []string     `json:"outcomes"`
	MetaTitle          *string      `json:"meta_title"`
	MetaDescription    *string      `json:"meta_description"`
	CoverMediaID       *uuid.UUID   `json:"cover_media_id"`
	PromoVideoMediaID  *uuid.UUID   `json:"promo_video_media_id"`
	IsFeatured         bool         `json:"is_featured"`
	CategoryIDs        []uuid.UUID  `json:"category_ids"`
}

func (s *Service) validateCourse(in *CourseInput) error {
	if len(in.Title) < 3 || len(in.Title) > 200 {
		return apperr.ErrValidation.Wrap(fmt.Errorf("title length %d", len(in.Title)))
	}
	switch in.Level {
	case course.LevelBeginner, course.LevelIntermediate, course.LevelAdvanced:
	default:
		return apperr.ErrValidation.Wrap(fmt.Errorf("level %q", in.Level))
	}
	if in.PriceRial < 0 {
		return apperr.ErrValidation.Wrap(fmt.Errorf("negative price"))
	}
	return nil
}

// uniqueSlug normalizes and suffixes until free (max 20 tries).
func (s *Service) uniqueSlug(ctx context.Context, base string, exclude uuid.UUID) (string, error) {
	slug, err := course.NormalizeSlug(base)
	if err != nil {
		return "", apperr.ErrValidation.Wrap(err)
	}
	for i := 0; i < 20; i++ {
		candidate := slug
		if i > 0 {
			candidate = fmt.Sprintf("%s-%d", slug, i+1)
		}
		exists, err := s.d.Courses.SlugExists(ctx, candidate, exclude)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", apperr.ErrValidation.Wrap(fmt.Errorf("could not derive unique slug"))
}

func (s *Service) audit(ctx context.Context, actor Actor, action, entityType string, entityID string, before, after any) error {
	return s.d.Audit.Insert(ctx, &ports.AuditEntry{
		ID: uuid.Must(uuid.NewV7()), ActorID: &actor.ID, Action: action,
		EntityType: entityType, EntityID: &entityID,
		Before: mustJSON(before), After: mustJSON(after),
		IP: actor.IP, UserAgent: actor.UserAgent,
	})
}

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

// CreateCourse validates, sanitizes, persists, links categories, and audits.
func (s *Service) CreateCourse(ctx context.Context, actor Actor, in CourseInput, instructorID uuid.UUID) (*course.Course, error) {
	if err := s.validateCourse(&in); err != nil {
		return nil, err
	}
	slug, err := s.uniqueSlug(ctx, in.Slug, uuid.Nil)
	if err != nil {
		return nil, err
	}
	if in.Outcomes == nil {
		in.Outcomes = []string{}
	}
	c := &course.Course{
		ID: uuid.Must(uuid.NewV7()), Slug: slug, InstructorID: instructorID,
		Title: in.Title, Summary: in.Summary,
		DescriptionHTML:    s.d.Sanitize(in.DescriptionHTML),
		Level:              in.Level,
		Status:             course.StatusDraft,
		PriceRial:          in.PriceRial,
		CompareAtPriceRial: in.CompareAtPriceRial,
		IsFeatured:         in.IsFeatured,
		PrerequisitesHTML:  s.d.Sanitize(in.PrerequisitesHTML),
		Outcomes:           in.Outcomes,
		MetaTitle:          in.MetaTitle,
		MetaDescription:    in.MetaDescription,
		CoverMediaID:       in.CoverMediaID,
		PromoVideoMediaID:  in.PromoVideoMediaID,
	}
	err = s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Courses.Create(ctx, c); err != nil {
			return err
		}
		if err := s.d.Categories.SetForCourse(ctx, c.ID, in.CategoryIDs); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.create", "course", c.ID.String(), nil, c)
	})
	if err != nil {
		return nil, err
	}
	return c, nil
}

// UpdateCourse re-fetches, sanitizes, updates, re-links categories, audits before/after.
func (s *Service) UpdateCourse(ctx context.Context, actor Actor, id uuid.UUID, in CourseInput) (*course.Course, error) {
	if err := s.validateCourse(&in); err != nil {
		return nil, err
	}
	old, err := s.d.Courses.ByID(ctx, id)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	slug, err := s.uniqueSlug(ctx, in.Slug, id)
	if err != nil {
		return nil, err
	}
	before := *old // audit copy carries the original slug
	old.Slug = slug
	old.Title = in.Title
	old.Summary = in.Summary
	old.DescriptionHTML = s.d.Sanitize(in.DescriptionHTML)
	old.Level = in.Level
	old.PriceRial = in.PriceRial
	old.CompareAtPriceRial = in.CompareAtPriceRial
	old.IsFeatured = in.IsFeatured
	old.PrerequisitesHTML = s.d.Sanitize(in.PrerequisitesHTML)
	if in.Outcomes == nil {
		in.Outcomes = []string{}
	}
	old.Outcomes = in.Outcomes
	old.MetaTitle = in.MetaTitle
	old.MetaDescription = in.MetaDescription
	old.CoverMediaID = in.CoverMediaID
	old.PromoVideoMediaID = in.PromoVideoMediaID

	err = s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Courses.Update(ctx, old); err != nil {
			return err
		}
		if err := s.d.Categories.SetForCourse(ctx, id, in.CategoryIDs); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.update", "course", id.String(), &before, old)
	})
	if err != nil {
		return nil, err
	}
	return old, nil
}

// DeleteCourse soft-deletes and audits. Sold entitlements are untouched.
func (s *Service) DeleteCourse(ctx context.Context, actor Actor, id uuid.UUID) error {
	c, err := s.d.Courses.ByID(ctx, id)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return apperr.ErrNotFound
		}
		return err
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Courses.SoftDelete(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.delete", "course", id.String(), c, nil)
	})
}

// PublishCourse requires at least one ready lesson (docs/03 invariant 6).
func (s *Service) PublishCourse(ctx context.Context, actor Actor, id uuid.UUID) error {
	c, err := s.d.Courses.ByID(ctx, id)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return apperr.ErrNotFound
		}
		return err
	}
	ready, err := s.d.Lessons.CountReady(ctx, id)
	if err != nil {
		return err
	}
	if ready == 0 {
		return apperr.ErrValidation.Wrap(fmt.Errorf("publish requires at least one ready lesson"))
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Courses.Publish(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.publish", "course", id.String(), c.Status, course.StatusPublished)
	})
}

func (s *Service) UnpublishCourse(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Courses.Unpublish(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.unpublish", "course", id.String(), nil, "draft")
	})
}
