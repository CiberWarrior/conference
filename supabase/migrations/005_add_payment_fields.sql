-- Add payment-related fields to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS invoice_id TEXT,
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Create index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_payment_intent_id ON registrations(payment_intent_id);

-- Create index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_invoice_id ON registrations(invoice_id);

