-- ============================================================================
-- Harden Bookings RLS
-- ============================================================================
-- Goal:
-- - super_admin/admin manage bookings
-- - finance SELECT only
-- - customer SELECT own bookings only
-- - staff/editor/photographer/videographer cannot SELECT all bookings
-- - staff/editor cannot UPDATE bookings directly

alter table public.bookings enable row level security;

-- Remove broad staff/editor booking policies from the base RLS file.
drop policy if exists "dv_editor_select_bookings_for_production" on public.bookings;
drop policy if exists "dv_staff_select_bookings" on public.bookings;
drop policy if exists "dv_staff_update_bookings" on public.bookings;

-- Recreate safe booking policies idempotently.
drop policy if exists "dv_admin_manage_bookings" on public.bookings;
drop policy if exists "dv_finance_select_bookings" on public.bookings;
drop policy if exists "dv_customer_select_own_bookings" on public.bookings;

create policy "dv_admin_manage_bookings"
  on public.bookings for all
  using (public.dv_is_admin())
  with check (public.dv_is_admin());

create policy "dv_finance_select_bookings"
  on public.bookings for select
  using (public.dv_has_role(array['finance']));

create policy "dv_customer_select_own_bookings"
  on public.bookings for select
  using (public.dv_customer_matches_booking(id));

comment on policy "dv_admin_manage_bookings" on public.bookings
  is 'super_admin/admin can create, read, update, and archive/cancel bookings.';

comment on policy "dv_finance_select_bookings" on public.bookings
  is 'finance can read bookings for finance reports only.';

comment on policy "dv_customer_select_own_bookings" on public.bookings
  is 'customers can read only bookings matched to their portal identity.';

