-- ============================================================
-- ČIŠĆENJE TESTNIH PODATAKA (prije beta testiranja)
-- ============================================================
-- Pokreni u Supabase SQL Editoru, KORAK PO KORAK.
--
-- BRIŠE: sve prijave (registrations), sažetke (abstracts),
--        profile sudionika, njihove auth račune i uploadane datoteke.
-- NE DIRA: konferencije, admin račune (user_profiles), kotizacije,
--          CMS stranice, pretplate, postavke.
--
-- Radnja je NEPOVRATNA — prvo pokreni KORAK 1 i pregledaj što se briše.

-- ============================================================
-- KORAK 1: PREGLED — što će biti obrisano (samo čitanje)
-- ============================================================
-- Napomena: neke tablice možda ne postoje u tvojoj bazi ako
-- pripadajuća migracija nije pokrenuta (npr. certificates iz 009,
-- payment_reminders iz 040, participant_* iz 035). Ovaj blok to
-- provjerava pa neće pucati ako tablica ne postoji — u tom
-- slučaju samo prikaže "ne postoji". Samo pokreni cijeli blok,
-- rezultat je jedna uredna tablica na kraju.
DO $$
DECLARE
  naziv TEXT;
  popis TEXT[] := ARRAY[
    'registrations', 'abstracts', 'payment_history', 'certificates',
    'payment_reminders', 'participant_profiles', 'participant_registrations',
    'participant_loyalty_discounts', 'participant_account_invites'
  ];
BEGIN
  DROP TABLE IF EXISTS pg_temp.cleanup_pregled;
  CREATE TEMP TABLE cleanup_pregled (tablica TEXT, broj TEXT);

  FOREACH naziv IN ARRAY popis LOOP
    IF to_regclass('public.' || naziv) IS NOT NULL THEN
      EXECUTE format('INSERT INTO cleanup_pregled SELECT %L, count(*)::text FROM %I', naziv, naziv);
    ELSE
      INSERT INTO cleanup_pregled VALUES (naziv, 'ne postoji');
    END IF;
  END LOOP;
END $$;

SELECT * FROM cleanup_pregled ORDER BY tablica;

-- Detaljni popis prijava (provjeri da su sve testne!):
SELECT id, conference_id, first_name, last_name, email, payment_status, created_at
FROM registrations
ORDER BY created_at DESC;

-- Auth računi sudionika koji će biti obrisani
-- (admin računi su zaštićeni — nalaze se u user_profiles).
-- Ako participant_profiles ne postoji (vidi rezultat gore), ovaj
-- upit vrati grešku "relation does not exist" — u tom slučaju
-- jednostavno preskoči ga, nema sudionika za brisanje.
SELECT u.id, u.email, u.created_at
FROM auth.users u
JOIN participant_profiles pp ON pp.auth_user_id = u.id
WHERE u.id NOT IN (SELECT id FROM user_profiles);

-- ============================================================
-- KORAK 2: BRISANJE PODATAKA (pokreni tek nakon pregleda!)
-- ============================================================
-- Cijeli blok je siguran za pokretanje i ako neka od participant_*
-- tablica ne postoji (samo je preskoči) — registrations i abstracts
-- su temeljne tablice i moraju postojati.
DO $$
BEGIN
  -- Auth računi sudionika (prije profila, dok veza još postoji).
  -- Admin računi su izuzeti provjerom na user_profiles.
  IF to_regclass('public.participant_profiles') IS NOT NULL THEN
    DELETE FROM auth.users
    WHERE id IN (
      SELECT auth_user_id FROM participant_profiles WHERE auth_user_id IS NOT NULL
    )
    AND id NOT IN (SELECT id FROM user_profiles);
  END IF;

  -- Prijave — CASCADE automatski briše payment_history,
  -- certificates i payment_reminders (ako postoje).
  DELETE FROM registrations;

  -- Sažeci (testne predaje sažetaka).
  DELETE FROM abstracts;

  -- Profili sudionika — CASCADE automatski briše
  -- participant_registrations i participant_loyalty_discounts.
  IF to_regclass('public.participant_account_invites') IS NOT NULL THEN
    DELETE FROM participant_account_invites;
  END IF;
  IF to_regclass('public.participant_profiles') IS NOT NULL THEN
    DELETE FROM participant_profiles;
  END IF;
END $$;

-- ============================================================
-- KORAK 3: BRISANJE UPLOADANIH DATOTEKA (opcionalno)
-- ============================================================
-- Testne datoteke u Storageu: potvrde o uplati, privici prijava
-- i datoteke sažetaka.
--
-- Prvo pregled:
SELECT bucket_id, name, created_at
FROM storage.objects
WHERE bucket_id IN ('registration-attachments', 'abstracts')
ORDER BY created_at DESC;

-- Zatim brisanje:
-- DELETE FROM storage.objects
-- WHERE bucket_id IN ('registration-attachments', 'abstracts');

-- ============================================================
-- KORAK 4: PROVJERA — sve mora biti 0
-- ============================================================
-- Isti robusni pristup kao u Koraku 1 (radi i ako neka tablica
-- ne postoji u tvojoj bazi).
DO $$
DECLARE
  naziv TEXT;
  popis TEXT[] := ARRAY[
    'registrations', 'abstracts', 'payment_history', 'certificates',
    'payment_reminders', 'participant_profiles', 'participant_registrations',
    'participant_loyalty_discounts', 'participant_account_invites'
  ];
BEGIN
  DROP TABLE IF EXISTS pg_temp.cleanup_provjera;
  CREATE TEMP TABLE cleanup_provjera (tablica TEXT, broj TEXT);

  FOREACH naziv IN ARRAY popis LOOP
    IF to_regclass('public.' || naziv) IS NOT NULL THEN
      EXECUTE format('INSERT INTO cleanup_provjera SELECT %L, count(*)::text FROM %I', naziv, naziv);
    ELSE
      INSERT INTO cleanup_provjera VALUES (naziv, 'ne postoji');
    END IF;
  END LOOP;
END $$;

SELECT * FROM cleanup_provjera ORDER BY tablica;
