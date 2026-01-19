-- ============================================
-- PAYMENT SYSTEM MIGRATIONS - RUN IN ORDER
-- ============================================
-- Copy and run this ENTIRE file in Supabase SQL Editor
-- This includes all necessary migrations in correct order
-- ============================================

-- ============================================
-- STEP 1: Create payment_history table (from migration 008)
-- ============================================

-- Add refund fields to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS refund_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('none', 'requested', 'approved', 'rejected', 'processed')),
ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_reminder_count INTEGER DEFAULT 0;

-- Create payment_history table for tracking all payment transactions
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_history_registration_id ON payment_history(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_refund_status ON registrations(refund_status);
CREATE INDEX IF NOT EXISTS idx_registrations_last_reminder ON registrations(last_payment_reminder_sent_at);

-- Add comments
COMMENT ON COLUMN registrations.refund_requested IS 'Whether a refund has been requested';
COMMENT ON COLUMN registrations.refund_amount IS 'Amount to be refunded';
COMMENT ON COLUMN registrations.refund_status IS 'Status of the refund request';
COMMENT ON COLUMN registrations.last_payment_reminder_sent_at IS 'When the last payment reminder was sent';
COMMENT ON COLUMN registrations.payment_reminder_count IS 'Number of payment reminders sent';

-- ============================================
-- STEP 2: Add VAT to user_profiles (from migration 039)
-- ============================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS default_vat_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS vat_label TEXT;

COMMENT ON COLUMN user_profiles.default_vat_percentage IS 'Default VAT percentage for organization (e.g., 25 for 25%)';
COMMENT ON COLUMN user_profiles.vat_label IS 'Label for VAT (e.g., "Croatia PDV", "EU VAT")';

-- ============================================
-- STEP 3: Multi-Currency & Bank Transfer System (from migration 040)
-- ============================================

-- ============================================
-- 1. ADD BANK ACCOUNT INFO TO USER PROFILES
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(34), -- IBAN format (max 34 chars)
ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS swift_bic VARCHAR(11),
ADD COLUMN IF NOT EXISTS bank_address TEXT,
ADD COLUMN IF NOT EXISTS bank_account_currency VARCHAR(10) DEFAULT 'EUR';

COMMENT ON COLUMN user_profiles.bank_account_number IS 'IBAN for receiving bank transfers';
COMMENT ON COLUMN user_profiles.bank_account_holder IS 'Name of the account holder';
COMMENT ON COLUMN user_profiles.swift_bic IS 'SWIFT/BIC code for international transfers';

-- ============================================
-- 2. ADD PAYMENT METHOD & REFERENCE TO REGISTRATIONS
-- ============================================
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card' 
  CHECK (payment_method IN ('card', 'bank_transfer', 'cash', 'other')),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100), -- Poziv na broj (unique reference)
ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(10) DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS bank_transfer_proof_url TEXT, -- Upload proof of payment
ADD COLUMN IF NOT EXISTS bank_transfer_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_transfer_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bank_transfer_verified_by UUID REFERENCES auth.users(id);

-- Create index for payment method filtering
CREATE INDEX IF NOT EXISTS idx_registrations_payment_method ON registrations(payment_method);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_reference ON registrations(payment_reference);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_currency ON registrations(payment_currency);

COMMENT ON COLUMN registrations.payment_method IS 'Method of payment: card (Stripe), bank_transfer, cash, other';
COMMENT ON COLUMN registrations.payment_reference IS 'Unique payment reference number for bank transfers (poziv na broj)';
COMMENT ON COLUMN registrations.payment_currency IS 'Currency used for this payment (can differ per participant)';
COMMENT ON COLUMN registrations.bank_transfer_proof_url IS 'URL to uploaded proof of bank transfer';
COMMENT ON COLUMN registrations.bank_transfer_verified IS 'Whether bank transfer was manually verified by admin';

-- ============================================
-- 3. EXTEND PAYMENT_HISTORY FOR MULTI-CURRENCY
-- ============================================
ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card',
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 6), -- For currency conversions
ADD COLUMN IF NOT EXISTS base_currency VARCHAR(10) DEFAULT 'EUR'; -- Original conference currency

