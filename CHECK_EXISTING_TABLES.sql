-- ============================================
-- CHECK WHICH TABLES EXIST IN DATABASE
-- ============================================
-- Run this in Supabase SQL Editor

-- List all tables in public schema
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- EXPECTED TABLES FOR PAYMENT SYSTEM:
-- ============================================
-- ✅ registrations
-- ✅ payment_history (created in migration 008)
-- ✅ user_profiles (created in migration 013)
-- ✅ conferences (created in migration 010)
-- ⏳ payment_reminders (created in migration 040)
-- ⏳ supported_currencies (created in migration 040)
-- ============================================
