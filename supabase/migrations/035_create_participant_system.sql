-- ============================================
-- PARTICIPANT ACCOUNT SYSTEM
-- Enables participants to have accounts and track registrations across events
-- ============================================

-- ============================================
-- 1. PARTICIPANT PROFILES TABLE
-- ============================================
-- Central table for all participants (with or without accounts)

CREATE TABLE IF NOT EXISTS participant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Optional auth link (NULL = guest participant, NOT NULL = registered participant)
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Core identification
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  
  -- Contact & profile info
  phone VARCHAR(50),
  country VARCHAR(100),
  institution VARCHAR(255),
  
  -- Account status
  has_account BOOLEAN DEFAULT FALSE, -- TRUE if participant created login account
  account_activated_at TIMESTAMP WITH TIME ZONE,
  
  -- Profile data & preferences
  profile_data JSONB DEFAULT '{}'::jsonb, -- Custom fields, preferences, etc.
  
  -- Avatar/photo (optional)
  avatar_url TEXT,
  
  -- Privacy & communication preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  
  -- Loyalty tracking
  total_events_attended INTEGER DEFAULT 0,
  loyalty_tier VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
  loyalty_points INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participant_profiles_email ON participant_profiles(email);
CREATE INDEX IF NOT EXISTS idx_participant_profiles_auth_user_id ON participant_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_participant_profiles_has_account ON participant_profiles(has_account);
CREATE INDEX IF NOT EXISTS idx_participant_profiles_loyalty_tier ON participant_profiles(loyalty_tier);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_participant_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participant_profiles_updated_at
  BEFORE UPDATE ON participant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_profiles_updated_at();

-- Comments
COMMENT ON TABLE participant_profiles IS 'Central participant profiles - can exist with or without login accounts';
COMMENT ON COLUMN participant_profiles.auth_user_id IS 'Link to auth.users - NULL for guest participants';
COMMENT ON COLUMN participant_profiles.has_account IS 'Whether participant has created a login account';
COMMENT ON COLUMN participant_profiles.loyalty_tier IS 'Loyalty tier based on attendance: bronze (0-2), silver (3-5), gold (6-10), platinum (11+)';

-- ============================================
-- 2. PARTICIPANT REGISTRATIONS (Linking Table)
-- ============================================
-- Links participants to specific conference registrations (many-to-many)

CREATE TABLE IF NOT EXISTS participant_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations (foreign keys will be added after table creation if parent tables exist)
  participant_id UUID NOT NULL,
  conference_id UUID NOT NULL,
  registration_id UUID, -- Main registration record
  
  -- Registration status
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')),
  
  -- Event-specific data
  custom_data JSONB DEFAULT '{}'::jsonb, -- Event-specific custom fields
  
  -- Registration type & pricing
  registration_fee_type VARCHAR(100), -- early_bird, regular, late, student, etc.
  amount_paid DECIMAL(10, 2),
  currency VARCHAR(10),
  
  -- Payment info
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'not_required')),
  payment_intent_id TEXT,
  
  -- Check-in tracking
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  
  -- Certificate (optional - only if certificates table exists)
  certificate_id UUID,
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  
  -- Accommodation (if applicable)
  accommodation_data JSONB, -- Hotel, arrival/departure dates, etc.
  
  -- Abstract submission (if applicable)
  abstract_submitted BOOLEAN DEFAULT FALSE,
  abstract_id UUID,
  
  -- Cancellation tracking
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  refund_issued BOOLEAN DEFAULT FALSE,
  refund_amount DECIMAL(10, 2),
  
  -- Timestamps
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participant_registrations_participant ON participant_registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_registrations_conference ON participant_registrations(conference_id);
CREATE INDEX IF NOT EXISTS idx_participant_registrations_status ON participant_registrations(status);
CREATE INDEX IF NOT EXISTS idx_participant_registrations_payment_status ON participant_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_participant_registrations_registered_at ON participant_registrations(registered_at DESC);

