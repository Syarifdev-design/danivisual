-- =============================================================================
-- DANIVISUAL ROW LEVEL SECURITY POLICIES
-- =============================================================================
-- Purpose:
--   Centralized production-oriented RLS policies for Danivisual.
--
-- Notes:
--   1. Run this after the schema files are applied.
--   2. This file does not contain secrets, API keys, passwords, or service_role keys.
--   3. Policies are based on public.admin_users.auth_id = auth.uid().
--   4. Public access is limited to published/active website content only.
-- =============================================================================

-- =============================================================================
-- HELPERS
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

create or replace function public.dv_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.dv_current_user_role() = any(allowed_roles), false)
$$;

create or replace function public.dv_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dv_has_role(array['super_admin', 'admin'])
$$;

create or replace function public.dv_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dv_has_role(array['editor', 'staff', 'photographer', 'videographer'])
$$;

create or replace function public.dv_current_employee_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
begin
  -- TODO: Prefer employees.user_id = auth.users.id everywhere.
  -- Some older Danivisual schemas do not have employees.user_id yet, so this
  -- function falls back to matching the active admin_users email to employees.email.
  -- If neither relationship is available, it returns null and own-record policies
  -- deny access instead of opening data broadly.
  if to_regclass('public.employees') is null then
    return null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'user_id'
  ) then
    execute 'select e.id from public.employees e where e.user_id = $1 limit 1'
      into v_employee_id
      using auth.uid();

    if v_employee_id is not null then
      return v_employee_id;
    end if;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'email'
  ) then
    execute '
      select e.id
      from public.employees e
      join public.admin_users u on lower(u.email) = lower(e.email)
      where u.auth_id = $1
        and u.is_active = true
      limit 1'
      into v_employee_id
      using auth.uid();

    if v_employee_id is not null then
      return v_employee_id;
    end if;
  end if;

  return null;
end;
$$;

create or replace function public.dv_user_owns_employee(p_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.dv_current_employee_id() = p_employee_id, false)
$$;

create or replace function public.dv_customer_matches_booking(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    join public.admin_users u on u.auth_id = auth.uid()
    where b.id = p_booking_id
      and u.is_active = true
      and u.role = 'customer'
      and (
        (u.email is not null and b.customer_email is not null and lower(u.email) = lower(b.customer_email))
        or
        (u.phone is not null and b.customer_phone is not null and u.phone = b.customer_phone)
      )
  )
$$;

create or replace function public.dv_customer_matches_customer(p_customer_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_matches boolean := false;
begin
  -- Preferred relationship for future portal auth: admin_users.customer_id.
  -- Some older schemas do not have that column yet, so check dynamically.
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_users'
      and column_name = 'customer_id'
  ) then
    execute '
      select exists (
        select 1
        from public.admin_users u
        where u.auth_id = $1
          and u.is_active = true
          and u.role = ''customer''
          and u.customer_id = $2
      )'
      into v_matches
      using auth.uid(), p_customer_id;

    if v_matches then
      return true;
    end if;
  end if;

  -- Fallback for current lightweight portal/login flows.
  select exists (
    select 1
    from public.customers c
    join public.admin_users u on u.auth_id = auth.uid()
    where c.id = p_customer_id
      and u.is_active = true
      and u.role = 'customer'
      and (
        (u.email is not null and c.email is not null and lower(u.email) = lower(c.email))
        or
        (u.phone is not null and c.phone is not null and u.phone = c.phone)
      )
  )
  into v_matches;

  return coalesce(v_matches, false);
end;
$$;

