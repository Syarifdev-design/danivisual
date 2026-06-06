-- =============================================================================
-- MIGRATION: 015_add_operational_staff_roles.sql
-- =============================================================================
-- Created: 2024-06-06
-- Purpose: Add photographer and videographer roles to database
--
-- This migration updates the admin_users table to support all 8 roles
-- defined in the frontend application.
--
-- Run this migration AFTER schema-auth.sql and schema-admin.sql
-- =============================================================================

-- =============================================================================
-- 1. UPDATE ROLE CONSTRAINT IN ADMIN_USERS
-- =============================================================================

-- Drop existing constraint first (if exists)
alter table admin_users drop constraint if exists admin_users_role_check;

-- Add new constraint with all 8 roles
alter table admin_users add constraint admin_users_role_check
    check (role in (
        'super_admin',
        'admin',
        'finance',
        'editor',
        'staff',
        'photographer',
        'videographer',
        'customer'
    ));

-- =============================================================================
-- 2. UPDATE dv_current_user_role() FUNCTION
-- =============================================================================

create or replace function public.dv_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.admin_users u
  where u.auth_id = auth.uid()
    and u.is_active = true
  limit 1
$$;

-- =============================================================================
-- 3. UPDATE dv_is_admin() FUNCTION
-- =============================================================================

create or replace function public.dv_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dv_has_role(array['super_admin', 'admin'])
$$;

-- =============================================================================
-- 4. UPDATE dv_is_staff() FUNCTION - NOW INCLUDES ALL OPERATIONAL ROLES
-- =============================================================================

create or replace function public.dv_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dv_has_role(array['editor', 'staff', 'photographer', 'videographer'])
$$;

-- =============================================================================
-- 5. UPDATE is_user_admin() FUNCTION
-- =============================================================================

create or replace function public.is_user_admin(p_auth_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from admin_users
        where auth_id = p_auth_id
        and role in ('super_admin', 'admin', 'finance', 'editor', 'staff', 'photographer', 'videographer')
        and is_active = true
    );
end;
$$ language plpgsql;

-- =============================================================================
-- 6. ADD FINANCE POLICIES (if not exists)
-- =============================================================================

-- Finance can view bookings
drop policy if exists "dv_finance_select_bookings" on bookings;
create policy "dv_finance_select_bookings"
  on bookings for select
  using (public.dv_has_role(array['finance']));

-- Finance can view customers
drop policy if exists "dv_finance_select_customers" on customers;
create policy "dv_finance_select_customers"
  on customers for select
  using (public.dv_has_role(array['finance']));

-- =============================================================================
-- 7. ADD STAFF POLICIES FOR PRODUCTION TASKS
-- =============================================================================

-- Drop old staff policies that might be too restrictive
drop policy if exists "dv_staff_select_bookings" on bookings;
drop policy if exists "dv_staff_update_bookings" on bookings;
drop policy if exists "dv_staff_select_customers" on customers;

-- =============================================================================
-- 8. SEED TEST USERS (for development only - comment out in production!)
-- =============================================================================

-- Uncomment these lines ONLY for development/testing:

/*
insert into admin_users (email, username, name, role, is_active) values
    ('superadmin@danivisual.test', 'superadmin', 'Super Admin', 'super_admin', true)
on conflict (email) do nothing;

insert into admin_users (email, username, name, role, is_active) values
    ('admin@danivisual.test', 'admin', 'Admin Danivisual', 'admin', true)
on conflict (email) do nothing;

insert into admin_users (email, username, name, role, is_active) values
    ('finance@danivisual.test', 'finance', 'Finance Danivisual', 'finance', true)
on conflict (email) do nothing;

insert into admin_users (email, username, name, role, is_active) values
    ('editor@danivisual.test', 'editor', 'Editor Danivisual', 'editor', true)
on conflict (email) do nothing;

insert into admin_users (email, username, name, role, is_active) values
    ('staff@danivisual.test', 'staff', 'Staff Danivisual', 'staff', true)
on conflict (email) do nothing;

insert into admin_users (email, username, name, role, is_active) values
    ('photographer@danivisual.test', 'photographer', 'Photographer Danivisual', 'photographer', true)
on conflict (email) do nothing;

insert into admin_users (email, username, name, role, is_active) values
    ('videographer@danivisual.test', 'videographer', 'Videographer Danivisual', 'videographer', true)
on conflict (email) do nothing;

insert into admin_users (email, username, name, role, is_active, whatsapp) values
    ('customer@danivisual.test', 'customer', 'Customer Danivisual', 'customer', true, '081234567890')
on conflict (email) do nothing;
*/

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check if constraint was applied correctly
select
    'admin_users constraint check:' as info,
    case
        when exists (
            select 1 from information_schema.table_constraints
            where constraint_name = 'admin_users_role_check'
            and table_name = 'admin_users'
        ) then '✓ Constraint applied'
        else '✗ Constraint not found'
    end as status;

-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================
/*
-- To rollback, run:
alter table admin_users drop constraint admin_users_role_check;
alter table admin_users add constraint admin_users_role_check
    check (role in ('super_admin', 'admin', 'finance', 'editor', 'staff', 'customer'));
*/