// Learning-context ports: progress tracking + entitlement listings.
package ports

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/course"
)

// LessonProgress is one learner's position in one lesson.
type LessonProgress struct {
	UserID          uuid.UUID
	LessonID        uuid.UUID
	PositionSeconds int
	CompletedAt     *time.Time
	UpdatedAt       time.Time
}

// LearningRepo — progress persistence.
type LearningRepo interface {
	// Upsert stores position and (optionally) marks completion.
	Upsert(ctx context.Context, p *LessonProgress) error
	// ForUserInCourse returns progress rows for every lesson of the course.
	ForUserInCourse(ctx context.Context, userID, courseID uuid.UUID) ([]*LessonProgress, error)
}

// EntitlementQuery extends entitlement reads for the learner panel.
type EntitlementReader interface {
	// ListForUser returns the user's active entitlements.
	ListForUser(ctx context.Context, userID uuid.UUID) ([]*course.Entitlement, error)
}
