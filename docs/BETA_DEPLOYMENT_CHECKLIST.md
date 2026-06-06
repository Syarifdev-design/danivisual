# Danivisual Beta Deployment Checklist

Use this checklist for staging first, then repeat it for production. Do not share
the beta link until every required item has evidence.

## 1. Required Environment Variables

Configure these values in the hosting provider for both staging and production:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<project-anon-key>
VITE_CLIENT_PORTAL_ENABLED=false
```

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend environment variables.
- Rebuild and redeploy after changing any `VITE_*` value.
- Confirm the deployed build shows the disabled Client Portal message.

## 2. Database Migrations

Apply in order:

1. `011_harden_staff_tables_rls.sql`
2. `012_add_customers_auth_id_link.sql`
3. `013_harden_finance_and_staff_rls.sql`
4. `014_finance_customer_data_restriction.sql`
5. `015_add_attendance_selfies_bucket.sql`

Record the staging and production migration history/output. Migration `014`
removes direct finance access to PII-bearing customer/booking rows and creates:

- `dv_finance_customer_summary()`
- `dv_finance_booking_summary()`

## 3. Edge Functions

Deploy and record the deployment output/version:

```bash
supabase functions deploy create-staff-user
supabase functions deploy update-staff-user
supabase functions deploy customer-bookings
```

Confirm each function has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
available through the Supabase function environment.

## 4. Storage Buckets

Confirm these buckets exist:

- `payment-proofs` - private
- `content-images` - public
- `portfolio-media` - public
- `attendance-selfies` - private

For `attendance-selfies`, verify:

- anon/customer cannot read or upload;
- staff can upload/read/update only inside their own employee ID folder;
- admin/super_admin can manage all objects.

## 5. Smoke Test Accounts

Prepare active staging accounts linked to the correct `admin_users` role:

- `super_admin`
- `admin`
- `finance`
- `staff`

Never place passwords in this repository or in the verification report.

## 6. Pre-launch Verification Queries

Run in the Supabase SQL editor and save the results.

```sql
-- Applied migrations (table name can differ by Supabase CLI version).
select * from supabase_migrations.schema_migrations order by version;

-- RLS status.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Sensitive anon grants must return zero rows.
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'public'
  and table_name in (
    'admin_users', 'employees', 'attendance_records', 'staff_tasks',
    'task_comments', 'kpi_reviews', 'customers', 'bookings', 'payments'
  );

-- Finance must not have direct base-table RLS policies.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('customers', 'bookings')
  and policyname like '%finance%';

-- Finance payments must be SELECT-only.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'payments'
  and policyname like '%finance%';

-- Finance RPC output columns must contain no PII.
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('dv_finance_customer_summary', 'dv_finance_booking_summary');

-- Required buckets.
select id, public
from storage.buckets
where id in (
  'payment-proofs', 'content-images', 'portfolio-media', 'attendance-selfies'
)
order by id;
```

## 7. Required Smoke Tests

- Public booking creates customer, booking, and payment proof records.
- Admin can login and manage booking/payment/production.
- Staff can login and access only own attendance/tasks/KPI.
- Finance can see financial summaries but cannot see/search phone, email,
  address/event location, customer notes, or query full customers/bookings.
- `/register` shows the disabled-registration safe message.
- `/dashboard/login` shows the disabled Client Portal message in production.
- Public FAQ reads published Supabase FAQ rows.
- `npm run build` passes.
- `npm run typecheck` result is recorded honestly.
