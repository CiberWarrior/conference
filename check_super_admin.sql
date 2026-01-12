-- ============================================
-- PROVJERA SUPER ADMIN KORISNIKA
-- ============================================
-- Pokreni ovaj SQL upit u Supabase SQL Editor-u
-- da vidiš sve super admin korisnike

-- Provjeri sve super admin korisnike
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  phone,
  organization,
  created_at,
  last_login
FROM user_profiles 
WHERE role = 'super_admin'
ORDER BY created_at DESC;

-- Provjeri da li postoji test user (iz dokumentacije)
SELECT 
  id,
  email,
  full_name,
  role,
  active
FROM user_profiles 
WHERE email = 'test@example.com' 
   OR email LIKE '%admin%'
   OR email LIKE '%test%'
ORDER BY email;

-- Provjeri sve korisnike (super admin i conference admin)
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  created_at
FROM user_profiles 
ORDER BY role, created_at DESC;


