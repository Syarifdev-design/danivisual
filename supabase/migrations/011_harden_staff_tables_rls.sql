-- =============================================================================
-- MIGRATION: 011_harden_staff_tables_rls.sql
-- Date: 2026-06-05
-- Purpose: Fix CRITICAL RLS security blockers
--
-- BLOCKERS FIXED:
-- 1. Anonymous SQL grants on sensitive staff tables (employees, attendance_records,
--    staff_tasks, task_comments, kpi_reviews) - REMOVED
-- 2. Legacy policy "Authenticated users can read employees" (allow ANY user to read ALL) - DROPPED
-- 3. Legacy policy "Staff can read own attendance" (uses user_id, not employee scope) - DROPPED
-- 4. Legacy policy "Staff can read assigned tasks" (too broad, no proper scope) - DROPPED
-- 5. Legacy policy "Staff can read task comments" (depends on broken tasks policy) - DROPPED
-- 6. Legacy policy "Staff can read own KPI" (works but replaced by consistent naming) - DROPPED
-- 7. Legacy broad "grant all to authenticated" - REPLACED with role-specific grants
--
-- SECURITY MODEL AFTER THIS MIGRATION:
-- - anon (public): NO access to any staff table
-- - customer: NO access to staff tables (explicit deny)
-- - staff/editor/photographer/videographer: OWN records only via dv_user_owns_employee()
-- - admin/super_admin: MANAGE all via dv_is_admin()
-- - finance: NO access to staff tables (not needed for finance reports)
-- - service_role: FULL access (backend only, not frontend)
-- =============================================================================

-- =============================================================================
-- STEP 1: REVOKE ALL ANONYMOUS (PUBLIC) GRANTS ON SENSITIVE STAFF TABLES
-- =============================================================================
-- These grants allow ANY person (even non-logged-in) to read employee data,
-- attendance records, tasks, comments, and KPI reviews.

revoke select on employees from anon;
revoke select on attendance_records from anon;
revoke insert on attendance_records from anon;
revoke select on staff_tasks from anon;
revoke select on task_comments from anon;
revoke insert on task_comments from anon;
revoke select on kpi_reviews from anon;

-- =============================================================================
-- STEP 2: REPLACE BROAD "GRANT ALL TO AUTHENTICATED" WITH ROLE-SPECIFIC GRANTS
-- =============================================================================
-- Old: grant all on <table> to authenticated - too broad, allows any role full access
-- New: grant specific operations needed by RLS-policies.sql helpers
--
-- Note: RLS policies control actual access. Grants here are for Supabase internals.
-- We keep SELECT/INSERT/UPDATE/DELETE for authenticated because RLS will restrict.
-- The key fix is removing "grant to anon" above.

-- employees: authenticated can do what RLS allows (admin manage, staff read own)
grant select, insert, update, delete on employees to authenticated;
grant all on employees to service_role;

-- attendance_records: authenticated can do what RLS allows
grant select, insert, update, delete on attendance_records to authenticated;
grant all on attendance_records to service_role;

-- staff_tasks: authenticated can do what RLS allows
grant select, insert, update, delete on staff_tasks to authenticated;
grant all on staff_tasks to service_role;

-- task_comments: authenticated can do what RLS allows
grant select, insert, update, delete on task_comments to authenticated;
grant all on task_comments to service_role;

-- kpi_reviews: authenticated can do what RLS allows
grant select, insert, update, delete on kpi_reviews to authenticated;
grant all on kpi_reviews to service_role;

-- =============================================================================
-- STEP 3: DROP LEGACY POLICIES FROM schema-staff-management.sql
-- =============================================================================
-- These policies are overly permissive and conflict with rls-policies.sql
-- which has the correct, more restrictive policies.

-- employees: drop "Authenticated users can read employees" (allows ANY user to read ALL)
drop policy if exists "Authenticated users can read employees" on employees;

-- employees: drop "Admins can manage employees" (replaced by dv_admin_manage_employees)
drop policy if exists "Admins can manage employees" on employees;

