-- =============================================================================
-- MIGRATION 006: Customers Foundation
-- =============================================================================
-- Purpose: Add customer lifecycle management columns to customers table
--
-- Changes:
--   1. Add status column (lead, active, booked, completed, inactive, archived)
--   2. Add source column (booking, inquiry, manual, portal)
--   3. Add is_active column for soft delete
--   4. Add updated_at if not exists
--   5. Add indexes for new columns
--
-- Safety: Uses ADD COLUMN IF NOT EXISTS to prevent errors on re-run
-- =============================================================================

-- =============================================================================
-- 1. ADD COLUMNS TO CUSTOMERS TABLE
-- =============================================================================

-- Add status column for customer lifecycle
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS status text DEFAULT 'lead'
CHECK (status IN ('lead', 'active', 'booked', 'completed', 'inactive', 'archived'));

-- Add source column for tracking customer origin
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
CHECK (source IN ('booking', 'inquiry', 'manual', 'portal'));

-- Add is_active column for soft delete (archive functionality)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add updated_at if the column doesn't exist yet
-- (schema-bookings.sql may or may not have added this already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE customers ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- =============================================================================
-- 2. UPDATE EXISTING DATA
-- =============================================================================

-- Set default status for existing customers (prioritize those with bookings)
UPDATE customers
SET
    status = CASE
        -- Customers with completed bookings become 'completed'
        WHEN EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.customer_id = customers.id
            AND b.status = 'completed'
        ) THEN 'completed'

        -- Customers with active bookings become 'booked'
        WHEN EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.customer_id = customers.id
            AND b.status IN ('pending', 'confirmed', 'in_progress')
        ) THEN 'booked'

        -- Customers with any bookings become 'active'
        WHEN EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.customer_id = customers.id
        ) THEN 'active'

        -- All others remain as 'lead'
        ELSE 'lead'
    END
WHERE status IS NULL OR status = 'lead';

-- Set source based on existing bookings (if any)
UPDATE customers
SET source = CASE
    WHEN EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.customer_id = customers.id
    ) THEN 'booking'
    ELSE COALESCE(NULLIF(source, ''), 'manual')
END
WHERE source IS NULL OR source = '';

-- Ensure all customers are active by default (don't archive existing)
UPDATE customers
SET is_active = true
WHERE is_active IS NULL;

-- =============================================================================
-- 3. ADD INDEXES FOR NEW COLUMNS
-- =============================================================================

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Index for duplicate checks and quick contact lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);

-- Index for filtering active/inactive customers
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- =============================================================================
-- 4. UPDATE TRIGGER FOR updated_at
-- =============================================================================

-- Create or replace the trigger function (may already exist from schema-bookings.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists to recreate
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN customers.status IS 'Customer lifecycle status: lead, active, booked, completed, inactive, archived';
COMMENT ON COLUMN customers.source IS 'Customer origin: booking (from booking form), inquiry (converted from inquiry), manual (created by admin), portal (self-registered)';
COMMENT ON COLUMN customers.is_active IS 'Soft delete flag - false means archived, data preserved but hidden from lists';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
