-- 000002_identity: users, roles, sessions (refresh tokens), OTP codes.
-- Money-free context; see docs/03 §3 for field notes.

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'instructor', 'learner');
CREATE TYPE user_status AS ENUM ('active', 'blocked', 'deleted');

CREATE TABLE users (
    id                UUID PRIMARY KEY,            -- app-generated UUIDv7
    mobile            VARCHAR(11) NOT NULL UNIQUE, -- 09xxxxxxxxx
    email             VARCHAR(255) NULL UNIQUE,
    full_name         VARCHAR(120) NOT NULL,
    password_hash     TEXT NULL,                   -- Argon2id encoded; NULL until password set
    status            user_status NOT NULL DEFAULT 'active',
    mobile_verified_at TIMESTAMPTZ NULL,
    last_login_at     TIMESTAMPTZ NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles as enum rows (multi-role ready); docs/03 refined from a roles table to this.
CREATE TABLE user_roles (
    user_id UUID      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role    user_role NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    family_id   UUID        NOT NULL,             -- rotation family; reuse ⇒ revoke family
    token_hash  TEXT        NOT NULL UNIQUE,      -- sha256 of the opaque token
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ NULL,
    replaced_by UUID        NULL,
    ip          TEXT        NOT NULL DEFAULT '',
    user_agent  TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX idx_refresh_tokens_user   ON refresh_tokens (user_id);

CREATE TABLE otp_codes (
    id          UUID PRIMARY KEY,
    mobile      VARCHAR(11) NOT NULL,
    code_hash   TEXT        NOT NULL,             -- HMAC-SHA256 (server pepper)
    purpose     TEXT        NOT NULL CHECK (purpose IN ('verify', 'login', 'reset')),
    expires_at  TIMESTAMPTZ NOT NULL,
    attempts    INT         NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_codes_mobile ON otp_codes (mobile, purpose, created_at DESC);
