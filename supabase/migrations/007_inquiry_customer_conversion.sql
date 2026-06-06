-- =============================================================================
-- MIGRATION 007: Inquiry to Customer Conversion
-- =============================================================================
-- Purpose: Link converted inquiries to customers without changing existing data.
-- Safety: Uses ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
-- =============================================================================

ALTER TABLE inquiries
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inquiries_customer_id ON inquiries(customer_id);

COMMENT ON COLUMN inquiries.customer_id IS 'Customer created or linked when inquiry is converted.';
