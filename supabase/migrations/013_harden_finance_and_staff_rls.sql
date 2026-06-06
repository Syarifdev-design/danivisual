-- =============================================================================
-- MIGRATION: 013_harden_finance_and_staff_rls.sql
-- Date: 2026-06-05
-- Purpose:
--   - Make finance payments read-only.
--   - Remove direct finance access to customer and booking PII.
--   - Remove broad staff calendar access until events can be scoped.
--
-- Finance-safe summary RPCs are created by migration 014. RLS remains on the
-- base tables; ordinary views are intentionally not used as an RLS boundary.
-- =============================================================================

-- Finance can read payments for reporting, but cannot modify them.
drop policy if exists "dv_finance_manage_payments" on public.payments;
drop policy if exists "dv_finance_select_payments" on public.payments;

create policy "dv_finance_select_payments"
  on public.payments for select
  using (public.dv_has_role(array['finance']));

-- Finance must not query full customer or booking rows because both contain PII.
drop policy if exists "dv_finance_select_customers" on public.customers;
drop policy if exists "dv_finance_select_bookings" on public.bookings;

-- calendar_events has no reliable employee assignment relationship. Keep it
-- admin-only until the schema can scope each event to an employee.
drop policy if exists "dv_staff_select_calendar_events" on public.calendar_events;

-- Verification:
-- select policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('payments', 'customers', 'bookings', 'calendar_events')
-- order by tablename, policyname;
