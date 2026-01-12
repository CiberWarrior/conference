-- ============================================
-- PROVJERA KORISNIKA: screatives.info@gmail.com
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
WHERE email = 'screatives.info@gmail.com';

-- Provjeri i u Auth sistemu (ako postoji direktan pristup)
-- Napomena: Auth podaci su u Supabase Auth sistemu, ne u user_profiles tabeli
-- Za provjeru Auth korisnika, idi u Supabase Dashboard → Authentication → Users

-- Provjeri sve korisnike sa sličnim email-om
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  created_at
FROM user_profiles 
WHERE email LIKE '%screatives%' OR email LIKE '%gmail%'
ORDER BY created_at DESC;


