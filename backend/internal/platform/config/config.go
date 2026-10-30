// Package config loads and validates application configuration from the
// environment. It is parsed exactly once at startup; nothing else in the
// codebase may read environment variables directly.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config is the fully-parsed application configuration.
type Config struct {
	Env      string // development | test | production
	BaseURL  string // public site URL, used for canonical links and callbacks
	HTTPPort string
	LogLevel string

	DatabaseURL string
	RedisAddr   string

	S3Endpoint  string // S3-compatible endpoint (MinIO locally, provider S3 in prod)
	S3Region    string
	S3Bucket    string
	S3AccessKey string
	S3SecretKey string
	S3UseSSL    bool

	JWTSecret string // ≥ 32 bytes in production; signs access tokens and peppers OTP hashes

	SMSProvider string // mock | kavenegar
}

// Load reads the environment and fails fast on missing or invalid values.
func Load() (Config, error) {
	c := Config{
		Env:         envOr("APP_ENV", "development"),
		BaseURL:     envOr("APP_BASE_URL", "http://localhost:3000"),
		HTTPPort:    envOr("HTTP_PORT", "8080"),
		LogLevel:    envOr("LOG_LEVEL", "info"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisAddr:   envOr("REDIS_ADDR", "localhost:6379"),
		S3Endpoint:  envOr("S3_ENDPOINT", "http://localhost:9000"),
		S3Region:    envOr("S3_REGION", "us-east-1"),
		S3Bucket:    envOr("S3_BUCKET", "golearn-media"),
		S3AccessKey: os.Getenv("S3_ACCESS_KEY"),
		S3SecretKey: os.Getenv("S3_SECRET_KEY"),
		JWTSecret:   os.Getenv("JWT_SECRET"),

		SMSProvider: envOr("SMS_PROVIDER", "mock"),
	}

	useSSL, err := strconv.ParseBool(envOr("S3_USE_SSL", "false"))
	if err != nil {
		return Config{}, fmt.Errorf("parse S3_USE_SSL: %w", err)
	}
	c.S3UseSSL = useSSL

	// Slice (not map) so the error message order is deterministic.
	required := [][2]string{
		{"DATABASE_URL", c.DatabaseURL},
		{"S3_ACCESS_KEY", c.S3AccessKey},
		{"S3_SECRET_KEY", c.S3SecretKey},
		{"JWT_SECRET", c.JWTSecret},
	}
	var missing []string
	for _, kv := range required {
		if kv[1] == "" {
			missing = append(missing, kv[0])
		}
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}
	if c.Env == "production" && len(c.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET must be at least 32 characters in production")
	}
	return c, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
