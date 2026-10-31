-- 000007_learning: lesson progress tracking (docs/01 US-D2).
CREATE TABLE lesson_progress (
    id               UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id        UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    position_seconds INT NOT NULL DEFAULT 0,
    completed_at     TIMESTAMPTZ NULL,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_progress_user_lesson ON lesson_progress (user_id, updated_at DESC);
