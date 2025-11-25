-- Create storage bucket for abstracts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'abstracts',
  'abstracts',
  false,
  10485760, -- 10MB in bytes
  ARRAY['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
-- Note: Storage RLS is handled differently, but we'll set up policies

-- Policy: Allow public upload to abstracts bucket
CREATE POLICY "Allow public upload abstracts"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'abstracts');

-- Policy: Allow authenticated users to read from abstracts bucket
CREATE POLICY "Allow authenticated read abstracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'abstracts');

-- Policy: Allow anon users to read (for admin panel - DEVELOPMENT ONLY)
-- WARNING: Remove this policy in production!
CREATE POLICY "Allow anon read abstracts"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'abstracts');

-- Policy: Allow service role full access
CREATE POLICY "Allow service role all abstracts"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'abstracts')
WITH CHECK (bucket_id = 'abstracts');