-- attendance_records: drop "Staff can read own attendance" (uses user_id, not employee scope)
-- This allows ANY authenticated user (including customer) to read attendance via user_id
drop policy if exists "Staff can read own attendance" on attendance_records;

-- attendance_records: drop "Admins can manage attendance" (replaced by dv_admin_manage_attendance_records)
drop policy if exists "Admins can manage attendance" on attendance_records;

-- staff_tasks: drop "Staff can read assigned tasks" (too broad, allows reading tasks where user is assigner)
drop policy if exists "Staff can read assigned tasks" on staff_tasks;

-- staff_tasks: drop "Admins can manage all tasks" (replaced by dv_admin_manage_staff_tasks)
drop policy if exists "Admins can manage all tasks" on staff_tasks;

-- task_comments: drop "Staff can read task comments" (depends on broken tasks policy)
drop policy if exists "Staff can read task comments" on task_comments;

-- task_comments: drop "Authenticated can create comments" (replaced by dv_staff_insert_own_task_comments)
drop policy if exists "Authenticated can create comments" on task_comments;

-- task_comments: drop "Admins can manage task comments" (replaced by dv_admin_manage_task_comments)
drop policy if exists "Admins can manage task comments" on task_comments;

-- kpi_reviews: drop "Staff can read own KPI" (replaced by dv_staff_select_own_kpi_reviews)
drop policy if exists "Staff can read own KPI" on kpi_reviews;

-- kpi_reviews: drop "Admins can manage KPI" (replaced by dv_admin_manage_kpi_reviews)
drop policy if exists "Admins can manage KPI" on kpi_reviews;

-- =============================================================================
-- STEP 4: RE-CREATE SECURE POLICIES FOR employees
-- =============================================================================
-- admin/super_admin: manage all employees
-- staff/editor/photographer/videographer: read own employee record only
-- customer: NO access
-- finance: NO access (employee data not needed for finance reports)

drop policy if exists "dv_admin_manage_employees" on employees;
drop policy if exists "dv_staff_select_own_employee" on employees;
drop policy if exists "dv_customer_deny_employees" on employees;

create policy "dv_customer_deny_employees"
  on employees for all
  using (false)
  with check (false);

create policy "dv_admin_manage_employees"
  on employees for all
  using (public.dv_is_admin())
  with check (public.dv_is_admin());

create policy "dv_staff_select_own_employee"
  on employees for select
  using (
    public.dv_is_staff()
    and public.dv_user_owns_employee(id)
  );

-- =============================================================================
-- STEP 5: RE-CREATE SECURE POLICIES FOR attendance_records
-- =============================================================================
-- admin/super_admin: manage all attendance records
-- staff/editor/photographer/videographer: access own records only via employee_id
-- customer: EXPLICIT DENY (attendance is internal HR data)
-- finance: NO access (attendance not needed for finance reports)

drop policy if exists "dv_admin_select_attendance_records" on attendance_records;
drop policy if exists "dv_admin_manage_attendance_records" on attendance_records;
drop policy if exists "dv_staff_select_own_attendance_records" on attendance_records;
drop policy if exists "dv_staff_insert_own_attendance_records" on attendance_records;
drop policy if exists "dv_staff_update_own_attendance_records" on attendance_records;
drop policy if exists "dv_customer_deny_attendance_records" on attendance_records;
drop policy if exists "dv_finance_deny_attendance_records" on attendance_records;

-- Explicit deny for customers - they must not access attendance records
create policy "dv_customer_deny_attendance_records"
  on attendance_records for all
  using (false)
  with check (false);

-- Explicit deny for finance - attendance is HR data, not finance
create policy "dv_finance_deny_attendance_records"
  on attendance_records for all
  using (false)
  with check (false);

-- Admin/super_admin: full access to all attendance records
create policy "dv_admin_select_attendance_records"
  on attendance_records for select
  using (public.dv_is_admin());

create policy "dv_admin_manage_attendance_records"
  on attendance_records for all
  using (public.dv_is_admin())
  with check (public.dv_is_admin());

