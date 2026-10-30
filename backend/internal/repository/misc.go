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

// TaxonomyRepo implements ports.TaxonomyRepo (blog categories + tags).
type TaxonomyRepo struct{ pool *pgxpool.Pool }

func NewTaxonomyRepo(pool *pgxpool.Pool) *TaxonomyRepo { return &TaxonomyRepo{pool: pool} }

func scanCategoryRow(row pgx.Row) (*content.BlogCategory, error) {
	c := &content.BlogCategory{}
	err := row.Scan(&c.ID, &c.Slug, &c.Title, &c.Position)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	return c, err
}

func (r *TaxonomyRepo) CreateCategory(ctx context.Context, c *content.BlogCategory) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO blog_categories (id, slug, title, position) VALUES ($1,$2,$3,$4)`,
		c.ID, c.Slug, c.Title, c.Position)
	if err != nil {
		return fmt.Errorf("insert blog category: %w", err)
	}
	return nil
}

func (r *TaxonomyRepo) UpdateCategory(ctx context.Context, c *content.BlogCategory) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE blog_categories SET slug=$2, title=$3, position=$4 WHERE id=$1`,
		c.ID, c.Slug, c.Title, c.Position)
	if err != nil {
		return fmt.Errorf("update blog category: %w", err)
	}
	return nil
}

func (r *TaxonomyRepo) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM blog_categories WHERE id=$1`, id)
	return err
}

func (r *TaxonomyRepo) ListCategories(ctx context.Context) ([]*content.BlogCategory, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, slug, title, position FROM blog_categories ORDER BY position, title`)
	if err != nil {
		return nil, fmt.Errorf("list blog categories: %w", err)
	}
	defer rows.Close()
	var out []*content.BlogCategory
	for rows.Next() {
		c, err := scanCategoryRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *TaxonomyRepo) CreateTag(ctx context.Context, t *content.BlogTag) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO blog_tags (id, slug, title) VALUES ($1,$2,$3)`, t.ID, t.Slug, t.Title)
	if err != nil {
		return fmt.Errorf("insert blog tag: %w", err)
	}
	return nil
}

func (r *TaxonomyRepo) DeleteTag(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM blog_tags WHERE id=$1`, id)
	return err
}

func (r *TaxonomyRepo) ListTags(ctx context.Context) ([]*content.BlogTag, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx, `SELECT id, slug, title FROM blog_tags ORDER BY title`)
	if err != nil {
		return nil, fmt.Errorf("list blog tags: %w", err)
	}
	defer rows.Close()
	var out []*content.BlogTag
	for rows.Next() {
		t := &content.BlogTag{}
		if err := rows.Scan(&t.ID, &t.Slug, &t.Title); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// EnsureTagByTitle returns the tag with this title, creating it if needed.
func (r *TaxonomyRepo) EnsureTagByTitle(ctx context.Context, title string) (*content.BlogTag, error) {
	t := &content.BlogTag{ID: uuid.Must(uuid.NewV7()), Title: title}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO blog_tags (id, slug, title) VALUES ($1,$2,$3)
		 ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title RETURNING id, slug, title`,
		t.ID, slugify(title), title).Scan(&t.ID, &t.Slug, &t.Title)
	if err != nil {
		return nil, fmt.Errorf("ensure tag: %w", err)
	}
	return t, nil
}

func slugify(s string) string {
	out := ""
	last := byte('-')
	for i := 0; i < len(s); i++ {
		b := s[i]
		ok := (b >= 'a' && b <= 'z') || (b >= '0' && b <= '9') || b > 127
		if ok {
			out += string(b)
			last = b
		} else if last != '-' {
			out += "-"
			last = '-'
		}
	}
	return strings.Trim(out, "-")
}

// PageRepo implements ports.PageRepo.
type PageRepo struct{ pool *pgxpool.Pool }

func NewPageRepo(pool *pgxpool.Pool) *PageRepo { return &PageRepo{pool: pool} }

const pageColumns = `id, slug, title, body_html, meta_title, meta_description, created_at, updated_at`

func scanPage(row pgx.Row) (*content.Page, error) {
	p := &content.Page{}
	err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.BodyHTML, &p.MetaTitle, &p.MetaDescription, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan page: %w", err)
	}
	return p, nil
}

func (r *PageRepo) Upsert(ctx context.Context, pg *content.Page) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO pages (id, slug, title, body_html, meta_title, meta_description)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 ON CONFLICT (slug) DO UPDATE SET title=$3, body_html=$4,
		 meta_title=$5, meta_description=$6, updated_at=now()`,
		pg.ID, pg.Slug, pg.Title, pg.BodyHTML, pg.MetaTitle, pg.MetaDescription)
	if err != nil {
		return fmt.Errorf("upsert page: %w", err)
	}
	return nil
}

func (r *PageRepo) BySlug(ctx context.Context, slug string) (*content.Page, error) {
	return scanPage(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+pageColumns+` FROM pages WHERE slug=$1`, slug))
}

