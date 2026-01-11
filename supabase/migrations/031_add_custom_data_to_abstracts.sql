-- Add custom_data JSONB column to abstracts table
-- This allows storing custom abstract submission fields dynamically

ALTER TABLE abstracts
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_abstracts_custom_data ON abstracts USING GIN (custom_data);

-- Add comment
COMMENT ON COLUMN abstracts.custom_data IS 'Stores custom abstract submission field values as key-value pairs';
