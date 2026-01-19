-- ============================================
-- SIMPLE STEP-BY-STEP MIGRATIONS
-- ============================================
-- Run each STEP separately in Supabase SQL Editor
-- Check for success before moving to next step
-- ============================================

-- ============================================
-- STEP 1: Check what you have
-- ============================================
-- Run this first to see what tables exist:

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected output should include:
-- ✅ registrations
-- ✅ conferences (if not, run FIX_MISSING_CONFERENCES_TABLE.sql first)
-- ✅ user_profiles
-- ⏳ payment_history (will be created below)

-- ============================================
-- STEP 2: Create payment_history table ONLY
-- ============================================
-- Copy and run this section:

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_payment_intent_id TEXT,
  stripe_refund_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_registration_id ON payment_history(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

-- Check: Did it work?
SELECT 'payment_history created!' WHERE EXISTS (
  SELECT FROM information_schema.tables WHERE table_name = 'payment_history'
);

-- ============================================
-- STEP 3: Add bank account fields to user_profiles
-- ============================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(34),
ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS swift_bic VARCHAR(11),
ADD COLUMN IF NOT EXISTS bank_address TEXT,
ADD COLUMN IF NOT EXISTS bank_account_currency VARCHAR(10) DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS default_vat_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS vat_label TEXT;

-- Check: Did it work?
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('bank_account_number', 'default_vat_percentage')
ORDER BY column_name;

-- ============================================
-- STEP 4: Add payment fields to registrations
-- ============================================

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card',
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(10) DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS bank_transfer_proof_url TEXT,
ADD COLUMN IF NOT EXISTS bank_transfer_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_transfer_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bank_transfer_verified_by UUID,
ADD COLUMN IF NOT EXISTS refund_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_status TEXT,
ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_reminder_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_registrations_payment_method ON registrations(payment_method);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_reference ON registrations(payment_reference);

-- Check: Did it work?
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'registrations' 
  AND column_name IN ('payment_method', 'payment_reference')
ORDER BY column_name;

-- ============================================
-- STEP 5: Create payment_reminders table
-- ============================================

CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) DEFAULT 'payment_pending',
  reminder_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  email_subject TEXT,
  email_body TEXT,
  email_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_registration ON payment_reminders(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_conference ON payment_reminders(conference_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);

-- Check: Did it work?
SELECT 'payment_reminders created!' WHERE EXISTS (
  SELECT FROM information_schema.tables WHERE table_name = 'payment_reminders'
);

-- ============================================
-- STEP 6: Create supported_currencies table
-- ============================================

CREATE TABLE IF NOT EXISTS supported_currencies (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  decimal_places INTEGER DEFAULT 2,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO supported_currencies (code, name, symbol, decimal_places, sort_order) VALUES
  ('EUR', 'Euro', '€', 2, 1),
  ('USD', 'US Dollar', '$', 2, 2),
  ('GBP', 'British Pound', '£', 2, 3),
  ('CHF', 'Swiss Franc', 'CHF', 2, 4),
  ('CAD', 'Canadian Dollar', 'CA$', 2, 5),
  ('AUD', 'Australian Dollar', 'A$', 2, 6),
  ('JPY', 'Japanese Yen', '¥', 0, 7),
  ('CNY', 'Chinese Yuan', '¥', 2, 8),
  ('HRK', 'Croatian Kuna', 'kn', 2, 9)
ON CONFLICT (code) DO NOTHING;

-- Check: Did it work?
SELECT code, name, symbol FROM supported_currencies ORDER BY sort_order;

-- ============================================
-- STEP 7: Add payment fields to payment_history
-- ============================================

ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card',
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 6),
ADD COLUMN IF NOT EXISTS base_currency VARCHAR(10) DEFAULT 'EUR';

-- ============================================
-- STEP 8: Add currency fields to conferences (SKIP IF FAILS)
-- ============================================
-- If this fails with "violates foreign key constraint", skip it
-- It's optional and can be added later

ALTER TABLE conferences
ADD COLUMN IF NOT EXISTS supported_currencies VARCHAR(10)[] DEFAULT ARRAY['EUR']::VARCHAR[];
-- Note: We skip the foreign key constraint to default_currency for now

-- ============================================
-- ALL DONE! ✅
-- ============================================
-- Run this final check:

SELECT 
  'payment_history' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_history') as exists
UNION ALL
SELECT 
  'payment_reminders',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_reminders')
UNION ALL
SELECT 
  'supported_currencies',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'supported_currencies');

-- All should show "true" ✅
-- ============================================
