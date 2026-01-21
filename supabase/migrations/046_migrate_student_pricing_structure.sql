-- Migration: Migrate student_discount to student pricing structure
-- This migration converts the old discount-based student pricing to fixed price per tier
-- and prepares the schema for custom fee types

-- Description:
-- Old structure: student_discount (amount to subtract from standard price)
-- New structure: student { early_bird, regular, late } (fixed prices per tier)

-- This is a DATA migration - no schema changes needed since pricing is JSONB

-- Step 1: Migrate existing conferences with student_discount to new student pricing structure
DO $$
DECLARE
  conf RECORD;
  early_bird_amount NUMERIC;
  regular_amount NUMERIC;
  late_amount NUMERIC;
  student_discount_amount NUMERIC;
  new_pricing JSONB;
BEGIN
  -- Loop through all conferences that have student_discount but not student pricing
  FOR conf IN 
    SELECT id, pricing 
    FROM conferences 
    WHERE pricing ? 'student_discount' 
      AND NOT pricing ? 'student'
  LOOP
    -- Extract amounts from pricing
    early_bird_amount := (conf.pricing->'early_bird'->>'amount')::NUMERIC;
    regular_amount := (conf.pricing->'regular'->>'amount')::NUMERIC;
    late_amount := (conf.pricing->'late'->>'amount')::NUMERIC;
    student_discount_amount := (conf.pricing->>'student_discount')::NUMERIC;
    
    -- Calculate student prices (standard price minus discount)
    new_pricing := conf.pricing || jsonb_build_object(
      'student', jsonb_build_object(
        'early_bird', GREATEST(0, early_bird_amount - student_discount_amount),
        'regular', GREATEST(0, regular_amount - student_discount_amount),
        'late', GREATEST(0, late_amount - student_discount_amount)
      )
    );
    
    -- Update the conference with new pricing structure
    -- Keep student_discount for backward compatibility (can be removed in future migration)
    UPDATE conferences
    SET 
      pricing = new_pricing,
      updated_at = NOW()
    WHERE id = conf.id;
    
    RAISE NOTICE 'Migrated conference % (ID: %)', 
      (SELECT name FROM conferences WHERE id = conf.id), 
      conf.id;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;

-- Step 2: For conferences that don't have student pricing at all, add default
-- (Same price as standard - they can adjust manually later)
UPDATE conferences
SET pricing = pricing || jsonb_build_object(
  'student', jsonb_build_object(
    'early_bird', (pricing->'early_bird'->>'amount')::NUMERIC,
    'regular', (pricing->'regular'->>'amount')::NUMERIC,
    'late', (pricing->'late'->>'amount')::NUMERIC
  )
)
WHERE NOT pricing ? 'student';

-- Note: custom_fee_types will be added when admins create them (no default needed)

-- Verification query (commented out - uncomment to run after migration)
-- SELECT 
--   id,
--   name,
--   pricing->'student_discount' as old_discount,
--   pricing->'student' as new_student_pricing
-- FROM conferences
-- WHERE pricing ? 'student';
