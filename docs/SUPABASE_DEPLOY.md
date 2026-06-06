# SUPABASE DATABASE DEPLOYMENT GUIDE

## Overview

This guide explains how to deploy the DaniVisual database schema to Supabase using the provided scripts.

---

## Prerequisites

### 1. Install PostgreSQL Client

The deployment scripts use `psql` (PostgreSQL command-line client).

#### macOS
```bash
brew install postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql-client
```

#### Windows
Download from: https://www.postgresql.org/download/windows/

Or use [PostgreSQL Portable](https://github.com/garethflowers/postgresql-portable)

#### Verify Installation
```bash
psql --version
# Should output: psql (PostgreSQL) 16.x.x
```

### 2. Supabase Account

You need access to your Supabase project:
- Dashboard: https://supabase.com/dashboard
- Project Settings > Database

---

## Step 1: Get Database Connection String

### From Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** > **Database**
4. Find **Connection string** section
5. Copy the **URI** format

### Format
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:5432/postgres
```

Example:
```
postgresql://postgres.abcdefghijk:abcdefghijk1234@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## Step 2: Create .env.local File

Create a file named `.env.local` in the project root:

```bash
# Project root directory
cd "/Volumes/Syarif/Premium Photography Website Design"

# Create .env.local
touch .env.local
```

### Content of .env.local

```env
# DATABASE_URL for psql client deployment
# Replace with your actual Supabase connection string
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:5432/postgres
```

**IMPORTANT:**
- `.env.local` is already in `.gitignore`
- DO NOT commit this file to GitHub
- DO NOT share your password with anyone

---

## Step 3: Run Database Deployment

### Option A: Using npm scripts (Recommended)

#### For Mac/Linux
```bash
npm run deploy:db
# or
npm run deploy:db:unix
```

#### For Windows
```cmd
npm run deploy:db:win
```

### Option B: Direct Script Execution

#### For Mac/Linux
```bash
chmod +x scripts/deploy-supabase.sh
./scripts/deploy-supabase.sh
```

#### For Windows
```cmd
scripts\deploy-supabase.bat
```

### Option C: Manual with psql

If you prefer to run manually:

```bash
psql "YOUR_DATABASE_URL" -f supabase/schema.sql
psql "YOUR_DATABASE_URL" -f supabase/schema-auth.sql
# ... continue with other files
```

---

## SQL File Execution Order

The scripts execute files in this order:

### Phase 1: Core Schema
| Order | File | Description |
|--------|-------|-------------|
| 1 | `schema.sql` | Core tables (packages, faqs, content) |
| 2 | `schema-auth.sql` | Auth & admin_users |
| 3 | `schema-admin.sql` | Admin analytics tables |
| 4 | `schema-bookings.sql` | Bookings & customers |
| 5 | `schema-operational.sql` | Attendance, KPI, tasks |
| 6 | `schema-staff-management.sql` | Staff management |
| 7 | `schema-staff-kpi.sql` | Staff KPI tables |

### Phase 2: Additional Schema
| Order | File | Description |
|--------|-------|-------------|
| 8 | `schema-inquiries.sql` | Inquiries table |
| 9 | `schema-payment-accounts.sql` | Payment accounts |

### Phase 3: Security (RLS Policies)
| Order | File | Description |
|--------|-------|-------------|
| 10 | `rls-policies.sql` | Row Level Security policies |

### Phase 4: Migrations
| Order | File | Description |
|--------|-------|-------------|
| 11 | `002_add_employee_user_linking.sql` | Employee linking |
| 12 | `003_attendance_settings.sql` | Attendance settings |
| 13 | `004_align_staff_tasks_schema.sql` | Staff tasks alignment |
| 14 | `005_add_employee_info_to_attendance_records.sql` | Employee attendance |
| 15 | `005_kpi_jobs.sql` | KPI jobs |
| 16 | `006_customers_foundation.sql` | Customer foundation |
| 17 | `007_inquiry_customer_conversion.sql` | Inquiry conversion |
| 18 | `008_harden_finance_payments_rls.sql` | Finance RLS |
| 19 | `009_bookings_archive_fields.sql` | Bookings archive |
| 20 | `010_harden_bookings_rls.sql` | Bookings RLS |
| 21 | `011_harden_staff_tables_rls.sql` | Staff tables RLS |
| 22 | `012_add_customers_auth_id_link.sql` | Customer auth link |
| 23 | `013_harden_finance_and_staff_rls.sql` | Finance & staff RLS |
| 24 | `014_finance_customer_data_restriction.sql` | Finance restrictions |
| 25 | `015_add_attendance_selfies_bucket.sql` | Attendance selfies |
| 26 | `015_add_operational_staff_roles.sql` | New roles |
| 27 | `016_seed_production_users.sql` | Production users (OPTIONAL) |

### Phase 5: Seed Data (Optional)
| Order | File | Description |
|--------|-------|-------------|
| 28 | `seed-packages.sql` | Sample packages |
| 29 | `seed-portfolio.sql` | Sample portfolio |
| 30 | `seed-faqs-from-frontend.sql` | Sample FAQs |
| 31 | `seed-portfolio-from-frontend.sql` | Sample portfolio |

---

## Verifying Deployment

### Check Tables Created

Run this in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- `admin_users`
- `admin_activity_log`
- `analytics_daily`
- `analytics_events`
- `analytics_page_views`
- `attendance`
- `attendance_records`
- `attendance_settings`
- `bookings`
- `calendar_events`
- `content_fields`
- `content_images`
- `content_menus`
- `customers`
- `employees`
- `faqs`
- `kpi_reviews`
- `media_files`
- `package_categories`
- `packages`
- `portfolio_albums`
- `portfolio_images`
- `service_includes`
- `services`
- `staff_tasks`

### Check RLS Enabled

```sql
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
```

Expected: Most tables should have `rowsecurity = true`

### Check Storage Buckets

```sql
SELECT id, name, public
FROM storage.buckets;
```

Expected buckets:
- `content-images` (public)
- `portfolio-media` (public)
- `payment-proofs` (private)
- `attendance-selfies` (private)

---

## Troubleshooting

### Error: Connection refused

```
psql: could not connect to server: Connection refused
```

**Solution:**
1. Check if DATABASE_URL is correct
2. Check if Supabase project is running
3. Whitelist your IP in Supabase Dashboard > Settings > Database > Connection Pooling

### Error: Authentication failed

```
psql: error: FATAL: password authentication failed
```

**Solution:**
1. Verify your password is correct
2. Reset password in Supabase Dashboard > Settings > Database
3. Update DATABASE_URL with new password

### Error: Table already exists

This is normal for idempotent migrations. The script uses `IF NOT EXISTS` where possible.

### Error: Permission denied

```
ERROR: permission denied for table xxx
```

**Solution:**
1. Make sure you're using the DATABASE_URL with `postgres` role
2. Supabase Direct Connection uses connection pooler which has elevated permissions

### Error: psql command not found

**Solution:**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

---

## Security Notes

### DO
- ✅ Use `.env.local` for sensitive credentials
- ✅ Keep your DATABASE_URL secret
- ✅ Use ANON_KEY for frontend
- ✅ Use DATABASE_URL only for server-side operations

### DON'T
- ❌ Commit `.env` or `.env.local` to Git
- ❌ Share database password publicly
- ❌ Use SERVICE_ROLE_KEY in frontend
- ❌ Put connection strings in frontend code

### If Password is Compromised
1. Reset password in Supabase Dashboard
2. Update `.env.local`
3. Re-run deployment
4. Notify team members to update their local files

---

## Alternative: Using Supabase CLI

If you prefer Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Or start local development
supabase start
```

---

## Support

### Official Documentation
- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/

### Project Files
- Deploy Script: `scripts/deploy-supabase.sh` / `scripts/deploy-supabase.bat`
- Master SQL: `deploy-supabase.sql`
- Migration Files: `supabase/migrations/`

---

**Last Updated:** 2026-06-06
**Version:** 1.0.0