-- Add new fields to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS arrival_date DATE,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS payment_by_card BOOLEAN DEFAULT false;

-- Create index on country for filtering
CREATE INDEX IF NOT EXISTS idx_registrations_country ON registrations(country);

-- Create index on institution for filtering
CREATE INDEX IF NOT EXISTS idx_registrations_institution ON registrations(institution);

-- Add check constraint to ensure departure_date is after arrival_date
ALTER TABLE registrations
ADD CONSTRAINT check_dates CHECK (
  arrival_date IS NULL OR 
  departure_date IS NULL OR 
  departure_date >= arrival_date
);

