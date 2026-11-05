-- Blog growth (sisoog-style): series, guest comments, views, featured.
CREATE TABLE blog_series (
    id          uuid PRIMARY KEY,
    slug        text NOT NULL UNIQUE,
    title       text NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts
    ADD COLUMN series_id   uuid REFERENCES blog_series(id) ON DELETE SET NULL,
    ADD COLUMN series_part integer,
    ADD COLUMN featured    boolean NOT NULL DEFAULT false,
    ADD COLUMN views       integer NOT NULL DEFAULT 0;

CREATE INDEX idx_blog_posts_views   ON blog_posts (views DESC, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_series  ON blog_posts (series_id, series_part);

CREATE TABLE blog_comments (
    id           uuid PRIMARY KEY,
    post_id      uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    parent_id    uuid REFERENCES blog_comments(id) ON DELETE CASCADE,
    author_name  text NOT NULL,
    author_email text NOT NULL,
    body         text NOT NULL,
    status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'spam')),
    approved_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_comments_post ON blog_comments (post_id, status, created_at);
