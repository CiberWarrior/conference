-- =====================================================
-- Add Hero Section fields to conference_pages
-- =====================================================

ALTER TABLE conference_pages
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_background_color TEXT;

COMMENT ON COLUMN conference_pages.hero_title IS 'Optional hero title (if not set, uses page title)';
COMMENT ON COLUMN conference_pages.hero_subtitle IS 'Optional hero subtitle/description';
COMMENT ON COLUMN conference_pages.hero_image_url IS 'Optional hero background image URL';
COMMENT ON COLUMN conference_pages.hero_background_color IS 'Optional hero background color (hex code)';
