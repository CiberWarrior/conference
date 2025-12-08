-- Add accompanying_persons_data field to store details about accompanying persons
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS accompanying_persons_data JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN registrations.accompanying_persons_data IS 'Stores array of accompanying persons with their details (name, surname, arrival_date, departure_date)';

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_registrations_accompanying_persons_data ON registrations USING GIN (accompanying_persons_data);

