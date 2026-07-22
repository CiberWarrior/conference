-- Create storage bucket for registration attachments (bank transfer proofs, file-type custom fields)
-- Public bucket, consistent with existing abstracts/page-images buckets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registration-attachments',
  'registration-attachments',
  true, -- PUBLIC bucket, same pattern as abstracts / page-images
  10485760, -- 10MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public upload (registration happens without login)
CREATE POLICY "Allow public upload registration attachments"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'registration-attachments');

-- Policy: Allow public read
CREATE POLICY "Allow public read registration attachments"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'registration-attachments');

-- Policy: Allow service role full access
CREATE POLICY "Allow service role all registration attachments"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'registration-attachments')
WITH CHECK (bucket_id = 'registration-attachments');
