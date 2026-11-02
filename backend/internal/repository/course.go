package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// CourseRepo implements ports.CourseRepo.
type CourseRepo struct{ pool *pgxpool.Pool }

func NewCourseRepo(pool *pgxpool.Pool) *CourseRepo { return &CourseRepo{pool: pool} }

const courseColumns = `c.id, c.slug, c.instructor_id, c.title, c.summary, c.description_html,
	c.cover_media_id, c.promo_video_media_id, c.level, c.status, c.price_rial,
	c.compare_at_price_rial, c.is_featured, c.prerequisites_html, c.outcomes,
	c.published_at, c.meta_title, c.meta_description, c.og_image_media_id,
	c.deleted_at, c.created_at, c.updated_at`

func scanCourse(row pgx.Row) (*course.Course, error) {
	c := &course.Course{}
	var level, status string
	var outcomes []byte
	err := row.Scan(&c.ID, &c.Slug, &c.InstructorID, &c.Title, &c.Summary, &c.DescriptionHTML,
		&c.CoverMediaID, &c.PromoVideoMediaID, &level, &status, &c.PriceRial,
		&c.CompareAtPriceRial, &c.IsFeatured, &c.PrerequisitesHTML, &outcomes,
		&c.PublishedAt, &c.MetaTitle, &c.MetaDescription, &c.OGImageMediaID,
		&c.DeletedAt, &c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan course: %w", err)
	}
	c.Level = course.Level(level)
	c.Status = course.Status(status)
	if len(outcomes) > 0 && json.Unmarshal(outcomes, &c.Outcomes) != nil {
		c.Outcomes = []string{}
	}
	if c.Outcomes == nil {
		c.Outcomes = []string{} // JSONB null must never leak to clients as nil
	}
	return c, nil
}

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

func (r *CourseRepo) Create(ctx context.Context, c *course.Course) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `INSERT INTO courses
		(id, slug, instructor_id, title, summary, description_html, cover_media_id,
		promo_video_media_id, level, status, price_rial, compare_at_price_rial,
		is_featured, prerequisites_html, outcomes, published_at,
		meta_title, meta_description, og_image_media_id, deleted_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
		c.ID, c.Slug, c.InstructorID, c.Title, c.Summary, c.DescriptionHTML, c.CoverMediaID,
		c.PromoVideoMediaID, string(c.Level), string(c.Status), c.PriceRial, c.CompareAtPriceRial,
		c.IsFeatured, c.PrerequisitesHTML, mustJSON(c.Outcomes), c.PublishedAt,
		c.MetaTitle, c.MetaDescription, c.OGImageMediaID, c.DeletedAt)
	if err != nil {
		return fmt.Errorf("insert course: %w", err)
	}
	return nil
}

func (r *CourseRepo) ByID(ctx context.Context, id uuid.UUID) (*course.Course, error) {
	return scanCourse(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+courseColumns+` FROM courses c WHERE c.id = $1 AND c.deleted_at IS NULL`, id))
}

func (r *CourseRepo) BySlug(ctx context.Context, slug string) (*course.Course, error) {
	return scanCourse(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+courseColumns+` FROM courses c WHERE c.slug = $1 AND c.deleted_at IS NULL`, slug))
}

func (r *CourseRepo) Update(ctx context.Context, c *course.Course) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `UPDATE courses SET
		slug=$2, title=$3, summary=$4, description_html=$5, cover_media_id=$6,
		promo_video_media_id=$7, level=$8, price_rial=$9, compare_at_price_rial=$10,
		is_featured=$11, prerequisites_html=$12, outcomes=$13,
		meta_title=$14, meta_description=$15, og_image_media_id=$16, updated_at=now()
		WHERE id=$1 AND deleted_at IS NULL`,
		c.ID, c.Slug, c.Title, c.Summary, c.DescriptionHTML, c.CoverMediaID,
		c.PromoVideoMediaID, string(c.Level), c.PriceRial, c.CompareAtPriceRial,
		c.IsFeatured, c.PrerequisitesHTML, mustJSON(c.Outcomes),
		c.MetaTitle, c.MetaDescription, c.OGImageMediaID)
	if err != nil {
		return fmt.Errorf("update course: %w", err)
	}
	return nil
}

func (r *CourseRepo) SoftDelete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE courses SET deleted_at = now(), status = 'archived' WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("soft delete course: %w", err)
	}
	return nil
}

func (r *CourseRepo) Publish(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE courses SET status='published', published_at=coalesce(published_at, now()), updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return fmt.Errorf("publish course: %w", err)
	}
	return nil
}

func (r *CourseRepo) Unpublish(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE courses SET status='draft', updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return fmt.Errorf("unpublish course: %w", err)
	}
	return nil
}

func (r *CourseRepo) SetFeatured(ctx context.Context, id uuid.UUID, featured bool) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE courses SET is_featured=$2, updated_at=now() WHERE id=$1`, id, featured)
	if err != nil {
		return fmt.Errorf("set featured: %w", err)
	}
	return nil
}

