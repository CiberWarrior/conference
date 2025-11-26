-- Add payment management fields
-- This migration adds fields for refunds, payment history, and reminders

-- Add refund fields to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS refund_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('none', 'requested', 'approved', 'rejected', 'processed')),
ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_reminder_count INTEGER DEFAULT 0;

-- Create payment_history table for tracking all payment transactions
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_payment_intent_id TEXT,
  stripe_refund_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_history_registration_id ON payment_history(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_refund_status ON registrations(refund_status);
CREATE INDEX IF NOT EXISTS idx_registrations_last_reminder ON registrations(last_payment_reminder_sent_at);

-- Add comments
COMMENT ON COLUMN registrations.refund_requested IS 'Whether a refund has been requested';
COMMENT ON COLUMN registrations.refund_amount IS 'Amount to be refunded';
COMMENT ON COLUMN registrations.refund_status IS 'Status of the refund request';
COMMENT ON COLUMN registrations.last_payment_reminder_sent_at IS 'When the last payment reminder was sent';
COMMENT ON COLUMN registrations.payment_reminder_count IS 'Number of payment reminders sent';

