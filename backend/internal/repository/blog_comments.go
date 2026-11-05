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

// CommentRepo implements ports.CommentRepo.
type CommentRepo struct{ pool *pgxpool.Pool }

func NewCommentRepo(pool *pgxpool.Pool) *CommentRepo { return &CommentRepo{pool: pool} }

const commentColumns = `id, post_id, parent_id, author_name, author_email, body, status, approved_by, created_at`

// commentColumnsC is the same list with the "c" table prefix (admin JOIN).
const commentColumnsC = `c.id, c.post_id, c.parent_id, c.author_name, c.author_email, c.body, c.status, c.approved_by, c.created_at`

func scanComment(row pgx.Row) (*content.BlogComment, error) {
	c := &content.BlogComment{}
	var status string
	err := row.Scan(&c.ID, &c.PostID, &c.ParentID, &c.AuthorName, &c.AuthorEmail,
		&c.Body, &status, &c.ApprovedBy, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan comment: %w", err)
	}
	c.Status = content.CommentStatus(status)
	return c, nil
}

func (r *CommentRepo) Create(ctx context.Context, c *content.BlogComment) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO blog_comments (id, post_id, parent_id, author_name, author_email, body, status)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		c.ID, c.PostID, c.ParentID, c.AuthorName, c.AuthorEmail, c.Body, string(c.Status))
	if err != nil {
		return fmt.Errorf("insert comment: %w", err)
	}
	return nil
}

func (r *CommentRepo) ByID(ctx context.Context, id uuid.UUID) (*content.BlogComment, error) {
	return scanComment(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+commentColumns+` FROM blog_comments WHERE id=$1`, id))
}

// ListApprovedByPost returns approved comments oldest-first for threading.
func (r *CommentRepo) ListApprovedByPost(ctx context.Context, postID uuid.UUID) ([]*content.BlogComment, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT `+commentColumns+` FROM blog_comments
		 WHERE post_id=$1 AND status='approved' ORDER BY created_at ASC`, postID)
	if err != nil {
		return nil, fmt.Errorf("list approved comments: %w", err)
	}
	defer rows.Close()
	var out []*content.BlogComment
	for rows.Next() {
		c, err := scanComment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *CommentRepo) ListAdmin(ctx context.Context, f ports.CommentFilter) ([]*content.CommentRow, int, error) {
	where, args := []string{"1=1"}, []any{}
	if f.Status != "" {
		where = append(where, "c.status = $"+fmt.Sprint(len(args)+1))
		args = append(args, f.Status)
	}
	if f.PostID != "" {
		where = append(where, "c.post_id = $"+fmt.Sprint(len(args)+1))
		args = append(args, f.PostID)
	}
	if f.Q != "" {
		where = append(where, "(c.author_name ILIKE $"+fmt.Sprint(len(args)+1)+" OR c.body ILIKE $"+fmt.Sprint(len(args)+1)+")")
		args = append(args, "%"+f.Q+"%")
	}
	cond := joinAND(where)
	rows, err := r.pool.Query(ctx,
		`SELECT `+commentColumnsC+`, p.slug, p.title FROM blog_comments c
		 JOIN blog_posts p ON p.id = c.post_id WHERE `+cond+
			` ORDER BY c.created_at DESC LIMIT $`+fmt.Sprint(len(args)+1)+` OFFSET $`+fmt.Sprint(len(args)+2),
		append(append([]any{}, args...), f.PerPage, (f.Page-1)*f.PerPage)...)
	if err != nil {
		return nil, 0, fmt.Errorf("list admin comments: %w", err)
	}
	defer rows.Close()
	var out []*content.CommentRow
	for rows.Next() {
		row := &content.CommentRow{}
		var status string
		if err := rows.Scan(&row.ID, &row.PostID, &row.ParentID, &row.AuthorName, &row.AuthorEmail,
			&row.Body, &status, &row.ApprovedBy, &row.CreatedAt, &row.PostSlug, &row.PostTitle); err != nil {
			return nil, 0, fmt.Errorf("scan comment row: %w", err)
		}
		row.Status = content.CommentStatus(status)
		out = append(out, row)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = r.pool.QueryRow(ctx,
		`SELECT count(*) FROM blog_comments c WHERE `+cond, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count comments: %w", err)
	}
	return out, total, nil
}

func (r *CommentRepo) CountByStatus(ctx context.Context) (map[string]int, error) {
	rows, err := r.pool.Query(ctx, `SELECT status, count(*) FROM blog_comments GROUP BY status`)
	if err != nil {
		return nil, fmt.Errorf("count comments by status: %w", err)
	}
	defer rows.Close()
	out := map[string]int{"pending": 0, "approved": 0, "spam": 0}
	for rows.Next() {
		var s string
		var n int
		if err := rows.Scan(&s, &n); err != nil {
			return nil, err
		}
		out[s] = n
	}
	return out, rows.Err()
}

// Approve stamps approved status + who approved it.
func (r *CommentRepo) Approve(ctx context.Context, id, actorID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE blog_comments SET status='approved', approved_by=$2 WHERE id=$1`, id, actorID)
	if err != nil {
		return fmt.Errorf("approve comment: %w", err)
	}
	return nil
}

func (r *CommentRepo) SetStatus(ctx context.Context, id uuid.UUID, s content.CommentStatus) error {
	_, err := r.pool.Exec(ctx, `UPDATE blog_comments SET status=$2 WHERE id=$1`, id, string(s))
	if err != nil {
		return fmt.Errorf("set comment status: %w", err)
	}
	return nil
}

func (r *CommentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM blog_comments WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete comment: %w", err)
	}
	return nil
}
