-- NOTE: This migration is intentionally empty / deprecated
-- We do NOT use user_id for abstracts because:
-- 1. Conference participants don't need login (only admins do)
-- 2. Everything works via email-based linking
-- 3. registration_id provides all necessary linking via email matching
-- 4. Simpler system = better UX

-- The linking strategy is:
-- abstracts.email → registrations.email → registration_id
-- This allows finding user's abstracts and registrations by email alone

-- No changes needed - abstracts already have registration_id column
