-- =============================================================================
-- MIGRATION: 014_finance_customer_data_restriction.sql
-- Date: 2026-06-05
-- Purpose:
--   Provide finance-safe customer and booking summaries without granting
--   finance SELECT access to the PII-bearing base tables.
--
-- Security design:
--   - customers and bookings remain protected by base-table RLS.
--   - finance has no SELECT policy on either base table.
--   - SECURITY DEFINER RPCs expose an explicit non-PII column allowlist.
--   - each RPC checks the caller's active Danivisual role before returning data.
-- =============================================================================

drop policy if exists "dv_finance_select_customers" on public.customers;
drop policy if exists "dv_finance_select_bookings" on public.bookings;

drop view if exists public.finance_customer_summary;
drop view if exists public.finance_customer_data;
drop view if exists public.finance_bookings_summary;

create or replace function public.dv_finance_customer_summary()
returns table (
  id uuid,
  customer_name text,
  status text,
  source text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  total_bookings integer,
  total_contract_value numeric,
  total_paid numeric,
  total_outstanding numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.dv_has_role(array['finance']) then
    raise exception 'finance role required' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.name,
    coalesce(c.status, 'active'),
    coalesce(c.source, 'booking'),
    coalesce(c.is_active, true),
    c.created_at,
    c.updated_at,
    count(b.id)::integer,
    coalesce(sum(b.total_amount), 0)::numeric,
    coalesce(sum(b.paid_amount), 0)::numeric,
    coalesce(sum(b.remaining_amount), 0)::numeric
  from public.customers c
  left join public.bookings b on b.customer_id = c.id
  group by c.id, c.name, c.status, c.source, c.is_active, c.created_at, c.updated_at
  order by c.created_at desc;
end;
$$;

create or replace function public.dv_finance_booking_summary()
returns table (
  id uuid,
  order_number text,
  customer_id uuid,
  customer_name text,
  package_id text,
  package_name text,
  package_price numeric,
  addon_total numeric,
  event_date date,
  event_type text,
  service_type text,
  total_amount numeric,
  dp_amount numeric,
  paid_amount numeric,
  remaining_amount numeric,
  status text,
  is_active boolean,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.dv_has_role(array['finance']) then
    raise exception 'finance role required' using errcode = '42501';
  end if;

  return query
  select
    b.id,
    b.order_number,
    b.customer_id,
    b.customer_name,
    b.package_id,
    b.package_name,
    b.package_price,
    coalesce(b.addon_total, 0)::numeric,
    b.event_date,
    b.event_type,
    b.service_type,
    b.total_amount,
    coalesce(b.dp_amount, 0)::numeric,
    coalesce(b.paid_amount, 0)::numeric,
    coalesce(b.remaining_amount, 0)::numeric,
    b.status,
    coalesce(b.is_active, true),
    b.archived_at,
    b.created_at,
    b.updated_at
  from public.bookings b
  order by b.created_at desc;
end;
$$;

revoke all on function public.dv_finance_customer_summary() from public;
revoke all on function public.dv_finance_customer_summary() from anon;
grant execute on function public.dv_finance_customer_summary() to authenticated;

revoke all on function public.dv_finance_booking_summary() from public;
revoke all on function public.dv_finance_booking_summary() from anon;
grant execute on function public.dv_finance_booking_summary() to authenticated;

-- Verification:
-- 1. As finance, these must be denied:
--      select * from public.customers;
--      select * from public.bookings;
-- 2. As finance, these must succeed and expose no phone/email/address/notes:
--      select * from public.dv_finance_customer_summary();
--      select * from public.dv_finance_booking_summary();
