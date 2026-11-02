-- Keep the uploader's original file name for display in admin pickers/grids.
ALTER TABLE media_assets ADD COLUMN filename TEXT NOT NULL DEFAULT '';
