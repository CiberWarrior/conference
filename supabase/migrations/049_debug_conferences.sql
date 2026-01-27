-- =====================================================
-- DEBUG: Check conferences and permissions
-- =====================================================

-- 1. Show all conferences
SELECT 
  id,
  name,
  slug,
  owner_id,
  active,
  published,
  created_at
FROM conferences
ORDER BY created_at DESC;

-- 2. Show all super admins
SELECT 
  id,
  email,
  full_name,
  role,
  active
FROM user_profiles
WHERE role = 'super_admin';

-- 3. Show all conference permissions
SELECT 
  cp.user_id,
  up.email,
  up.role,
  up.active as user_active,
  c.name as conference_name,
  c.slug,
  c.active as conf_active,
  c.published as conf_published,
  cp.can_edit_conference,
  cp.granted_at
FROM conference_permissions cp
JOIN user_profiles up ON cp.user_id = up.id
JOIN conferences c ON cp.conference_id = c.id
ORDER BY cp.granted_at DESC;

-- 4. Test RLS policy directly for your user
-- Replace 'YOUR_USER_ID_HERE' with actual user ID from user_profiles
DO $$
DECLARE
  test_user_id UUID;
  conf_count INTEGER;
BEGIN
  -- Get first super admin
  SELECT id INTO test_user_id
  FROM user_profiles
  WHERE role = 'super_admin' AND active = true
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    -- Set the user context (simulates RLS)
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id::text)::text, true);
    
    -- Count conferences this user should see
    SELECT COUNT(*) INTO conf_count
    FROM conferences;
    
    RAISE NOTICE 'User % (super_admin) should see % conferences', test_user_id, conf_count;
  ELSE
    RAISE NOTICE 'No super admin found in user_profiles';
  END IF;
END $$;
