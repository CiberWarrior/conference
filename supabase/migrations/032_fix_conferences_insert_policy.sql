-- Fix RLS policy for conferences INSERT operations
-- The existing policy "Super admins can manage conferences" needs WITH CHECK clause for INSERT

-- Drop the existing policy
DROP POLICY IF EXISTS "Super admins can manage conferences" ON conferences;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Super admins can manage conferences"
  ON conferences FOR ALL
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

-- Also ensure there's a specific INSERT policy for super admins
CREATE POLICY "Super admins can insert conferences"
  ON conferences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    )
  );
