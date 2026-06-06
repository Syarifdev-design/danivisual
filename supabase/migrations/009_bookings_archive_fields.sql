-- ============================================================================
-- Bookings Archive Fields
-- ============================================================================
-- Adds soft-archive fields so bookings can be cancelled/archived without
-- deleting historical customer, payment, finance, and production data.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_is_active ON bookings(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_archived_at ON bookings(archived_at);