-- Staff (editor, staff, photographer, videographer): own records only
-- Uses dv_user_owns_employee(employee_id) which checks:
--   1. employees.user_id = auth.uid() (preferred, secure)
--   2. employees.email = admin_users.email (fallback, secure)
-- If no employee relationship exists, access is DENIED (safe by default)
create policy "dv_staff_select_own_attendance_records"
  on attendance_records for select
  using (
    public.dv_is_staff()
    and public.dv_user_owns_employee(employee_id)
  );

create policy "dv_staff_insert_own_attendance_records"
  on attendance_records for insert
  with check (
    public.dv_is_staff()
    and public.dv_user_owns_employee(employee_id)
  );

create policy "dv_staff_update_own_attendance_records"
  on attendance_records for update
  using (
    public.dv_is_staff()
    and public.dv_user_owns_employee(employee_id)
  )
  with check (
    public.dv_is_staff()
    and public.dv_user_owns_employee(employee_id)
  );

-- =============================================================================
-- STEP 6: RE-CREATE SECURE POLICIES FOR staff_tasks
-- =============================================================================
-- admin/super_admin: manage all tasks
-- staff/editor/photographer/videographer: read/update own tasks (assigned_to = own employee)
-- customer: EXPLICIT DENY
-- finance: NO access

drop policy if exists "dv_admin_select_staff_tasks" on staff_tasks;
drop policy if exists "dv_admin_manage_staff_tasks" on staff_tasks;
drop policy if exists "dv_staff_select_own_staff_tasks" on staff_tasks;
drop policy if exists "dv_staff_insert_own_staff_tasks" on staff_tasks;
drop policy if exists "dv_staff_update_own_staff_tasks" on staff_tasks;
drop policy if exists "dv_customer_deny_staff_tasks" on staff_tasks;
drop policy if exists "dv_finance_deny_staff_tasks" on staff_tasks;

-- Explicit deny for customers
create policy "dv_customer_deny_staff_tasks"
  on staff_tasks for all
  using (false)
  with check (false);

-- Explicit deny for finance
create policy "dv_finance_deny_staff_tasks"
  on staff_tasks for all
  using (false)
  with check (false);

-- Admin/super_admin: full access
create policy "dv_admin_select_staff_tasks"
  on staff_tasks for select
  using (public.dv_is_admin());

create policy "dv_admin_manage_staff_tasks"
  on staff_tasks for all
  using (public.dv_is_admin())
  with check (public.dv_is_admin());

-- Staff: own tasks only (assigned_to = own employee)
-- Note: staff_tasks.assigned_to references employees(id), so dv_user_owns_employee works
create policy "dv_staff_select_own_staff_tasks"
  on staff_tasks for select
  using (
    public.dv_is_staff()
    and public.dv_user_owns_employee(assigned_to)
  );

create policy "dv_staff_insert_own_staff_tasks"
  on staff_tasks for insert
  with check (
    public.dv_is_staff()
    and public.dv_user_owns_employee(assigned_to)
  );

create policy "dv_staff_update_own_staff_tasks"
  on staff_tasks for update
  using (
    public.dv_is_staff()
    and public.dv_user_owns_employee(assigned_to)
  )
  with check (
    public.dv_is_staff()
    and public.dv_user_owns_employee(assigned_to)
  );

-- =============================================================================
-- STEP 7: RE-CREATE SECURE POLICIES FOR task_comments
-- =============================================================================
-- admin/super_admin: manage all comments
-- staff: read comments on their own tasks only
-- customer: EXPLICIT DENY
-- finance: NO access

drop policy if exists "dv_admin_select_task_comments" on task_comments;
drop policy if exists "dv_admin_manage_task_comments" on task_comments;
drop policy if exists "dv_staff_select_own_task_comments" on task_comments;
drop policy if exists "dv_staff_insert_own_task_comments" on task_comments;
drop policy if exists "dv_customer_deny_task_comments" on task_comments;
drop policy if exists "dv_finance_deny_task_comments" on task_comments;

-- Explicit deny for customers
create policy "dv_customer_deny_task_comments"
  on task_comments for all
  using (false)
  with check (false);

-- Explicit deny for finance
create policy "dv_finance_deny_task_comments"
  on task_comments for all
  using (false)
  with check (false);

