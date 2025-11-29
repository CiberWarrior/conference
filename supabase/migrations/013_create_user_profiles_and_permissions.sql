-- Migration: User Profiles and Conference Permissions
-- Purpose: Implement role-based access control for multi-tenant admin system

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'conference_admin' CHECK (role IN ('super_admin', 'conference_admin')),
  active BOOLEAN DEFAULT true,
  phone VARCHAR(50),
  organization VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(active);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

COMMENT ON TABLE user_profiles IS 'Extended user profiles with roles and permissions';
COMMENT ON COLUMN user_profiles.role IS 'User role: super_admin (platform owner) or conference_admin (client)';

-- ============================================
-- 2. CONFERENCE PERMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS conference_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  
  -- Granular permissions (can be expanded)
  can_view_registrations BOOLEAN DEFAULT true,
  can_export_data BOOLEAN DEFAULT true,
  can_manage_payments BOOLEAN DEFAULT true,
  can_manage_abstracts BOOLEAN DEFAULT true,
  can_check_in BOOLEAN DEFAULT true,
  can_generate_certificates BOOLEAN DEFAULT true,
  can_edit_conference BOOLEAN DEFAULT false,
  can_delete_data BOOLEAN DEFAULT false,
  
  -- Metadata
  granted_by UUID REFERENCES user_profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(user_id, conference_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conf_perms_user ON conference_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_conf_perms_conference ON conference_permissions(conference_id);
CREATE INDEX IF NOT EXISTS idx_conf_perms_user_conf ON conference_permissions(user_id, conference_id);

COMMENT ON TABLE conference_permissions IS 'Defines which users can access which conferences';
COMMENT ON COLUMN conference_permissions.granted_by IS 'Super admin who granted access';

-- ============================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can update all profiles
CREATE POLICY "Super admins can update profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()) -- Can't change own role
  );

-- Enable RLS on conference_permissions
ALTER TABLE conference_permissions ENABLE ROW LEVEL SECURITY;

-- Super admins can view all permissions
CREATE POLICY "Super admins can view all permissions"
  ON conference_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON conference_permissions FOR SELECT
  USING (user_id = auth.uid());

-- Super admins can insert/update/delete permissions
CREATE POLICY "Super admins can manage permissions"
  ON conference_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Update RLS policies for conferences table
-- Super admins see all, conference admins see only their assigned conferences
DROP POLICY IF EXISTS "Anyone can view conferences" ON conferences;

CREATE POLICY "Users see their conferences"
  ON conferences FOR SELECT
  USING (
    -- Super admin sees all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR
    -- Conference admin sees only assigned conferences
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid() AND conference_id = conferences.id
    )
  );

CREATE POLICY "Super admins can manage conferences"
  ON conferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Update RLS policies for registrations table
DROP POLICY IF EXISTS "Admin can view all registrations" ON registrations;

CREATE POLICY "Users see registrations for their conferences"
  ON registrations FOR SELECT
  USING (
    -- Super admin sees all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR
    -- Conference admin sees only their conferences' registrations
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid() 
        AND conference_id = registrations.conference_id
        AND can_view_registrations = true
    )
  );

CREATE POLICY "Users can manage registrations for their conferences"
  ON registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid() 
        AND conference_id = registrations.conference_id
    )
  );

-- Update RLS policies for abstracts table
DROP POLICY IF EXISTS "Admin can view all abstracts" ON abstracts;

CREATE POLICY "Users see abstracts for their conferences"
  ON abstracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid() 
        AND conference_id = abstracts.conference_id
        AND can_manage_abstracts = true
    )
  );

CREATE POLICY "Users can manage abstracts for their conferences"
  ON abstracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM conference_permissions
      WHERE user_id = auth.uid() 
        AND conference_id = abstracts.conference_id
    )
  );

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = check_user_id AND role = 'super_admin' AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission for conference
CREATE OR REPLACE FUNCTION has_conference_permission(
  check_user_id UUID,
  check_conference_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conference_permissions
    WHERE user_id = check_user_id 
      AND conference_id = check_conference_id
  ) OR is_super_admin(check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible conferences
CREATE OR REPLACE FUNCTION get_accessible_conferences(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  location VARCHAR,
  start_date DATE,
  end_date DATE,
  published BOOLEAN,
  active BOOLEAN
) AS $$
BEGIN
  -- Super admin gets all conferences
  IF is_super_admin(check_user_id) THEN
    RETURN QUERY
    SELECT c.id, c.name, c.slug, c.location, c.start_date, c.end_date, c.published, c.active
    FROM conferences c
    ORDER BY c.created_at DESC;
  ELSE
    -- Conference admin gets only assigned conferences
    RETURN QUERY
    SELECT c.id, c.name, c.slug, c.location, c.start_date, c.end_date, c.published, c.active
    FROM conferences c
    INNER JOIN conference_permissions cp ON c.id = cp.conference_id
    WHERE cp.user_id = check_user_id
    ORDER BY c.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIEWS FOR EASIER QUERYING
-- ============================================

-- View: Users with their conferences
CREATE OR REPLACE VIEW user_conferences AS
SELECT 
  up.id as user_id,
  up.email,
  up.full_name,
  up.role,
  c.id as conference_id,
  c.name as conference_name,
  c.slug as conference_slug,
  cp.can_view_registrations,
  cp.can_export_data,
  cp.can_manage_payments,
  cp.can_manage_abstracts,
  cp.can_check_in,
  cp.can_generate_certificates,
  cp.can_edit_conference,
  cp.granted_at
FROM user_profiles up
LEFT JOIN conference_permissions cp ON up.id = cp.user_id
LEFT JOIN conferences c ON cp.conference_id = c.id
WHERE up.active = true;

-- ============================================
-- 6. INITIAL SETUP - CREATE YOUR SUPER ADMIN
-- ============================================

-- NOTE: You need to replace 'your-email@example.com' with your actual email
-- This will be executed after you create your first user in Supabase Auth

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create a new user with your email
-- 3. Copy the user UUID
-- 4. Run this insert with your actual UUID and email:

-- Example (REPLACE WITH YOUR ACTUAL DATA):
-- INSERT INTO user_profiles (id, email, full_name, role, active)
-- VALUES (
--   'your-user-uuid-from-supabase',
--   'your-email@example.com',
--   'Your Full Name',
--   'super_admin',
--   true
-- );

-- ============================================
-- 7. AUDIT LOG (OPTIONAL - FOR TRACKING CHANGES)
-- ============================================

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

COMMENT ON TABLE admin_audit_log IS 'Audit trail for admin actions';

-- Function to log admin actions
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


