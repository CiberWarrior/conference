-- ============================================
-- MINIMAL PERFORMANCE INDEXES - 100% SAFE
-- ============================================
-- Samo najvažniji indexi koji će sigurno raditi
-- Run this in Supabase SQL Editor
-- ============================================

-- CONFERENCES - Osnovno
CREATE INDEX IF NOT EXISTS idx_conferences_slug ON conferences(slug);
CREATE INDEX IF NOT EXISTS idx_conferences_active ON conferences(active);

-- REGISTRATIONS - Najvažnije
CREATE INDEX IF NOT EXISTS idx_registrations_conference ON registrations(conference_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at DESC);

-- ABSTRACTS - Osnovno
CREATE INDEX IF NOT EXISTS idx_abstracts_conference ON abstracts(conference_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_registration ON abstracts(registration_id);

-- USER_PROFILES - Osnovno  
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- CONFERENCE_PAGES - Osnovno
CREATE INDEX IF NOT EXISTS idx_conference_pages_conference ON conference_pages(conference_id);
CREATE INDEX IF NOT EXISTS idx_conference_pages_slug ON conference_pages(slug);

-- CUSTOM_REGISTRATION_FEES - Osnovno
CREATE INDEX IF NOT EXISTS idx_custom_fees_conference ON custom_registration_fees(conference_id);

-- ============================================
-- ✅ GOTOVO!
-- ============================================
-- 13 osnovnih indexa kreirano
-- Ovi indexi će poboljšati performanse za:
-- - Pretragu konferencija (slug)
-- - Admin dashboard (conference_id filter)
-- - Pretragu registracija (email)
-- - Listanje stranica
-- ============================================
