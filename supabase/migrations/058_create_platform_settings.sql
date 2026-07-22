-- Migration: Platform-level payment settings (singleton)
-- Date: July 2026
--
-- Stores the PLATFORM OWNER's (super admin) payment details used when an
-- organizer pays for using the platform (subscriptions).
--
-- This is intentionally separate from user_profiles bank fields, which hold
-- each conference organizer's details for receiving participant registration
-- fees. Keeping them apart avoids mixing "platform income" with
-- "conference organizers' income".

CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  bank_account_number text,
  bank_account_holder text,
  bank_name text,
  swift_bic text,
  bank_address text,
  bank_currency text NOT NULL DEFAULT 'EUR',
  bank_transfer_enabled boolean NOT NULL DEFAULT false,
  payment_note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT platform_settings_singleton CHECK (id = 1)
);

-- Ensure the single settings row always exists
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Keep updated_at fresh (function created in earlier migrations)
DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: super admin only. Public reads (for the pricing page) go through a
-- controlled service-role API route, never directly from the client.
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin reads platform settings" ON platform_settings;
CREATE POLICY "Super admin reads platform settings"
  ON platform_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );

DROP POLICY IF EXISTS "Super admin manages platform settings" ON platform_settings;
CREATE POLICY "Super admin manages platform settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );
