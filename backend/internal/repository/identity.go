// Package repository holds pgx implementations of the ports. SQL is
// hand-written and fully parameterized; sqlc adoption is deferred until the
// query surface stabilizes (docs/08 §2 note).
package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
)

// --- users ---

type UserRepo struct{ pool *pgxpool.Pool }

func NewUserRepo(pool *pgxpool.Pool) *UserRepo { return &UserRepo{pool: pool} }

const userColumns = `id, mobile, email, full_name, COALESCE(password_hash,''), status,
	mobile_verified_at, last_login_at, created_at, updated_at`

func scanUser(row pgx.Row) (*identity.User, error) {
	u := &identity.User{}
	var status string
	err := row.Scan(&u.ID, &u.Mobile, &u.Email, &u.FullName, &u.PasswordHash, &status,
		&u.MobileVerifiedAt, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan user: %w", err)
	}
	u.Status = identity.Status(status)
	return u, nil
}

func (r *UserRepo) Create(ctx context.Context, u *identity.User) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO users (id, mobile, email, full_name, password_hash, status)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6)`,
		u.ID, u.Mobile, u.Email, u.FullName, u.PasswordHash, string(u.Status))
	if err != nil {
		return fmt.Errorf("insert user: %w", err)
	}
	return nil
}

func (r *UserRepo) ByMobile(ctx context.Context, mobile string) (*identity.User, error) {
	return scanUser(r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE mobile = $1 AND status <> 'deleted'`, mobile))
}

func (r *UserRepo) ByID(ctx context.Context, id uuid.UUID) (*identity.User, error) {
	return scanUser(r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE id = $1 AND status <> 'deleted'`, id))
}

func (r *UserRepo) Roles(ctx context.Context, userID uuid.UUID) ([]identity.Role, error) {
	rows, err := r.pool.Query(ctx, `SELECT role FROM user_roles WHERE user_id = $1`, userID)
	if err != nil {
		return nil, fmt.Errorf("select roles: %w", err)
	}
	defer rows.Close()
	var roles []identity.Role
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return nil, fmt.Errorf("scan role: %w", err)
		}
		roles = append(roles, identity.Role(role))
	}
	return roles, rows.Err()
}

func (r *UserRepo) AddRole(ctx context.Context, userID uuid.UUID, role identity.Role) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, string(role))
	if err != nil {
		return fmt.Errorf("insert role: %w", err)
	}
	return nil
}

func (r *UserRepo) SetMobileVerified(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET mobile_verified_at = now(), updated_at = now() WHERE id = $1`, userID)
	if err != nil {
		return fmt.Errorf("verify mobile: %w", err)
	}
	return nil
}

func (r *UserRepo) UpdatePassword(ctx context.Context, userID uuid.UUID, hash string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, userID, hash)
	if err != nil {
		return fmt.Errorf("update password: %w", err)
	}
	return nil
}

func (r *UserRepo) TouchLogin(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET last_login_at = now() WHERE id = $1`, userID)
	if err != nil {
		return fmt.Errorf("touch login: %w", err)
	}
	return nil
}

// --- otp codes ---

type OTPRepo struct{ pool *pgxpool.Pool }

func NewOTPRepo(pool *pgxpool.Pool) *OTPRepo { return &OTPRepo{pool: pool} }

const otpColumns = `id, mobile, code_hash, purpose, expires_at, attempts, consumed_at, created_at`

func scanOTP(row pgx.Row) (*identity.OTP, error) {
	o := &identity.OTP{}
	var purpose string
	err := row.Scan(&o.ID, &o.Mobile, &o.CodeHash, &purpose, &o.ExpiresAt, &o.Attempts, &o.ConsumedAt, &o.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan otp: %w", err)
	}
	o.Purpose = identity.Purpose(purpose)
	return o, nil
}

func (r *OTPRepo) Create(ctx context.Context, o *identity.OTP) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO otp_codes (id, mobile, code_hash, purpose, expires_at) VALUES ($1, $2, $3, $4, $5)`,
		o.ID, o.Mobile, o.CodeHash, string(o.Purpose), o.ExpiresAt)
	if err != nil {
		return fmt.Errorf("insert otp: %w", err)
	}
	return nil
}

