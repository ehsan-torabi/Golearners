package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/ports"
)

// AuditRepo implements ports.AuditRepo (append-only admin trail).
type AuditRepo struct{ pool *pgxpool.Pool }

func NewAuditRepo(pool *pgxpool.Pool) *AuditRepo { return &AuditRepo{pool: pool} }

func (r *AuditRepo) Insert(ctx context.Context, e *ports.AuditEntry) error {
	_, err := querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, before, after, ip, user_agent)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		e.ID, e.ActorID, e.Action, e.EntityType, e.EntityID, e.Before, e.After, e.IP, e.UserAgent)
	if err != nil {
		return fmt.Errorf("insert audit: %w", err)
	}
	return nil
}

func (r *AuditRepo) List(ctx context.Context, page, perPage int) ([]*ports.AuditEntry, int, error) {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT id, actor_user_id, action, entity_type, entity_id, before, after, ip, user_agent, created_at
		 FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`, perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, fmt.Errorf("list audit: %w", err)
	}
	defer rows.Close()
	var out []*ports.AuditEntry
	for rows.Next() {
		e := &ports.AuditEntry{}
		if err := rows.Scan(&e.ID, &e.ActorID, &e.Action, &e.EntityType, &e.EntityID,
			&e.Before, &e.After, &e.IP, &e.UserAgent, &e.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan audit: %w", err)
		}
		out = append(out, e)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx, `SELECT count(*) FROM audit_logs`).Scan(&total)
	return out, total, err
}