-- =============================================================================
-- DROP OLD / BROAD POLICIES
-- =============================================================================

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname in (
        'Public can read published content',
        'Public can read published FAQs',
        'Public can read active services',
        'Public can read published portfolios',
        'Public can read active categories',
        'Public can read active packages',
        'Public can read active addons',
        'Admins can manage content fields',
        'Admins can manage content images',
        'Admins can manage content menus',
        'Admins can manage FAQs',
        'Admins can manage services',
        'Admins can manage service includes',
        'Admins can manage portfolios',
        'Admins can manage portfolio images',
        'Admins can manage categories',
        'Admins can manage packages',
        'Admins can manage service types',
        'Admins can manage benefits',
        'Admins can manage addons',
        'Admins can manage addon categories',
        'Admins can manage customers',
        'Admins can manage bookings',
        'Admins can manage booking details',
        'Admins can manage payments',
        'Admins can manage admin users',
        'Admins can manage media files',
        'Admins can manage calendar events',
        'Admins can manage analytics',
        'Admins can manage analytics events'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

drop policy if exists "dv_public_select_content_menus" on content_menus;
drop policy if exists "dv_public_select_content_fields" on content_fields;
drop policy if exists "dv_public_select_content_images" on content_images;
drop policy if exists "dv_public_select_faqs" on faqs;
drop policy if exists "dv_public_select_services" on services;
drop policy if exists "dv_public_select_service_includes" on service_includes;
drop policy if exists "dv_public_select_portfolios" on portfolios;
drop policy if exists "dv_public_select_portfolio_images" on portfolio_images;
drop policy if exists "dv_public_select_package_categories" on package_categories;
drop policy if exists "dv_public_select_packages" on packages;
drop policy if exists "dv_public_select_package_service_types" on package_service_types;
drop policy if exists "dv_public_select_package_benefits" on package_benefits;
drop policy if exists "dv_public_select_addons" on addons;
drop policy if exists "dv_public_select_addon_categories" on addon_categories;
drop policy if exists "dv_public_select_public_media" on media_files;

drop policy if exists "dv_admin_manage_content_menus" on content_menus;
drop policy if exists "dv_admin_manage_content_fields" on content_fields;
drop policy if exists "dv_admin_manage_content_images" on content_images;
drop policy if exists "dv_admin_manage_faqs" on faqs;
drop policy if exists "dv_admin_manage_services" on services;
drop policy if exists "dv_admin_manage_service_includes" on service_includes;
drop policy if exists "dv_admin_manage_portfolios" on portfolios;
drop policy if exists "dv_admin_manage_portfolio_images" on portfolio_images;
drop policy if exists "dv_admin_manage_package_categories" on package_categories;
drop policy if exists "dv_admin_manage_packages" on packages;
drop policy if exists "dv_admin_manage_package_service_types" on package_service_types;
drop policy if exists "dv_admin_manage_package_benefits" on package_benefits;
drop policy if exists "dv_admin_manage_addons" on addons;
drop policy if exists "dv_admin_manage_addon_categories" on addon_categories;
drop policy if exists "dv_admin_manage_customers" on customers;
drop policy if exists "dv_admin_select_customers" on customers;
drop policy if exists "dv_admin_insert_customers" on customers;
drop policy if exists "dv_admin_update_customers" on customers;
drop policy if exists "dv_admin_delete_customers" on customers;
drop policy if exists "dv_admin_manage_bookings" on bookings;
drop policy if exists "dv_admin_manage_booking_event_details" on booking_event_details;
drop policy if exists "dv_admin_manage_payments" on payments;
drop policy if exists "dv_admin_manage_admin_users" on admin_users;
drop policy if exists "dv_admin_manage_media_files" on media_files;
drop policy if exists "dv_admin_manage_calendar_events" on calendar_events;
drop policy if exists "dv_admin_manage_analytics_daily" on analytics_daily;
drop policy if exists "dv_admin_manage_analytics_events" on analytics_events;

drop policy if exists "dv_finance_select_bookings" on bookings;
drop policy if exists "dv_finance_select_customers" on customers;
drop policy if exists "dv_finance_manage_payments" on payments;
drop policy if exists "dv_finance_select_payments" on payments;
drop policy if exists "dv_finance_select_analytics_daily" on analytics_daily;

drop policy if exists "dv_editor_manage_portfolios" on portfolios;
drop policy if exists "dv_editor_manage_portfolio_images" on portfolio_images;
drop policy if exists "dv_editor_select_bookings_for_production" on bookings;
drop policy if exists "dv_editor_select_customers_for_production" on customers;

drop policy if exists "dv_staff_select_bookings" on bookings;
drop policy if exists "dv_staff_update_bookings" on bookings;
drop policy if exists "dv_staff_select_customers" on customers;
drop policy if exists "dv_staff_select_calendar_events" on calendar_events;

drop policy if exists "dv_customer_select_own_customer" on customers;
drop policy if exists "dv_customer_select_own_bookings" on bookings;
drop policy if exists "dv_customer_select_own_booking_event_details" on booking_event_details;
drop policy if exists "dv_customer_select_own_payments" on payments;
drop policy if exists "dv_customer_insert_own_payments" on payments;

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

alter table content_menus enable row level security;
alter table content_fields enable row level security;
alter table content_images enable row level security;
alter table faqs enable row level security;
alter table services enable row level security;
alter table service_includes enable row level security;
alter table portfolios enable row level security;
alter table portfolio_images enable row level security;
alter table package_categories enable row level security;
alter table packages enable row level security;
alter table package_service_types enable row level security;
alter table package_benefits enable row level security;
alter table addons enable row level security;
alter table addon_categories enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table booking_event_details enable row level security;
alter table payments enable row level security;
alter table admin_users enable row level security;
alter table media_files enable row level security;
alter table calendar_events enable row level security;
alter table analytics_daily enable row level security;
alter table analytics_events enable row level security;

-- =============================================================================
-- PUBLIC WEBSITE READ ACCESS
-- =============================================================================

create policy "dv_public_select_content_menus"
  on content_menus for select
  using (status = 'published');

create policy "dv_public_select_content_fields"
  on content_fields for select
  using (
    exists (
      select 1
      from content_menus m
      where m.menu_id = content_fields.menu_id
        and m.status = 'published'
    )
  );

create policy "dv_public_select_content_images"
  on content_images for select
  using (
    exists (
      select 1
      from content_menus m
      where m.menu_id = content_images.menu_id
        and m.status = 'published'
    )
  );

create policy "dv_public_select_faqs"
  on faqs for select
  using (is_published = true);

create policy "dv_public_select_services"
  on services for select
  using (is_active = true);

create policy "dv_public_select_service_includes"
  on service_includes for select
  using (
    exists (
      select 1
      from services s
      where s.id = service_includes.service_id
        and s.is_active = true
    )
  );

create policy "dv_public_select_portfolios"
  on portfolios for select
  using (is_published = true);

create policy "dv_public_select_portfolio_images"
  on portfolio_images for select
  using (
    exists (
      select 1
      from portfolios p
      where p.id = portfolio_images.portfolio_id
        and p.is_published = true
    )
  );

create policy "dv_public_select_package_categories"
  on package_categories for select
  using (is_active = true);

create policy "dv_public_select_packages"
  on packages for select
  using (
    is_active = true
    and exists (
      select 1
      from package_categories c
      where c.id = packages.category_id
        and c.is_active = true
    )
  );

create policy "dv_public_select_package_service_types"
  on package_service_types for select
  using (
    exists (
      select 1
      from packages p
      join package_categories c on c.id = p.category_id
      where p.id = package_service_types.package_id
        and p.is_active = true
        and c.is_active = true
    )
  );

create policy "dv_public_select_package_benefits"
  on package_benefits for select
  using (
    exists (
      select 1
      from packages p
      join package_categories c on c.id = p.category_id
      where p.id = package_benefits.package_id
        and p.is_active = true
        and c.is_active = true
    )
  );

create policy "dv_public_select_addons"
  on addons for select
  using (is_active = true);

create policy "dv_public_select_addon_categories"
  on addon_categories for select
  using (
    exists (
      select 1
      from addons a
      join package_categories c on c.id = addon_categories.category_id
      where a.id = addon_categories.addon_id
        and a.is_active = true
        and c.is_active = true
    )
  );

create policy "dv_public_select_public_media"
  on media_files for select
  using (is_public = true);

-- =============================================================================
-- ADMIN / SUPER ADMIN ACCESS
-- =============================================================================

create policy "dv_admin_manage_content_menus" on content_menus for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_content_fields" on content_fields for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_content_images" on content_images for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_faqs" on faqs for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_services" on services for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_service_includes" on service_includes for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_portfolios" on portfolios for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_portfolio_images" on portfolio_images for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_package_categories" on package_categories for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_packages" on packages for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_package_service_types" on package_service_types for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_package_benefits" on package_benefits for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_addons" on addons for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_addon_categories" on addon_categories for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_select_customers"
  on customers for select
  using (public.dv_is_admin());

create policy "dv_admin_insert_customers"
  on customers for insert
  with check (
    public.dv_is_admin()
    and coalesce(is_active, true) = true
    and coalesce(status, 'lead') <> 'archived'
  );

create policy "dv_admin_update_customers"
  on customers for update
  using (public.dv_is_admin())
  with check (public.dv_is_admin());
create policy "dv_admin_manage_bookings" on bookings for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_booking_event_details" on booking_event_details for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_payments" on payments for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_admin_users" on admin_users for all using (public.dv_has_role(array['super_admin'])) with check (public.dv_has_role(array['super_admin']));
create policy "dv_admin_manage_media_files" on media_files for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_calendar_events" on calendar_events for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_analytics_daily" on analytics_daily for all using (public.dv_is_admin()) with check (public.dv_is_admin());
create policy "dv_admin_manage_analytics_events" on analytics_events for all using (public.dv_is_admin()) with check (public.dv_is_admin());

-- =============================================================================
-- FINANCE ACCESS
-- =============================================================================
-- Finance reads payments only. Customer and booking summaries are exposed by
-- the allowlisted RPCs in migration 014; finance has no base-table PII access.

create policy "dv_finance_select_payments"
  on payments for select
  using (public.dv_has_role(array['finance']));

create policy "dv_finance_select_analytics_daily"
  on analytics_daily for select
  using (public.dv_has_role(array['finance']));

-- =============================================================================
-- EDITOR ACCESS
-- =============================================================================
-- Editor can manage portfolio. Customer rows are not exposed broadly; add a
-- production-assignment-specific customer policy only after assignments exist.

create policy "dv_editor_manage_portfolios"
  on portfolios for all
  using (public.dv_has_role(array['editor']))
  with check (public.dv_has_role(array['editor']));

create policy "dv_editor_manage_portfolio_images"
  on portfolio_images for all
  using (public.dv_has_role(array['editor']))
  with check (public.dv_has_role(array['editor']));

-- =============================================================================
-- STAFF ACCESS
-- =============================================================================
-- Staff access is intentionally narrow. They do not read all customers; customer
-- access and booking context must be opened only through explicit production or
-- task assignment policies. Staff/editor/photographer/videographer do not get
-- direct SELECT/UPDATE policies on bookings.

-- calendar_events remains admin-only until events have an employee assignment
-- relationship that can be scoped safely.

-- =============================================================================
-- CUSTOMER ACCESS
-- =============================================================================

create policy "dv_customer_select_own_customer"
  on customers for select
  using (public.dv_customer_matches_customer(id));

create policy "dv_customer_select_own_bookings"
  on bookings for select
  using (public.dv_customer_matches_booking(id));

create policy "dv_customer_select_own_booking_event_details"
  on booking_event_details for select
  using (public.dv_customer_matches_booking(booking_id));

create policy "dv_customer_select_own_payments"
  on payments for select
  using (
    booking_id is not null
    and public.dv_customer_matches_booking(booking_id)
  );

create policy "dv_customer_insert_own_payments"
  on payments for insert
  with check (
    booking_id is not null
    and public.dv_customer_matches_booking(booking_id)
    and status = 'pending'
  );

-- =============================================================================
-- OPTIONAL TABLES
-- =============================================================================
-- These tables are referenced by app modules but may not exist in every schema
-- batch yet. Policies are created only when the table exists.

do $$
begin
  if to_regclass('public.production_records') is not null then
    execute 'alter table public.production_records enable row level security';
    execute 'drop policy if exists "dv_admin_manage_production_records" on public.production_records';
    execute 'drop policy if exists "dv_editor_manage_production_records" on public.production_records';
    execute 'drop policy if exists "dv_staff_select_production_records" on public.production_records';
    execute 'drop policy if exists "dv_staff_update_production_records" on public.production_records';
    execute 'drop policy if exists "dv_customer_select_own_production_records" on public.production_records';

    execute 'create policy "dv_admin_manage_production_records" on public.production_records for all using (public.dv_is_admin()) with check (public.dv_is_admin())';
    execute 'create policy "dv_editor_manage_production_records" on public.production_records for all using (public.dv_has_role(array[''editor''])) with check (public.dv_has_role(array[''editor'']))';
    execute 'create policy "dv_staff_select_production_records" on public.production_records for select using (public.dv_has_role(array[''staff'']))';
    execute 'create policy "dv_staff_update_production_records" on public.production_records for update using (public.dv_has_role(array[''staff''])) with check (public.dv_has_role(array[''staff'']))';
    execute 'create policy "dv_customer_select_own_production_records" on public.production_records for select using (public.dv_customer_matches_booking(booking_id))';
  end if;

  if to_regclass('public.booking_delivery_info') is not null then
    execute 'alter table public.booking_delivery_info enable row level security';
    execute 'drop policy if exists "dv_admin_manage_booking_delivery_info" on public.booking_delivery_info';
    execute 'drop policy if exists "dv_staff_select_booking_delivery_info" on public.booking_delivery_info';
    execute 'drop policy if exists "dv_customer_select_own_booking_delivery_info" on public.booking_delivery_info';

    execute 'create policy "dv_admin_manage_booking_delivery_info" on public.booking_delivery_info for all using (public.dv_is_admin()) with check (public.dv_is_admin())';
    execute 'create policy "dv_staff_select_booking_delivery_info" on public.booking_delivery_info for select using (public.dv_has_role(array[''staff'']))';
    execute 'create policy "dv_customer_select_own_booking_delivery_info" on public.booking_delivery_info for select using (public.dv_customer_matches_booking(booking_id))';
  end if;

  if to_regclass('public.booking_status_history') is not null then
    execute 'alter table public.booking_status_history enable row level security';
    execute 'drop policy if exists "dv_admin_manage_booking_status_history" on public.booking_status_history';
    execute 'drop policy if exists "dv_staff_select_booking_status_history" on public.booking_status_history';
    execute 'drop policy if exists "dv_customer_select_own_booking_status_history" on public.booking_status_history';

    execute 'create policy "dv_admin_manage_booking_status_history" on public.booking_status_history for all using (public.dv_is_admin()) with check (public.dv_is_admin())';
    execute 'create policy "dv_staff_select_booking_status_history" on public.booking_status_history for select using (public.dv_has_role(array[''staff'']))';
    execute 'create policy "dv_customer_select_own_booking_status_history" on public.booking_status_history for select using (public.dv_customer_matches_booking(booking_id))';
  end if;

  if to_regclass('public.employees') is not null then
    execute 'alter table public.employees enable row level security';
    execute 'drop policy if exists "Authenticated users can read employees" on public.employees';
    execute 'drop policy if exists "Admins can manage employees" on public.employees';
    execute 'drop policy if exists "dv_admin_manage_employees" on public.employees';
    execute 'drop policy if exists "dv_staff_select_employees" on public.employees';
    execute 'drop policy if exists "dv_admin_select_employees" on public.employees';
    execute 'drop policy if exists "dv_super_admin_manage_employees" on public.employees';
    execute 'drop policy if exists "dv_staff_select_own_employee" on public.employees';
    execute 'drop policy if exists "dv_staff_select_own_employees" on public.employees';

    execute 'create policy "dv_admin_manage_employees" on public.employees for all using (public.dv_is_admin()) with check (public.dv_is_admin())';
    execute 'create policy "dv_staff_select_own_employee" on public.employees for select using (public.dv_is_staff() and public.dv_user_owns_employee(id))';
  end if;

  if to_regclass('public.attendance') is not null then
    execute 'alter table public.attendance enable row level security';
    execute 'drop policy if exists "dv_admin_manage_attendance" on public.attendance';
    execute 'drop policy if exists "dv_staff_select_attendance" on public.attendance';
    execute 'drop policy if exists "dv_staff_select_own_attendance" on public.attendance';
    execute 'drop policy if exists "dv_staff_insert_own_attendance" on public.attendance';
    execute 'drop policy if exists "dv_staff_update_own_attendance" on public.attendance';
    execute 'drop policy if exists "dv_customer_deny_attendance" on public.attendance';

    -- Explicit deny for customers
    execute 'create policy "dv_customer_deny_attendance" on public.attendance for all using (false) with check (false)';

    execute 'create policy "dv_admin_manage_attendance" on public.attendance for all using (public.dv_is_admin()) with check (public.dv_is_admin())';

    -- Staff can only access their own attendance records
    -- If employee_id column doesn't exist, access is DENIED (safe by default)
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'attendance'
        and column_name = 'employee_id'
    ) then
      execute 'create policy "dv_staff_select_own_attendance" on public.attendance for select using (public.dv_is_staff() and public.dv_user_owns_employee(employee_id))';
      execute 'create policy "dv_staff_insert_own_attendance" on public.attendance for insert with check (public.dv_is_staff() and public.dv_user_owns_employee(employee_id))';
      execute 'create policy "dv_staff_update_own_attendance" on public.attendance for update using (public.dv_is_staff() and public.dv_user_owns_employee(employee_id)) with check (public.dv_is_staff() and public.dv_user_owns_employee(employee_id))';
    end if;
  end if;

  if to_regclass('public.attendance_records') is not null then
    execute 'alter table public.attendance_records enable row level security';
    execute 'drop policy if exists "Staff can read own attendance" on public.attendance_records';
    execute 'drop policy if exists "Admins can manage attendance" on public.attendance_records';
    execute 'drop policy if exists "dv_admin_select_attendance_records" on public.attendance_records';
    execute 'drop policy if exists "dv_admin_manage_attendance_records" on public.attendance_records';
    execute 'drop policy if exists "dv_staff_select_own_attendance_records" on public.attendance_records';
    execute 'drop policy if exists "dv_staff_insert_own_attendance_records" on public.attendance_records';
    execute 'drop policy if exists "dv_staff_update_own_attendance_records" on public.attendance_records';
    execute 'drop policy if exists "dv_customer_deny_attendance_records" on public.attendance_records';

    -- Explicit deny for customers - they must not access attendance records
    execute 'create policy "dv_customer_deny_attendance_records" on public.attendance_records for all using (false) with check (false)';

    execute 'create policy "dv_admin_select_attendance_records" on public.attendance_records for select using (public.dv_is_admin())';
    execute 'create policy "dv_admin_manage_attendance_records" on public.attendance_records for all using (public.dv_is_admin()) with check (public.dv_is_admin())';

    -- Staff (editor, staff, photographer, videographer) can only access their OWN records
    -- using dv_user_owns_employee() which checks:
    -- 1. employees.user_id = auth.uid() (preferred)
    -- 2. employees.email = admin_users.email (fallback)
    -- If no employee relationship exists, access is DENIED (safe by default)
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'attendance_records'
        and column_name = 'employee_id'
    ) then
      execute 'create policy "dv_staff_select_own_attendance_records" on public.attendance_records for select using (public.dv_is_staff() and public.dv_user_owns_employee(employee_id))';
      execute 'create policy "dv_staff_insert_own_attendance_records" on public.attendance_records for insert with check (public.dv_is_staff() and public.dv_user_owns_employee(employee_id))';
      execute 'create policy "dv_staff_update_own_attendance_records" on public.attendance_records for update using (public.dv_is_staff() and public.dv_user_owns_employee(employee_id)) with check (public.dv_is_staff() and public.dv_user_owns_employee(employee_id))';
    end if;
  end if;

  if to_regclass('public.attendance_settings') is not null then
    execute 'alter table public.attendance_settings enable row level security';
    execute 'drop policy if exists "dv_admin_manage_attendance_settings" on public.attendance_settings';
    execute 'drop policy if exists "dv_staff_read_attendance_settings" on public.attendance_settings';

    execute 'create policy "dv_admin_manage_attendance_settings" on public.attendance_settings for all using (public.dv_is_admin()) with check (public.dv_is_admin())';
    execute 'create policy "dv_staff_read_attendance_settings" on public.attendance_settings for select using (public.dv_is_staff())';
  end if;

  if to_regclass('public.staff_tasks') is not null then
    execute 'alter table public.staff_tasks enable row level security';
    execute 'drop policy if exists "Staff can read assigned tasks" on public.staff_tasks';
    execute 'drop policy if exists "Admins can manage all tasks" on public.staff_tasks';
    execute 'drop policy if exists "dv_admin_select_staff_tasks" on public.staff_tasks';
    execute 'drop policy if exists "dv_admin_manage_staff_tasks" on public.staff_tasks';
    execute 'drop policy if exists "dv_staff_select_own_staff_tasks" on public.staff_tasks';
    execute 'drop policy if exists "dv_staff_select_own_staff_tasks_assigned_to_id" on public.staff_tasks';

    execute 'create policy "dv_admin_select_staff_tasks" on public.staff_tasks for select using (public.dv_is_admin())';
    execute 'create policy "dv_admin_manage_staff_tasks" on public.staff_tasks for all using (public.dv_is_admin()) with check (public.dv_is_admin())';

    -- TODO: staff_tasks should use assigned_to uuid references employees(id).
    -- assigned_to_id is supported only for compatibility; if neither column
    -- exists, staff access remains denied by default.
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'staff_tasks'
        and column_name = 'assigned_to'
    ) then
      execute 'create policy "dv_staff_select_own_staff_tasks" on public.staff_tasks for select using (public.dv_is_staff() and public.dv_user_owns_employee(assigned_to))';
    elsif exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'staff_tasks'
        and column_name = 'assigned_to_id'
    ) then
      execute 'create policy "dv_staff_select_own_staff_tasks_assigned_to_id" on public.staff_tasks for select using (public.dv_is_staff() and public.dv_user_owns_employee(assigned_to_id))';
    end if;
  end if;

  if to_regclass('public.kpi_reviews') is not null then
    execute 'alter table public.kpi_reviews enable row level security';
    execute 'drop policy if exists "Staff can read own KPI" on public.kpi_reviews';
    execute 'drop policy if exists "Admins can manage KPI" on public.kpi_reviews';
    execute 'drop policy if exists "dv_admin_select_kpi_reviews" on public.kpi_reviews';
    execute 'drop policy if exists "dv_staff_select_own_kpi_reviews" on public.kpi_reviews';
    execute 'drop policy if exists "dv_super_admin_insert_kpi_reviews" on public.kpi_reviews';
    execute 'drop policy if exists "dv_super_admin_update_kpi_reviews" on public.kpi_reviews';
    execute 'drop policy if exists "dv_super_admin_delete_kpi_reviews" on public.kpi_reviews';
    execute 'drop policy if exists "dv_admin_update_kpi_reviews" on public.kpi_reviews';
    execute 'drop policy if exists "dv_admin_manage_kpi_reviews" on public.kpi_reviews';

    execute 'create policy "dv_admin_select_kpi_reviews" on public.kpi_reviews for select using (public.dv_is_admin())';
    execute 'create policy "dv_admin_manage_kpi_reviews" on public.kpi_reviews for all using (public.dv_is_admin()) with check (public.dv_is_admin())';

    -- TODO: kpi_reviews must expose employee_id to allow staff own-KPI reads.
    -- Without that relationship, staff access remains denied by default.
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'kpi_reviews'
        and column_name = 'employee_id'
    ) then
      execute 'create policy "dv_staff_select_own_kpi_reviews" on public.kpi_reviews for select using (public.dv_is_staff() and public.dv_user_owns_employee(employee_id))';
    end if;
  end if;
