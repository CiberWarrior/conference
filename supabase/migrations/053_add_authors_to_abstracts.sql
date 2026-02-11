-- Add support for multiple authors per abstract submission
-- This allows one abstract to have multiple authors with structured data

-- Add authors JSONB column to abstracts table
ALTER TABLE abstracts
ADD COLUMN IF NOT EXISTS authors JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_abstracts_authors ON abstracts USING GIN (authors);

-- Add comment
COMMENT ON COLUMN abstracts.authors IS 'Array of author objects, each with firstName, lastName, email, affiliation, and other author details';

-- Example structure:
-- authors: [
--   {
--     "firstName": "John",
--     "lastName": "Doe",
--     "email": "john@example.com",
--     "affiliation": "University XYZ",
--     "country": "USA",
--     "isCorresponding": true,
--     "order": 1
--   },
--   {
--     "firstName": "Jane",
--     "lastName": "Smith",
--     "email": "jane@example.com",
--     "affiliation": "Institute ABC",
--     "country": "UK",
--     "isCorresponding": false,
--     "order": 2
--   }
-- ]
