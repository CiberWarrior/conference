-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  payment_required BOOLEAN DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('pending', 'paid', 'not_required')),
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for registration)
CREATE POLICY "Allow public insert" ON registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to read (for admin panel)
-- Note: In production, you should restrict this to admin users only
CREATE POLICY "Allow authenticated read" ON registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users to read (for admin panel - DEVELOPMENT ONLY)
-- WARNING: Remove this policy in production and use proper authentication!
CREATE POLICY "Allow anon read" ON registrations
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow service role to do everything (for API routes)
CREATE POLICY "Allow service role all" ON registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