end $$;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

drop policy if exists "Public can access content images" on storage.objects;
drop policy if exists "Admins can upload content images" on storage.objects;
drop policy if exists "Public can access portfolio media" on storage.objects;
drop policy if exists "Admins can upload portfolio media" on storage.objects;
drop policy if exists "Admins can manage payment proofs" on storage.objects;

drop policy if exists "dv_public_read_content_images" on storage.objects;
drop policy if exists "dv_admin_manage_content_images_storage" on storage.objects;
drop policy if exists "dv_public_read_portfolio_media" on storage.objects;
drop policy if exists "dv_editor_manage_portfolio_media_storage" on storage.objects;
drop policy if exists "dv_admin_manage_payment_proofs_storage" on storage.objects;
drop policy if exists "dv_finance_manage_payment_proofs_storage" on storage.objects;
drop policy if exists "dv_customer_upload_own_payment_proofs_storage" on storage.objects;
drop policy if exists "dv_customer_read_own_payment_proofs_storage" on storage.objects;
drop policy if exists "dv_staff_upload_own_attendance_selfies" on storage.objects;
drop policy if exists "dv_staff_read_own_attendance_selfies" on storage.objects;
drop policy if exists "dv_staff_update_own_attendance_selfies" on storage.objects;
drop policy if exists "dv_admin_manage_attendance_selfies" on storage.objects;