func (r *PageRepo) List(ctx context.Context) ([]*content.Page, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx, `SELECT `+pageColumns+` FROM pages ORDER BY title`)
	if err != nil {
		return nil, fmt.Errorf("list pages: %w", err)
	}
	defer rows.Close()
	var out []*content.Page
	for rows.Next() {
		p, err := scanPage(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *PageRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM pages WHERE id=$1`, id)
	return err
}

// FAQRepo implements ports.FAQRepo.
type FAQRepo struct{ pool *pgxpool.Pool }

func NewFAQRepo(pool *pgxpool.Pool) *FAQRepo { return &FAQRepo{pool: pool} }

func scanFAQ(row pgx.Row) (*content.FAQ, error) {
	f := &content.FAQ{}
	err := row.Scan(&f.ID, &f.Question, &f.Answer, &f.Position, &f.IsPublished)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	return f, err
}

func (r *FAQRepo) Upsert(ctx context.Context, f *content.FAQ) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO faqs (id, question, answer, position, is_published) VALUES ($1,$2,$3,$4,$5)
		 ON CONFLICT (id) DO UPDATE SET question=$2, answer=$3, position=$4, is_published=$5, updated_at=now()`,
		f.ID, f.Question, f.Answer, f.Position, f.IsPublished)
	if err != nil {
		return fmt.Errorf("upsert faq: %w", err)
	}
	return nil
}

func (r *FAQRepo) List(ctx context.Context, publishedOnly bool) ([]*content.FAQ, error) {
	q := `SELECT id, question, answer, position, is_published FROM faqs`
	if publishedOnly {
		q += ` WHERE is_published = true`
	}
	q += ` ORDER BY position`
	rows, err := querierOf(ctx, r.pool).Query(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list faqs: %w", err)
	}
	defer rows.Close()
	var out []*content.FAQ
	for rows.Next() {
		f, err := scanFAQ(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (r *FAQRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM faqs WHERE id=$1`, id)
	return err
}

// TestimonialRepo implements ports.TestimonialRepo.
type TestimonialRepo struct{ pool *pgxpool.Pool }

func NewTestimonialRepo(pool *pgxpool.Pool) *TestimonialRepo { return &TestimonialRepo{pool: pool} }

func scanTestimonial(row pgx.Row) (*content.Testimonial, error) {
	t := &content.Testimonial{}
	err := row.Scan(&t.ID, &t.AuthorName, &t.AuthorRole, &t.Body, &t.Rating, &t.AvatarMediaID, &t.Position, &t.IsPublished)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	return t, err
}

func (r *TestimonialRepo) Upsert(ctx context.Context, t *content.Testimonial) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO testimonials (id, author_name, author_role, body, rating, avatar_media_id, position, is_published)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		 ON CONFLICT (id) DO UPDATE SET author_name=$2, author_role=$3, body=$4, rating=$5,
		 avatar_media_id=$6, position=$7, is_published=$8, updated_at=now()`,
		t.ID, t.AuthorName, t.AuthorRole, t.Body, t.Rating, t.AvatarMediaID, t.Position, t.IsPublished)
	if err != nil {
		return fmt.Errorf("upsert testimonial: %w", err)
	}
	return nil
}

func (r *TestimonialRepo) List(ctx context.Context, publishedOnly bool) ([]*content.Testimonial, error) {
	q := `SELECT id, author_name, author_role, body, rating, avatar_media_id, position, is_published FROM testimonials`
	if publishedOnly {
		q += ` WHERE is_published = true`
	}
	q += ` ORDER BY position`
	rows, err := querierOf(ctx, r.pool).Query(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list testimonials: %w", err)
	}
	defer rows.Close()
	var out []*content.Testimonial
	for rows.Next() {
		t, err := scanTestimonial(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *TestimonialRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM testimonials WHERE id=$1`, id)
	return err
}

// ContactRepo implements ports.ContactRepo.
type ContactRepo struct{ pool *pgxpool.Pool }

func NewContactRepo(pool *pgxpool.Pool) *ContactRepo { return &ContactRepo{pool: pool} }

func scanContact(row pgx.Row) (*content.ContactMessage, error) {
	m := &content.ContactMessage{}
	var status string
	err := row.Scan(&m.ID, &m.UserID, &m.Name, &m.Contact, &m.Subject, &m.Body, &status, &m.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan contact: %w", err)
	}
	m.Status = content.ContactStatus(status)
	return m, nil
}

func (r *ContactRepo) Create(ctx context.Context, m *content.ContactMessage) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO contact_messages (id, user_id, name, contact, subject, body) VALUES ($1,$2,$3,$4,$5,$6)`,
		m.ID, m.UserID, m.Name, m.Contact, m.Subject, m.Body)
	if err != nil {
		return fmt.Errorf("insert contact message: %w", err)
	}
	return nil
}

func (r *ContactRepo) List(ctx context.Context, page, perPage int) ([]*content.ContactMessage, int, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, user_id, name, contact, subject, body, status, created_at
		 FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2`, perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, fmt.Errorf("list contact messages: %w", err)
	}
	defer rows.Close()
	var out []*content.ContactMessage
	for rows.Next() {
		m, err := scanContact(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, m)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx, `SELECT count(*) FROM contact_messages`).Scan(&total)
	return out, total, err
}

func (r *ContactRepo) SetStatus(ctx context.Context, id uuid.UUID, s content.ContactStatus) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE contact_messages SET status=$2, updated_at=now() WHERE id=$1`, id, string(s))
	return err
}
