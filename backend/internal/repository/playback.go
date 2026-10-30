// Attachment + playback-session repositories.
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

// AttachmentRepo implements ports.AttachmentRepo.
type AttachmentRepo struct{ pool *pgxpool.Pool }

func NewAttachmentRepo(pool *pgxpool.Pool) *AttachmentRepo { return &AttachmentRepo{pool: pool} }

func scanAttachment(row pgx.Row) (*course.LessonAttachment, error) {
	a := &course.LessonAttachment{}
	err := row.Scan(&a.ID, &a.LessonID, &a.MediaID, &a.Title, &a.AllowDownload)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan attachment: %w", err)
	}
	return a, nil
}

func (r *AttachmentRepo) ByID(ctx context.Context, id uuid.UUID) (*course.LessonAttachment, error) {
	return scanAttachment(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT id, lesson_id, media_id, title, allow_download FROM lesson_attachments WHERE id=$1`, id))
}

func (r *AttachmentRepo) ListByLesson(ctx context.Context, lessonID uuid.UUID) ([]*course.LessonAttachment, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, lesson_id, media_id, title, allow_download
		 FROM lesson_attachments WHERE lesson_id=$1 ORDER BY title`, lessonID)
	if err != nil {
		return nil, fmt.Errorf("list attachments: %w", err)
	}
	defer rows.Close()
	var out []*course.LessonAttachment
	for rows.Next() {
		a, err := scanAttachment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *AttachmentRepo) Create(ctx context.Context, a *course.LessonAttachment) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO lesson_attachments (id, lesson_id, media_id, title, allow_download)
		 VALUES ($1,$2,$3,$4,$5)`,
		a.ID, a.LessonID, a.MediaID, a.Title, a.AllowDownload)
	if err != nil {
		return fmt.Errorf("insert attachment: %w", err)
	}
	return nil
}

func (r *AttachmentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM lesson_attachments WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete attachment: %w", err)
	}
	return nil
}

// PlaybackSessionRepo implements ports.PlaybackSessionRepo.
type PlaybackSessionRepo struct{ pool *pgxpool.Pool }

func NewPlaybackSessionRepo(pool *pgxpool.Pool) *PlaybackSessionRepo {
	return &PlaybackSessionRepo{pool: pool}
}

func (r *PlaybackSessionRepo) Insert(ctx context.Context, s *course.PlaybackSession) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO playback_sessions (id, user_id, lesson_id, issued_at, expires_at, ip)
		 VALUES ($1,$2,$3,coalesce($4, now()),$5,$6)`,
		s.ID, s.UserID, s.LessonID, s.IssuedAt, s.ExpiresAt, s.IP)
	if err != nil {
		return fmt.Errorf("insert playback session: %w", err)
	}
	return nil
}