create policy "dv_public_read_content_images"
  on storage.objects for select
  using (bucket_id = 'content-images');

create policy "dv_admin_manage_content_images_storage"
  on storage.objects for all
  using (bucket_id = 'content-images' and public.dv_is_admin())
  with check (bucket_id = 'content-images' and public.dv_is_admin());

create policy "dv_public_read_portfolio_media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

create policy "dv_editor_manage_portfolio_media_storage"
  on storage.objects for all
  using (bucket_id = 'portfolio-media' and public.dv_has_role(array['super_admin', 'admin', 'editor']))
  with check (bucket_id = 'portfolio-media' and public.dv_has_role(array['super_admin', 'admin', 'editor']));

create policy "dv_admin_manage_payment_proofs_storage"
  on storage.objects for all
  using (bucket_id = 'payment-proofs' and public.dv_is_admin())
  with check (bucket_id = 'payment-proofs' and public.dv_is_admin());

create policy "dv_finance_manage_payment_proofs_storage"
  on storage.objects for all
  using (bucket_id = 'payment-proofs' and public.dv_has_role(array['finance']))
  with check (bucket_id = 'payment-proofs' and public.dv_has_role(array['finance']));

create policy "dv_customer_upload_own_payment_proofs_storage"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and public.dv_has_role(array['customer'])
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "dv_customer_read_own_payment_proofs_storage"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and public.dv_has_role(array['customer'])
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "dv_staff_upload_own_attendance_selfies"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  );

create policy "dv_staff_read_own_attendance_selfies"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  );

create policy "dv_staff_update_own_attendance_selfies"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  )
  with check (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  );

create policy "dv_admin_manage_attendance_selfies"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'attendance-selfies' and public.dv_is_admin())
  with check (bucket_id = 'attendance-selfies' and public.dv_is_admin());