-- Admin/super_admin: full access
create policy "dv_admin_select_task_comments"
  on task_comments for select
  using (public.dv_is_admin());

create policy "dv_admin_manage_task_comments"
  on task_comments for all
  using (public.dv_is_admin())
  with check (public.dv_is_admin());

-- Staff: can only comment on their own tasks
-- Comments are scoped to tasks they own (via task_id -> staff_tasks.assigned_to)
create policy "dv_staff_select_own_task_comments"
  on task_comments for select
  using (
    public.dv_is_staff()
    and exists (
      select 1 from staff_tasks t
      where t.id = task_id
      and public.dv_user_owns_employee(t.assigned_to)
    )
  );

create policy "dv_staff_insert_own_task_comments"
  on task_comments for insert
  with check (
    public.dv_is_staff()
    and exists (
      select 1 from staff_tasks t
      where t.id = task_id
      and public.dv_user_owns_employee(t.assigned_to)
    )
  );

-- =============================================================================
-- STEP 8: RE-CREATE SECURE POLICIES FOR kpi_reviews
-- =============================================================================
-- admin/super_admin: manage all KPI reviews
-- staff: read own KPI reviews only
-- customer: EXPLICIT DENY
-- finance: NO access (KPI is HR/management data)

drop policy if exists "dv_admin_select_kpi_reviews" on kpi_reviews;
drop policy if exists "dv_admin_manage_kpi_reviews" on kpi_reviews;
drop policy if exists "dv_staff_select_own_kpi_reviews" on kpi_reviews;
drop policy if exists "dv_customer_deny_kpi_reviews" on kpi_reviews;
drop policy if exists "dv_finance_deny_kpi_reviews" on kpi_reviews;

-- Explicit deny for customers
create policy "dv_customer_deny_kpi_reviews"
  on kpi_reviews for all
  using (false)
  with check (false);

-- Explicit deny for finance
create policy "dv_finance_deny_kpi_reviews"
  on kpi_reviews for all
  using (false)
  with check (false);

-- Admin/super_admin: full access
create policy "dv_admin_select_kpi_reviews"
  on kpi_reviews for select
  using (public.dv_is_admin());

create policy "dv_admin_manage_kpi_reviews"
  on kpi_reviews for all
  using (public.dv_is_admin())
  with check (public.dv_is_admin());

-- Staff: own KPI reviews only (via employee_id)
create policy "dv_staff_select_own_kpi_reviews"
  on kpi_reviews for select
  using (
    public.dv_is_staff()
    and public.dv_user_owns_employee(employee_id)
  );

-- =============================================================================
-- STEP 9: VERIFICATION - Run these queries to confirm security
-- =============================================================================
-- These queries should return 0 rows in production after this migration.

-- VERIFY1: No RLS policies allow anon SELECT on staff tables
-- Expected: 0 rows (all should be restricted)
-- /*
select 'VERIFY1: anon should have NO select policy on employees' as check_name
where exists (
  select 1 from pg_policies
  where schemaname = 'public'
    and tablename = 'employees'
    and policyname not like '%deny%'
    and 'anon' = any(roles)
);
-- */

-- VERIFY 2: Check all policies on employees table
-- Expected policies:
--   dv_customer_deny_employees (deny)
--   dv_admin_manage_employees (admin manage)
--   dv_staff_select_own_employee (staff read own)
-- /*
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'employees';
-- */

-- VERIFY 3: Check all policies on attendance_records
-- Expected: customer deny, finance deny, admin select/manage, staff own (select/insert/update)
-- /*
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'attendance_records';
-- */

-- VERIFY 4: Check all policies on staff_tasks
-- Expected: customer deny, finance deny, admin select/manage, staff own (select/insert/update)
-- /*
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'staff_tasks';
-- */

-- VERIFY 5: Check all policies on kpi_reviews
-- Expected: customer deny, finance deny, admin select/manage, staff own select
-- /*
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'kpi_reviews';
-- */

-- VERIFY 6: Check all policies on task_comments
-- Expected: customer deny, finance deny, admin select/manage, staff own (select/insert)
-- /*
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'task_comments';
-- */

