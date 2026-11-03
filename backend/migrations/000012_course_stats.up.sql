-- 000012_course_stats: watch time per learner per lesson per day, plus the
-- indexes the admin course-statistics aggregates need.
--
-- The player reports a heartbeat; the server credits the smaller of the
-- reported delta and the wall-clock gap since the previous beat, so a paused
-- or scrubbed player cannot inflate the total. `day` is the product calendar
-- day (Asia/Tehran) because the console renders Jalali dates.
CREATE TABLE lesson_watch_daily (
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id    UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    day          DATE NOT NULL,
    seconds      INT NOT NULL DEFAULT 0,
    last_beat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id, day)
);
CREATE INDEX idx_watch_daily_lesson ON lesson_watch_daily (lesson_id);
CREATE INDEX idx_watch_daily_beat ON lesson_watch_daily (user_id, lesson_id, last_beat_at DESC);

-- the aggregates join and filter on these columns; none of them were indexed
CREATE INDEX idx_entitlements_course ON entitlements (course_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_order_items_course ON order_items (course_id);
CREATE INDEX idx_reviews_course ON reviews (course_id);
CREATE INDEX idx_progress_lesson ON lesson_progress (lesson_id);
CREATE INDEX idx_sections_course ON course_sections (course_id);
