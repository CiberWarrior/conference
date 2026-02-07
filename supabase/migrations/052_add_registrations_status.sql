-- Add status to registrations for sold_count logic: only count confirmed or paid.
-- status IN ('confirmed', 'paid') => counts toward fee capacity.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'confirmed';

-- Constrain: confirmed, paid (count toward capacity), cancelled (excluded)
ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE registrations
  ADD CONSTRAINT registrations_status_check
  CHECK (status IN ('confirmed', 'paid', 'cancelled'));

-- Backfill: sync status from payment_status for all existing rows
-- (ADD COLUMN with DEFAULT sets everyone to 'confirmed'; we need 'paid' where payment_status = 'paid')
UPDATE registrations
SET status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'confirmed' END;

-- Ensure default for new rows
ALTER TABLE registrations
  ALTER COLUMN status SET DEFAULT 'confirmed';

CREATE INDEX IF NOT EXISTS idx_registrations_status
  ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_fee_id_status
  ON registrations(registration_fee_id, status)
  WHERE registration_fee_id IS NOT NULL;

COMMENT ON COLUMN registrations.status IS
  'Registration status: confirmed (counts toward capacity), paid (counts toward capacity), cancelled (excluded from sold_count)';
