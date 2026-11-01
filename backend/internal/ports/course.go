// Package ports — course-context repository interfaces.
package ports

import (
	"context"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/course"
)

// CourseFilter shapes public/admin course lists.
type CourseFilter struct {
	CategorySlug  string
	Level         string
	Status        string // admin only: draft | published | archived
	Q             string
	Sort          string // newest | popular | price_asc | price_desc
	Page, PerPage int
}

// CourseRepo — catalog persistence.
type CourseRepo interface {
	Create(ctx context.Context, c *course.Course) error
	ByID(ctx context.Context, id uuid.UUID) (*course.Course, error)
	BySlug(ctx context.Context, slug string) (c *course.Course, err error)
	Update(ctx context.Context, c *course.Course) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	// ListPublished for the public catalog; ListAdmin includes drafts/archived.
	ListPublished(ctx context.Context, f CourseFilter) ([]*course.Course, int, error)
	ListAdmin(ctx context.Context, f CourseFilter) ([]*course.Course, int, error)
	// SlugExists reports whether a slug is taken (excluding excludeID).
	SlugExists(ctx context.Context, slug string, excludeID uuid.UUID) (bool, error)
	// Publish sets status=published + published_at atomically; requires a ready lesson (service checks).
	Publish(ctx context.Context, id uuid.UUID) error
	// Unpublish returns the course to draft.
	Unpublish(ctx context.Context, id uuid.UUID) error
	SetFeatured(ctx context.Context, id uuid.UUID, featured bool) error
}

// SectionRepo — curriculum sections.
type SectionRepo interface {
	Create(ctx context.Context, s *course.Section) error
	ByID(ctx context.Context, id uuid.UUID) (*course.Section, error)
	Update(ctx context.Context, s *course.Section) error
	Delete(ctx context.Context, id uuid.UUID) error
	// ListByCourse ordered by position.
	ListByCourse(ctx context.Context, courseID uuid.UUID) ([]*course.Section, error)
	// Reorder applies positions atomically.
	Reorder(ctx context.Context, courseID uuid.UUID, ids []uuid.UUID) error
}

// LessonRepo — curriculum lessons.
type LessonRepo interface {
	Create(ctx context.Context, l *course.Lesson) error
	ByID(ctx context.Context, id uuid.UUID) (*course.Lesson, error)
	Update(ctx context.Context, l *course.Lesson) error
	Delete(ctx context.Context, id uuid.UUID) error
	// ListByCourse returns every lesson of the course, ordered by section position.
	ListByCourse(ctx context.Context, courseID uuid.UUID) ([]*course.Lesson, error)
	// CountReady counts status='ready'|'published' lessons of a course.
	CountReady(ctx context.Context, courseID uuid.UUID) (int, error)
	Reorder(ctx context.Context, sectionID uuid.UUID, ids []uuid.UUID) error
}

// CategoryRepo — course categories.
type CategoryRepo interface {
	Create(ctx context.Context, c *course.Category) error
	ByID(ctx context.Context, id uuid.UUID) (*course.Category, error)
	BySlug(ctx context.Context, slug string) (*course.Category, error)
	Update(ctx context.Context, c *course.Category) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context) ([]*course.Category, error)
	// SetForCourse replaces the course's category links.
	SetForCourse(ctx context.Context, courseID uuid.UUID, categoryIDs []uuid.UUID) error
	// ForCourse lists categories of one course.
	ForCourse(ctx context.Context, courseID uuid.UUID) ([]*course.Category, error)
}

// ReviewRepo — moderated course reviews.
type ReviewRepo interface {
	Upsert(ctx context.Context, r *course.Review) error
	// ApprovedByCourse for public display.
	ApprovedByCourse(ctx context.Context, courseID uuid.UUID, page, perPage int) ([]*course.Review, int, error)
	SetStatus(ctx context.Context, id uuid.UUID, s course.ReviewStatus) error
	// SummaryFor returns (avg, count) of approved reviews.
	SummaryFor(ctx context.Context, courseID uuid.UUID) (float64, int, error)
}

// EntitlementRepo — access grants (commerce consumes this in phase 6).
type EntitlementRepo interface {
	HasActive(ctx context.Context, userID, courseID uuid.UUID) (bool, error)
	ListForUser(ctx context.Context, userID uuid.UUID) ([]*course.Entitlement, error)
	Grant(ctx context.Context, e *course.Entitlement) error
	// RevokeByOrder revokes entitlements created by an order (refunds).
	RevokeByOrder(ctx context.Context, orderID uuid.UUID) error
}

// MediaRepo — metadata + pipeline status for stored files.
type MediaRepo interface {
	Create(ctx context.Context, m *course.MediaAsset) error
	ByID(ctx context.Context, id uuid.UUID) (*course.MediaAsset, error)
	List(ctx context.Context, status string, page, perPage int) ([]*course.MediaAsset, int, error)
	Delete(ctx context.Context, id uuid.UUID) error
	SetStatus(ctx context.Context, id uuid.UUID, status course.MediaStatus, errMsg string) error
	SetIngested(ctx context.Context, id uuid.UUID, provider, remoteID string) error
}

// Entitlement is defined in the course domain to keep commerce decoupled.
type Entitlement = course.Entitlement

// InstructorRepo — the public teacher profile (Primary = the single v1 instructor).
type InstructorRepo interface {
	Primary(ctx context.Context) (*course.Instructor, error)
	Upsert(ctx context.Context, i *course.Instructor) error
}

// ProgressRepo — watch position + completion tracking.
type ProgressRepo interface {
	// Upsert stores position; completedAt optional.
	Upsert(ctx context.Context, p *course.LessonProgress) error
	ForCourse(ctx context.Context, userID, courseID uuid.UUID) ([]*course.LessonProgress, error)
	ForLesson(ctx context.Context, userID, lessonID uuid.UUID) (*course.LessonProgress, error)
}
