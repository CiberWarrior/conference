-- ============================================
-- CHECK IF MIGRATION 040 HAS ALREADY RUN
-- ============================================
-- Run this in Supabase SQL Editor to check if columns already exist

-- Check registrations table for new payment columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations'
  AND column_name IN (
    'payment_method',
    'payment_reference',
    'payment_currency',
    'payment_amount',
    'bank_transfer_proof_url',
    'bank_transfer_verified'
  )
ORDER BY column_name;

-- Check user_profiles table for bank account columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'bank_account_number',
    'bank_account_holder',
    'bank_name',
    'swift_bic'
  )
ORDER BY column_name;

-- Check if payment_reminders table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'payment_reminders'
) AS payment_reminders_exists;

-- Check if supported_currencies table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'supported_currencies'
) AS supported_currencies_exists;

-- ============================================
-- RESULTS INTERPRETATION:
-- ============================================
-- If all columns exist → Migration already ran ✅
-- If some/all missing → Need to run migration 040 ⏳
-- ============================================
