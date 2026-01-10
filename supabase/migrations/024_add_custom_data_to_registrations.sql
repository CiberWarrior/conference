-- Add custom_data JSONB column to registrations table
-- This allows storing custom registration fields dynamically

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_registrations_custom_data ON registrations USING GIN (custom_data);

-- Add comment
COMMENT ON COLUMN registrations.custom_data IS 'Stores custom registration field values as key-value pairs';




