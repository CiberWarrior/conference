-- Create storage bucket for conference logos
-- This bucket should be PUBLIC so logos can be displayed on public pages

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conference-logos',
  'conference-logos',
  true, -- PUBLIC bucket so logos can be accessed without authentication
  2097152, -- 2MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public upload to conference-logos bucket (for admin)
CREATE POLICY "Allow public upload conference logos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'conference-logos');

-- Policy: Allow public read from conference-logos bucket
CREATE POLICY "Allow public read conference logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'conference-logos');

-- Policy: Allow authenticated users to update/delete their conference logos
CREATE POLICY "Allow authenticated update conference logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'conference-logos')
WITH CHECK (bucket_id = 'conference-logos');

CREATE POLICY "Allow authenticated delete conference logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'conference-logos');

-- Policy: Allow service role full access
CREATE POLICY "Allow service role all conference logos"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'conference-logos')
WITH CHECK (bucket_id = 'conference-logos');

