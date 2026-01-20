-- =====================================================
-- Add Hero Layout fields to conference_pages
-- =====================================================

ALTER TABLE conference_pages
ADD COLUMN IF NOT EXISTS hero_layout_type TEXT DEFAULT 'centered',
ADD COLUMN IF NOT EXISTS hero_logo_url TEXT,
ADD COLUMN IF NOT EXISTS hero_info_cards JSONB;

COMMENT ON COLUMN conference_pages.hero_layout_type IS 'Hero layout type: centered, split (text left, logo right)';
COMMENT ON COLUMN conference_pages.hero_logo_url IS 'URL to logo/illustration for split layout (right side)';
COMMENT ON COLUMN conference_pages.hero_info_cards IS 'JSON array of info cards (e.g., [{"label":"START DATE","value":"Jul 10, 2027","icon":"calendar"}])';