-- Unique constraint: one participant per conference (can't register twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_registrations_unique 
ON participant_registrations(participant_id, conference_id) 
WHERE status != 'cancelled';

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_participant_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participant_registrations_updated_at
  BEFORE UPDATE ON participant_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_registrations_updated_at();

-- Comments
COMMENT ON TABLE participant_registrations IS 'Links participants to conference registrations - tracks event attendance history';
COMMENT ON COLUMN participant_registrations.status IS 'Registration status: confirmed, cancelled, attended, no_show';

-- ============================================
-- 3. PARTICIPANT ACCOUNT INVITES
-- ============================================
-- Tracks invites sent to participants to create accounts

CREATE TABLE IF NOT EXISTS participant_account_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  participant_id UUID NOT NULL REFERENCES participant_profiles(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  
  -- Invite token (for magic link)
  invite_token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participant_invites_token ON participant_account_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_participant_invites_participant ON participant_account_invites(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_invites_status ON participant_account_invites(status);

COMMENT ON TABLE participant_account_invites IS 'Tracks invitations sent to participants to create login accounts';

-- ============================================
-- 4. PARTICIPANT LOYALTY DISCOUNTS
-- ============================================
-- Tracks loyalty discounts for returning participants

CREATE TABLE IF NOT EXISTS participant_loyalty_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  participant_id UUID NOT NULL,
  conference_id UUID NOT NULL,
  
  -- Discount details
  discount_type VARCHAR(50) NOT NULL, -- returning_participant, loyalty_tier, custom
  discount_percentage DECIMAL(5, 2), -- e.g., 10.00 for 10%
  discount_amount DECIMAL(10, 2), -- Fixed amount discount
  
  -- Status
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP WITH TIME ZONE,
  
  -- Validation
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_discounts_participant ON participant_loyalty_discounts(participant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_discounts_conference ON participant_loyalty_discounts(conference_id);

COMMENT ON TABLE participant_loyalty_discounts IS 'Tracks loyalty discounts for returning participants';

-- ============================================
-- 5. UPDATE EXISTING REGISTRATIONS TABLE
-- ============================================
-- Add link to participant_profile for backward compatibility

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS participant_profile_id UUID REFERENCES participant_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_participant_profile ON registrations(participant_profile_id);

COMMENT ON COLUMN registrations.participant_profile_id IS 'Link to participant profile if participant has account';

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to calculate loyalty tier based on events attended
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(events_count INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
  IF events_count >= 11 THEN
    RETURN 'platinum';
  ELSIF events_count >= 6 THEN
    RETURN 'gold';
  ELSIF events_count >= 3 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update loyalty tier when participant registers for event
CREATE OR REPLACE FUNCTION update_participant_loyalty()
RETURNS TRIGGER AS $$
DECLARE
  attended_count INTEGER;
BEGIN
  -- Count attended events (status = 'attended' or 'confirmed')
  SELECT COUNT(*) INTO attended_count
  FROM participant_registrations
  WHERE participant_id = NEW.participant_id
    AND status IN ('attended', 'confirmed');
  
  -- Update participant profile
  UPDATE participant_profiles
  SET 
    total_events_attended = attended_count,
    loyalty_tier = calculate_loyalty_tier(attended_count),
    loyalty_points = attended_count * 10 -- 10 points per event
  WHERE id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update loyalty when registration status changes
CREATE TRIGGER update_loyalty_on_registration
  AFTER INSERT OR UPDATE OF status ON participant_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_loyalty();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE participant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_account_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_loyalty_discounts ENABLE ROW LEVEL SECURITY;

-- Participants can view/edit their own profiles
CREATE POLICY participant_own_profile ON participant_profiles
  FOR ALL
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Participants can view their own registrations
CREATE POLICY participant_own_registrations ON participant_registrations
  FOR SELECT
  USING (
    participant_id IN (
      SELECT id FROM participant_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Admin access to all participant data (via service role key)
CREATE POLICY admin_all_access_participants ON participant_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY admin_all_access_registrations ON participant_registrations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 8. ADD FOREIGN KEY CONSTRAINTS (IF TABLES EXIST)
-- ============================================
-- Add foreign key constraints only if parent tables exist

-- Add participant_id foreign key (participant_profiles should exist since we just created it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_participant_registrations_participant'
  ) THEN
    ALTER TABLE participant_registrations
    ADD CONSTRAINT fk_participant_registrations_participant
    FOREIGN KEY (participant_id) REFERENCES participant_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add conference_id foreign key if conferences table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conferences') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'fk_participant_registrations_conference'
    ) THEN
      ALTER TABLE participant_registrations
      ADD CONSTRAINT fk_participant_registrations_conference
      FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add registration_id foreign key if registrations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registrations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'fk_participant_registrations_registration'
    ) THEN
      ALTER TABLE participant_registrations
      ADD CONSTRAINT fk_participant_registrations_registration
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add certificate_id foreign key if certificates table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'fk_participant_registrations_certificate'
    ) THEN
      ALTER TABLE participant_registrations
      ADD CONSTRAINT fk_participant_registrations_certificate
      FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add abstract_id foreign key if abstracts table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'abstracts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'fk_participant_registrations_abstract'
    ) THEN
      ALTER TABLE participant_registrations
      ADD CONSTRAINT fk_participant_registrations_abstract
      FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add foreign keys for participant_loyalty_discounts
DO $$
BEGIN
  -- participant_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_loyalty_discounts_participant'
  ) THEN
    ALTER TABLE participant_loyalty_discounts
    ADD CONSTRAINT fk_loyalty_discounts_participant
    FOREIGN KEY (participant_id) REFERENCES participant_profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- conference_id foreign key if conferences table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conferences') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'fk_loyalty_discounts_conference'
    ) THEN
      ALTER TABLE participant_loyalty_discounts
      ADD CONSTRAINT fk_loyalty_discounts_conference
      FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================
-- DONE!
-- ============================================
