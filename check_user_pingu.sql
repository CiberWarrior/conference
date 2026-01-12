-- ============================================
-- PROVJERA KORISNIKA: pingu2111@yahoo.com
-- ============================================
-- Pokreni ovaj SQL upit u Supabase SQL Editor-u

-- Provjeri da li postoji korisnik sa tim email-om
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  phone,
  organization,
  created_at,
  updated_at,
  last_login
FROM user_profiles 
WHERE email = 'pingu2111@yahoo.com';

-- Provjeri sve korisnike sa sličnim email-om (yahoo domen)
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  created_at
FROM user_profiles 
WHERE email LIKE '%yahoo%'
ORDER BY created_at DESC;

-- Provjeri sve korisnike sa "pingu" u email-u
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  created_at
FROM user_profiles 
WHERE email LIKE '%pingu%'
ORDER BY created_at DESC;

-- Provjeri sve korisnike (pregled svih)
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  created_at,
  last_login
FROM user_profiles 
ORDER BY created_at DESC;


