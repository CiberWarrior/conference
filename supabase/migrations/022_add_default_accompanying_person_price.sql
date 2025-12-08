-- Add default accompanying_person_price to existing conferences
-- Update all conferences to include accompanying_person_price: 140 if not already set

UPDATE conferences
SET pricing = jsonb_set(
  COALESCE(pricing, '{}'::jsonb),
  '{accompanying_person_price}',
  '140'::jsonb,
  true
)
WHERE pricing->>'accompanying_person_price' IS NULL 
   OR (pricing->>'accompanying_person_price')::numeric = 0;

-- Also update the default value in the table definition for new conferences
-- Note: This requires recreating the table, so we'll just ensure existing ones are updated