func (r *OTPRepo) Latest(ctx context.Context, mobile string, p identity.Purpose) (*identity.OTP, error) {
	return scanOTP(r.pool.QueryRow(ctx,
		`SELECT `+otpColumns+` FROM otp_codes
		 WHERE mobile = $1 AND purpose = $2 AND consumed_at IS NULL
		 ORDER BY created_at DESC LIMIT 1`, mobile, string(p)))
}

func (r *OTPRepo) LatestAny(ctx context.Context, mobile string, p identity.Purpose) (*identity.OTP, error) {
	return scanOTP(r.pool.QueryRow(ctx,
		`SELECT `+otpColumns+` FROM otp_codes
		 WHERE mobile = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1`, mobile, string(p)))
}

func (r *OTPRepo) Consume(ctx context.Context, id uuid.UUID) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`UPDATE otp_codes SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL`, id)
	if err != nil {
		return false, fmt.Errorf("consume otp: %w", err)
	}
	return tag.RowsAffected() == 1, nil
}

func (r *OTPRepo) IncrementAttempts(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("increment otp attempts: %w", err)
	}
	return nil
}

// --- refresh tokens ---

type TokenRepo struct{ pool *pgxpool.Pool }

func NewTokenRepo(pool *pgxpool.Pool) *TokenRepo { return &TokenRepo{pool: pool} }

const tokenColumns = `id, user_id, family_id, token_hash, expires_at, revoked_at, replaced_by, ip, user_agent, created_at`

func scanToken(row pgx.Row) (*identity.RefreshToken, error) {
	t := &identity.RefreshToken{}
	err := row.Scan(&t.ID, &t.UserID, &t.FamilyID, &t.TokenHash, &t.ExpiresAt, &t.RevokedAt,
		&t.ReplacedBy, &t.IP, &t.UserAgent, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ports.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan refresh token: %w", err)
	}
	return t, nil
}

func (r *TokenRepo) Create(ctx context.Context, t *identity.RefreshToken) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, expires_at, ip, user_agent)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		t.ID, t.UserID, t.FamilyID, t.TokenHash, t.ExpiresAt, t.IP, t.UserAgent)
	if err != nil {
		return fmt.Errorf("insert refresh token: %w", err)
	}
	return nil
}

func (r *TokenRepo) ByHash(ctx context.Context, tokenHash string) (*identity.RefreshToken, error) {
	return scanToken(r.pool.QueryRow(ctx,
		`SELECT `+tokenColumns+` FROM refresh_tokens WHERE token_hash = $1`, tokenHash))
}

// Rotate revokes the old token and inserts its replacement in one transaction,
// so a crash can never leave a consumed token without a successor.
func (r *TokenRepo) Rotate(ctx context.Context, oldID uuid.UUID, next *identity.RefreshToken) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin rotate: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	now := time.Now()
	tag, err := tx.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = $2, replaced_by = $3 WHERE id = $1 AND revoked_at IS NULL`,
		oldID, now, next.ID)
	if err != nil {
		return fmt.Errorf("revoke old token: %w", err)
	}
	if tag.RowsAffected() != 1 {
		return ports.ErrNotFound
	}
	_, err = tx.Exec(ctx,
		`INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, expires_at, ip, user_agent)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		next.ID, next.UserID, next.FamilyID, next.TokenHash, next.ExpiresAt, next.IP, next.UserAgent)
	if err != nil {
		return fmt.Errorf("insert rotated token: %w", err)
	}
	return tx.Commit(ctx)
}

func (r *TokenRepo) RevokeByHash(ctx context.Context, tokenHash string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, tokenHash)
	if err != nil {
		return fmt.Errorf("revoke token: %w", err)
	}
	return nil
}

func (r *TokenRepo) RevokeFamily(ctx context.Context, familyID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL`, familyID)
	if err != nil {
		return fmt.Errorf("revoke family: %w", err)
	}
	return nil
}

func (r *TokenRepo) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, userID)
	if err != nil {
		return fmt.Errorf("revoke all tokens: %w", err)
	}
	return nil
}
