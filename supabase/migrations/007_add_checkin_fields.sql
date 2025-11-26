-- Add check-in fields to registrations table
-- This migration adds check-in functionality

-- Add checked_in column
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

-- Add checked_in_at timestamp
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster check-in queries
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON registrations(checked_in);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in_at ON registrations(checked_in_at);

-- Add comment
COMMENT ON COLUMN registrations.checked_in IS 'Whether the participant has checked in at the conference';
COMMENT ON COLUMN registrations.checked_in_at IS 'Timestamp when the participant checked in';

