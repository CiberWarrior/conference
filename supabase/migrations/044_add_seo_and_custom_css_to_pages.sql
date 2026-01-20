-- =====================================================
-- Add SEO and Custom CSS fields to conference_pages
-- =====================================================

ALTER TABLE conference_pages
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT,
ADD COLUMN IF NOT EXISTS custom_css TEXT;

COMMENT ON COLUMN conference_pages.meta_title IS 'Custom meta title for SEO (if not set, uses page title)';
COMMENT ON COLUMN conference_pages.meta_description IS 'Custom meta description for SEO';
COMMENT ON COLUMN conference_pages.og_image_url IS 'Open Graph image URL for social sharing';
COMMENT ON COLUMN conference_pages.custom_css IS 'Custom CSS styles for this page';
