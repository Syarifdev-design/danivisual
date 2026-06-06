-- =============================================================================
-- DANIVISUAL SUPABASE MIGRATION SCRIPT
-- =============================================================================
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- Run in order: 1, 2, 3, ... 15
-- =============================================================================

-- =============================================================================
-- MIGRATION 011: Harden Staff Tables RLS
-- =============================================================================
-- Security hardening for staff management tables

-- Run: 011_harden_staff_tables_rls.sql content here
-- (This file is in supabase/migrations/011_harden_staff_tables_rls.sql)

-- =============================================================================
-- MIGRATION 012: Add Customers Auth ID Link
-- =============================================================================
-- Link customers to Supabase Auth users

-- Run: 012_add_customers_auth_id_link.sql content here
-- (This file is in supabase/migrations/012_add_customers_auth_id_link.sql)

-- =============================================================================
-- MIGRATION 013: Harden Finance and Staff RLS
-- =============================================================================

-- Run: 013_harden_finance_and_staff_rls.sql content here
-- (This file is in supabase/migrations/013_harden_finance_and_staff_rls.sql)

-- =============================================================================
-- MIGRATION 014: Finance Customer Data Restriction
-- =============================================================================

-- Run: 014_finance_customer_data_restriction.sql content here
-- (This file is in supabase/migrations/014_finance_customer_data_restriction.sql)

-- =============================================================================
-- MIGRATION 015: Add Attendance Selfies Bucket
-- =============================================================================

-- Run: 015_add_attendance_selfies_bucket.sql content here
-- (This file is in supabase/migrations/015_add_attendance_selfies_bucket.sql)

-- =============================================================================
-- STORAGE BUCKETS SETUP
-- =============================================================================

-- Content Images (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Portfolio Media (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;

-- Payment Proofs (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Attendance Selfies (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-selfies', 'attendance-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check buckets created
SELECT id, name, public FROM storage.buckets;

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- Check RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;