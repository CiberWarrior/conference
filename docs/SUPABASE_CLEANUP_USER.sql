-- ============================================
-- SUPABASE: Čišćenje korisnika (prije brisanja u Dashboardu)
-- ============================================
--
-- ⚠️ NE KORISTI za screatives.info@gmail.com – to je Super Admin (glavni admin).
--
-- Skripta služi kad želiš ukloniti NEKI DRUGI korisnik (npr. stari test account).
-- Zamijeni v_remove_id i v_new_owner_id s odgovarajućim UUID-ovima, pa pokreni.
-- Zatim u Dashboard → Authentication → Users obriši tog korisnika.
--
-- Trenutni korisnici u projektu:
--   - screatives.info@gmail.com  = Super Admin (glavni admin, NE brisati)
--   - TESTER1 (pingu2111@yahoo.com) = test admin
--   - Test Participant (test@participant.com) = test sudionik
--
-- ============================================

-- Zamijeni UUID korisnika kojeg brišeš i UUID korisnika koji preuzima owner/created_by (npr. Super Admin).
DO $$
DECLARE
  v_remove_id UUID := 'PASTE_UUID_KORISNIKA_KOJEG_BRISES';   -- 👈 NE stavljati screatives (Super Admin)
  v_new_owner_id UUID := 'PASTE_UUID_SUPER_ADMIN_ILI_TESTER1'; -- 👈 npr. screatives ili TESTER1
  v_perm_count INT;
  v_audit_count INT;
  v_conf_count INT;
  v_offers_count INT;
BEGIN
  -- 1. conference_permissions: oslobodi granted_by da brisanje ne zapne
  UPDATE conference_permissions SET granted_by = NULL WHERE granted_by = v_remove_id;
  GET DIAGNOSTICS v_perm_count = ROW_COUNT;
  RAISE NOTICE 'conference_permissions.granted_by: % redova postavljeno na NULL', v_perm_count;

  -- 2. admin_audit_log: ostavi zapis, samo user_id na NULL
  UPDATE admin_audit_log SET user_id = NULL WHERE user_id = v_remove_id;
  GET DIAGNOSTICS v_audit_count = ROW_COUNT;
  RAISE NOTICE 'admin_audit_log: % redova ažurirano', v_audit_count;

  -- 3. conferences: prebaci owner_id na TESTER1 ako je trenutni owner korisnik koji se briše
  UPDATE conferences SET owner_id = v_new_owner_id::TEXT WHERE owner_id = v_remove_id::TEXT;
  GET DIAGNOSTICS v_conf_count = ROW_COUNT;
  RAISE NOTICE 'conferences.owner_id: % konferencija prebačeno na TESTER1', v_conf_count;

  -- 4. payment_offers.created_by (RESTRICT) – prebaci na TESTER1
  UPDATE payment_offers SET created_by = v_new_owner_id WHERE created_by = v_remove_id;
  GET DIAGNOSTICS v_offers_count = ROW_COUNT;
  RAISE NOTICE 'payment_offers.created_by: % redova prebačeno na TESTER1', v_offers_count;

  RAISE NOTICE 'Gotovo. Sada možeš obrisati korisnika u Dashboard → Authentication → Users.';
END $$;

-- Provjera (nakon što zalijepiš UUID): ne bi smjelo ostati referenci na v_remove_id
-- SELECT 'conference_permissions' AS tbl, COUNT(*) FROM conference_permissions WHERE granted_by = v_remove_id;
-- SELECT 'admin_audit_log', COUNT(*) FROM admin_audit_log WHERE user_id = v_remove_id;
-- SELECT 'conferences', COUNT(*) FROM conferences WHERE owner_id = v_remove_id::TEXT;
-- SELECT 'payment_offers', COUNT(*) FROM payment_offers WHERE created_by = v_remove_id;
