-- Abstract management upgrades (phase 1 + phase 2)
-- Apply on Supabase before relying on new features in production.

-- ---------------------------------------------------------------------------
-- Abstracts: add "revise" status + revision tracking
-- ---------------------------------------------------------------------------
-- Drop any existing CHECK constraint on abstracts.status (auto-generated name may vary)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'abstracts'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE abstracts DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE abstracts
  ADD CONSTRAINT abstracts_status_check CHECK (
    status IN ('pending', 'under_review', 'revise', 'accepted', 'rejected', 'withdrawn')
  );

ALTER TABLE abstracts
  ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ;

ALTER TABLE abstracts
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- Backfill title from custom_data for existing rows
UPDATE abstracts
SET title = NULLIF(TRIM(custom_data->>'abstractTitle'), '')
WHERE (title IS NULL OR TRIM(title) = '')
  AND NULLIF(TRIM(custom_data->>'abstractTitle'), '') IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Reviewer reminders
-- ---------------------------------------------------------------------------
ALTER TABLE abstract_reviews
  ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Author self-service tokens (no login required)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abstract_manage_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abstract_id UUID NOT NULL REFERENCES abstracts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_abstract_manage_tokens_abstract
  ON abstract_manage_tokens (abstract_id);

ALTER TABLE abstract_manage_tokens ENABLE ROW LEVEL SECURITY;

-- Only the service role (admin/public API routes) may read or write these.
DROP POLICY IF EXISTS abstract_manage_tokens_deny_all ON abstract_manage_tokens;
CREATE POLICY abstract_manage_tokens_deny_all ON abstract_manage_tokens
  FOR ALL USING (false) WITH CHECK (false);
