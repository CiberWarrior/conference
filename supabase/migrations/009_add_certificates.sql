-- Add certificate fields to registrations table
-- This migration adds certificate generation functionality

-- Add certificate fields
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS certificate_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_sent_at TIMESTAMP WITH TIME ZONE;

-- Create certificates table for storing certificate metadata
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL DEFAULT 'participation' CHECK (certificate_type IN ('participation', 'presentation', 'organizer', 'volunteer')),
  certificate_number TEXT UNIQUE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  template_name TEXT DEFAULT 'default',
  pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_certificates_registration_id ON certificates(registration_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_registrations_certificate_generated ON registrations(certificate_generated);

-- Add comments
COMMENT ON COLUMN registrations.certificate_generated IS 'Whether a certificate has been generated for this registration';
COMMENT ON COLUMN registrations.certificate_url IS 'URL to the generated certificate PDF';
COMMENT ON COLUMN certificates.certificate_type IS 'Type of certificate: participation, presentation, organizer, volunteer';
COMMENT ON COLUMN certificates.certificate_number IS 'Unique certificate number/ID';

