-- ============================================
-- Migration: Add default VAT settings to user profiles
-- Description: Allow users to set organization-level default VAT percentage
--              that applies to all their conferences unless overridden
-- ============================================

-- Add default VAT percentage column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS default_vat_percentage NUMERIC(5,2) CHECK (default_vat_percentage >= 0 AND default_vat_percentage <= 100),
ADD COLUMN IF NOT EXISTS vat_label TEXT;

-- Add helpful comments
COMMENT ON COLUMN user_profiles.default_vat_percentage IS 'Default VAT/PDV percentage for this organization (e.g., 25 for Croatia). Applied to all conferences unless overridden at conference level.';
COMMENT ON COLUMN user_profiles.vat_label IS 'Optional label for VAT (e.g., "Croatia PDV", "Germany MwSt"). Used for display purposes.';

-- Create index for performance (queries filtering by VAT settings)
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_vat ON user_profiles(default_vat_percentage) WHERE default_vat_percentage IS NOT NULL;

-- ============================================
-- Optional: Set default for existing Croatian users
-- Uncomment if you want to pre-populate for existing users
-- ============================================
-- UPDATE user_profiles 
-- SET default_vat_percentage = 25.00, 
--     vat_label = 'Croatia PDV'
-- WHERE default_vat_percentage IS NULL;
