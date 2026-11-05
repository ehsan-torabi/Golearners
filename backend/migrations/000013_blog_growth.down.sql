DROP TABLE IF EXISTS blog_comments;
DROP INDEX IF EXISTS idx_blog_posts_series;
DROP INDEX IF EXISTS idx_blog_posts_views;
ALTER TABLE blog_posts
    DROP COLUMN IF EXISTS views,
    DROP COLUMN IF EXISTS featured,
    DROP COLUMN IF EXISTS series_part,
    DROP COLUMN IF EXISTS series_id;
DROP TABLE IF EXISTS blog_series;
