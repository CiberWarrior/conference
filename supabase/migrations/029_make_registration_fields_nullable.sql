-- Make standard registration fields nullable
-- Since we now use custom_data and participants JSONB columns for all data,
-- the old standard columns are no longer required

-- Make standard fields nullable
ALTER TABLE registrations
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN last_name DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL;

-- Make other standard fields nullable if they exist and have NOT NULL constraints
ALTER TABLE registrations
ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE registrations
ALTER COLUMN country DROP NOT NULL;

ALTER TABLE registrations
ALTER COLUMN institution DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON TABLE registrations IS 'Registration records. Standard fields (first_name, last_name, etc.) are nullable as all data is now stored in custom_data and participants JSONB columns for flexibility.';
