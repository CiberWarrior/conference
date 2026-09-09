-- Academic ops upgrades: abstract workflow, peer review, program, add-ons, manage tokens
-- Apply on Supabase before relying on new features in production.

-- ---------------------------------------------------------------------------
-- Abstracts: status workflow
-- ---------------------------------------------------------------------------
ALTER TABLE abstracts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'withdrawn'));

ALTER TABLE abstracts
  ADD COLUMN IF NOT EXISTS decision_notes TEXT;

ALTER TABLE abstracts
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

ALTER TABLE abstracts
  ADD COLUMN IF NOT EXISTS title TEXT;

CREATE INDEX IF NOT EXISTS idx_abstracts_conference_status
  ON abstracts (conference_id, status);

-- ---------------------------------------------------------------------------
-- Peer review
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abstract_reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  invite_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conference_id, email)
);

CREATE TABLE IF NOT EXISTS abstract_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abstract_id UUID NOT NULL REFERENCES abstracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES abstract_reviewers(id) ON DELETE CASCADE,
  score INTEGER CHECK (score IS NULL OR (score >= 1 AND score <= 5)),
  comments TEXT,
  recommendation TEXT CHECK (
    recommendation IS NULL OR recommendation IN ('accept', 'reject', 'revise')
  ),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (abstract_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_abstract_reviews_abstract
  ON abstract_reviews (abstract_id);

CREATE INDEX IF NOT EXISTS idx_abstract_reviewers_token
  ON abstract_reviewers (invite_token);

ALTER TABLE abstract_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE abstract_reviews ENABLE ROW LEVEL SECURITY;

-- Service role / admin APIs use service client; keep RLS on with no public policies.
DROP POLICY IF EXISTS abstract_reviewers_deny_all ON abstract_reviewers;
CREATE POLICY abstract_reviewers_deny_all ON abstract_reviewers
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS abstract_reviews_deny_all ON abstract_reviews;
CREATE POLICY abstract_reviews_deny_all ON abstract_reviews
  FOR ALL USING (false) WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Program / sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  track TEXT,
  room TEXT,
  session_type TEXT NOT NULL DEFAULT 'oral'
    CHECK (session_type IN ('oral', 'poster', 'keynote', 'break', 'other')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  abstract_id UUID REFERENCES abstracts(id) ON DELETE SET NULL,
  title TEXT,
  speaker_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_sessions_conference
  ON program_sessions (conference_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_program_items_session
  ON program_items (session_id, sort_order);

ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS program_sessions_public_read ON program_sessions;
CREATE POLICY program_sessions_public_read ON program_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conferences c
      WHERE c.id = program_sessions.conference_id
        AND c.published = true
    )
  );

DROP POLICY IF EXISTS program_items_public_read ON program_items;
CREATE POLICY program_items_public_read ON program_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM program_sessions s
      JOIN conferences c ON c.id = s.conference_id
      WHERE s.id = program_items.session_id
        AND c.published = true
    )
  );

-- Admin writes via service role (bypasses RLS). Deny authenticated direct writes.
DROP POLICY IF EXISTS program_sessions_deny_write ON program_sessions;
CREATE POLICY program_sessions_deny_write ON program_sessions
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS program_items_deny_write ON program_items;
CREATE POLICY program_items_deny_write ON program_items
  FOR INSERT WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Registration manage tokens (attendee self-service, no login)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registration_manage_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_registration_manage_tokens_registration
  ON registration_manage_tokens (registration_id);

ALTER TABLE registration_manage_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS registration_manage_tokens_deny_all ON registration_manage_tokens;
CREATE POLICY registration_manage_tokens_deny_all ON registration_manage_tokens
  FOR ALL USING (false) WITH CHECK (false);

-- Selected add-ons JSON on registrations (id, quantity, unit_price, label)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;
