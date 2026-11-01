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

// MediaRepo implements ports.MediaRepo (metadata only; pipeline in phase 5).
type MediaRepo struct{ pool *pgxpool.Pool }

func NewMediaRepo(pool *pgxpool.Pool) *MediaRepo { return &MediaRepo{pool: pool} }

const mediaColumns = `id, kind, storage_key, mime, size_bytes, checksum_sha256, status,
	duration_seconds, vod_provider, vod_remote_id, error_message, uploaded_by,
	created_at, updated_at`

func scanMedia(row pgx.Row) (*course.MediaAsset, error) {
	m := &course.MediaAsset{}
	var kind, status string
	err := row.Scan(&m.ID, &kind, &m.StorageKey, &m.Mime, &m.SizeBytes, &m.Checksum,
		&status, &m.DurationSecs, &m.VODProvider, &m.VODRemoteID, &m.ErrorMessage,
		&m.UploadedBy, &m.CreatedAt, &m.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan media: %w", err)
	}
	m.Kind = course.MediaKind(kind)
	m.Status = course.MediaStatus(status)
	return m, nil
}

func (r *MediaRepo) Create(ctx context.Context, m *course.MediaAsset) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO media_assets (id, kind, storage_key, mime, size_bytes, checksum_sha256, status, duration_seconds, uploaded_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		m.ID, string(m.Kind), m.StorageKey, m.Mime, m.SizeBytes, m.Checksum, string(m.Status), m.DurationSecs, m.UploadedBy)
	if err != nil {
		return fmt.Errorf("insert media: %w", err)
	}
	return nil
}

func (r *MediaRepo) ByID(ctx context.Context, id uuid.UUID) (*course.MediaAsset, error) {
	return scanMedia(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+mediaColumns+` FROM media_assets WHERE id=$1`, id))
}

func (r *MediaRepo) List(ctx context.Context, f ports.MediaFilter) ([]*course.MediaAsset, int, error) {
	where := "TRUE"
	args := []any{}
	if f.Status != "" {
		where = "status = $1"
		args = append(args, f.Status)
	}
	if f.Kind != "" {
		where = where + " AND kind = $" + fmt.Sprint(len(args)+1)
		args = append(args, f.Kind)
	}
	if f.Q != "" {
		where = where + " AND storage_key ILIKE $" + fmt.Sprint(len(args)+1)
		args = append(args, "%"+f.Q+"%")
	}
	order := "created_at DESC"
	switch f.Sort {
	case "oldest":
		order = "created_at ASC"
	case "size_desc":
		order = "size_bytes DESC"
	case "size_asc":
		order = "size_bytes ASC"
	}
	q := `SELECT ` + mediaColumns + ` FROM media_assets WHERE ` + where +
		` ORDER BY ` + order + ` LIMIT $` + fmt.Sprint(len(args)+1) +
		` OFFSET $` + fmt.Sprint(len(args)+2)
	args = append(args, f.PerPage, (f.Page-1)*f.PerPage)
	rows, err := querierOf(ctx, r.pool).Query(ctx, q, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list media: %w", err)
	}
	defer rows.Close()
	var out []*course.MediaAsset
	for rows.Next() {
		m, err := scanMedia(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, m)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM media_assets WHERE `+where, args[:len(args)-2]...).Scan(&total)
	return out, total, err
}

func (r *MediaRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx, `DELETE FROM media_assets WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("delete media: %w", err)
	}
	return nil
}

func (r *MediaRepo) SetStatus(ctx context.Context, id uuid.UUID, status course.MediaStatus, errMsg string) error {
	var msgPtr *string
	if errMsg != "" {
		msgPtr = &errMsg
	}
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE media_assets SET status=$2, error_message=$3, updated_at=now() WHERE id=$1`,
		id, string(status), msgPtr)
	if err != nil {
		return fmt.Errorf("set media status: %w", err)
	}
	return nil
}

func (r *MediaRepo) SetIngested(ctx context.Context, id uuid.UUID, provider, remoteID string) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`UPDATE media_assets SET vod_provider=$2, vod_remote_id=$3, status='processing', updated_at=now() WHERE id=$1`,
		id, provider, remoteID)
	if err != nil {
		return fmt.Errorf("set ingested: %w", err)
	}
	return nil
}
