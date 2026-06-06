# Attendance Tables Consolidation Note

## Overview
Danivisual has two attendance-related tables in the database schema.

---

## Tables Status

| Table Name | Status | Schema Location | Usage |
|------------|--------|-----------------|-------|
| `attendance` | **LEGACY** | `supabase/schema-operational.sql` | Deprecated, not used by current services |
| `attendance_records` | **ACTIVE** | `supabase/schema-staff-management.sql` | Primary table for all attendance operations |

---

## Active Table: attendance_records

**Location:** `supabase/schema-staff-management.sql`

**Columns:**
- `id` (uuid, primary key)
- `employee_id` (uuid, FK to employees)
- `user_id` (uuid, FK to auth.users)
- `employee_name` (text, cached for display)
- `employee_role` (text, cached for display)
- `date` (date)
- `check_in_time` (timestamptz)
- `check_in_selfie_url` (text)
- `check_in_latitude` (numeric)
- `check_in_longitude` (numeric)
- `check_out_time` (timestamptz)
- `check_out_selfie_url` (text)
- `check_out_latitude` (numeric)
- `check_out_longitude` (numeric)
- `status` (text: present, late, absent, leave, remote)
- `late_minutes` (integer)
- `work_duration_minutes` (integer)
- `notes` (text)
- `approved_by` (uuid)
- `approved_at` (timestamptz)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Services using this table:**
- `src/services/attendanceService.ts`
- `src/services/kpiService.ts`

---

## Legacy Table: attendance

**Location:** `supabase/schema-operational.sql`

**Status:** LEGACY - Do not use

**Note:** This table exists for historical compatibility but is not used by any current services. It may be removed in a future migration.

**Migration:** If you need to migrate data from `attendance` to `attendance_records`, use migration `006_migrate_legacy_attendance_to_records.sql`.

---

## Migrations

| Migration | Description |
|-----------|-------------|
| `002_add_employee_user_linking.sql` | Add user_id to employees table |
| `003_attendance_settings.sql` | Create attendance_settings table |
| `004_align_staff_tasks_schema.sql` | Align staff_tasks with service |
| `005_add_employee_info_to_attendance_records.sql` | Add employee_name, employee_role columns |
| `006_migrate_legacy_attendance_to_records.sql` | (Future) Migrate data from legacy table |

---

## Last Updated
2024-06-04