package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/content"
	"golearn/backend/internal/ports"
)

// SeriesRepo implements ports.SeriesRepo.
type SeriesRepo struct{ pool *pgxpool.Pool }

func NewSeriesRepo(pool *pgxpool.Pool) *SeriesRepo { return &SeriesRepo{pool: pool} }

const seriesColumns = `id, slug, title, description, created_at`

func scanSeries(row pgx.Row) (*content.BlogSeries, error) {
	s := &content.BlogSeries{}
	err := row.Scan(&s.ID, &s.Slug, &s.Title, &s.Description, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan series: %w", err)
	}
	return s, nil
}

func (r *SeriesRepo) Create(ctx context.Context, s *content.BlogSeries) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO blog_series (id, slug, title, description) VALUES ($1,$2,$3,$4)`,
		s.ID, s.Slug, s.Title, s.Description)
	if err != nil {
		return fmt.Errorf("insert series: %w", err)
	}
	return nil
}

func (r *SeriesRepo) Update(ctx context.Context, s *content.BlogSeries) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE blog_series SET slug=$2, title=$3, description=$4 WHERE id=$1`,
		s.ID, s.Slug, s.Title, s.Description)
	if err != nil {
		return fmt.Errorf("update series: %w", err)
	}
	return nil
}

func (r *SeriesRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM blog_series WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete series: %w", err)
	}
	return nil
}

func (r *SeriesRepo) ByID(ctx context.Context, id uuid.UUID) (*content.BlogSeries, error) {
	return scanSeries(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+seriesColumns+` FROM blog_series WHERE id=$1`, id))
}

func (r *SeriesRepo) BySlug(ctx context.Context, slug string) (*content.BlogSeries, error) {
	return scanSeries(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+seriesColumns+` FROM blog_series WHERE slug=$1`, slug))
}

func (r *SeriesRepo) List(ctx context.Context) ([]*content.BlogSeries, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+seriesColumns+` FROM blog_series ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list series: %w", err)
	}
	defer rows.Close()
	var out []*content.BlogSeries
	for rows.Next() {
		s, err := scanSeries(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *SeriesRepo) SlugExists(ctx context.Context, slug string, excludeID uuid.UUID) (bool, error) {
	var exists bool
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM blog_series WHERE slug=$1 AND id<>$2)`, slug, excludeID).Scan(&exists)
	return exists, err
}

func (r *SeriesRepo) PostsCount(ctx context.Context, id uuid.UUID) (int, error) {
	var n int
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM blog_posts WHERE series_id=$1`, id).Scan(&n)
	return n, err
}
