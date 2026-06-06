-- =============================================================================
-- Migration: 004_align_staff_tasks_schema
-- Purpose: Add missing columns to staff_tasks and update status values
-- =============================================================================

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add assigned_to_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'staff_tasks'
      AND column_name = 'assigned_to_name'
  ) THEN
    ALTER TABLE staff_tasks ADD COLUMN assigned_to_name text;
  END IF;

  -- Add assigned_by_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'staff_tasks'
      AND column_name = 'assigned_by_name'
  ) THEN
    ALTER TABLE staff_tasks ADD COLUMN assigned_by_name text;
  END IF;

  -- Add booking_order_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'staff_tasks'
      AND column_name = 'booking_order_number'
  ) THEN
    ALTER TABLE staff_tasks ADD COLUMN booking_order_number text;
  END IF;
END $$;

-- =============================================================================
-- Update status values (change 'pending' to 'todo')
-- =============================================================================

UPDATE staff_tasks
SET status = 'todo'
WHERE status = 'pending';

-- Update check constraint for status column
DO $$
BEGIN
  -- Drop the existing check constraint
  ALTER TABLE staff_tasks DROP CONSTRAINT IF EXISTS staff_tasks_status_check;

  -- Add the new check constraint with updated status values
  ALTER TABLE staff_tasks ADD CONSTRAINT staff_tasks_status_check
    CHECK (status IN ('todo', 'in_progress', 'submitted', 'revision', 'completed', 'cancelled', 'overdue'));
EXCEPTION
  WHEN undefined_object THEN
    -- Constraint doesn't exist, that's okay
    NULL;
END $$;

-- =============================================================================
-- Note: Column order is maintained as-is
-- New columns are added at the end of the table
-- Existing data is preserved
-- =============================================================================