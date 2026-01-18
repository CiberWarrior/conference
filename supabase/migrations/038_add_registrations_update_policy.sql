-- Migration: Add UPDATE policy for registrations table
-- This allows authenticated users and service role to update registrations
-- Needed for linking participant_profile_id after registration creation

-- ============================================
-- ADD UPDATE POLICY FOR REGISTRATIONS
-- ============================================

-- Allow authenticated users and service role to update registrations
CREATE POLICY "Allow update registrations"
ON registrations
FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "Allow update registrations" ON registrations IS 
'Allows authenticated users and service role to update registration records. Required for participant profile linking.';
