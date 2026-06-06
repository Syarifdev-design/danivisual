-- =============================================================================
-- MIGRATION: Add Employee & User Linking Columns
-- =============================================================================
-- Purpose:
--   1. Add employee_id to admin_users (link admin_users to employees)
--   2. Add user_id to employees (link employees to auth.users)
--   3. Add proper indexes for performance
--   4. Add RLS policies for employee self-access
-- =============================================================================

-- =============================================================================
-- 1. ADD employee_id COLUMN TO admin_users
-- =============================================================================

-- Add employee_id column referencing employees table
alter table if exists admin_users
add column if not exists employee_id uuid references employees(id) on delete set null;

-- Add index for faster lookups
create index if not exists idx_admin_users_employee_id on admin_users(employee_id);

-- =============================================================================
-- 2. ADD user_id COLUMN TO employees
-- =============================================================================

-- Add user_id column referencing auth.users
alter table if exists employees
add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Add index for faster lookups
create index if not exists idx_employees_user_id on employees(user_id);

-- =============================================================================
-- 3. UPDATE existing records (optional migration for existing data)
-- =============================================================================

-- This is a one-time migration to link existing admin_users with employees by email
-- Uncomment if you have existing data that needs linking:

-- UPDATE admin_users au
-- SET employee_id = e.id
-- FROM employees e
-- WHERE lower(au.email) = lower(e.email)
--   AND au.email IS NOT NULL
--   AND e.email IS NOT NULL
--   AND au.employee_id IS NULL;

-- UPDATE employees e
-- SET user_id = au.auth_id
-- FROM admin_users au
-- WHERE lower(au.email) = lower(e.email)
--   AND au.email IS NOT NULL
--   AND e.email IS NOT NULL
--   AND au.auth_id IS NOT NULL
--   AND e.user_id IS NULL;

-- =============================================================================
-- 4. ADD position COLUMN TO admin_users (optional, for display)
-- =============================================================================

alter table if exists admin_users
add column if not exists position text;

-- Allow all Danivisual login roles in admin_users.
do $$
declare
  constraint_name text;
begin
  select c.conname into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'admin_users'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%role%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.admin_users drop constraint %I', constraint_name);
  end if;

  alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('super_admin', 'admin', 'finance', 'editor', 'photographer', 'videographer', 'staff', 'customer'));
end $$;

-- =============================================================================
-- 5. VERIFY COLUMNS EXIST
-- =============================================================================

do $$
begin
  -- Verify admin_users columns
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'admin_users'
    and column_name = 'employee_id'
  ) then
    raise notice 'employee_id column not found in admin_users';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'employees'
    and column_name = 'user_id'
  ) then
    raise notice 'user_id column not found in employees';
  end if;
end $$;

-- =============================================================================
-- 6. RLS POLICIES FOR EMPLOYEES (staff can read own record)
-- =============================================================================

-- Drop existing policies if they exist
drop policy if exists "dv_staff_select_own_employee" on employees;
drop policy if exists "dv_staff_select_employees" on employees;
drop policy if exists "dv_admin_manage_employees" on employees;
drop policy if exists "dv_employee_select_own" on employees;
drop policy if exists "dv_employee_select_own_by_auth" on employees;

-- Ensure RLS is enabled
alter table employees enable row level security;

-- Admin can manage all employees
create policy "dv_admin_manage_employees"
on employees for all
using (public.dv_is_admin())
with check (public.dv_is_admin());

-- Staff can select their own employee record
-- Match by employees.user_id = auth.uid()
create policy "dv_employee_select_own_by_auth"
on employees for select
using (
  public.dv_is_staff()
  and user_id = auth.uid()
);

-- Employee can select their own record by employee_id linking
-- Match by admin_users.employee_id = employees.id AND admin_users.auth_id = auth.uid()
create policy "dv_employee_select_own"
on employees for select
using (
  exists (
    select 1 from admin_users au
    where au.employee_id = employees.id
    and au.auth_id = auth.uid()
    and au.is_active = true
  )
);

-- =============================================================================
-- 7. RLS POLICIES FOR admin_users (admin can manage, staff can read own)
-- =============================================================================

-- Drop existing policies if they exist
drop policy if exists "dv_admin_manage_admin_users" on admin_users;
drop policy if exists "dv_admin_select_admin_users" on admin_users;
drop policy if exists "dv_staff_select_own_admin_user" on admin_users;
drop policy if exists "dv_customer_deny_admin_users" on admin_users;
drop policy if exists "dv_super_admin_manage_admin_users" on admin_users;
drop policy if exists "dv_admin_update_admin_users" on admin_users;

-- Ensure RLS is enabled
alter table admin_users enable row level security;

-- Super admin can manage all admin_users (create/delete others)
create policy "dv_super_admin_manage_admin_users"
on admin_users for all
using (public.dv_has_role(array['super_admin']))
with check (public.dv_has_role(array['super_admin']));

-- Admin can select all admin_users
create policy "dv_admin_select_admin_users"
on admin_users for select
using (public.dv_has_role(array['super_admin', 'admin']));

-- Admin can update non-super_admin users
create policy "dv_admin_update_admin_users"
on admin_users for update
using (
  public.dv_has_role(array['super_admin', 'admin'])
  and (
    -- Can update anyone except super_admin
    role != 'super_admin'
    -- Or updating own record
    or auth.uid() = admin_users.auth_id
  )
)
with check (
  public.dv_has_role(array['super_admin', 'admin'])
  and role != 'super_admin'
);

-- Staff can select their own admin_users record
create policy "dv_staff_select_own_admin_user"
on admin_users for select
using (
  public.dv_is_staff()
  and auth.uid() = admin_users.auth_id
);

-- Customers have no admin_users policy beyond their own profile policies from
-- older auth schemas. Do not add a permissive "deny" policy here.

-- =============================================================================
-- DONE
-- =============================================================================

-- Grant permissions (adjust as needed)
-- grant select, insert, update, delete on admin_users to authenticated;
-- grant select, insert, update, delete on employees to authenticated;
