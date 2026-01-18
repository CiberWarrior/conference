-- =====================================================
-- ADD CONFERENCE CODE AND REGISTRATION NUMBERS
-- Conference-specific registration numbers (e.g., ICD11-001, ICD11-002)
-- =====================================================

-- =====================================================
-- STEP 1: ADD CONFERENCE CODE (abbreviation)
-- =====================================================

-- Add conference_code column to conferences table
ALTER TABLE conferences
ADD COLUMN IF NOT EXISTS conference_code VARCHAR(20) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_conferences_code 
ON conferences(conference_code);

-- Add comment
COMMENT ON COLUMN conferences.conference_code IS 
'Short abbreviation for conference (e.g., ICD11, ISMB2025) - used in registration numbers';

-- =====================================================
-- STEP 2: ADD REGISTRATION NUMBERS
-- =====================================================

-- Add registration_number to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);

-- Create unique index (prevents duplicate registration numbers)
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_number 
ON registrations(registration_number) WHERE registration_number IS NOT NULL;

-- Create index for searching
CREATE INDEX IF NOT EXISTS idx_registrations_number_search 
ON registrations(registration_number) WHERE registration_number IS NOT NULL;

-- =====================================================
-- STEP 3: FUNCTION TO GENERATE REGISTRATION NUMBER
-- =====================================================

CREATE OR REPLACE FUNCTION generate_conference_registration_number(
  p_conference_id UUID
)
RETURNS VARCHAR(50) AS $$
DECLARE
  conf_code VARCHAR(20);
  sequence_num INTEGER;
  reg_number VARCHAR(50);
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Get conference code
  SELECT conference_code INTO conf_code
  FROM conferences
  WHERE id = p_conference_id;
  
  -- If no conference code set, use fallback
  IF conf_code IS NULL OR conf_code = '' THEN
    conf_code := 'REG';
  END IF;
  
  -- Loop to handle race conditions
  LOOP
    -- Get next sequence number for this conference
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(registration_number FROM '[0-9]+$') AS INTEGER
      )
    ), 0) + 1
    INTO sequence_num
    FROM registrations
    WHERE conference_id = p_conference_id
      AND registration_number IS NOT NULL
      AND registration_number ~ ('^' || conf_code || '-[0-9]+$');
    
    -- Format: {CODE}-{SEQUENCE} (e.g., ICD11-001)
    reg_number := conf_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    -- Check if this number already exists (race condition check)
    IF NOT EXISTS (
      SELECT 1 FROM registrations 
      WHERE registration_number = reg_number
    ) THEN
      RETURN reg_number;
    END IF;
    
    -- If exists, increment attempt counter and try again
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      -- Fallback: use random suffix
      reg_number := conf_code || '-' || LPAD(sequence_num::TEXT, 3, '0') || '-' || 
                    SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4);
      RETURN reg_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: TRIGGER TO AUTO-GENERATE REGISTRATION NUMBER
-- =====================================================

CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if not already set and conference_id exists
  IF NEW.registration_number IS NULL AND NEW.conference_id IS NOT NULL THEN
    NEW.registration_number := generate_conference_registration_number(NEW.conference_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS before_insert_registration_number ON registrations;

CREATE TRIGGER before_insert_registration_number
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_number();

-- =====================================================
-- STEP 5: BACKFILL EXISTING REGISTRATIONS
-- =====================================================

-- Generate numbers for existing registrations (ordered by creation date)
DO $$
DECLARE
  reg_record RECORD;
  generated_number VARCHAR(50);
BEGIN
  FOR reg_record IN 
    SELECT id, conference_id 
    FROM registrations 
    WHERE registration_number IS NULL 
      AND conference_id IS NOT NULL
    ORDER BY created_at
  LOOP
    generated_number := generate_conference_registration_number(reg_record.conference_id);
    
    UPDATE registrations
    SET registration_number = generated_number
    WHERE id = reg_record.id;
  END LOOP;
END $$;

-- =====================================================
-- STEP 6: ADD TO PARTICIPANT_REGISTRATIONS
-- =====================================================

-- Add registration_number to participant_registrations for easy access
ALTER TABLE participant_registrations
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);

-- Create index
CREATE INDEX IF NOT EXISTS idx_participant_registrations_number 
ON participant_registrations(registration_number);

-- Add comment
COMMENT ON COLUMN participant_registrations.registration_number IS 
'Registration number (e.g., ICD11-001) - copied from registrations table for quick access';

-- =====================================================
-- STEP 7: UPDATE EXISTING PARTICIPANT_REGISTRATIONS
-- =====================================================

-- Copy registration numbers from registrations to participant_registrations
UPDATE participant_registrations pr
SET registration_number = r.registration_number
FROM registrations r
WHERE pr.registration_id = r.id
  AND pr.registration_number IS NULL
  AND r.registration_number IS NOT NULL;

-- =====================================================
-- DONE!
-- =====================================================

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Conference codes can now be set via conferences.conference_code';
  RAISE NOTICE 'Registration numbers will be auto-generated in format: {CODE}-{SEQUENCE}';
  RAISE NOTICE 'Example: ICD11-001, ICD11-002, etc.';
END $$;
