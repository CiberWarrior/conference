-- ============================================
-- KOMPLETNA SETUP MIGRACIJA ZA REGISTRACIJE
-- Pokrenite ovu migraciju u Supabase SQL Editoru
-- ============================================

-- 1. Kreiranje osnovne tablice registrations
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  payment_required BOOLEAN DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('pending', 'paid', 'not_required')),
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Dodavanje dodatnih polja za registraciju
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS arrival_date DATE,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS payment_by_card BOOLEAN DEFAULT false;

-- 3. Dodavanje polja za plaćanje
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS invoice_id TEXT,
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- 4. Kreiranje indeksa za brže pretraživanje
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_country ON registrations(country);
CREATE INDEX IF NOT EXISTS idx_registrations_institution ON registrations(institution);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_intent_id ON registrations(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_registrations_invoice_id ON registrations(invoice_id);

-- 5. Dodavanje constrainta za provjeru datuma
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS check_dates;

ALTER TABLE registrations
ADD CONSTRAINT check_dates CHECK (
  arrival_date IS NULL OR 
  departure_date IS NULL OR 
  departure_date >= arrival_date
);

-- 6. Omogućavanje Row Level Security
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 7. Brisanje postojećih politika (ako postoje)
DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated read" ON registrations;
DROP POLICY IF EXISTS "Allow anon read" ON registrations;
DROP POLICY IF EXISTS "Allow service role all" ON registrations;

-- 8. Kreiranje RLS politika
-- Policy: Dozvoljava svima da unose podatke (za registraciju)
CREATE POLICY "Allow public insert" ON registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Dozvoljava autentificiranim korisnicima da čitaju (za admin panel)
-- NAPOMENA: U production-u, ograničite ovo samo na admin korisnike!
CREATE POLICY "Allow authenticated read" ON registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Dozvoljava anon korisnicima da čitaju (ZA DEVELOPMENT SAMO!)
-- UPOZORENJE: Uklonite ovu politiku u production-u i koristite pravu autentifikaciju!
CREATE POLICY "Allow anon read" ON registrations
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Dozvoljava service role da radi sve (za API rute)
CREATE POLICY "Allow service role all" ON registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- MIGRACIJA ZAVRŠENA!
-- Provjerite u Table Editoru da je tablica 'registrations' kreirana
-- ============================================

