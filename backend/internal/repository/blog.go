package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/content"
	"golearn/backend/internal/ports"
)

// BlogPostRepo implements ports.BlogPostRepo.
type BlogPostRepo struct{ pool *pgxpool.Pool }

func NewBlogPostRepo(pool *pgxpool.Pool) *BlogPostRepo { return &BlogPostRepo{pool: pool} }

const postColumns = `p.id, p.slug, p.author_user_id, p.title, p.excerpt, p.body_html,
	p.cover_media_id, p.category_id, p.series_id, p.series_part, p.featured, p.views,
	p.status, p.published_at, p.reading_minutes,
	p.meta_title, p.meta_description, p.og_image_media_id, p.created_at, p.updated_at`

func scanPost(row pgx.Row) (*content.BlogPost, error) {
	p := &content.BlogPost{}
	var status string
	err := row.Scan(&p.ID, &p.Slug, &p.AuthorID, &p.Title, &p.Excerpt, &p.BodyHTML,
		&p.CoverMediaID, &p.CategoryID, &p.SeriesID, &p.SeriesPart, &p.Featured, &p.Views,
		&status, &p.PublishedAt, &p.ReadingMinutes,
		&p.MetaTitle, &p.MetaDescription, &p.OGImageMediaID, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan post: %w", err)
	}
	p.Status = content.PostStatus(status)
	return p, nil
}

func (r *BlogPostRepo) Create(ctx context.Context, p *content.BlogPost) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO blog_posts (id, slug, author_user_id, title, excerpt, body_html,
		 cover_media_id, category_id, series_id, series_part, featured, status,
		 published_at, reading_minutes, meta_title, meta_description, og_image_media_id)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
		p.ID, p.Slug, p.AuthorID, p.Title, p.Excerpt, p.BodyHTML, p.CoverMediaID,
		p.CategoryID, p.SeriesID, p.SeriesPart, p.Featured, string(p.Status),
		p.PublishedAt, p.ReadingMinutes, p.MetaTitle, p.MetaDescription, p.OGImageMediaID)
	if err != nil {
		return fmt.Errorf("insert post: %w", err)
	}
	return nil
}

func (r *BlogPostRepo) ByID(ctx context.Context, id uuid.UUID) (*content.BlogPost, error) {
	return scanPost(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+postColumns+` FROM blog_posts p WHERE p.id=$1`, id))
}

func (r *BlogPostRepo) BySlug(ctx context.Context, slug string) (*content.BlogPost, error) {
	return scanPost(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+postColumns+` FROM blog_posts p WHERE p.slug=$1`, slug))
}

func (r *BlogPostRepo) Update(ctx context.Context, p *content.BlogPost) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE blog_posts SET slug=$2, title=$3, excerpt=$4, body_html=$5,
		 cover_media_id=$6, category_id=$7, series_id=$8, series_part=$9, featured=$10,
		 reading_minutes=$11, meta_title=$12, meta_description=$13,
		 og_image_media_id=$14, updated_at=now()
		 WHERE id=$1`,
		p.ID, p.Slug, p.Title, p.Excerpt, p.BodyHTML, p.CoverMediaID, p.CategoryID,
		p.SeriesID, p.SeriesPart, p.Featured, p.ReadingMinutes, p.MetaTitle,
		p.MetaDescription, p.OGImageMediaID)
	if err != nil {
		return fmt.Errorf("update post: %w", err)
	}
	return nil
}

func (r *BlogPostRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM blog_posts WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete post: %w", err)
	}
	return nil
}

// Publish flips status and stamps published_at once.
func (r *BlogPostRepo) Publish(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE blog_posts SET status='published', published_at=coalesce(published_at, now()) WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("publish post: %w", err)
	}
	return nil
}

func (r *BlogPostRepo) Unpublish(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE blog_posts SET status='draft' WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("unpublish post: %w", err)
	}
	return nil
}

func (r *BlogPostRepo) SlugExists(ctx context.Context, slug string, excludeID uuid.UUID) (bool, error) {
	var exists bool
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM blog_posts WHERE slug=$1 AND id<>$2)`, slug, excludeID).Scan(&exists)
	return exists, err
}

