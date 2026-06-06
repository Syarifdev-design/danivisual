-- =============================================================================
-- Migration: 005_add_employee_info_to_attendance_records
-- Purpose: Add employee_name and employee_role columns for display caching
-- =============================================================================

DO $$
BEGIN
  -- Add employee_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_records'
      AND column_name = 'employee_name'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN employee_name text;
  END IF;

  -- Add employee_role if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_records'
      AND column_name = 'employee_role'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN employee_role text;
  END IF;
END $$;

-- =============================================================================
-- Note: Column order is maintained as-is
-- New columns are added at the end of the table
-- Existing data is preserved
-- =============================================================================