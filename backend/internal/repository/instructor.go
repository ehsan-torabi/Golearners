package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// InstructorRepo implements ports.InstructorRepo.
type InstructorRepo struct{ pool *pgxpool.Pool }

func NewInstructorRepo(pool *pgxpool.Pool) *InstructorRepo { return &InstructorRepo{pool: pool} }

func scanInstructor(row pgx.Row) (*course.Instructor, error) {
	i := &course.Instructor{}
	var socials []byte
	err := row.Scan(&i.UserID, &i.Headline, &i.BioHTML, &i.AvatarMediaID, &socials)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan instructor: %w", err)
	}
	_ = json.Unmarshal(socials, &i.Socials)
	return i, nil
}

func (r *InstructorRepo) Primary(ctx context.Context) (*course.Instructor, error) {
	return scanInstructor(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT user_id, headline, bio_html, avatar_media_id, socials FROM instructors LIMIT 1`))
}

func (r *InstructorRepo) Upsert(ctx context.Context, i *course.Instructor) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO instructors (user_id, headline, bio_html, avatar_media_id, socials)
		 VALUES ($1,$2,$3,$4,$5)
		 ON CONFLICT (user_id) DO UPDATE SET headline=$2, bio_html=$3,
		 avatar_media_id=$4, socials=$5, updated_at=now()`,
		i.UserID, i.Headline, i.BioHTML, i.AvatarMediaID, mustJSON(i.Socials))
	if err != nil {
		return fmt.Errorf("upsert instructor: %w", err)
	}
	return nil
}
