-- Support tickets for internal/admin support (e.g. participant issues, technical requests).
-- Separate from contact_inquiries (sales leads).

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(100),
  conference_id UUID REFERENCES conferences(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email VARCHAR(255),
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_conference_id ON support_tickets(conference_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to_user_id);

CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all support tickets" ON support_tickets;
CREATE POLICY "Admin can view all support tickets"
  ON support_tickets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can insert support tickets" ON support_tickets;
CREATE POLICY "Admin can insert support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update support tickets" ON support_tickets;
CREATE POLICY "Admin can update support tickets"
  ON support_tickets FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Admin can delete support tickets" ON support_tickets;
CREATE POLICY "Admin can delete support tickets"
  ON support_tickets FOR DELETE
  USING (true);

COMMENT ON TABLE support_tickets IS 'Internal support tickets (admin/participant issues). Status: open, in_progress, resolved, closed. Priority: low, medium, high, urgent.';
