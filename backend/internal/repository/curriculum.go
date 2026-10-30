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

// SectionRepo implements ports.SectionRepo.
type SectionRepo struct{ pool *pgxpool.Pool }

func NewSectionRepo(pool *pgxpool.Pool) *SectionRepo { return &SectionRepo{pool: pool} }

func scanSection(row pgx.Row) (*course.Section, error) {
	s := &course.Section{}
	err := row.Scan(&s.ID, &s.CourseID, &s.Title, &s.Position)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan section: %w", err)
	}
	return s, nil
}

func (r *SectionRepo) Create(ctx context.Context, s *course.Section) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO course_sections (id, course_id, title, position) VALUES ($1,$2,$3,$4)`,
		s.ID, s.CourseID, s.Title, s.Position)
	if err != nil {
		return fmt.Errorf("insert section: %w", err)
	}
	return nil
}

func (r *SectionRepo) ByID(ctx context.Context, id uuid.UUID) (*course.Section, error) {
	return scanSection(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT id, course_id, title, position FROM course_sections WHERE id = $1`, id))
}

func (r *SectionRepo) Update(ctx context.Context, s *course.Section) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE course_sections SET title=$2, position=$3 WHERE id=$1`,
		s.ID, s.Title, s.Position)
	if err != nil {
		return fmt.Errorf("update section: %w", err)
	}
	return nil
}

func (r *SectionRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM course_sections WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete section: %w", err)
	}
	return nil
}

func (r *SectionRepo) ListByCourse(ctx context.Context, courseID uuid.UUID) ([]*course.Section, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, course_id, title, position FROM course_sections WHERE course_id=$1 ORDER BY position`,
		courseID)
	if err != nil {
		return nil, fmt.Errorf("list sections: %w", err)
	}
	defer rows.Close()
	var out []*course.Section
	for rows.Next() {
		s, err := scanSection(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// Reorder applies new positions atomically via unnest.
func (r *SectionRepo) Reorder(ctx context.Context, courseID uuid.UUID, ids []uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE course_sections s SET position = o.pos
		 FROM (SELECT unnest($2::uuid[]) AS id, generate_subscripts($2::uuid[], 1) AS pos) o
		 WHERE s.id = o.id AND s.course_id = $1`,
		courseID, ids)
	if err != nil {
		return fmt.Errorf("reorder sections: %w", err)
	}
	return nil
}

// LessonRepo implements ports.LessonRepo.
type LessonRepo struct{ pool *pgxpool.Pool }

func NewLessonRepo(pool *pgxpool.Pool) *LessonRepo { return &LessonRepo{pool: pool} }

func scanLesson(row pgx.Row) (*course.Lesson, error) {
	l := &course.Lesson{}
	var status string
	err := row.Scan(&l.ID, &l.SectionID, &l.Title, &l.ContentHTML, &l.Position,
		&l.IsPreview, &l.DurationSeconds, &status, &l.MediaID, &l.CreatedAt, &l.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan lesson: %w", err)
	}
	l.Status = course.LessonStatus(status)
	return l, nil
}

const lessonColumns = `l.id, l.section_id, l.title, l.content_html, l.position,
	l.is_preview, l.duration_seconds, l.status, l.media_id, l.created_at, l.updated_at`

func (r *LessonRepo) Create(ctx context.Context, l *course.Lesson) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO lessons (id, section_id, title, content_html, position, is_preview, duration_seconds, status, media_id)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		l.ID, l.SectionID, l.Title, l.ContentHTML, l.Position, l.IsPreview,
		l.DurationSeconds, string(l.Status), l.MediaID)
	if err != nil {
		return fmt.Errorf("insert lesson: %w", err)
	}
	return nil
}

func (r *LessonRepo) ByID(ctx context.Context, id uuid.UUID) (*course.Lesson, error) {
	return scanLesson(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+lessonColumns+` FROM lessons l WHERE l.id = $1`, id))
}

func (r *LessonRepo) Update(ctx context.Context, l *course.Lesson) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE lessons SET section_id=$2, title=$3, content_html=$4, position=$5,
		 is_preview=$6, duration_seconds=$7, status=$8, media_id=$9, updated_at=now()
		 WHERE id=$1`,
		l.ID, l.SectionID, l.Title, l.ContentHTML, l.Position, l.IsPreview,
		l.DurationSeconds, string(l.Status), l.MediaID)
	if err != nil {
		return fmt.Errorf("update lesson: %w", err)
	}
	return nil
}

func (r *LessonRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM lessons WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete lesson: %w", err)
	}
	return nil
}

func (r *LessonRepo) ListByCourse(ctx context.Context, courseID uuid.UUID) ([]*course.Lesson, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+lessonColumns+` FROM lessons l
		 JOIN course_sections s ON s.id = l.section_id
		 WHERE s.course_id = $1
		 ORDER BY s.position, l.position`, courseID)
	if err != nil {
		return nil, fmt.Errorf("list lessons: %w", err)
	}
	defer rows.Close()
	var out []*course.Lesson
	for rows.Next() {
		l, err := scanLesson(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (r *LessonRepo) CountReady(ctx context.Context, courseID uuid.UUID) (int, error) {
	var n int
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM lessons l JOIN course_sections s ON s.id = l.section_id
		 WHERE s.course_id = $1 AND l.status IN ('ready','published')`, courseID).Scan(&n)
	return n, err
}

func (r *LessonRepo) Reorder(ctx context.Context, sectionID uuid.UUID, ids []uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE lessons l SET position = o.pos
		 FROM (SELECT unnest($2::uuid[]) AS id, generate_subscripts($2::uuid[], 1) AS pos) o
		 WHERE l.id = o.id AND l.section_id = $1`,
		sectionID, ids)
	if err != nil {
		return fmt.Errorf("reorder lessons: %w", err)
	}
	return nil
}

// CategoryRepo implements ports.CategoryRepo.
type CategoryRepo struct{ pool *pgxpool.Pool }

func NewCategoryRepo(pool *pgxpool.Pool) *CategoryRepo { return &CategoryRepo{pool: pool} }

func scanCategory(row pgx.Row) (*course.Category, error) {
	c := &course.Category{}
	err := row.Scan(&c.ID, &c.Slug, &c.Title, &c.Position)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan category: %w", err)
	}
	return c, nil
}

func (r *CategoryRepo) Create(ctx context.Context, c *course.Category) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO course_categories (id, slug, title, position) VALUES ($1,$2,$3,$4)`,
		c.ID, c.Slug, c.Title, c.Position)
	if err != nil {
		return fmt.Errorf("insert category: %w", err)
	}
	return nil
}

func (r *CategoryRepo) ByID(ctx context.Context, id uuid.UUID) (*course.Category, error) {
	return scanCategory(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT id, slug, title, position FROM course_categories WHERE id=$1`, id))
}

func (r *CategoryRepo) BySlug(ctx context.Context, slug string) (*course.Category, error) {
	return scanCategory(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT id, slug, title, position FROM course_categories WHERE slug=$1`, slug))
}

func (r *CategoryRepo) Update(ctx context.Context, c *course.Category) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE course_categories SET slug=$2, title=$3, position=$4 WHERE id=$1`,
		c.ID, c.Slug, c.Title, c.Position)
	if err != nil {
		return fmt.Errorf("update category: %w", err)
	}
	return nil
}

func (r *CategoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM course_categories WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	return nil
}

func (r *CategoryRepo) List(ctx context.Context) ([]*course.Category, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, slug, title, position FROM course_categories ORDER BY position, title`)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()
	var out []*course.Category
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
