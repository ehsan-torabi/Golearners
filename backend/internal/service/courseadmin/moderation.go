// Review moderation and category CRUD (audited).
package courseadmin

import (
	"context"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
)

// ModeratReview approves or rejects a learner review.
func (s *Service) ModerateReview(ctx context.Context, actor Actor, reviewID uuid.UUID, approve bool) error {
	status := course.ReviewRejected
	if approve {
		status = course.ReviewApproved
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Reviews.SetStatus(ctx, reviewID, status); err != nil {
			return err
		}
		return s.audit(ctx, actor, "review.moderate", "review", reviewID.String(), nil, status)
	})
}

// PendingReviews lists unmoderated reviews (admin queue). Implemented via
// ports.ReviewRepo.ApprovedByCourse? No — dedicated listing below.
type CategoryInput struct {
	Title    string
	Position int
}

func (s *Service) CreateCategory(ctx context.Context, actor Actor, in CategoryInput) (*course.Category, error) {
	if len(in.Title) < 1 || len(in.Title) > 120 {
		return nil, apperr.ErrValidation
	}
	slug, err := course.NormalizeSlug(in.Title)
	if err != nil {
		return nil, apperr.ErrValidation.Wrap(err)
	}
	c := &course.Category{ID: uuid.Must(uuid.NewV7()), Slug: slug, Title: in.Title, Position: in.Position}
	if err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Categories.Create(ctx, c); err != nil {
			return err
		}
		return s.audit(ctx, actor, "category.create", "course_category", c.ID.String(), nil, c)
	}); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *Service) UpdateCategory(ctx context.Context, actor Actor, id uuid.UUID, in CategoryInput) error {
	if len(in.Title) < 1 || len(in.Title) > 120 {
		return apperr.ErrValidation
	}
	slug, err := course.NormalizeSlug(in.Title)
	if err != nil {
		return apperr.ErrValidation.Wrap(err)
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Categories.Update(ctx, &course.Category{ID: id, Slug: slug, Title: in.Title, Position: in.Position}); err != nil {
			return err
		}
		return s.audit(ctx, actor, "category.update", "course_category", id.String(), nil, in)
	})
}

func (s *Service) DeleteCategory(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Categories.Delete(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "category.delete", "course_category", id.String(), nil, nil)
	})
}
