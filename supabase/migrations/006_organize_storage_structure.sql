-- Add registration_id to abstracts table for better organization
ALTER TABLE abstracts
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL;

-- Create index on registration_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_abstracts_registration_id ON abstracts(registration_id);

-- Add index on email for linking abstracts to registrations
-- This helps when registration_id is not available but email is
CREATE INDEX IF NOT EXISTS idx_abstracts_email_lookup ON abstracts(email) WHERE email IS NOT NULL;

