// ProgressRepo implementation.
package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// ProgressRepo implements ports.ProgressRepo.
type ProgressRepo struct{ pool *pgxpool.Pool }

func NewProgressRepo(pool *pgxpool.Pool) *ProgressRepo { return &ProgressRepo{pool: pool} }

func scanProgress(row pgx.Row) (*course.LessonProgress, error) {
	p := &course.LessonProgress{}
	err := row.Scan(&p.ID, &p.UserID, &p.LessonID, &p.PositionSeconds, &p.CompletedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan progress: %w", err)
	}
	return p, nil
}

func (r *ProgressRepo) Upsert(ctx context.Context, p *course.LessonProgress) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO lesson_progress (id, user_id, lesson_id, position_seconds, completed_at)
		 VALUES ($1,$2,$3,$4,$5)
		 ON CONFLICT (user_id, lesson_id) DO UPDATE
		 SET position_seconds = $4, completed_at = $5, updated_at = now()`,
		p.ID, p.UserID, p.LessonID, p.PositionSeconds, p.CompletedAt)
	if err != nil {
		return fmt.Errorf("upsert progress: %w", err)
	}
	return nil
}

func (r *ProgressRepo) ForCourse(ctx context.Context, userID, courseID uuid.UUID) ([]*course.LessonProgress, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT p.id, p.user_id, p.lesson_id, p.position_seconds, p.completed_at, p.updated_at
		 FROM lesson_progress p
		 JOIN lessons l ON l.id = p.lesson_id
		 JOIN course_sections s ON s.id = l.section_id
		 WHERE p.user_id = $1 AND s.course_id = $2`, userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("progress for course: %w", err)
	}
	defer rows.Close()
	var out []*course.LessonProgress
	for rows.Next() {
		p, err := scanProgress(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *ProgressRepo) ForLesson(ctx context.Context, userID, lessonID uuid.UUID) (*course.LessonProgress, error) {
	return scanProgress(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT id, user_id, lesson_id, position_seconds, completed_at, updated_at
		 FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2`, userID, lessonID))
}
