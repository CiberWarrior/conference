-- =====================================================
-- MULTI-TENANT CONFERENCE PLATFORM - Database Schema
-- =====================================================

-- 1. Create conferences table
CREATE TABLE IF NOT EXISTS conferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Event Details
  start_date DATE,
  end_date DATE,
  location TEXT,
  venue TEXT,
  
  -- Branding
  logo_url TEXT,
  website_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  
  -- Pricing (JSONB for flexibility)
  pricing JSONB DEFAULT '{
    "currency": "EUR",
    "early_bird": {
      "amount": 150,
      "deadline": null
    },
    "regular": {
      "amount": 200
    },
    "late": {
      "amount": 250
    },
    "student_discount": 50
  }'::jsonb,
  
  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{
    "registration_enabled": true,
    "abstract_submission_enabled": true,
    "payment_required": true,
    "max_registrations": null,
    "timezone": "Europe/Zagreb"
  }'::jsonb,
  
  -- Email Configuration
  email_settings JSONB DEFAULT '{
    "from_email": null,
    "from_name": null,
    "reply_to": null
  }'::jsonb,
  
  -- Ownership (for now, just one global admin)
  owner_id TEXT DEFAULT 'admin',
  
  -- Status
  active BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_conferences_slug ON conferences(slug);

-- Create index on active conferences
CREATE INDEX IF NOT EXISTS idx_conferences_active ON conferences(active) WHERE active = true;

-- Create index on owner_id for multi-user support later
CREATE INDEX IF NOT EXISTS idx_conferences_owner_id ON conferences(owner_id);

-- =====================================================
-- 2. Add conference_id to existing tables
-- =====================================================

-- Add conference_id to registrations table
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS conference_id UUID REFERENCES conferences(id) ON DELETE CASCADE;

-- Create index on conference_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_registrations_conference_id ON registrations(conference_id);

-- Add conference_id to abstracts table
ALTER TABLE abstracts 
ADD COLUMN IF NOT EXISTS conference_id UUID REFERENCES conferences(id) ON DELETE CASCADE;

-- Create index on conference_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_abstracts_conference_id ON abstracts(conference_id);

-- =====================================================
-- 3. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on conferences table
ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Allow service role all conferences" ON conferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all conferences (for admin panel)
CREATE POLICY "Allow authenticated read conferences" ON conferences
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users to read published conferences (for public pages)
CREATE POLICY "Allow anon read published conferences" ON conferences
  FOR SELECT
  TO anon
  USING (published = true);

-- =====================================================
-- 4. Helper Functions
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on conferences table
DROP TRIGGER IF EXISTS update_conferences_updated_at ON conferences;
CREATE TRIGGER update_conferences_updated_at
  BEFORE UPDATE ON conferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Generate slug from name function
-- =====================================================
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NOTES:
-- - conference_id is nullable for now (existing data)
-- - For new registrations/abstracts, conference_id will be required
-- - Use ON DELETE CASCADE to automatically clean up data when conference is deleted
-- =====================================================

