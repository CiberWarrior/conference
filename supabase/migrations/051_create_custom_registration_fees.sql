-- Custom registration fees: one fee = one price + one validity period + one capacity.
-- No global tiers (early/regular/late). Organizers create multiple fee records for multiple prices over time.

CREATE TABLE IF NOT EXISTS custom_registration_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  price_net DECIMAL(12, 2) NOT NULL,
  price_gross DECIMAL(12, 2) NOT NULL,
  capacity INTEGER,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_fee_dates CHECK (valid_to >= valid_from),
  CONSTRAINT non_negative_prices CHECK (price_net >= 0 AND price_gross >= 0),
  CONSTRAINT non_negative_capacity CHECK (capacity IS NULL OR capacity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_custom_registration_fees_conference
  ON custom_registration_fees(conference_id);
CREATE INDEX IF NOT EXISTS idx_custom_registration_fees_validity
  ON custom_registration_fees(conference_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_custom_registration_fees_display_order
  ON custom_registration_fees(conference_id, display_order);

COMMENT ON TABLE custom_registration_fees IS
  'One record per registration fee: name, validity window, net/gross price, optional capacity. No tiers.';
COMMENT ON COLUMN custom_registration_fees.price_net IS 'Price excluding VAT';
COMMENT ON COLUMN custom_registration_fees.price_gross IS 'Price including VAT (shown on public form)';
COMMENT ON COLUMN custom_registration_fees.capacity IS 'Max registrations for this fee; NULL = unlimited';
COMMENT ON COLUMN custom_registration_fees.display_order IS 'Order in which fees are shown (admin and form)';

CREATE OR REPLACE FUNCTION update_custom_registration_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_custom_registration_fees_updated_at ON custom_registration_fees;
CREATE TRIGGER trigger_custom_registration_fees_updated_at
  BEFORE UPDATE ON custom_registration_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_registration_fees_updated_at();

-- Link registrations to a custom fee (new system). Legacy registration_fee_type remains for old data.
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS registration_fee_id UUID REFERENCES custom_registration_fees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_registration_fee_id
  ON registrations(registration_fee_id);
COMMENT ON COLUMN registrations.registration_fee_id IS
  'Custom registration fee (new model). When set, registration_fee_type is legacy/deprecated.';

-- RLS: allow public read for active fees (form), admin CRUD via conference ownership
ALTER TABLE custom_registration_fees ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (idempotent: safe to re-run migration)
DROP POLICY IF EXISTS "Public read fees for conferences" ON custom_registration_fees;
DROP POLICY IF EXISTS "Service role all on custom_registration_fees" ON custom_registration_fees;
DROP POLICY IF EXISTS "Conference admins manage fees" ON custom_registration_fees;

-- Public can read fees for published conferences (used by registration form)
CREATE POLICY "Public read fees for conferences"
  ON custom_registration_fees FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conferences c
      WHERE c.id = custom_registration_fees.conference_id
      AND c.published = true
      AND c.active = true
    )
  );

-- Service role full access (API/admin)
CREATE POLICY "Service role all on custom_registration_fees"
  ON custom_registration_fees FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users with conference access can manage fees (align with existing conference admin policies)
CREATE POLICY "Conference admins manage fees"
  ON custom_registration_fees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conference_permissions cp
      WHERE cp.conference_id = custom_registration_fees.conference_id
      AND cp.user_id = auth.uid()
      AND cp.can_edit_conference = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conference_permissions cp
      WHERE cp.conference_id = custom_registration_fees.conference_id
      AND cp.user_id = auth.uid()
      AND cp.can_edit_conference = true
    )
  );
