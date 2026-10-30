-- 000003_courses: media assets, instructor profile, courses, curriculum,
-- reviews, entitlements (docs/03 §3 course + commerce-lite).

CREATE TYPE course_level   AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE course_status  AS ENUM ('draft', 'published', 'archived');
CREATE TYPE lesson_status  AS ENUM ('draft', 'ready', 'published');
CREATE TYPE media_kind     AS ENUM ('video', 'image', 'pdf');
CREATE TYPE media_status   AS ENUM ('uploaded', 'processing', 'ready', 'failed');
CREATE TYPE review_status  AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE entitlement_source AS ENUM ('purchase', 'grant', 'refund_reversed');

CREATE TABLE media_assets (
    id              UUID PRIMARY KEY,
    kind            media_kind NOT NULL,
    storage_key     TEXT       NOT NULL,          -- server-generated UUID path
    mime            VARCHAR(100) NOT NULL DEFAULT '',
    size_bytes      BIGINT     NOT NULL DEFAULT 0,
    checksum_sha256 TEXT       NULL,
    status          media_status NOT NULL DEFAULT 'uploaded',
    duration_seconds INT NULL,
    vod_provider    TEXT NULL,
    vod_remote_id   TEXT NULL,
    error_message   TEXT NULL,
    uploaded_by     UUID NULL REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE instructors (
    user_id         UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    headline        VARCHAR(200) NOT NULL DEFAULT '',
    bio_html        TEXT NOT NULL DEFAULT '',
    avatar_media_id UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    socials         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE course_categories (
    id         UUID PRIMARY KEY,
    slug       TEXT NOT NULL UNIQUE,
    title      TEXT NOT NULL,
    position   INT  NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE courses (
    id                   UUID PRIMARY KEY,
    slug                 TEXT NOT NULL UNIQUE,
    instructor_id        UUID NOT NULL REFERENCES instructors (user_id),
    title                TEXT NOT NULL,
    summary              TEXT NOT NULL DEFAULT '',
    description_html     TEXT NOT NULL DEFAULT '',
    cover_media_id       UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    promo_video_media_id UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    level                course_level  NOT NULL DEFAULT 'beginner',
    status               course_status NOT NULL DEFAULT 'draft',
    price_rial           BIGINT NOT NULL DEFAULT 0,
    compare_at_price_rial BIGINT NULL,
    is_featured          BOOLEAN NOT NULL DEFAULT false,
    prerequisites_html   TEXT NOT NULL DEFAULT '',
    outcomes             JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_at         TIMESTAMPTZ NULL,
    meta_title           TEXT NULL,
    meta_description     TEXT NULL,
    og_image_media_id    UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    deleted_at           TIMESTAMPTZ NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_public ON courses (status, published_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE course_category_courses (
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES course_categories (id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, category_id)
);

CREATE TABLE course_sections (
    id        UUID PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    title     TEXT NOT NULL,
    position  INT  NOT NULL,
    UNIQUE (course_id, position)
);

CREATE TABLE lessons (
    id               UUID PRIMARY KEY,
    section_id       UUID NOT NULL REFERENCES course_sections (id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    content_html     TEXT NOT NULL DEFAULT '',
    position         INT  NOT NULL,
    is_preview       BOOLEAN NOT NULL DEFAULT false,
    duration_seconds INT  NOT NULL DEFAULT 0,
    status           lesson_status NOT NULL DEFAULT 'draft',
    media_id         UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (section_id, position)
);
CREATE INDEX idx_lessons_section ON lessons (section_id, position);

CREATE TABLE lesson_attachments (
    id             UUID PRIMARY KEY,
    lesson_id      UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    media_id       UUID NOT NULL REFERENCES media_assets (id),
    title          TEXT NOT NULL,
    allow_download BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
    id          UUID PRIMARY KEY,
    course_id   UUID   NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    user_id     UUID   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body        TEXT NOT NULL DEFAULT '',
    status      review_status NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, user_id)
);

CREATE TABLE entitlements (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    course_id  UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    source     entitlement_source NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NULL,             -- NULL = lifetime
    order_id   UUID NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_entitlements_active ON entitlements (user_id, course_id) WHERE revoked_at IS NULL;
