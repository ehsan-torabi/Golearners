package config

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLoadMissingRequiredFailsFast(t *testing.T) {
	for _, key := range []string{"DATABASE_URL", "S3_ACCESS_KEY", "S3_SECRET_KEY", "JWT_SECRET"} {
		t.Setenv(key, "")
	}

	_, err := Load()
	require.Error(t, err)
	require.Contains(t, err.Error(), "DATABASE_URL")
	require.Contains(t, err.Error(), "JWT_SECRET")
}

func TestLoadProductionRejectsWeakJWTSecret(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://localhost/db")
	t.Setenv("S3_ACCESS_KEY", "ak")
	t.Setenv("S3_SECRET_KEY", "sk")
	t.Setenv("JWT_SECRET", "too-short")

	_, err := Load()
	require.Error(t, err)
	require.Contains(t, err.Error(), "JWT_SECRET")
}

func TestLoadMapsEnvironment(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", "postgres://golearn:golearn@localhost:5432/golearn")
	t.Setenv("S3_ACCESS_KEY", "minioadmin")
	t.Setenv("S3_SECRET_KEY", "minioadmin")
	t.Setenv("JWT_SECRET", strings.Repeat("x", 32))
	t.Setenv("HTTP_PORT", "9090")
	t.Setenv("S3_BUCKET", "test-bucket")

	cfg, err := Load()
	require.NoError(t, err)
	require.Equal(t, "9090", cfg.HTTPPort)
	require.Equal(t, "test-bucket", cfg.S3Bucket)
	require.False(t, cfg.S3UseSSL)
}
