-- 000005_playback: playback-session audit (abuse monitoring per docs/06 §3).
CREATE TABLE playback_sessions (
    id         UUID PRIMARY KEY,
    user_id    UUID NULL REFERENCES users (id) ON DELETE SET NULL,
    lesson_id  UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    issued_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    ip         TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_playback_sessions_lesson ON playback_sessions (lesson_id, issued_at DESC);
CREATE INDEX idx_playback_sessions_user   ON playback_sessions (user_id, issued_at DESC);
