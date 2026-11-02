-- 000010_category_icons: an icon key per course category, rendered by the
-- site topic tiles (lucide name; empty = initials fallback).
ALTER TABLE course_categories ADD COLUMN icon TEXT NOT NULL DEFAULT '';
