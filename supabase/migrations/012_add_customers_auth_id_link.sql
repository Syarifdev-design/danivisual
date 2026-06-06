-- =============================================================================
-- MIGRATION: 012_add_customers_auth_id_link.sql
-- Date: 2026-06-05
-- Purpose: Link customers table to Supabase Auth users for secure customer portal
--
-- WHY:
-- The customer-bookings Edge Function needs to verify that a request comes from
-- an authenticated Supabase user before returning booking data. Without this
-- link, we cannot reliably match auth.uid() to a customer record.
--
-- This migration:
-- 1. Adds auth_id column to customers table (links to auth.users)
-- 2. Creates index for fast lookups
-- 3. Updates RLS so customers can only manage their own record
-- 4. Prevents duplicate auth_id (one auth user -> one customer record)
--
-- NOTE: Run this BEFORE deploying the updated customer-bookings Edge Function.
-- =============================================================================

-- =============================================================================
-- STEP 1: Add auth_id column to customers table
-- =============================================================================

alter table customers
add column if not exists auth_id uuid references auth.users(id) on delete set null;

-- =============================================================================
-- STEP 2: Add unique constraint (one auth user -> one customer)
-- =============================================================================

-- Only add if not exists (will fail if already added)
do $$
begin
  perform 1
  from pg_constraint
  where conname = 'customers_auth_id_unique'
    and conrelid = 'public.customers'::regclass;

  if not found then
    alter table public.customers
      add constraint customers_auth_id_unique unique (auth_id);
  end if;
end $$;

-- =============================================================================
-- STEP 3: Add index for fast auth_id lookups
-- =============================================================================

create index if not exists idx_customers_auth_id on customers(auth_id);

-- =============================================================================
-- STEP 4: Update RLS for customers table
-- =============================================================================
-- Customers should be able to read their own record (via auth_id link)
-- Note: This is in addition to the existing admin RLS policies

-- Drop existing customer self-access policy if it exists (it may conflict)
drop policy if exists "dv_customer_select_own_customer" on customers;

-- Create policy: customer can read their own record via auth_id link
-- This allows authenticated customers to see their own customer profile
create policy "dv_customer_select_own_customer"
  on customers for select
  using (
    auth_id is not null
    and auth_id = auth.uid()
  );

-- =============================================================================
-- STEP5: Verify the column was added
-- =============================================================================
-- Run this to verify:
-- select column_name, data_type from information_schema.columns
--   where table_name = 'customers' and column_name = 'auth_id';

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- After this migration:
-- - customers.auth_id links to auth.users(id)
-- - bookings.customer_id links to customers(id)
-- - Edge Function can:
--   1. Verify JWT Bearer token
--   2. Extract auth.uid()
--   3. Look up customer by auth_id
--   4. Query bookings where bookings.customer_id = customer.id
--   5. Return only that customer's bookings
--
-- Security model:
-- - No request without valid JWT →401
-- - JWT valid but no customer record linked →403
-- - JWT valid + customer linked → only own bookings returned
-- - No SELECT * FROM bookings (all) → always scoped by customer_id
-- =============================================================================
