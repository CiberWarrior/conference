-- Fix missing registration columns
-- This migration ensures all required columns exist in the registrations table

-- Add accompanying_persons if missing
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS accompanying_persons BOOLEAN NOT NULL DEFAULT false;

-- Add gala_dinner if missing
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS gala_dinner BOOLEAN NOT NULL DEFAULT false;

-- Add presentation_type if missing
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS presentation_type BOOLEAN NOT NULL DEFAULT false;

-- Add abstract_submission if missing
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS abstract_submission BOOLEAN NOT NULL DEFAULT false;

-- Add accompanying_persons_data if missing
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS accompanying_persons_data JSONB DEFAULT '[]'::jsonb;

-- Add comments
COMMENT ON COLUMN registrations.accompanying_persons IS 'Indicates whether the registrant will bring accompanying persons to the conference';
COMMENT ON COLUMN registrations.gala_dinner IS 'Indicates whether the registrant will attend the Gala Dinner';
COMMENT ON COLUMN registrations.presentation_type IS 'Indicates whether the registrant intends to have poster/spoken presentation';
COMMENT ON COLUMN registrations.abstract_submission IS 'Indicates whether the registrant will submit an abstract';
COMMENT ON COLUMN registrations.accompanying_persons_data IS 'Stores array of accompanying persons with their details (name, surname, arrival_date, departure_date)';

-- Create index for accompanying_persons_data if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_registrations_accompanying_persons_data ON registrations USING GIN (accompanying_persons_data);

