-- 000007_learning: per-lesson playback progress.
CREATE TABLE lesson_progress (
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id       UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    position_seconds INT NOT NULL DEFAULT 0,
    completed_at    TIMESTAMPTZ NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX idx_progress_user ON lesson_progress (user_id, updated_at DESC);