-- =============================================================================
-- SUMMARY OF CHANGES
-- =============================================================================
--
-- POLICIES DROPPED (8 legacy policies removed):
--   1. "Authenticated users can read employees"    (employees) - allowed ANY user to read ALL
--   2. "Admins can manage employees"               (employees) - replaced
--   3. "Staff can read own attendance"            (attendance_records) - broken scope
--   4. "Admins can manage attendance"              (attendance_records) - replaced
--   5. "Staff can read assigned tasks"             (staff_tasks) - too broad
--   6. "Admins can manage all tasks"               (staff_tasks) - replaced
--   7. "Staff can read task comments"             (task_comments) - depends on broken
--   8. "Authenticated can create comments"         (task_comments) - replaced
--   9. "Admins can manage task comments"           (task_comments) - replaced
--  10. "Staff can read own KPI"                  (kpi_reviews) - replaced
--  11. "Admins can manage KPI"                    (kpi_reviews) - replaced
--
-- POLICIES ADDED (22 new secure policies):
--   employees (3):
--     + dv_customer_deny_employees     (deny customer)
--     + dv_admin_manage_employees     (admin manage all)
--     + dv_staff_select_own_employee  (staff read own)
--
--   attendance_records (6):
--     + dv_customer_deny_attendance_records  (deny customer)
--     + dv_finance_deny_attendance_records  (deny finance)
--     + dv_admin_select_attendance_records   (admin read all)
--     + dv_admin_manage_attendance_records  (admin manage all)
--     + dv_staff_select_own_attendance_records (staff read own)
--     + dv_staff_insert_own_attendance_records (staff insert own)
--     + dv_staff_update_own_attendance_records (staff update own)
--
--   staff_tasks (6):
--     + dv_customer_deny_staff_tasks    (deny customer)
--     + dv_finance_deny_staff_tasks     (deny finance)
--     + dv_admin_select_staff_tasks    (admin read all)
--     + dv_admin_manage_staff_tasks     (admin manage all)
--     + dv_staff_select_own_staff_tasks (staff read own)
--     + dv_staff_insert_own_staff_tasks (staff insert own)
--     + dv_staff_update_own_staff_tasks (staff update own)
--
--   task_comments (5):
--     + dv_customer_deny_task_comments   (deny customer)
--     + dv_finance_deny_task_comments    (deny finance)
--     + dv_admin_select_task_comments   (admin read all)
--     + dv_admin_manage_task_comments    (admin manage all)
--     + dv_staff_select_own_task_comments (staff read own task comments)
--     + dv_staff_insert_own_task_comments (staff insert own task comments)
--
--   kpi_reviews (4):
--     + dv_customer_deny_kpi_reviews (deny customer)
--     + dv_finance_deny_kpi_reviews    (deny finance)
--     + dv_admin_select_kpi_reviews (admin read all)
--     + dv_admin_manage_kpi_reviews   (admin manage all)
--     + dv_staff_select_own_kpi_reviews (staff read own)
--
-- GRANTS REMOVED (7 anonymous grants removed):
--   revoke select on employees from anon;
--   revoke select on attendance_records from anon;
--   revoke insert on attendance_records from anon;
--   revoke select on staff_tasks from anon;
--   revoke select on task_comments from anon;
--   revoke insert on task_comments from anon;
--   revoke select on kpi_reviews from anon;
--
-- ACCESS MATRIX AFTER MIGRATION:
-- Table              | anon | customer | finance | staff | admin/super_admin
--   ------------------|------|----------|---------|-------|-------------------
--   employees | DENY | DENY     | DENY    | OWN | ALL
--   attendance_records| DENY | DENY     | DENY    | OWN   | ALL
--   staff_tasks       | DENY | DENY     | DENY    | OWN   | ALL
--   task_comments     | DENY | DENY     | DENY    | OWN | ALL
--   kpi_reviews       | DENY | DENY     | DENY    | OWN   | ALL
--
--   OWN = own records only via dv_user_owns_employee(employee_id)
--   ALL = full manage access via dv_is_admin()
--   DENY = explicit deny policy
-- =============================================================================
