-- ============================================
-- VERIFY MIGRATION SUCCESS
-- ============================================
-- Run this to confirm everything was created correctly
-- ============================================

-- 1. Check if all new tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('payment_history', 'payment_reminders', 'supported_currencies')
ORDER BY table_name;

-- Expected: 3 tables (payment_history, payment_reminders, supported_currencies)

-- 2. Check supported currencies data
SELECT code, name, symbol 
FROM supported_currencies 
ORDER BY sort_order
LIMIT 5;

-- Expected: EUR, USD, GBP, CHF, CAD

-- 3. Check new columns in registrations table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'registrations'
  AND column_name IN ('payment_method', 'payment_reference', 'payment_currency', 'bank_transfer_verified')
ORDER BY column_name;

-- Expected: 4 new payment columns

-- 4. Check new columns in user_profiles table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('bank_account_number', 'bank_account_holder', 'default_vat_percentage')
ORDER BY column_name;

-- Expected: 3 new columns (bank account + VAT)

-- 5. Check if triggers were created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_create_payment_reminder', 'update_payment_reminders_updated_at_trigger')
ORDER BY trigger_name;

-- Expected: 2 triggers

-- ============================================
-- ALL CHECKS COMPLETE! ✅
-- ============================================
-- If you see results for all queries above, migration was successful!
-- ============================================