func (r *BlogPostRepo) ListPublic(ctx context.Context, f ports.PublicPostFilter) ([]*content.BlogPost, int, error) {
	where := []string{"p.status = 'published'"}
	args := []any{}
	if f.CategorySlug != "" {
		where = append(where, "EXISTS(SELECT 1 FROM blog_categories bc WHERE bc.id = p.category_id AND bc.slug = $"+fmt.Sprint(len(args)+1)+")")
		args = append(args, f.CategorySlug)
	}
	if f.TagSlug != "" {
		where = append(where, "EXISTS(SELECT 1 FROM blog_post_tags pt JOIN blog_tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.slug = $"+fmt.Sprint(len(args)+1)+")")
		args = append(args, f.TagSlug)
	}
	if f.Q != "" {
		where = append(where, "(p.title ILIKE '%'||$"+fmt.Sprint(len(args)+1)+"||'%' OR p.excerpt ILIKE '%'||$"+fmt.Sprint(len(args)+1)+"||'%')")
		args = append(args, f.Q)
	}
	if f.AuthorID != "" {
		where = append(where, "p.author_user_id = $"+fmt.Sprint(len(args)+1))
		args = append(args, f.AuthorID)
	}
	if f.FeaturedOnly {
		where = append(where, "p.featured")
	}
	whereSQL := joinAND(where)
	order := "p.published_at DESC"
	switch f.Sort {
	case "featured":
		order = "p.featured DESC, p.published_at DESC"
	case "popular":
		order = "p.views DESC, p.published_at DESC"
	case "random":
		order = "random()"
	}
	limit := "$" + fmt.Sprint(len(args)+1)
	offset := "$" + fmt.Sprint(len(args)+2)
	args = append(args, f.PerPage, (f.Page-1)*f.PerPage)
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+postColumns+` FROM blog_posts p WHERE `+whereSQL+
			` ORDER BY `+order+` LIMIT `+limit+` OFFSET `+offset, args...)
	list, err := collectPosts(rows, err)
	if err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM blog_posts p WHERE `+whereSQL, args[:len(args)-2]...).Scan(&total)
	return list, total, err
}

// BySeries lists published series parts, part-number first then date.
func (r *BlogPostRepo) BySeries(ctx context.Context, seriesID uuid.UUID) ([]*content.BlogPost, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+postColumns+` FROM blog_posts p
		 WHERE p.status='published' AND p.series_id = $1
		 ORDER BY p.series_part NULLS LAST, p.published_at ASC`, seriesID)
	return collectPosts(rows, err)
}

// IncrViews bumps the view counter once (public beacon).
func (r *BlogPostRepo) IncrViews(ctx context.Context, postID uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `UPDATE blog_posts SET views = views + 1 WHERE id=$1`, postID)
	if err != nil {
		return fmt.Errorf("incr post views: %w", err)
	}
	return nil
}

func joinAND(parts []string) string {
	out := ""
	for i, s := range parts {
		if i > 0 {
			out += " AND "
		}
		out += s
	}
	return out
}

func collectPosts(rows pgx.Rows, err error) ([]*content.BlogPost, error) {
	if err != nil {
		return nil, fmt.Errorf("list posts: %w", err)
	}
	defer rows.Close()
	var out []*content.BlogPost
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *BlogPostRepo) ListAdmin(ctx context.Context, f ports.PostFilter) ([]*content.BlogPost, int, error) {
	where, args := []string{"1=1"}, []any{}
	if f.Status != "" {
		where = append(where, "p.status = $"+fmt.Sprint(len(args)+1))
		args = append(args, f.Status)
	}
	if f.Q != "" {
		where = append(where, "(p.title ILIKE $"+fmt.Sprint(len(args)+1)+" OR p.slug ILIKE $"+fmt.Sprint(len(args)+1)+")")
		args = append(args, "%"+f.Q+"%")
	}
	if f.CategoryID != "" {
		where = append(where, "p.category_id = $"+fmt.Sprint(len(args)+1))
		args = append(args, f.CategoryID)
	}
	if f.TagSlug != "" {
		where = append(where, "EXISTS(SELECT 1 FROM blog_post_tags pt JOIN blog_tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.slug = $"+fmt.Sprint(len(args)+1)+")")
		args = append(args, f.TagSlug)
	}
	order := "p.created_at DESC"
	switch f.Sort {
	case "oldest":
		order = "p.created_at ASC"
	case "title":
		order = "p.title ASC"
	case "published":
		order = "p.published_at DESC NULLS LAST"
	}
	cond := strings.Join(where, " AND ")
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+postColumns+` FROM blog_posts p WHERE `+cond+` ORDER BY `+order+` LIMIT $`+fmt.Sprint(len(args)+1)+` OFFSET $`+fmt.Sprint(len(args)+2),
		append(append([]any{}, args...), f.PerPage, (f.Page-1)*f.PerPage)...)
	list, err := collectPosts(rows, err)
	if err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx, `SELECT count(*) FROM blog_posts p WHERE `+cond, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count posts: %w", err)
	}
	return list, total, nil
}

func (r *BlogPostRepo) SetTags(ctx context.Context, postID uuid.UUID, tagIDs []uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM blog_post_tags WHERE post_id=$1`, postID)
	if err != nil {
		return fmt.Errorf("clear post tags: %w", err)
	}
	for _, id := range tagIDs {
		_, err := querierOf(ctx, r.pool).Exec(ctx,
			`INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, postID, id)
		if err != nil {
			return fmt.Errorf("insert post tag: %w", err)
		}
	}
	return nil
}

func (r *BlogPostRepo) TagsOf(ctx context.Context, postID uuid.UUID) ([]*content.BlogTag, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT t.id, t.slug, t.title FROM blog_tags t
		 JOIN blog_post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = $1 ORDER BY t.title`, postID)
	if err != nil {
		return nil, fmt.Errorf("tags of post: %w", err)
	}
	defer rows.Close()
	var out []*content.BlogTag
	for rows.Next() {
		tg := &content.BlogTag{}
		if err := rows.Scan(&tg.ID, &tg.Slug, &tg.Title); err != nil {
			return nil, fmt.Errorf("scan tag: %w", err)
		}
		out = append(out, tg)
	}
	return out, rows.Err()
}

// Related returns recent published posts in the same category (excluding the post itself).
func (r *BlogPostRepo) Related(ctx context.Context, postID uuid.UUID, limit int) ([]*content.BlogPost, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+postColumns+` FROM blog_posts p
		 WHERE p.status='published' AND p.id <> $1
		   AND p.category_id IS NOT DISTINCT FROM (SELECT category_id FROM blog_posts WHERE id=$1)
		 ORDER BY p.published_at DESC LIMIT $2`, postID, limit)
	return collectPosts(rows, err)
}
