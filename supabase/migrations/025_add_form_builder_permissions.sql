-- Add new permissions for form builder and analytics
-- This migration adds columns for managing registration forms and viewing analytics

-- Add new permission columns to conference_permissions table
ALTER TABLE conference_permissions
ADD COLUMN IF NOT EXISTS can_manage_registration_form BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_all_registrations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN conference_permissions.can_manage_registration_form IS 'Permission to create and edit custom registration form fields';
COMMENT ON COLUMN conference_permissions.can_view_all_registrations IS 'Permission to view all registrations without restrictions';
COMMENT ON COLUMN conference_permissions.can_view_analytics IS 'Permission to view conference analytics and statistics';

-- Update existing Conference Admin users to have these permissions by default
UPDATE conference_permissions
SET 
  can_view_all_registrations = true,
  can_view_analytics = true
WHERE can_view_registrations = true;

-- Grant form builder permission to users who can edit conferences
UPDATE conference_permissions
SET can_manage_registration_form = true
WHERE can_edit_conference = true;

-- Update RLS policy for registrations table
-- Conference Admin can view all registrations for their assigned conferences
DROP POLICY IF EXISTS "conference_admins_view_registrations" ON registrations;

CREATE POLICY "conference_admins_view_registrations" ON registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN conference_permissions cp ON up.id = cp.user_id
    WHERE up.id = auth.uid()
    AND cp.conference_id = registrations.conference_id
    AND (cp.can_view_registrations = true OR cp.can_view_all_registrations = true)
    AND up.active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
    AND up.active = true
  )
);

-- Update RLS policy for conferences table
-- Conference Admin can view their assigned conferences
DROP POLICY IF EXISTS "conference_admins_view_conferences" ON conferences;

CREATE POLICY "conference_admins_view_conferences" ON conferences
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN conference_permissions cp ON up.id = cp.user_id
    WHERE up.id = auth.uid()
    AND cp.conference_id = conferences.id
    AND up.active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
    AND up.active = true
  )
  OR
  published = true
);

-- Conference Admin can update registration forms only if they have permission
DROP POLICY IF EXISTS "conference_admins_update_conferences" ON conferences;

CREATE POLICY "conference_admins_update_conferences" ON conferences
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN conference_permissions cp ON up.id = cp.user_id
    WHERE up.id = auth.uid()
    AND cp.conference_id = conferences.id
    AND (cp.can_edit_conference = true OR cp.can_manage_registration_form = true)
    AND up.active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
    AND up.active = true
  )
);
