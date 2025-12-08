-- Add accompanying_persons field to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS accompanying_persons BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN registrations.accompanying_persons IS 'Indicates whether the registrant will bring accompanying persons to the conference';

