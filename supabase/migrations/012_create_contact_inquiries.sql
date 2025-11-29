-- Create contact_inquiries table for tracking sales leads
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  conference_type VARCHAR(50),
  expected_attendees VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new' NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  notes TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  converted BOOLEAN DEFAULT FALSE,
  converted_to_conference_id UUID REFERENCES conferences(id) ON DELETE SET NULL,
  source VARCHAR(100) DEFAULT 'website',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_converted ON contact_inquiries(converted);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_priority ON contact_inquiries(priority);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_inquiries_updated_at();

-- Add RLS policies
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Admin can view all inquiries
CREATE POLICY "Admin can view all contact inquiries"
  ON contact_inquiries FOR SELECT
  USING (true);

-- Anyone can insert (for public contact form)
CREATE POLICY "Anyone can insert contact inquiries"
  ON contact_inquiries FOR INSERT
  WITH CHECK (true);

-- Admin can update inquiries
CREATE POLICY "Admin can update contact inquiries"
  ON contact_inquiries FOR UPDATE
  USING (true);

-- Admin can delete inquiries
CREATE POLICY "Admin can delete contact inquiries"
  ON contact_inquiries FOR DELETE
  USING (true);

-- Create a view for inquiry statistics
CREATE OR REPLACE VIEW contact_inquiry_stats AS
SELECT
  COUNT(*) as total_inquiries,
  COUNT(*) FILTER (WHERE status = 'new') as new_inquiries,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_inquiries,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified_inquiries,
  COUNT(*) FILTER (WHERE converted = true) as converted_inquiries,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as inquiries_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as inquiries_last_30_days,
  COUNT(*) FILTER (WHERE conference_type = 'virtual') as virtual_conference_requests,
  COUNT(*) FILTER (WHERE conference_type = 'hybrid') as hybrid_conference_requests,
  COUNT(*) FILTER (WHERE conference_type = 'onsite') as onsite_conference_requests,
  ROUND(AVG(
    CASE 
      WHEN contacted_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (contacted_at - created_at)) / 3600
      ELSE NULL
    END
  ), 2) as avg_response_time_hours,
  ROUND(
    (COUNT(*) FILTER (WHERE converted = true)::numeric / NULLIF(COUNT(*), 0) * 100),
    2
  ) as conversion_rate_percent
FROM contact_inquiries;

COMMENT ON TABLE contact_inquiries IS 'Stores contact form submissions and sales leads from the marketing website';
COMMENT ON COLUMN contact_inquiries.status IS 'Status values: new, contacted, qualified, proposal_sent, negotiating, converted, rejected';
COMMENT ON COLUMN contact_inquiries.priority IS 'Priority values: low, medium, high, urgent';
COMMENT ON COLUMN contact_inquiries.source IS 'Where the inquiry came from: website, referral, event, etc.';