COMMENT ON COLUMN payment_history.payment_method IS 'Method used for this transaction';
COMMENT ON COLUMN payment_history.payment_reference IS 'Reference number for bank transfers';
COMMENT ON COLUMN payment_history.exchange_rate IS 'Exchange rate if currency conversion was applied';

-- ============================================
-- 4. CREATE PAYMENT REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  
  -- Reminder details
  reminder_type VARCHAR(50) DEFAULT 'payment_pending' 
    CHECK (reminder_type IN ('payment_pending', 'payment_overdue', 'payment_confirmation')),
  reminder_count INTEGER DEFAULT 0,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  -- Email details
  email_subject TEXT,
  email_body TEXT,
  email_error TEXT, -- Error message if sending failed
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reminders
CREATE INDEX IF NOT EXISTS idx_payment_reminders_registration ON payment_reminders(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_conference ON payment_reminders(conference_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled ON payment_reminders(scheduled_for) 
  WHERE status = 'pending';

COMMENT ON TABLE payment_reminders IS 'Automated payment reminders for pending payments';
COMMENT ON COLUMN payment_reminders.scheduled_for IS 'When to send this reminder (e.g., 3 days after registration)';

-- ============================================
-- 5. FUNCTION TO GENERATE UNIQUE PAYMENT REFERENCE
-- ============================================
CREATE OR REPLACE FUNCTION generate_payment_reference(
  conference_code VARCHAR,
  registration_number VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
  reference VARCHAR;
  random_suffix VARCHAR;
BEGIN
  -- Generate 4-digit random suffix
  random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Format: CONF-REG-XXXX (e.g., ICD11-001-7234)
  reference := conference_code || '-' || registration_number || '-' || random_suffix;
  
  RETURN reference;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_payment_reference IS 'Generates unique payment reference for bank transfers (poziv na broj)';

-- ============================================
-- 6. FUNCTION TO AUTO-CREATE PAYMENT REMINDERS
-- ============================================
CREATE OR REPLACE FUNCTION create_payment_reminder_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reminder if payment is required and method is bank_transfer
  IF NEW.payment_status = 'pending' AND NEW.payment_method = 'bank_transfer' THEN
    -- Schedule first reminder for 3 days after registration
    INSERT INTO payment_reminders (
      registration_id,
      conference_id,
      reminder_type,
      reminder_count,
      scheduled_for,
      status
    ) VALUES (
      NEW.id,
      NEW.conference_id,
      'payment_pending',
      1,
      NOW() + INTERVAL '3 days',
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create reminders
DROP TRIGGER IF EXISTS trigger_create_payment_reminder ON registrations;
CREATE TRIGGER trigger_create_payment_reminder
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_reminder_on_registration();

-- ============================================
-- 7. FUNCTION TO UPDATE REMINDER TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_payment_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_reminders_updated_at_trigger ON payment_reminders;
CREATE TRIGGER update_payment_reminders_updated_at_trigger
  BEFORE UPDATE ON payment_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_reminders_updated_at();

-- ============================================
-- 8. SUPPORTED CURRENCIES REFERENCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS supported_currencies (
  code VARCHAR(10) PRIMARY KEY, -- ISO 4217 currency code
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  decimal_places INTEGER DEFAULT 2,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common currencies
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

COMMENT ON TABLE supported_currencies IS 'List of supported currencies for multi-currency pricing';

-- ============================================
-- 9. ADD CURRENCY SETTINGS TO CONFERENCES
-- ============================================
ALTER TABLE conferences
ADD COLUMN IF NOT EXISTS supported_currencies VARCHAR(10)[] DEFAULT ARRAY['EUR']::VARCHAR[],
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(10) DEFAULT 'EUR' REFERENCES supported_currencies(code);

COMMENT ON COLUMN conferences.supported_currencies IS 'Array of currency codes supported for this conference';
COMMENT ON COLUMN conferences.default_currency IS 'Default currency for this conference (typically organizer currency)';

-- ============================================
-- ALL MIGRATIONS COMPLETE! ✅
-- ============================================
-- You should see "Success. No rows returned" if everything worked.
-- ============================================
