-- ============================================================
-- CATCH-UP MIGRACIJA: dodaje sve što je dijagnostika (schema-diagnostic.sql)
-- otkrila da nedostaje u ovoj bazi, a kod aplikacije to očekuje.
-- ============================================================
-- Nedostajalo je:
--   - registrations: certificate_generated, certificate_generated_at,
--     certificate_sent, certificate_sent_at, certificate_url,
--     checked_in, checked_in_at, status
--   - tablice: certificates, admin_audit_log, contact_inquiries,
--     user_activity_log, subscription_plans, subscriptions, payment_offers
--
-- Svaki dio je preuzet iz originalnih migracija (009, 007, 052, 013, 012,
-- 014, 016) bez izmjena osim dodatne idempotentnosti (IF NOT EXISTS,
-- DROP ... IF EXISTS prije CREATE, ON CONFLICT DO NOTHING za seed podatke),
-- tako da je ovu migraciju sigurno pokrenuti više puta.
--
-- Pokreni OVU migraciju PRIJE 056_tighten_rls_policies.sql, jer 056
-- zatim dodatno pooštrava RLS police na contact_inquiries koje ova
-- migracija stvara u njihovom (starijem, širem) obliku.

-- ============================================================
-- 0. Pomoćna funkcija (za updated_at trigere) — sigurno ako već postoji
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. REGISTRATIONS — nedostajuće kolone (iz 007, 009, 052)
-- ============================================================
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS certificate_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'confirmed';

ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE registrations
  ADD CONSTRAINT registrations_status_check
  CHECK (status IN ('confirmed', 'paid', 'cancelled'));

-- Backfill status za postojeće redove (isto kao 052)
UPDATE registrations
SET status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'confirmed' END
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_certificate_generated ON registrations(certificate_generated);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON registrations(checked_in);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in_at ON registrations(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_fee_id_status
  ON registrations(registration_fee_id, status)
  WHERE registration_fee_id IS NOT NULL;

-- ============================================================
-- 2. CERTIFICATES (iz 009)
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL DEFAULT 'participation' CHECK (certificate_type IN ('participation', 'presentation', 'organizer', 'volunteer')),
  certificate_number TEXT UNIQUE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  template_name TEXT DEFAULT 'default',
  pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_registration_id ON certificates(registration_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);

-- Napomena: originalna migracija 009 nije uključivala RLS na ovoj tablici.
-- Dodajemo je ovdje (isti obrazac kao za registrations/abstracts u 056):
-- admini konferencije čiji je registration_id vidljiv preko conference_id.
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage certificates for their conferences" ON certificates;
CREATE POLICY "Admins can manage certificates for their conferences"
  ON certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = certificates.registration_id
        AND (
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'super_admin' AND active = true
          )
          OR EXISTS (
            SELECT 1 FROM conference_permissions
            WHERE user_id = auth.uid() AND conference_id = r.conference_id
          )
        )
    )
  );

-- ============================================================
-- 3. ADMIN_AUDIT_LOG (iz 013)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Napomena: originalna migracija 013 nije uključivala RLS na ovoj tablici.
-- Dodajemo je ovdje (super-admin-only SELECT) u duhu migracije 056 koja
-- pooštrava sličnu izloženost na drugim tablicama — inače bi audit log bio
-- javno čitljiv preko API-ja bez restrikcije.
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view audit log" ON admin_audit_log;
CREATE POLICY "Super admins can view audit log"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );

-- ============================================================
-- 4. CONTACT_INQUIRIES (iz 012) — police su namjerno u izvornom,
-- širem obliku; migracija 056 (pokreni je NAKON ove) ih pooštrava.
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  conference_type VARCHAR(50),
  expected_attendees VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new' NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  notes TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  converted BOOLEAN DEFAULT FALSE,
  converted_to_conference_id UUID REFERENCES conferences(id) ON DELETE SET NULL,
  source VARCHAR(100) DEFAULT 'website',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_converted ON contact_inquiries(converted);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_priority ON contact_inquiries(priority);

CREATE OR REPLACE FUNCTION update_contact_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_inquiries_updated_at ON contact_inquiries;
CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_inquiries_updated_at();

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all contact inquiries" ON contact_inquiries;
CREATE POLICY "Admin can view all contact inquiries"
  ON contact_inquiries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert contact inquiries" ON contact_inquiries;
CREATE POLICY "Anyone can insert contact inquiries"
  ON contact_inquiries FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update contact inquiries" ON contact_inquiries;
CREATE POLICY "Admin can update contact inquiries"
  ON contact_inquiries FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Admin can delete contact inquiries" ON contact_inquiries;
CREATE POLICY "Admin can delete contact inquiries"
  ON contact_inquiries FOR DELETE
  USING (true);

