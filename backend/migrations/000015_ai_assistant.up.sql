-- 000015: AI assistant — provider config lives in the settings KV under "ai";
-- these tables hold the human-in-the-loop draft pipeline and usage metering.

CREATE TABLE ai_drafts (
    id                 BIGSERIAL PRIMARY KEY,
    kind               TEXT NOT NULL CHECK (kind IN
                         ('blog_post','course_copy','seo','stats_report','freeform')),
    action             TEXT NOT NULL DEFAULT 'none' CHECK (action IN ('create','update','none')),
    target_type        TEXT NOT NULL DEFAULT '' CHECK (target_type IN ('','post','course')),
    target_id          UUID,
    target_label       TEXT NOT NULL DEFAULT '',
    status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
                         ('pending','applied','rejected','ready','failed')),
    summary            TEXT NOT NULL DEFAULT '',
    notes              TEXT NOT NULL DEFAULT '',
    instructions       TEXT NOT NULL DEFAULT '',
    original           JSONB,
    proposed           JSONB NOT NULL DEFAULT '{}'::jsonb,
    provider           TEXT NOT NULL DEFAULT '',
    model              TEXT NOT NULL DEFAULT '',
    prompt_tokens      INT NOT NULL DEFAULT 0,
    completion_tokens  INT NOT NULL DEFAULT 0,
    created_by         UUID REFERENCES users(id),
    error              TEXT NOT NULL DEFAULT '',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at         TIMESTAMPTZ,
    applied_at         TIMESTAMPTZ
);

CREATE INDEX idx_ai_drafts_status ON ai_drafts (status, created_at DESC);
CREATE INDEX idx_ai_drafts_kind   ON ai_drafts (kind, created_at DESC);

CREATE TABLE ai_usage (
    id                 BIGSERIAL PRIMARY KEY,
    kind               TEXT NOT NULL,
    provider           TEXT NOT NULL DEFAULT '',
    model              TEXT NOT NULL DEFAULT '',
    ok                 BOOLEAN NOT NULL DEFAULT true,
    prompt_tokens      INT NOT NULL DEFAULT 0,
    completion_tokens  INT NOT NULL DEFAULT 0,
    duration_ms        INT NOT NULL DEFAULT 0,
    error              TEXT NOT NULL DEFAULT '',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_day ON ai_usage (created_at DESC);
