-- Create abstracts table
CREATE TABLE IF NOT EXISTS abstracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  email TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on uploaded_at for sorting
CREATE INDEX IF NOT EXISTS idx_abstracts_uploaded_at ON abstracts(uploaded_at DESC);

-- Create index on email for filtering
CREATE INDEX IF NOT EXISTS idx_abstracts_email ON abstracts(email);

-- Enable Row Level Security
ALTER TABLE abstracts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for abstract upload)
CREATE POLICY "Allow public insert abstracts" ON abstracts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to read (for admin panel)
CREATE POLICY "Allow authenticated read abstracts" ON abstracts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users to read (for admin panel - DEVELOPMENT ONLY)
-- WARNING: Remove this policy in production and use proper authentication!
CREATE POLICY "Allow anon read abstracts" ON abstracts
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow service role to do everything (for API routes)
CREATE POLICY "Allow service role all abstracts" ON abstracts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

