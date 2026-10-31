// LearningRepo implementation (lesson_progress).
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/ports"
)

// LearningRepo implements ports.LearningRepo.
type LearningRepo struct{ pool *pgxpool.Pool }

func NewLearningRepo(pool *pgxpool.Pool) *LearningRepo { return &LearningRepo{pool: pool} }

func (r *LearningRepo) Upsert(ctx context.Context, p *ports.LessonProgress) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO lesson_progress (user_id, lesson_id, position_seconds, completed_at)
		 VALUES ($1,$2,$3,$4)
		 ON CONFLICT (user_id, lesson_id) DO UPDATE
		 SET position_seconds = $3,
		     completed_at = coalesce($4, lesson_progress.completed_at),
		     updated_at = now()`,
		p.UserID, p.LessonID, p.PositionSeconds, p.CompletedAt)
	if err != nil {
		return fmt.Errorf("upsert progress: %w", err)
	}
	return nil
}

func (r *LearningRepo) ForUserInCourse(ctx context.Context, userID, courseID uuid.UUID) ([]*ports.LessonProgress, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT p.user_id, p.lesson_id, p.position_seconds, p.completed_at, p.updated_at
		 FROM lesson_progress p
		 JOIN lessons l ON l.id = p.lesson_id
		 JOIN course_sections s ON s.id = l.section_id
		 WHERE p.user_id = $1 AND s.course_id = $2`, userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("list progress: %w", err)
	}
	defer rows.Close()
	var out []*ports.LessonProgress
	for rows.Next() {
		p := &ports.LessonProgress{}
		if err := rows.Scan(&p.UserID, &p.LessonID, &p.PositionSeconds, &p.CompletedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan progress: %w", err)
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

var _ = uuid.Nil
