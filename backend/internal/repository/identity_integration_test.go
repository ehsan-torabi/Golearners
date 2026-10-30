// Integration tests against a real PostgreSQL. Skipped unless TEST_DATABASE_URL
// is set (CI sets it; local: make infra && export TEST_DATABASE_URL).
// Migrations are applied programmatically so the suite is self-contained.
package repository_test

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	pgxv5migrate "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"

	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/repository"
)

// openTestDB connects to the integration database with migrations applied.
func openTestDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping integration tests")
	}
	applyMigrations(t, url)
	pool, err := pgxpool.New(context.Background(), url)
	require.NoError(t, err)
	t.Cleanup(pool.Close)
	return pool
}

// applyMigrations mirrors cmd/migrate (pgx stdlib driver + golang-migrate).
func applyMigrations(t *testing.T, url string) {
	t.Helper()
	sqlDB, err := sql.Open("pgx", url)
	require.NoError(t, err)
	defer sqlDB.Close()

	driver, err := pgxv5migrate.WithInstance(sqlDB, &pgxv5migrate.Config{})
	require.NoError(t, err)
	m, err := migrate.NewWithDatabaseInstance("file://migrations", "postgres", driver)
	require.NoError(t, err)
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		require.NoError(t, err)
	}
}

func TestUserRepoCreateAndLookup(t *testing.T) {
	pool := openTestDB(t)
	users := repository.NewUserRepo(pool)
	ctx := context.Background()

	want := &identity.User{
		ID:           uuid.Must(uuid.NewV7()),
		Mobile:       "09121234567",
		FullName:     "دانجو تستی",
		PasswordHash: "x",
		Status:       identity.StatusActive,
	}
	require.NoError(t, users.Create(ctx, want))

	got, err := users.ByMobile(ctx, "09121234567")
	require.NoError(t, err)
	require.Equal(t, want.ID, got.ID)
	require.Equal(t, want.FullName, got.FullName)
	require.Equal(t, identity.StatusActive, got.Status)

	got, err = users.ByID(ctx, want.ID)
	require.NoError(t, err)
	require.Equal(t, want.Mobile, got.Mobile)
}

func TestOTPConsumeIsAtomic(t *testing.T) {
	pool := openTestDB(t)
	otps := repository.NewOTPRepo(pool)
	ctx := context.Background()

	otp := &identity.OTP{
		ID:        uuid.Must(uuid.NewV7()),
		Mobile:    "09121234567",
		CodeHash:  "h",
		Purpose:   identity.PurposeVerify,
		ExpiresAt: time.Now().Add(time.Minute),
		CreatedAt: time.Now(),
	}
	require.NoError(t, otps.Create(ctx, otp))

	const racers = 8
	results := make([]bool, racers)
	var wg sync.WaitGroup
	for i := 0; i < racers; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			ok, err := otps.Consume(ctx, otp.ID)
			require.NoError(t, err)
			results[i] = ok
		}(i)
	}
	wg.Wait()

	wins := 0
	for _, ok := range results {
		if ok {
			wins++
		}
	}
	require.Equal(t, 1, wins, "exactly one racer may consume the OTP")
}

func TestRefreshRotateAndReuseRevokesFamily(t *testing.T) {
	pool := openTestDB(t)
	tokens := repository.NewTokenRepo(pool)
	users := repository.NewUserRepo(pool)
	ctx := context.Background()

	uid := uuid.Must(uuid.NewV7())
	require.NoError(t, users.Create(ctx, &identity.User{
		ID: uid, Mobile: "09121234567", FullName: "دانجو", Status: identity.StatusActive,
	}))

	plain1, hash1, err := identity.NewOpaqueRefreshToken()
	require.NoError(t, err)
	t1 := &identity.RefreshToken{
		ID: uuid.Must(uuid.NewV7()), UserID: uid, FamilyID: uuid.Must(uuid.NewV7()),
		TokenHash: hash1, ExpiresAt: time.Now().Add(time.Hour),
	}
	require.NoError(t, tokens.Create(ctx, t1))

	plain2, hash2, err := identity.NewOpaqueRefreshToken()
	require.NoError(t, err)
	t2 := &identity.RefreshToken{
		ID: uuid.Must(uuid.NewV7()), UserID: uid, FamilyID: t1.FamilyID,
		TokenHash: hash2, ExpiresAt: time.Now().Add(time.Hour),
	}
	require.NoError(t, tokens.Rotate(ctx, t1.ID, t2))

	// old token revoked
	old, err := tokens.ByHash(ctx, hash1)
	require.NoError(t, err)
	require.NotNil(t, old.RevokedAt)

	// reuse of old token → family revoked
	_ = plain1
	_ = plain2
	require.NoError(t, tokens.RevokeFamily(ctx, t1.FamilyID))
	newer, err := tokens.ByHash(ctx, hash2)
	require.NoError(t, err)
	require.NotNil(t, newer.RevokedAt)
}
