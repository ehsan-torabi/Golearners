package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/ports"
)

// AIRepo implements ports.AIDraftRepo and ports.AIUsageRepo over Postgres.
type AIRepo struct{ pool *pgxpool.Pool }

func NewAIRepo(pool *pgxpool.Pool) *AIRepo { return &AIRepo{pool: pool} }

const aiDraftCols = `id, kind, action, target_type, target_id, target_label, status,
	summary, notes, instructions, original, proposed, provider, model,
	prompt_tokens, completion_tokens, created_by, error, created_at, decided_at, applied_at`

func scanAIDraft(row pgx.Row) (*ports.AIDraft, error) {
	var d ports.AIDraft
	var original, proposed []byte
	err := row.Scan(&d.ID, &d.Kind, &d.Action, &d.TargetType, &d.TargetID, &d.TargetLabel,
		&d.Status, &d.Summary, &d.Notes, &d.Instructions, &original, &proposed,
		&d.Provider, &d.Model, &d.PromptTokens, &d.CompletionTokens, &d.CreatedBy,
		&d.Error, &d.CreatedAt, &d.DecidedAt, &d.AppliedAt)
	if err != nil {
		return nil, err
	}
	if original != nil {
		d.Original = json.RawMessage(original)
	}
	d.Proposed = json.RawMessage(proposed)
	return &d, nil
}

func (r *AIRepo) Create(ctx context.Context, d *ports.AIDraft) error {
	row := r.pool.QueryRow(ctx, `INSERT INTO ai_drafts
		(kind, action, target_type, target_id, target_label, status, summary, notes,
		 instructions, original, proposed, provider, model, prompt_tokens,
		 completion_tokens, created_by, error)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
		RETURNING `+aiDraftCols,
		d.Kind, d.Action, d.TargetType, d.TargetID, d.TargetLabel, d.Status,
		d.Summary, d.Notes, d.Instructions, d.Original, d.Proposed,
		d.Provider, d.Model, d.PromptTokens, d.CompletionTokens, d.CreatedBy, d.Error)
	out, err := scanAIDraft(row)
	if err != nil {
		return fmt.Errorf("create ai draft: %w", err)
	}
	*d = *out
	return nil
}

func (r *AIRepo) ByID(ctx context.Context, id int64) (*ports.AIDraft, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+aiDraftCols+` FROM ai_drafts WHERE id = $1`, id)
	d, err := scanAIDraft(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("ai draft %d: %w", id, ports.ErrNotFound)
		}
		return nil, fmt.Errorf("get ai draft: %w", err)
	}
	return d, nil
}

func (r *AIRepo) List(ctx context.Context, f ports.AIDraftFilter, page, perPage int) ([]*ports.AIDraft, int, error) {
	where := "WHERE true"
	args := []any{}
	n := 0
	if f.Status != "" {
		n++
		where += fmt.Sprintf(" AND status = $%d", n)
		args = append(args, f.Status)
	}
	if f.Kind != "" {
		n++
		where += fmt.Sprintf(" AND kind = $%d", n)
		args = append(args, f.Kind)
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT count(*) FROM ai_drafts `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count ai drafts: %w", err)
	}
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	n++
	args = append(args, perPage)
	n++
	args = append(args, (page-1)*perPage)
	rows, err := r.pool.Query(ctx,
		`SELECT `+aiDraftCols+` FROM ai_drafts `+where+
			fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, n-1, n), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list ai drafts: %w", err)
	}
	defer rows.Close()
	out := []*ports.AIDraft{}
	for rows.Next() {
		row := rows
		d, err := scanAIDraft(row)
		if err != nil {
			return nil, 0, fmt.Errorf("scan ai draft: %w", err)
		}
		out = append(out, d)
	}
	return out, total, rows.Err()
}

func (r *AIRepo) SetStatus(ctx context.Context, id int64, status, errNote string) error {
	ct, err := r.pool.Exec(ctx, `UPDATE ai_drafts
		SET status = $2, error = $3, decided_at = now() WHERE id = $1`,
		id, status, errNote)
	if err != nil {
		return fmt.Errorf("set ai draft status: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("ai draft %d: %w", id, ports.ErrNotFound)
	}
	return nil
}

func (r *AIRepo) MarkApplied(ctx context.Context, id int64) error {
	ct, err := r.pool.Exec(ctx, `UPDATE ai_drafts
		SET status = 'applied', decided_at = now(), applied_at = now(), error = ''
		WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("mark ai draft applied: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("ai draft %d: %w", id, ports.ErrNotFound)
	}
	return nil
}

func (r *AIRepo) Delete(ctx context.Context, id int64) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM ai_drafts WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete ai draft: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("ai draft %d: %w", id, ports.ErrNotFound)
	}
	return nil
}

func (r *AIRepo) Insert(ctx context.Context, kind, provider, model string, ok bool,
	promptTokens, completionTokens, durationMs int, errNote string) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO ai_usage
		(kind, provider, model, ok, prompt_tokens, completion_tokens, duration_ms, error)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		kind, provider, model, ok, promptTokens, completionTokens, durationMs, errNote)
	if err != nil {
		return fmt.Errorf("insert ai usage: %w", err)
	}
	return nil
}

func (r *AIRepo) Summary(ctx context.Context, days int) (*ports.AIUsageSummary, error) {
	out := &ports.AIUsageSummary{ByKind: map[string]int{}}
	rows, err := r.pool.Query(ctx, `SELECT kind, count(*),
			sum(prompt_tokens), sum(completion_tokens),
			count(*) FILTER (WHERE ok), count(*) FILTER (WHERE NOT ok)
		FROM ai_usage WHERE created_at > now() - ($1 || ' days')::interval
		GROUP BY kind`, fmt.Sprint(days))
	if err != nil {
		return nil, fmt.Errorf("ai usage summary: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var kind string
		var count int
		var pt, ct, okCount, failCount int64
		if err := rows.Scan(&kind, &count, &pt, &ct, &okCount, &failCount); err != nil {
			return nil, fmt.Errorf("scan ai usage: %w", err)
		}
		out.ByKind[kind] = count
		out.Requests += count
		out.OK += int(okCount)
		out.Failed += int(failCount)
		out.PromptTokens += pt
		out.CompletionTokens += ct
	}
	return out, rows.Err()
}

func (r *AIRepo) Daily(ctx context.Context, days int) ([]ports.AIUsageDay, error) {
	rows, err := r.pool.Query(ctx, `SELECT to_char(
			(created_at AT TIME ZONE 'Asia/Tehran')::date, 'YYYY-MM-DD') AS day,
			count(*), sum(prompt_tokens), sum(completion_tokens)
		FROM ai_usage WHERE created_at > now() - ($1 || ' days')::interval
		GROUP BY 1 ORDER BY 1`, fmt.Sprint(days))
	if err != nil {
		return nil, fmt.Errorf("ai usage daily: %w", err)
	}
	defer rows.Close()
	out := []ports.AIUsageDay{}
	for rows.Next() {
		var d ports.AIUsageDay
		if err := rows.Scan(&d.Day, &d.Requests, &d.PromptTokens, &d.CompletionTokens); err != nil {
			return nil, fmt.Errorf("scan ai usage day: %w", err)
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// compile-time proof both interfaces are satisfied
var (
	_ ports.AIDraftRepo = (*AIRepo)(nil)
	_ ports.AIUsageRepo = (*AIRepo)(nil)
)
