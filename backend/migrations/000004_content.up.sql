-- 000004_content: blog, static pages, FAQs, testimonials, contact inbox.

CREATE TYPE post_status    AS ENUM ('draft', 'published');
CREATE TYPE contact_status AS ENUM ('new', 'read', 'replied');

CREATE TABLE blog_categories (
    id         UUID PRIMARY KEY,
    slug       TEXT NOT NULL UNIQUE,
    title      TEXT NOT NULL,
    position   INT  NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blog_tags (
    id         UUID PRIMARY KEY,
    slug       TEXT NOT NULL UNIQUE,
    title      TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blog_posts (
    id               UUID PRIMARY KEY,
    slug             TEXT NOT NULL UNIQUE,
    author_user_id   UUID NOT NULL REFERENCES users (id),
    title            TEXT NOT NULL,
    excerpt          TEXT NOT NULL DEFAULT '',
    body_html        TEXT NOT NULL DEFAULT '',
    cover_media_id   UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    category_id      UUID NULL REFERENCES blog_categories (id) ON DELETE SET NULL,
    status           post_status NOT NULL DEFAULT 'draft',
    published_at     TIMESTAMPTZ NULL,
    reading_minutes  INT NOT NULL DEFAULT 0,
    meta_title       TEXT NULL,
    meta_description TEXT NULL,
    og_image_media_id UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blog_posts_public ON blog_posts (status, published_at DESC);

CREATE TABLE blog_post_tags (
    post_id UUID NOT NULL REFERENCES blog_posts (id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES blog_tags (id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE pages (
    id               UUID PRIMARY KEY,
    slug             TEXT NOT NULL UNIQUE,
    title            TEXT NOT NULL,
    body_html        TEXT NOT NULL DEFAULT '',
    meta_title       TEXT NULL,
    meta_description TEXT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faqs (
    id           UUID PRIMARY KEY,
    question     TEXT NOT NULL,
    answer       TEXT NOT NULL,
    position     INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE testimonials (
    id              UUID PRIMARY KEY,
    author_name     TEXT NOT NULL,
    author_role     TEXT NOT NULL DEFAULT '',
    body            TEXT NOT NULL,
    rating          SMALLINT NULL CHECK (rating BETWEEN 1 AND 5),
    avatar_media_id UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    position        INT NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_messages (
    id         UUID PRIMARY KEY,
    user_id    UUID NULL REFERENCES users (id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    contact    TEXT NOT NULL,               -- mobile or email as entered
    subject    TEXT NOT NULL DEFAULT '',
    body       TEXT NOT NULL,
    status     contact_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
