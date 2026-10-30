// Package jwt implements ports.TokenSigner with short-lived HS256 access tokens.
// Refresh tokens are opaque DB-backed values, NOT JWTs (docs/02 ADR-1).
package jwt

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const issuer = "golearn"

var ErrInvalid = errors.New("invalid access token")

type Signer struct {
	key []byte
	ttl time.Duration
}

func New(secret string, ttl time.Duration) *Signer {
	return &Signer{key: []byte(secret), ttl: ttl}
}

func (s *Signer) SignAccess(_ context.Context, userID uuid.UUID) (string, time.Time, error) {
	now := time.Now()
	exp := now.Add(s.ttl)
	claims := jwt.RegisteredClaims{
		Issuer:    issuer,
		Subject:   userID.String(),
		ID:        uuid.New().String(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(exp),
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.key)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign access token: %w", err)
	}
	return token, exp, nil
}

func (s *Signer) ParseAccess(_ context.Context, token string) (uuid.UUID, error) {
	parsed, err := jwt.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("%w: unexpected signing method", ErrInvalid)
		}
		return s.key, nil
	}, jwt.WithIssuer(issuer), jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired())
	if err != nil || !parsed.Valid {
		return uuid.Nil, ErrInvalid
	}
	claims, ok := parsed.Claims.(*jwt.RegisteredClaims)
	if !ok || claims.Subject == "" {
		return uuid.Nil, ErrInvalid
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, ErrInvalid
	}
	return userID, nil
}
