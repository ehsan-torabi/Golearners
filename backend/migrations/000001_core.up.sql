-- 000001_core: shared foundation tables (settings + audit log).
-- Domain tables (identity, courses, commerce, …) land with their phases per docs/10.

CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY,          -- app-generated UUIDv7
    actor_user_id UUID NULL,
    action        TEXT        NOT NULL,      -- e.g. "course.publish", "order.refund"
    entity_type   TEXT        NOT NULL,
    entity_id     TEXT        NULL,
    before        JSONB       NULL,
    after         JSONB       NULL,
    ip            INET        NULL,
    user_agent    TEXT        NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action     ON audit_logs (action);
