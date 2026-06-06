-- ============================================================================
-- Payment Accounts Schema
-- Table untuk menyimpan data rekening pembayaran
-- ============================================================================

-- Drop existing table if needed (careful in production!)
-- DROP TABLE IF EXISTS payment_accounts CASCADE;

-- Create payment_accounts table
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  branch TEXT,
  payment_type TEXT DEFAULT 'all' CHECK (payment_type IN ('all', 'dp', 'final_payment')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_accounts_is_active ON payment_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_payment_type ON payment_accounts(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_is_default ON payment_accounts(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_sort_order ON payment_accounts(sort_order);

-- Enable RLS (Row Level Security)
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated admin access
CREATE POLICY IF NOT EXISTS "Admin full access to payment_accounts"
  ON payment_accounts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS payment_accounts_updated_at_trigger ON payment_accounts;
CREATE TRIGGER payment_accounts_updated_at_trigger
  BEFORE UPDATE ON payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_accounts_updated_at();

-- Function to ensure only one default account per payment_type
CREATE OR REPLACE FUNCTION ensure_single_default_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset other defaults for the same payment_type
    UPDATE payment_accounts
    SET is_default = false
    WHERE id != NEW.id
      AND payment_type = NEW.payment_type
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single default
DROP TRIGGER IF EXISTS ensure_single_default_trigger ON payment_accounts;
CREATE TRIGGER ensure_single_default_trigger
  AFTER INSERT OR UPDATE ON payment_accounts
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_account();

-- ============================================================================
-- Seed Data (Optional - untuk development)
-- ============================================================================

--.insert into payment_accounts (id, bank_name, account_number, account_holder_name, branch, payment_type, is_default, is_active, sort_order)
--values
--  ('acc-bri-001'::uuid, 'BRI', '645201020316531', 'DANI INDRA FIRMANSYAH', 'Cabang Pacitan', 'all', true, true, 1)
--ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT ALL ON payment_accounts TO authenticated;
GRANT ALL ON payment_accounts TO service_role;
