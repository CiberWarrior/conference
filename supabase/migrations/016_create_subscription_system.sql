-- Migration: Subscription System for SaaS Model
-- Purpose: Manage subscription plans, customer subscriptions, and automated onboarding
-- Date: December 2025

-- ============================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  
  -- Limits and Features
  max_conferences INTEGER NOT NULL,
  max_registrations_per_conference INTEGER,
  max_storage_gb INTEGER,
  
  -- Features (stored as JSON for flexibility)
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Stripe Integration
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  stripe_product_id VARCHAR(255),
  
  -- Status
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_order ON subscription_plans(display_order);

-- ============================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  inquiry_id UUID REFERENCES contact_inquiries(id) ON DELETE SET NULL,
  
  -- Subscription Details
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  billing_cycle VARCHAR(20) DEFAULT 'monthly' NOT NULL, -- monthly, yearly
  
  -- Pricing (stored for historical record)
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  
  -- Stripe Integration
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  
  -- Dates
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage Tracking
  conferences_used INTEGER DEFAULT 0,
  registrations_used INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trialing'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);

-- ============================================
-- 3. PAYMENT OFFERS TABLE (tracking sent offers)
-- ============================================

CREATE TABLE IF NOT EXISTS payment_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  inquiry_id UUID NOT NULL REFERENCES contact_inquiries(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  
  -- Offer Details
  billing_cycle VARCHAR(20) NOT NULL,
  custom_price DECIMAL(10, 2), -- if different from plan price
  discount_percent INTEGER DEFAULT 0,
  
  -- Stripe Payment Link
  stripe_payment_link_id VARCHAR(255),
  stripe_payment_link_url TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'sent' NOT NULL, -- sent, paid, expired, canceled
  
  -- Dates
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_offer_status CHECK (status IN ('sent', 'paid', 'expired', 'canceled'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_offers_inquiry ON payment_offers(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_payment_offers_status ON payment_offers(status);

-- ============================================
-- 4. AUTO-UPDATE TRIGGERS
-- ============================================

-- Update subscription_plans updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update payment_offers updated_at
CREATE TRIGGER update_payment_offers_updated_at
  BEFORE UPDATE ON payment_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Subscription Plans (public read, admin manage)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (active = true);

CREATE POLICY "Super admins can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Subscriptions (users see own, admins see all)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Payment Offers (super admins only)
ALTER TABLE payment_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage payment offers"
  ON payment_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Check if user's subscription is active
CREATE OR REPLACE FUNCTION has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = check_user_id
      AND status = 'active'
      AND starts_at <= NOW()
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's current subscription limits
CREATE OR REPLACE FUNCTION get_subscription_limits(check_user_id UUID)
RETURNS TABLE (
  max_conferences INTEGER,
  max_registrations_per_conference INTEGER,
  max_storage_gb INTEGER,
  conferences_used INTEGER,
  registrations_used INTEGER,
  storage_used_gb DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.max_conferences,
    sp.max_registrations_per_conference,
    sp.max_storage_gb,
    s.conferences_used,
    s.registrations_used,
    s.storage_used_gb
  FROM subscriptions s
  INNER JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = check_user_id
    AND s.status = 'active'
    AND s.starts_at <= NOW()
    AND (s.expires_at IS NULL OR s.expires_at > NOW())
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. SEED DATA - DEFAULT SUBSCRIPTION PLANS
-- ============================================

INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_conferences, max_registrations_per_conference, max_storage_gb, features, display_order, active)
VALUES 
  (
    'Basic',
    'basic',
    'Perfect for small conferences and events',
    49.00,
    490.00,
    1,
    500,
    5,
    '["Up to 500 registrations per conference", "Basic analytics", "Email support", "QR code check-in", "Certificate generation", "Export to Excel/CSV"]'::jsonb,
    1,
    true
  ),
  (
    'Professional',
    'professional',
    'Ideal for multiple events and growing organizations',
    99.00,
    990.00,
    5,
    2000,
    20,
    '["Up to 5 conferences", "Up to 2,000 registrations per conference", "Advanced analytics", "Priority email support", "Custom branding", "Abstract management", "Payment processing", "All Basic features"]'::jsonb,
    2,
    true
  ),
  (
    'Enterprise',
    'enterprise',
    'For large-scale conferences and institutions',
    249.00,
    2490.00,
    999,
    999999,
    100,
    '["Unlimited conferences", "Unlimited registrations", "Dedicated support", "Custom domain", "API access", "Advanced integrations", "White-label option", "All Professional features"]'::jsonb,
    3,
    true
  );

-- ============================================
-- 8. VIEWS FOR EASIER QUERYING
-- ============================================

-- Active subscriptions with plan details
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  up.email,
  up.full_name,
  up.organization,
  sp.name as plan_name,
  sp.slug as plan_slug,
  s.billing_cycle,
  s.price,
  s.currency,
  s.status,
  s.starts_at,
  s.expires_at,
  s.conferences_used,
  s.registrations_used,
  sp.max_conferences,
  sp.max_registrations_per_conference,
  s.stripe_subscription_id
FROM subscriptions s
INNER JOIN user_profiles up ON s.user_id = up.id
INNER JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active'
  AND s.starts_at <= NOW()
  AND (s.expires_at IS NULL OR s.expires_at > NOW());

COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans for Conference Admin users';
COMMENT ON TABLE subscriptions IS 'Tracks active and historical subscriptions for Conference Admin users';
COMMENT ON TABLE payment_offers IS 'Tracks payment offers sent to potential customers';

