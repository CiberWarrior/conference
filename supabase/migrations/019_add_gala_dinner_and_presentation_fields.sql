-- Add gala_dinner and presentation_type fields to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS gala_dinner BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS presentation_type BOOLEAN NOT NULL DEFAULT false;

-- Add comments to explain the fields
COMMENT ON COLUMN registrations.gala_dinner IS 'Indicates whether the registrant will attend the Gala Dinner';
COMMENT ON COLUMN registrations.presentation_type IS 'Indicates whether the registrant intends to have poster/spoken presentation';

