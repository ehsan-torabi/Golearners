// Package catalog implements the public read use-cases: course list/detail,
// categories, instructor profile, and moderated reviews.
package catalog

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

type Deps struct {
	Courses      ports.CourseRepo
	Sections     ports.SectionRepo
	Lessons      ports.LessonRepo
	Categories   ports.CategoryRepo
	Reviews      ports.ReviewRepo
	Entitlements ports.EntitlementRepo
	Instructors  ports.InstructorRepo
}

type Service struct{ d Deps }

func NewService(d Deps) *Service { return &Service{d: d} }

func (s *Service) ListCourses(ctx context.Context, f ports.CourseFilter) ([]*course.Course, int, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PerPage < 1 || f.PerPage > 100 {
		f.PerPage = 20
	}
	return s.d.Courses.ListPublished(ctx, f)
}

// CourseDetail bundles everything the course page renders.
type CourseDetail struct {
	Course        *course.Course
	Sections      []*course.Section
	Lessons       []*course.Lesson // grouped by SectionID at the client
	RatingAvg     float64
	RatingCount   int
	OwnedByViewer bool
}

func (s *Service) CourseDetail(ctx context.Context, slug string, viewerID *uuid.UUID) (*CourseDetail, error) {
	c, err := s.d.Courses.BySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	if c.Status != course.StatusPublished {
		return nil, apperr.ErrNotFound // drafts are invisible publicly
	}
	d := &CourseDetail{Course: c}
	if d.Sections, err = s.d.Sections.ListByCourse(ctx, c.ID); err != nil {
		return nil, err
	}
	if d.Lessons, err = s.d.Lessons.ListByCourse(ctx, c.ID); err != nil {
		return nil, err
	}
	if d.RatingAvg, d.RatingCount, err = s.d.Reviews.SummaryFor(ctx, c.ID); err != nil {
		return nil, err
	}
	if viewerID != nil {
		if d.OwnedByViewer, err = s.d.Entitlements.HasActive(ctx, *viewerID, c.ID); err != nil {
			return nil, err
		}
	}
	return d, nil
}

func (s *Service) Categories(ctx context.Context) ([]*course.Category, error) {
	return s.d.Categories.List(ctx)
}

// InstructorProfile is the public about-the-teacher payload.
type InstructorProfile struct {
	UserID        uuid.UUID         `json:"user_id"`
	Headline      string            `json:"headline"`
	BioHTML       string            `json:"bio_html"`
	AvatarMediaID *uuid.UUID        `json:"avatar_media_id"`
	Socials       map[string]string `json:"socials"`
}

func (s *Service) InstructorProfile(ctx context.Context) (*InstructorProfile, error) {
	p, err := s.d.Instructors.Primary(ctx)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	return &InstructorProfile{
		UserID: p.UserID, Headline: p.Headline, BioHTML: p.BioHTML,
		AvatarMediaID: p.AvatarMediaID, Socials: p.Socials,
	}, nil
}

// ReviewsFor returns approved reviews of a course.
func (s *Service) ReviewsFor(ctx context.Context, courseSlug string, page, perPage int) ([]*course.Review, int, error) {
	c, err := s.d.Courses.BySlug(ctx, courseSlug)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, 0, apperr.ErrNotFound
		}
		return nil, 0, err
	}
	return s.d.Reviews.ApprovedByCourse(ctx, c.ID, page, perPage)
}

// SubmitReview upserts the caller's review (entitlement required).
func (s *Service) SubmitReview(ctx context.Context, userID uuid.UUID, courseSlug string, rating int, body string) error {
	if rating < 1 || rating > 5 {
		return apperr.ErrValidation.Wrap(fmt.Errorf("rating %d out of range", rating))
	}
	c, err := s.d.Courses.BySlug(ctx, courseSlug)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return apperr.ErrNotFound
		}
		return err
	}
	ok, err := s.d.Entitlements.HasActive(ctx, userID, c.ID)
	if err != nil {
		return err
	}
	if !ok {
		return apperr.ErrForbidden.Wrap(fmt.Errorf("review requires entitlement"))
	}
	return s.d.Reviews.Upsert(ctx, &course.Review{
		ID: uuid.Must(uuid.NewV7()), CourseID: c.ID, UserID: userID,
		Rating: rating, Body: body, Status: course.ReviewPending,
	})
}
