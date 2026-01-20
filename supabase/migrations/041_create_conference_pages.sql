-- =====================================================
-- Conference Pages (Phase 1: Custom pages)
-- =====================================================

CREATE TABLE IF NOT EXISTS conference_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT conference_pages_slug_unique UNIQUE (conference_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_conference_pages_conference_id ON conference_pages(conference_id);
CREATE INDEX IF NOT EXISTS idx_conference_pages_published ON conference_pages(conference_id, published);
CREATE INDEX IF NOT EXISTS idx_conference_pages_sort_order ON conference_pages(conference_id, sort_order);

COMMENT ON TABLE conference_pages IS 'Custom pages per conference (Phase 1). content is stored as plain text and rendered safely.';
