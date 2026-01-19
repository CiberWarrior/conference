-- ============================================
-- CREATE CONFERENCES TABLE (if missing)
-- ============================================
-- Run this FIRST if you get "relation 'conferences' does not exist" error

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
  
  -- Ownership
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

-- Create index on owner_id for multi-user support
CREATE INDEX IF NOT EXISTS idx_conferences_owner_id ON conferences(owner_id);

-- Add conference_id to registrations table (if not exists)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS conference_id UUID REFERENCES conferences(id) ON DELETE CASCADE;

-- Create index on conference_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_registrations_conference_id ON registrations(conference_id);

-- Enable RLS on conferences table
ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
DROP POLICY IF EXISTS "Allow service role all conferences" ON conferences;
CREATE POLICY "Allow service role all conferences" ON conferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all conferences
DROP POLICY IF EXISTS "Allow authenticated read conferences" ON conferences;
CREATE POLICY "Allow authenticated read conferences" ON conferences
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users to read published conferences
DROP POLICY IF EXISTS "Allow anon read published conferences" ON conferences;
CREATE POLICY "Allow anon read published conferences" ON conferences
  FOR SELECT
  TO anon
  USING (published = true);

-- ============================================
-- SUCCESS! Now run RUN_PAYMENT_MIGRATIONS_IN_ORDER.sql
-- ============================================
