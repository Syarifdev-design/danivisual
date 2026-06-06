-- =============================================================================
-- SQL SCRIPT: Create Production Admin Users
-- =============================================================================
-- Purpose: Create admin users in Supabase Auth and link to admin_users table
--
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor (Dashboard > SQL Editor)
-- 2. Replace placeholders with actual values
-- 3. Users will be created in auth.users AND linked to admin_users
--
-- IMPORTANT: Run this AFTER the main schema migrations
-- =============================================================================

-- =============================================================================
-- CONFIGURATION: Replace these with actual values
-- =============================================================================

-- For each user, you need:
-- 1. A valid email
-- 2. A password (minimum 6 characters for Supabase Auth)
-- 3. The user's full name
-- 4. The role they should have

-- =============================================================================
-- STEP 1: Create users in auth.users table
-- =============================================================================
-- Note: This uses Supabase Auth's internal functions
-- You may need to do this through the Supabase Dashboard instead

-- =============================================================================
-- STEP 2: Link auth users to admin_users
-- =============================================================================
-- After creating users in Supabase Auth, run this to link them:

/*
-- Example: Link a user (run once per user, with actual auth_id)

-- First, get the auth_id from auth.users:
-- SELECT id, email FROM auth.users WHERE email = 'admin@yourcompany.com';

-- Then insert into admin_users with the auth_id:
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    'YOUR-AUTH-UUID-HERE',
    'admin@yourcompany.com',
    'admin',
    'Admin User',
    'super_admin',
    true
) ON CONFLICT (email) DO NOTHING;
*/

-- =============================================================================
-- TEMPLATE: Quick create all 8 roles (modify emails/passwords)
-- =============================================================================

/*
-- 1. SUPER ADMIN
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    NULL, -- Will be filled after creating in Supabase Auth
    'superadmin@yourcompany.com',
    'superadmin',
    'Super Admin',
    'super_admin',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    is_active = true;

-- 2. ADMIN
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    NULL,
    'admin@yourcompany.com',
    'admin',
    'Admin User',
    'admin',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_active = true;

-- 3. FINANCE
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    NULL,
    'finance@yourcompany.com',
    'finance',
    'Finance User',
    'finance',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'finance',
    is_active = true;

-- 4. EDITOR
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    NULL,
    'editor@yourcompany.com',
    'editor',
    'Editor User',
    'editor',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'editor',
    is_active = true;

-- 5. STAFF
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    NULL,
    'staff@yourcompany.com',
    'staff',
    'Staff User',
    'staff',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'staff',
    is_active = true;

-- 6. PHOTOGRAPHER
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    NULL,
    'photographer@yourcompany.com',
    'photographer',
    'Photographer User',
    'photographer',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'photographer',
    is_active = true;

-- 7. VIDEOGRAPHER
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active
) VALUES (
    NULL,
    'videographer@yourcompany.com',
    'videographer',
    'Videographer User',
    'videographer',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'videographer',
    is_active = true;

-- 8. CUSTOMER (example)
INSERT INTO admin_users (
    auth_id,
    email,
    username,
    name,
    role,
    is_active,
    whatsapp
) VALUES (
    NULL,
    'customer@example.com',
    'customer',
    'Test Customer',
    'customer',
    true,
    '081234567890'
) ON CONFLICT (email) DO UPDATE SET
    role = 'customer',
    is_active = true;
*/

-- =============================================================================
-- VERIFICATION: Check all users were created
-- =============================================================================

SELECT
    id,
    email,
    username,
    name,
    role,
    is_active,
    auth_id IS NOT NULL as has_auth_link
FROM admin_users
ORDER BY
    CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'finance' THEN 3
        WHEN 'editor' THEN 4
        WHEN 'staff' THEN 5
        WHEN 'photographer' THEN 6
        WHEN 'videographer' THEN 7
        WHEN 'customer' THEN 8
    END;