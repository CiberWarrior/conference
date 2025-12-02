-- =====================================================
-- USER ACTIVITY TRACKING
-- =====================================================

-- Create user_activity_log table for tracking user actions
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'view_registration', 'download_certificate', etc.
  resource_type VARCHAR(100), -- 'registration', 'abstract', 'certificate', etc.
  resource_id UUID,
  details JSONB, -- Additional data about the action
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_email ON user_activity_log(user_email);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON user_activity_log(session_id);

COMMENT ON TABLE user_activity_log IS 'User activity tracking for conference participants';

-- Add RLS policies
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view their own activity"
  ON user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

-- Admins can view all activity
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

-- Function to log user activity (can be called from other functions)
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
  -- Get user email from auth
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

COMMENT ON FUNCTION log_user_activity IS 'Helper function to log user activities';

