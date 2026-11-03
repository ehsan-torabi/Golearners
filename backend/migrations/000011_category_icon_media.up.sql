-- 000011_category_icon_media: an uploaded image as the category icon, next to
-- the built-in lucide key (icon column). NULL = use the key / initials.
ALTER TABLE course_categories
    ADD COLUMN icon_media_id UUID NULL REFERENCES media_assets (id) ON DELETE SET NULL;
