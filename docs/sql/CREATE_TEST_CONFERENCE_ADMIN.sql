-- ============================================
-- CREATE TEST CONFERENCE ADMIN
-- ============================================
--
-- Kreira test korisnika za admin konferencija (uloga conference_admin).
-- Email: testuser@example.com
-- Nakon ovoga možeš se ulogirati na /auth/admin-login i upravljati konferencijama.
--
-- KORACI:
-- 1. Kreiraj Auth user u Supabase Dashboard (Authentication → Users → Add User)
-- 2. Kopiraj UUID i zalijepi u skriptu ispod
-- 3. Pokreni cijelu skriptu u SQL Editor-u
--
-- ============================================

-- KORAK 1: U Supabase Dashboard
-- Authentication → Users → Add User
--   Email:          testuser@example.com
--   Password:        TestPassword123!
--   ☑ Auto Confirm User
-- Nakon kreiranja kopiraj UUID korisnika.

-- KORAK 2: Zamijeni PASTE_AUTH_USER_UUID_HERE u OBJE DO $$ ... $$ bloka ispod s UUID-om iz Auth korisnika.

-- ============================================
-- 1. Kreiraj ili ažuriraj user_profiles (conference_admin)
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'PASTE_AUTH_USER_UUID_HERE'; -- 👈 ZAMJENI SA UUID-om iz Auth korisnika
  v_email TEXT := 'testuser@example.com';
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = v_user_id) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE 'User profile već postoji. Ažuriranje na conference_admin...';
    UPDATE user_profiles
    SET
      email = v_email,
      full_name = 'Test Conference Admin',
      role = 'conference_admin',
      active = true,
      organization = 'Test Organization',
      updated_at = NOW()
    WHERE id = v_user_id;
  ELSE
    RAISE NOTICE 'Kreiranje user profila (conference_admin)...';
    INSERT INTO user_profiles (
      id,
      email,
      full_name,
      role,
      active,
      phone,
      organization,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_email,
      'Test Conference Admin',
      'conference_admin',
      true,
      NULL,
      'Test Organization',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- ============================================
-- 2. Dodijeli pristup SVIM postojećim konferencijama
--    (test user može upravljati svim konferencijama kao admin)
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'PASTE_AUTH_USER_UUID_HERE'; -- 👈 Isti UUID kao gore
  v_granted_by UUID; -- prvi super_admin ako postoji
  c RECORD;
BEGIN
  -- Nađi nekog super_admina kao granted_by (opcionalno)
  SELECT id INTO v_granted_by
  FROM user_profiles
  WHERE role = 'super_admin' AND active = true
  LIMIT 1;

  FOR c IN
    SELECT id FROM conferences
  LOOP
    INSERT INTO conference_permissions (
      user_id,
      conference_id,
      can_view_registrations,
      can_export_data,
      can_manage_payments,
      can_manage_abstracts,
      can_check_in,
      can_generate_certificates,
      can_edit_conference,
      can_delete_data,
      granted_by
    ) VALUES (
      v_user_id,
      c.id,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      v_granted_by
    )
    ON CONFLICT (user_id, conference_id) DO UPDATE SET
      can_view_registrations = true,
      can_export_data = true,
      can_manage_payments = true,
      can_manage_abstracts = true,
      can_check_in = true,
      can_generate_certificates = true,
      can_edit_conference = true,
      can_delete_data = true,
      granted_by = COALESCE(conference_permissions.granted_by, v_granted_by);
  END LOOP;

  RAISE NOTICE 'Dodijeljene permisije za sve konferencije.';
END $$;

-- ============================================
-- 3. Provjera rezultata
-- ============================================

SELECT
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.active,
  (SELECT COUNT(*) FROM conference_permissions cp WHERE cp.user_id = up.id) AS conference_count
FROM user_profiles up
WHERE up.email = 'testuser@example.com';

-- Lista konferencija na koje test user ima pristup
SELECT
  c.name AS conference_name,
  c.slug,
  cp.can_edit_conference,
  cp.can_view_registrations
FROM conference_permissions cp
JOIN conferences c ON c.id = cp.conference_id
JOIN user_profiles up ON up.id = cp.user_id
WHERE up.email = 'testuser@example.com'
ORDER BY c.name;

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- Provjera profila:
--   SELECT * FROM user_profiles WHERE email = 'testuser@example.com';
-- Aktivacija ako je isključen:
--   UPDATE user_profiles SET active = true WHERE email = 'testuser@example.com';
-- Reset lozinke: Supabase Dashboard → Authentication → Users → testuser@example.com → Reset password
-- Login: /auth/admin-login → testuser@example.com / TestPassword123!
