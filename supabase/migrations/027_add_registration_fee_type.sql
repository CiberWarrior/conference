-- Add registration_fee_type column to registrations table
-- This column stores the selected registration fee category

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS registration_fee_type TEXT;

-- Add comment
COMMENT ON COLUMN registrations.registration_fee_type IS 'Type of registration fee selected: early_bird, regular, late, student, accompanying_person';

-- Create index for filtering by fee type
CREATE INDEX IF NOT EXISTS idx_registrations_fee_type ON registrations (registration_fee_type);
