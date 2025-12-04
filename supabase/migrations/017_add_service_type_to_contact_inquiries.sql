-- Migration: Add service_type to contact_inquiries
-- Purpose: Track which service the inquiry is about (platform, website, both, other)
-- Date: December 2025

-- Add service_type column to contact_inquiries
ALTER TABLE contact_inquiries
ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);

-- Add comment
COMMENT ON COLUMN contact_inquiries.service_type IS 'Service type: platform, website, both, other';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_service_type 
ON contact_inquiries(service_type);

