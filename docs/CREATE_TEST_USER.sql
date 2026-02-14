-- ============================================
-- CREATE TEST USER (Super Admin)
-- ============================================
--
-- Ova skripta kreira TEST SUPER ADMIN usera (puni pristup cijeloj platformi).
-- Za test korisnika koji je ADMIN KONFERENCIJE (conference_admin) koristi:
--   docs/CREATE_TEST_CONFERENCE_ADMIN.sql  (testuser@example.com)
--
-- Koraci za ovu skriptu:
-- 1. Prvo kreiraj Auth user u Supabase Dashboard (Authentication → Users → Add User)
-- 2. Kopiraj UUID iz Auth usera
-- 3. Zameni UUID i email u ovoj skripti
-- 4. Pokreni skriptu u SQL Editor-u
--
-- ============================================

-- KORAK 1: Kreiraj Auth User u Supabase Dashboard
-- Authentication → Users → Add User
-- Email: test@example.com
-- Password: TestPassword123!
-- ☑ Auto Confirm User
-- Kopiraj UUID nakon kreiranja

-- KORAK 2: Zameni UUID i email ovde:
-- ⚠️ ZAMENI OVE VREDNOSTI:
-- 'PASTE_AUTH_USER_UUID_HERE' → UUID iz Auth usera
-- 'test@example.com' → Email adresa

-- KORAK 3: Pokreni ovu skriptu u SQL Editor-u

-- Proveri da li user već postoji
DO $$
DECLARE
  v_user_id UUID := 'PASTE_AUTH_USER_UUID_HERE'; -- 👈 ZAMENI SA UUID-JEM
  v_email TEXT := 'test@example.com'; -- 👈 ZAMENI SA EMAIL-OM
  v_exists BOOLEAN;
BEGIN
  -- Proveri da li user profile već postoji
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = v_user_id) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE 'User profile već postoji! Ažuriranje...';
    
    -- Ažuriraj postojeći user
    UPDATE user_profiles
    SET 
      email = v_email,
      full_name = 'Test User',
      role = 'super_admin',
      active = true,
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'User profile ažuriran!';
  ELSE
    RAISE NOTICE 'Kreiranje novog user profila...';
    
    -- Kreiraj novi user profile
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
      'Test User',
      'super_admin',
      true,
      NULL,
      'Test Organization',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'User profile kreiran!';
  END IF;
END $$;

-- Proveri rezultat
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  created_at
FROM user_profiles 
WHERE email = 'test@example.com'; -- 👈 ZAMENI SA EMAIL-OM

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Proveri da li Auth user postoji (u Supabase Dashboard → Authentication → Users)
-- Proveri da li user profile postoji:
SELECT * FROM user_profiles WHERE email = 'test@example.com';

-- Proveri da li je user aktivan:
SELECT id, email, role, active FROM user_profiles WHERE email = 'test@example.com';

-- Ako user nije aktivan, aktiviraj ga:
-- UPDATE user_profiles SET active = true WHERE email = 'test@example.com';

-- Ako treba da resetuješ password:
-- 1. Idi u Supabase Dashboard → Authentication → Users
-- 2. Klikni na usera
-- 3. Klikni "Reset Password" ili "Send Password Reset Email"

