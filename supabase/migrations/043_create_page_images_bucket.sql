-- Create storage bucket for conference page images
-- This bucket should be PUBLIC so images can be displayed on public pages

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-images',
  'page-images',
  true, -- PUBLIC bucket so images can be accessed without authentication
  5242880, -- 5MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload to page-images bucket
CREATE POLICY "Allow authenticated upload page images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'page-images');

-- Policy: Allow public read from page-images bucket
CREATE POLICY "Allow public read page images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'page-images');

-- Policy: Allow authenticated users to delete their uploaded images
CREATE POLICY "Allow authenticated delete page images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'page-images');

-- Policy: Allow service role full access
CREATE POLICY "Allow service role all page images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'page-images')
WITH CHECK (bucket_id = 'page-images');
