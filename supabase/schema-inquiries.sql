-- ============================================================================
-- Inquiries Schema
-- Table untuk menyimpan data inquiry dari form kontak
-- ============================================================================

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  service_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'archived')),
  source TEXT DEFAULT 'contact_page',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_source ON inquiries(source);

-- Enable RLS (Row Level Security)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated admin access
CREATE POLICY IF NOT EXISTS "Admin full access to inquiries"
  ON inquiries FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Public insert policy (anyone can submit inquiry)
CREATE POLICY IF NOT EXISTS "Anyone can insert inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS inquiries_updated_at_trigger ON inquiries;
CREATE TRIGGER inquiries_updated_at_trigger
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT ALL ON inquiries TO authenticated;
GRANT ALL ON inquiries TO service_role;
GRANT INSERT ON inquiries TO anon;
GRANT SELECT ON inquiries TO authenticated;