-- Add accommodation fields to registrations table
-- This allows storing accommodation details (check-in, check-out, nights)

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS accommodation JSONB DEFAULT NULL;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_registrations_accommodation ON registrations USING GIN (accommodation);

-- Add comment
COMMENT ON COLUMN registrations.accommodation IS 'Accommodation details stored as JSONB: {arrival_date, departure_date, number_of_nights}';

-- Example structure:
-- accommodation: {
--   "arrival_date": "2026-06-15",
--   "departure_date": "2026-06-20",
--   "number_of_nights": 5
-- }