func (r *CourseRepo) SlugExists(ctx context.Context, slug string, excludeID uuid.UUID) (bool, error) {
	var exists bool
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM courses WHERE slug=$1 AND id<>$2 AND deleted_at IS NULL)`,
		slug, excludeID).Scan(&exists)
	return exists, err
}

func courseListWhere(f ports.CourseFilter, publicOnly bool) (string, []any) {
	where := []string{"c.deleted_at IS NULL"}
	args := []any{}
	if publicOnly {
		where = append(where, "c.status = 'published'")
	}
	if f.CategorySlug != "" {
		where = append(where, "EXISTS(SELECT 1 FROM course_category_courses cc JOIN course_categories cat ON cat.id = cc.category_id WHERE cc.course_id = c.id AND cat.slug = $"+fmt.Sprint(len(args)+1)+")")
		args = append(args, f.CategorySlug)
	}
	if f.Level != "" {
		where = append(where, "c.level = $"+fmt.Sprint(len(args)+1))
		args = append(args, f.Level)
	}
	if f.Status != "" {
		where = append(where, "c.status = $"+fmt.Sprint(len(args)+1))
		args = append(args, f.Status)
	}
	if f.Q != "" {
		where = append(where, "(c.title ILIKE '%'||$"+fmt.Sprint(len(args)+1)+"||'%' OR c.summary ILIKE '%'||$"+fmt.Sprint(len(args)+1)+"||'%' OR c.slug ILIKE '%'||$"+fmt.Sprint(len(args)+1)+"||'%')")
		args = append(args, f.Q)
	}
	if f.FeaturedOnly {
		where = append(where, "c.is_featured = TRUE")
	}
	if f.MinPriceRial > 0 {
		where = append(where, "c.price_rial >= $"+fmt.Sprint(len(args)+1))
		args = append(args, f.MinPriceRial)
	}
	if f.MaxPriceRial > 0 {
		where = append(where, "c.price_rial <= $"+fmt.Sprint(len(args)+1))
		args = append(args, f.MaxPriceRial)
	}
	return strings.Join(where, " AND "), args
}

func courseOrder(sort string) string {
	switch sort {
	case "popular":
		return "c.is_featured DESC, c.published_at DESC"
	case "price_asc":
		return "c.price_rial ASC"
	case "price_desc":
		return "c.price_rial DESC"
	case "oldest":
		return "c.created_at ASC"
	case "title":
		return "c.title ASC"
	default:
		return "c.published_at DESC NULLS LAST, c.created_at DESC"
	}
}

func collectCourses(rows pgx.Rows, err error) ([]*course.Course, error) {
	if err != nil {
		return nil, fmt.Errorf("list courses: %w", err)
	}
	defer rows.Close()
	var out []*course.Course
	for rows.Next() {
		c, err := scanCourse(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *CourseRepo) ListPublished(ctx context.Context, f ports.CourseFilter) ([]*course.Course, int, error) {
	where, args := courseListWhere(f, true)
	q := `SELECT ` + courseColumns + ` FROM courses c WHERE ` + where +
		` ORDER BY ` + courseOrder(f.Sort) +
		` LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2)
	args = append(args, f.PerPage, (f.Page-1)*f.PerPage)
	rows, err := querierOf(ctx, r.pool).Query(ctx, q, args...)
	list, err := collectCourses(rows, err)
	if err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM courses c WHERE `+where, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count courses: %w", err)
	}
	return list, total, nil
}

func (r *CourseRepo) ListAdmin(ctx context.Context, f ports.CourseFilter) ([]*course.Course, int, error) {
	where, args := courseListWhere(f, false)
	q := `SELECT ` + courseColumns + ` FROM courses c WHERE ` + where +
		` ORDER BY ` + courseOrder(f.Sort) +
		` LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2)
	args = append(args, f.PerPage, (f.Page-1)*f.PerPage)
	rows, err := querierOf(ctx, r.pool).Query(ctx, q, args...)
	list, err := collectCourses(rows, err)
	if err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM courses c WHERE `+where, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count courses: %w", err)
	}
	return list, total, nil
}
