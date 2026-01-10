-- Add custom_data column to registrations table
-- This allows storing any custom registration data that doesn't fit in standard fields

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_registrations_custom_data ON registrations USING GIN (custom_data);

-- Add comment
COMMENT ON COLUMN registrations.custom_data IS 'Custom registration data stored as JSONB for flexible form fields';
