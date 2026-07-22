-- Migration: Tighten overly permissive RLS policies
-- Date: July 2026
--
-- Removes development-era policies that allowed anonymous/any-authenticated
-- access to personal data, and replaces them with permission-scoped policies.
--
-- Verified against application code paths:
-- * Public registration inserts (anon) keep working via "Allow public insert".
-- * Admin pages/API routes use authenticated sessions and are covered by the
--   conference-permission scoped policies (recreated below defensively).
-- * Participant API routes and /api/register participant-profile linking use
--   the service role client, which bypasses RLS.

-- ============================================
-- 1. REGISTRATIONS
-- ============================================

-- Anonymous users must never read registrations (PII leak).
DROP POLICY IF EXISTS "Allow anon read" ON registrations;

-- Any-authenticated read/update is too broad: participants are also
-- authenticated users. Scoped policies below take over.
DROP POLICY IF EXISTS "Allow authenticated read" ON registrations;
DROP POLICY IF EXISTS "Allow update registrations" ON registrations;

-- Recreate the scoped policies (idempotent) so this migration is self-sufficient.
DROP POLICY IF EXISTS "Users see registrations for their conferences" ON registrations;
CREATE POLICY "Users see registrations for their conferences"
  ON registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid()
        AND conference_id = registrations.conference_id
    )
  );

DROP POLICY IF EXISTS "Users can manage registrations for their conferences" ON registrations;
CREATE POLICY "Users can manage registrations for their conferences"
  ON registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid()
        AND conference_id = registrations.conference_id
    )
  );

-- ============================================
-- 2. ABSTRACTS
-- ============================================

DROP POLICY IF EXISTS "Allow anon read abstracts" ON abstracts;
DROP POLICY IF EXISTS "Allow authenticated read abstracts" ON abstracts;

DROP POLICY IF EXISTS "Users see abstracts for their conferences" ON abstracts;
CREATE POLICY "Users see abstracts for their conferences"
  ON abstracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid()
        AND conference_id = abstracts.conference_id
    )
  );

DROP POLICY IF EXISTS "Users can manage abstracts for their conferences" ON abstracts;
CREATE POLICY "Users can manage abstracts for their conferences"
  ON abstracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid()
        AND conference_id = abstracts.conference_id
    )
  );

-- ============================================
-- 3. PARTICIPANT SYSTEM
-- ============================================
-- The old "admin_all_access_*" policies had USING (true) with no role
-- restriction, which effectively disabled RLS on these tables (anyone,
-- including anonymous visitors, could read all participant profiles).
-- Service role bypasses RLS anyway, so these policies are replaced with
-- admin-scoped SELECT. Writes go through service-role API routes.

DROP POLICY IF EXISTS admin_all_access_participants ON participant_profiles;
DROP POLICY IF EXISTS admin_all_access_registrations ON participant_registrations;

-- Admins (super admin or any conference admin) can read participant profiles
-- (needed for the admin registrations list join and the participants page).
DROP POLICY IF EXISTS admins_select_participant_profiles ON participant_profiles;
CREATE POLICY admins_select_participant_profiles
  ON participant_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.active = true
        AND (
          up.role = 'super_admin'
          OR EXISTS (
            SELECT 1 FROM conference_permissions cp WHERE cp.user_id = up.id
          )
        )
    )
  );

DROP POLICY IF EXISTS admins_select_participant_registrations ON participant_registrations;
CREATE POLICY admins_select_participant_registrations
  ON participant_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.active = true
        AND (
          up.role = 'super_admin'
          OR EXISTS (
            SELECT 1 FROM conference_permissions cp WHERE cp.user_id = up.id
          )
        )
    )
  );

-- Participants can update their own registrations (e.g. cancellation).
-- Previously covered only by the open admin_all_access policy.
DROP POLICY IF EXISTS participant_update_own_registrations ON participant_registrations;
CREATE POLICY participant_update_own_registrations
  ON participant_registrations FOR UPDATE
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM participant_profiles WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    participant_id IN (
      SELECT id FROM participant_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Super admins can update participant profiles (admin participants page).
DROP POLICY IF EXISTS super_admins_update_participant_profiles ON participant_profiles;
CREATE POLICY super_admins_update_participant_profiles
  ON participant_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );

-- Participants can read their own loyalty discounts (dashboard);
-- super admins can read all (admin participant detail page).
-- RLS was enabled on this table without any policy, so reads silently
-- returned nothing even for the owner.
DROP POLICY IF EXISTS participant_own_loyalty_discounts ON participant_loyalty_discounts;
CREATE POLICY participant_own_loyalty_discounts
  ON participant_loyalty_discounts FOR SELECT
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM participant_profiles WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );

-- ============================================
-- 4. CONTACT INQUIRIES
-- ============================================
-- Old policies allowed anyone (including anon) to read, update and delete
-- inquiries. Inquiries are a super-admin feature; keep the public INSERT
-- for the contact form.

DROP POLICY IF EXISTS "Admin can view all contact inquiries" ON contact_inquiries;
DROP POLICY IF EXISTS "Admin can update contact inquiries" ON contact_inquiries;
DROP POLICY IF EXISTS "Admin can delete contact inquiries" ON contact_inquiries;

CREATE POLICY "Super admins can view contact inquiries"
  ON contact_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );

CREATE POLICY "Super admins can update contact inquiries"
  ON contact_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );

CREATE POLICY "Super admins can delete contact inquiries"
  ON contact_inquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );

-- ============================================
-- 5. SUPPORT TICKETS
-- ============================================
-- Old policies allowed anyone (including anon) full access.
-- Both super admins and conference admins use tickets via the admin API
-- (authenticated session); system-generated tickets use the service role.

DROP POLICY IF EXISTS "Admin can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admin can insert support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admin can update support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admin can delete support tickets" ON support_tickets;

CREATE POLICY "Admins can view support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'conference_admin')
        AND active = true
    )
  );

CREATE POLICY "Admins can insert support tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'conference_admin')
        AND active = true
    )
  );

CREATE POLICY "Admins can update support tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'conference_admin')
        AND active = true
    )
  );

CREATE POLICY "Admins can delete support tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'conference_admin')
        AND active = true
    )
  );

COMMENT ON POLICY "Users see registrations for their conferences" ON registrations IS
'Scoped read access: super admins see all, conference admins see registrations of conferences they have permissions for. Public/anon access removed in migration 056.';
