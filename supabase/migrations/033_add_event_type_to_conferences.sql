-- =====================================================
-- Add event_type support to conferences table
-- This enables support for multiple event types:
-- - conference (default, existing)
-- - workshop
-- - seminar
-- - webinar
-- - training
-- - other
-- =====================================================

-- Step 1: Add event_type column with default 'conference'
ALTER TABLE conferences 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'conference' 
CHECK (event_type IN ('conference', 'workshop', 'seminar', 'webinar', 'training', 'other'));

-- Step 2: Update all existing conferences to have event_type = 'conference'
UPDATE conferences 
SET event_type = 'conference' 
WHERE event_type IS NULL;

-- Step 3: Make event_type NOT NULL after setting defaults
ALTER TABLE conferences 
ALTER COLUMN event_type SET NOT NULL;

-- Step 4: Create index for faster filtering by event type
CREATE INDEX IF NOT EXISTS idx_conferences_event_type ON conferences(event_type);

-- Step 5: Update slug uniqueness to be per event_type (optional)
-- This allows same slug for different event types
-- Comment out if you want globally unique slugs
-- DROP INDEX IF EXISTS idx_conferences_slug;
-- CREATE UNIQUE INDEX idx_conferences_slug_event_type ON conferences(slug, event_type);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN conferences.event_type IS 'Type of event: conference, workshop, seminar, webinar, training, or other';
