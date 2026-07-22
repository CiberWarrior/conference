-- Migration: Self-service platform subscription orders
-- Date: July 2026
--
-- When an organizer picks a plan on the public pricing page, they go to
-- /subscribe and create an order here. This is separate from:
--   * payment_offers (admin-sent Stripe links from CRM inquiries)
--   * registrations (conference participant fees)
--
-- Requires: subscription_plans (057), platform_settings (058 recommended
-- for bank-transfer instructions; card checkout works without it).

CREATE TABLE IF NOT EXISTS subscription_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  billing_cycle varchar(20) NOT NULL,
  price decimal(10, 2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  full_name text NOT NULL,
  email text NOT NULL,
  organization text,
  phone text,
  payment_method varchar(20) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'pending',
  payment_reference text,
  stripe_checkout_session_id varchar(255),
  stripe_payment_link_url text,
  bank_transfer_verified boolean NOT NULL DEFAULT false,
  bank_transfer_verified_at timestamptz,
  bank_transfer_verified_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_orders_billing_cycle_check
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT subscription_orders_payment_method_check
    CHECK (payment_method IN ('card', 'bank_transfer')),
  CONSTRAINT subscription_orders_status_check
    CHECK (status IN ('pending', 'paid', 'canceled', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_orders_status
  ON subscription_orders(status);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_email
  ON subscription_orders(email);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_plan
  ON subscription_orders(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_reference
  ON subscription_orders(payment_reference);

DROP TRIGGER IF EXISTS trg_subscription_orders_updated_at ON subscription_orders;
CREATE TRIGGER trg_subscription_orders_updated_at
  BEFORE UPDATE ON subscription_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscription_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin manages subscription orders" ON subscription_orders;
CREATE POLICY "Super admin manages subscription orders"
  ON subscription_orders FOR ALL
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

COMMENT ON TABLE subscription_orders IS
  'Self-service platform subscription checkouts from the public pricing page';