CREATE OR REPLACE VIEW contact_inquiry_stats AS
SELECT
  COUNT(*) as total_inquiries,
  COUNT(*) FILTER (WHERE status = 'new') as new_inquiries,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_inquiries,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified_inquiries,
  COUNT(*) FILTER (WHERE converted = true) as converted_inquiries,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as inquiries_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as inquiries_last_30_days,
  COUNT(*) FILTER (WHERE conference_type = 'virtual') as virtual_conference_requests,
  COUNT(*) FILTER (WHERE conference_type = 'hybrid') as hybrid_conference_requests,
  COUNT(*) FILTER (WHERE conference_type = 'onsite') as onsite_conference_requests,
  ROUND(AVG(
    CASE
      WHEN contacted_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (contacted_at - created_at)) / 3600
      ELSE NULL
    END
  ), 2) as avg_response_time_hours,
  ROUND(
    (COUNT(*) FILTER (WHERE converted = true)::numeric / NULLIF(COUNT(*), 0) * 100),
    2
  ) as conversion_rate_percent
FROM contact_inquiries;

-- ============================================================
-- 5. USER_ACTIVITY_LOG (iz 014)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_email ON user_activity_log(user_email);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON user_activity_log(session_id);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
CREATE POLICY "Users can view their own activity"
  ON user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Admins can view all user activity" ON user_activity_log;
CREATE POLICY "Admins can view all user activity"
  ON user_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('super_admin', 'conference_admin')
      AND user_profiles.active = true
    )
  );

CREATE OR REPLACE FUNCTION log_user_activity(
  p_action VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_email VARCHAR(255);
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  IF v_user_email IS NOT NULL THEN
    INSERT INTO user_activity_log (
      user_id,
      user_email,
      action,
      resource_type,
      resource_id,
      details
    )
    VALUES (
      auth.uid(),
      v_user_email,
      p_action,
      p_resource_type,
      p_resource_id,
      p_details
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. SUBSCRIPTION SYSTEM (iz 016): subscription_plans, subscriptions,
--    payment_offers — potrebno za /admin/subscriptions (platform revenue)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  max_conferences INTEGER NOT NULL,
  max_registrations_per_conference INTEGER,
  max_storage_gb INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  stripe_product_id VARCHAR(255),
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_order ON subscription_plans(display_order);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  inquiry_id UUID REFERENCES contact_inquiries(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  billing_cycle VARCHAR(20) DEFAULT 'monthly' NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  conferences_used INTEGER DEFAULT 0,
  registrations_used INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trialing'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);

CREATE TABLE IF NOT EXISTS payment_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES contact_inquiries(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  billing_cycle VARCHAR(20) NOT NULL,
  custom_price DECIMAL(10, 2),
  discount_percent INTEGER DEFAULT 0,
  stripe_payment_link_id VARCHAR(255),
  stripe_payment_link_url TEXT,
  status VARCHAR(50) DEFAULT 'sent' NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_offer_status CHECK (status IN ('sent', 'paid', 'expired', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_payment_offers_inquiry ON payment_offers(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_payment_offers_status ON payment_offers(status);

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_offers_updated_at ON payment_offers;
CREATE TRIGGER update_payment_offers_updated_at
  BEFORE UPDATE ON payment_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Super admins can manage plans" ON subscription_plans;
CREATE POLICY "Super admins can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Super admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage subscriptions" ON subscriptions;
CREATE POLICY "Super admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

ALTER TABLE payment_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage payment offers" ON payment_offers;
CREATE POLICY "Super admins can manage payment offers"
  ON payment_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

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

-- Seed: default planovi — ON CONFLICT (slug) DO NOTHING čini ovo sigurnim
-- za ponovno pokretanje (neće duplicirati ako planovi već postoje).
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
  )
ON CONFLICT (slug) DO NOTHING;

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
COMMENT ON TABLE certificates IS 'Certificate metadata for registrations';
COMMENT ON TABLE admin_audit_log IS 'Audit trail for admin actions';
COMMENT ON TABLE contact_inquiries IS 'Stores contact form submissions and sales leads from the marketing website';
COMMENT ON TABLE user_activity_log IS 'User activity tracking for conference participants';

-- ============================================================
-- 7. PREOSTALE NEDOSTAJUĆE KOLONE (otkrivene u drugom krugu dijagnostike):
-- abstracts.authors/custom_data (iz 053, 031) i
-- contact_inquiries.service_type (iz 017)
-- ============================================================
ALTER TABLE abstracts
  ADD COLUMN IF NOT EXISTS authors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_abstracts_authors ON abstracts USING GIN (authors);
CREATE INDEX IF NOT EXISTS idx_abstracts_custom_data ON abstracts USING GIN (custom_data);

COMMENT ON COLUMN abstracts.authors IS 'Array of author objects, each with firstName, lastName, email, affiliation, and other author details';
COMMENT ON COLUMN abstracts.custom_data IS 'Stores custom abstract submission field values as key-value pairs';

ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_service_type
  ON contact_inquiries(service_type);

COMMENT ON COLUMN contact_inquiries.service_type IS 'Service type: platform, website, both, other';
