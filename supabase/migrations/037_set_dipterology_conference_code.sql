-- =====================================================
-- SET CONFERENCE CODE FOR DIPTEROLOGY CONFERENCE
-- =====================================================

-- Check current state
SELECT 
  id, 
  name, 
  conference_code,
  slug,
  created_at
FROM conferences 
WHERE name LIKE '%Dipterology%'
ORDER BY created_at DESC;

-- Set conference code for the Dipterology conference
UPDATE conferences 
SET conference_code = 'ICD11'
WHERE name LIKE '%Dipterology%'
  AND conference_code IS NULL;

-- Verify the update
SELECT 
  id, 
  name, 
  conference_code,
  slug
FROM conferences 
WHERE name LIKE '%Dipterology%';

-- Check if there are any registrations for this conference
SELECT 
  r.id,
  r.registration_number,
  r.email,
  r.created_at,
  c.name as conference_name,
  c.conference_code
FROM registrations r
JOIN conferences c ON r.conference_id = c.id
WHERE c.name LIKE '%Dipterology%'
ORDER BY r.created_at DESC
LIMIT 10;

-- If registrations exist without numbers, generate them
DO $$
DECLARE
  conf_id UUID;
  reg_record RECORD;
  generated_number VARCHAR(50);
BEGIN
  -- Get the Dipterology conference ID
  SELECT id INTO conf_id
  FROM conferences
  WHERE name LIKE '%Dipterology%'
  LIMIT 1;
  
  IF conf_id IS NOT NULL THEN
    -- Generate numbers for existing registrations
    FOR reg_record IN 
      SELECT id, conference_id 
      FROM registrations 
      WHERE conference_id = conf_id
        AND registration_number IS NULL
      ORDER BY created_at
    LOOP
      generated_number := generate_conference_registration_number(reg_record.conference_id);
      
      UPDATE registrations
      SET registration_number = generated_number
      WHERE id = reg_record.id;
      
      RAISE NOTICE 'Generated % for registration %', generated_number, reg_record.id;
    END LOOP;
  END IF;
END $$;

-- Final verification - show all registrations with their numbers
SELECT 
  r.id,
  r.registration_number,
  r.email,
  r.first_name,
  r.last_name,
  r.created_at,
  c.name as conference_name,
  c.conference_code
FROM registrations r
JOIN conferences c ON r.conference_id = c.id
WHERE c.name LIKE '%Dipterology%'
ORDER BY r.registration_number;

-- Update participant_registrations with registration numbers
UPDATE participant_registrations pr
SET registration_number = r.registration_number
FROM registrations r
WHERE pr.registration_id = r.id
  AND pr.registration_number IS NULL
  AND r.conference_id IN (
    SELECT id FROM conferences WHERE name LIKE '%Dipterology%'
  );

-- Verify participant_registrations
SELECT 
  pr.id,
  pr.registration_number,
  pp.email,
  pp.first_name,
  pp.last_name,
  c.name as conference_name
FROM participant_registrations pr
JOIN participant_profiles pp ON pr.participant_id = pp.id
JOIN conferences c ON pr.conference_id = c.id
WHERE c.name LIKE '%Dipterology%'
ORDER BY pr.registered_at DESC;
