-- Add abstract_submission field to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS abstract_submission BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN registrations.abstract_submission IS 'Indicates whether the registrant will submit an abstract';

