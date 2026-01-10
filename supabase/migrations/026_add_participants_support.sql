-- Add support for multiple participants per registration
-- This allows one registration to have multiple participants with same fields

-- Add participants JSONB column to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_registrations_participants ON registrations USING GIN (participants);

-- Add comment
COMMENT ON COLUMN registrations.participants IS 'Array of participant objects, each with same fields as main registrant plus custom fields';

-- Example structure:
-- participants: [
--   {
--     "firstName": "John",
--     "lastName": "Doe",
--     "email": "john@example.com",
--     "phone": "+1234567890",
--     "country": "USA",
--     "institution": "University XYZ",
--     "customFields": {
--       "dietary_requirements": "Vegetarian",
--       "tshirt_size": "M"
--     }
--   },
--   {
--     "firstName": "Jane",
--     "lastName": "Smith",
--     ...
--   }
-- ]

-- Add participant settings to conferences table settings JSONB
-- This will be stored in conferences.settings.participant_settings
-- Structure:
-- {
--   "enabled": true,
--   "min_participants": 1,
--   "max_participants": 10,
--   "require_unique_emails": true,
--   "participant_fields": ["firstName", "lastName", "email", "phone", "country", "institution"],
--   "custom_fields_per_participant": true
-- }
