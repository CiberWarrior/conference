-- ============================================
-- Osiguraj da TESTER1 (pingu2111@yahoo.com) može login kao conference admin
-- ============================================
-- Pokreni u Supabase SQL Editoru. Korisnik mora već postojati u Authentication → Users.
-- UID TESTER1 s tvog screenshot-a: bf61bccd-6b56-46b5-adae-1fdc9f234694
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'bf61bccd-6b56-46b5-adae-1fdc9f234694'; -- TESTER1
  v_email TEXT := 'pingu2111@yahoo.com';
  v_granted_by UUID; -- super_admin koji dodjeljuje
BEGIN
  -- 1. Kreiraj ili ažuriraj user_profiles (conference_admin, active)
  INSERT INTO user_profiles (id, email, full_name, role, active, organization, created_at, updated_at)
  VALUES (
    v_user_id,
    v_email,
    'TESTER1',
    'conference_admin',
    true,
    'Test Organization',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = v_email,
    full_name = 'TESTER1',
    role = 'conference_admin',
    active = true,
    updated_at = NOW();

  -- 2. Nađi super_admina za granted_by (opcionalno)
  SELECT id INTO v_granted_by FROM user_profiles WHERE role = 'super_admin' AND active = true LIMIT 1;

  -- 3. Dodijeli pristup svim konferencijama
  INSERT INTO conference_permissions (
    user_id, conference_id,
    can_view_registrations, can_export_data, can_manage_payments, can_manage_abstracts,
    can_check_in, can_generate_certificates, can_edit_conference, can_delete_data, granted_by
  )
  SELECT
    v_user_id, c.id,
    true, true, true, true, true, true, true, true, v_granted_by
  FROM conferences c
  ON CONFLICT (user_id, conference_id) DO UPDATE SET
    can_view_registrations = true,
    can_export_data = true,
    can_manage_payments = true,
    can_manage_abstracts = true,
    can_check_in = true,
    can_generate_certificates = true,
    can_edit_conference = true,
    can_delete_data = true;

  RAISE NOTICE 'TESTER1 je postavljen kao conference_admin s pristupom svim konferencijama.';
END $$;

-- Provjera
SELECT up.email, up.full_name, up.role, up.active,
       (SELECT COUNT(*) FROM conference_permissions cp WHERE cp.user_id = up.id) AS conference_count
FROM user_profiles up
WHERE up.email = 'pingu2111@yahoo.com';
