-- =============================================================================
-- MIGRATION: 008_harden_finance_payments_rls.sql
-- =============================================================================
-- Purpose:
--   Harden RLS for finance role on payments table.
--   Finance role should only have SELECT access to payments for reporting.
--   Admin roles maintain full CRUD access.
--
-- Changes:
--   1. Replace dv_finance_manage_payments (FOR ALL) with dv_finance_select_payments (SELECT only)
--   2. No UPDATE/DELETE/INSERT for finance role on payments
--
-- Pre-conditions:
--   - supabase/rls-policies.sql has been applied
--   - dv_has_role() function exists
--
-- Rollback:
--   Run the original rls-policies.sql to restore dv_finance_manage_payments
-- =============================================================================

-- =============================================================================
-- STEP 1: Drop the broad manage policy (FOR ALL)
-- =============================================================================

drop policy if exists "dv_finance_manage_payments" on payments;

-- =============================================================================
-- STEP 2: Create SELECT-only policy for finance
-- =============================================================================

-- Finance can SELECT all payments for reporting purposes
-- This is read-only access - no INSERT, UPDATE, or DELETE
create policy "dv_finance_select_payments"
  on payments for select
  using (public.dv_has_role(array['finance']));

-- =============================================================================
-- STEP 3: Verify admin policies still exist (informational)
-- =============================================================================
-- The following policies should already exist from rls-policies.sql:
--   dv_admin_manage_payments - FOR ALL using dv_is_admin() (super_admin + admin)
--   dv_customer_select_own_payments - SELECT using dv_customer_matches_booking()
--   dv_customer_insert_own_payments - INSERT for customer's own bookings
--
-- If any are missing, run supabase/rls-policies.sql to restore them.

-- =============================================================================
-- STEP 4: Verify policies
-- =============================================================================

-- Check that policies exist
do $$
declare
  finance_select_exists boolean;
  finance_manage_exists boolean;
begin
  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'dv_finance_select_payments'
  ) into finance_select_exists;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'dv_finance_manage_payments'
  ) into finance_manage_exists;

  if finance_select_exists and not finance_manage_exists then
    raise notice 'RLS hardening successful: Finance has SELECT-only access to payments';
  elsif finance_select_exists and finance_manage_exists then
    raise warning 'Both policies exist. dv_finance_manage_payments should be dropped manually';
  else
    raise warning 'Verification failed. Please check policies manually.';
  end if;
end $$;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================
-- Final permissions for payments table:
--
-- Role              | SELECT | INSERT | UPDATE | DELETE
-- ------------------+--------+--------+--------+--------
-- super_admin       |   ✅    |   ✅   |   ✅   |   ✅
-- admin             |   ✅    |   ✅   |   ✅   |   ✅
-- finance           |   ✅    |   ❌   |   ❌   |   ❌
-- customer (own)    |   ✅    |   ✅*  |   ❌   |   ❌
-- public            |   ❌    |   ❌   |   ❌   |   ❌
--
-- * Customer INSERT limited to own bookings with status='pending'
--
-- If finance needs to verify payments in the UI, consider:
--   Option A: Add UI-level permission check + specific UPDATE policy
--   Option B: Create Edge Function/RPC for verify-payment
-- =============================================================================