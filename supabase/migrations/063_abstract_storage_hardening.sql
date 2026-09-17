-- 063: Harden abstract document storage + add private bucket for organizer templates
--
-- Background: 003_create_storage_bucket.sql created the private `abstracts` bucket but
-- attached broad policies (anon/authenticated INSERT, authenticated whole-bucket SELECT,
-- anon SELECT). All abstract uploads/downloads now go through server API routes using
-- the service role, so those policies are removed. Downloads are issued as short-lived
-- signed URLs only after the API has authorized the caller.

-- ---------------------------------------------------------------------------
-- 1. abstracts bucket: drop unsafe policies, keep service role access
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public upload abstracts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read abstracts" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read abstracts" ON storage.objects;

-- Ensure bucket stays private and only accepts the formats supported by the app
-- (DOCX + PDF, 10 MB). Legacy .doc objects already stored are unaffected.
UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ]
WHERE id = 'abstracts';

-- Service role policy (idempotent re-create so the file is safe to re-run)
DROP POLICY IF EXISTS "Allow service role all abstracts" ON storage.objects;
CREATE POLICY "Allow service role all abstracts"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'abstracts')
WITH CHECK (bucket_id = 'abstracts');

-- ---------------------------------------------------------------------------
-- 2. conference-templates bucket: PRIVATE, DOCX only, 5 MB, service role only
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conference-templates',
  'conference-templates',
  false,
  5242880,
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow service role all conference templates" ON storage.objects;
CREATE POLICY "Allow service role all conference templates"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'conference-templates')
WITH CHECK (bucket_id = 'conference-templates');

-- No anon / authenticated policies are created on purpose:
-- template download for authors goes through /api/conferences/[slug]/abstract-template
-- which issues a short-lived signed URL only when the conference uses document upload.
