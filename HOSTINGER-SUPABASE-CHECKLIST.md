# HOSTINGER SUPABASE CONNECTION CHECKLIST

**Project:** DaniVisual - Premium Wedding Photography
**Domain:** https://danivisual.com
**Date:** 2026-06-06
**Status:** Ready for Supabase Connection

---

## 1. ENVIRONMENT VARIABLES STATUS

### Required in Hostinger (Vercel/Netlify/Hostinger)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional - for clarity
VITE_CLIENT_PORTAL_ENABLED=false
```

### Status Checklist

| Variable | Required | Current Status | Action |
|----------|----------|----------------|--------|
| `VITE_SUPABASE_URL` | ✅ WAJIB | ⬜ Belum diset | Set di Hostinger dashboard |
| `VITE_SUPABASE_ANON_KEY` | ✅ WAJIB | ⬜ Belum diset | Set di Hostinger dashboard |
| `VITE_CLIENT_PORTAL_ENABLED` | ⚠️ Opsional | N/A | Defaults to false |

### Steps to Set in Hostinger:

1. Login ke Hostinger Dashboard
2. Buka project settings / environment variables
3. Tambahkan:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```
4. **REDEPLOY** aplikasi

---

## 2. SUPABASE MIGRATION STATUS

### Migration Files Required (011-015)

Jalankan di **Supabase SQL Editor** (https://supabase.com/dashboard → SQL Editor):

```sql
-- Run in order from 011 to 015
-- Migration 016 is for production users only (optional)
```

| Migration | File | Description | Priority |
|----------|------|-------------|----------|
| 011 | `011_harden_staff_tables_rls.sql` | Staff tables RLS hardening | ✅ HIGH |
| 012 | `012_add_customers_auth_id_link.sql` | Customer auth linking | ✅ HIGH |
| 013 | `013_harden_finance_and_staff_rls.sql` | Finance & staff RLS | ✅ HIGH |
| 014 | `014_finance_customer_data_restriction.sql` | Finance data restrictions | ✅ HIGH |
| 015 | `015_add_attendance_selfies_bucket.sql` | Attendance selfies bucket | ⚠️ MEDIUM |
| 015b | `015_add_operational_staff_roles.sql` | Add photographer/videographer | ✅ HIGH |
| 016 | `016_seed_production_users.sql` | Seed production users | ⚠️ OPTIONAL |

### Pre-requisite Schemas (Jalankan terlebih dahulu)

```sql
-- Basic schema files
-- 1. schema.sql - Core tables
-- 2. schema-auth.sql - Auth & admin_users
-- 3. schema-admin.sql - Admin tables
-- 4. schema-bookings.sql - Bookings
-- 5. schema-operational.sql - Attendance, KPI, tasks
-- 6. schema-staff-management.sql - Staff management
-- 7. schema-staff-kpi.sql - KPI system
```

### Quick Migration Command (Supabase CLI)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Or run individual migrations via SQL Editor
```

### Migration Status Checklist

| Step | Action | Status |
|------|--------|--------|
| 1 | Jalankan schema.sql | ⬜ |
| 2 | Jalankan schema-auth.sql | ⬜ |
| 3 | Jalankan schema-admin.sql | ⬜ |
| 4 | Jalankan schema-bookings.sql | ⬜ |
| 5 | Jalankan schema-operational.sql | ⬜ |
| 6 | Jalankan schema-staff-management.sql | ⬜ |
| 7 | Jalankan schema-staff-kpi.sql | ⬜ |
| 8 | Jalankan rls-policies.sql | ⬜ |
| 9 | Jalankan 011_harden_staff_tables_rls.sql | ⬜ |
| 10 | Jalankan 012_add_customers_auth_id_link.sql | ⬜ |
| 11 | Jalankan 013_harden_finance_and_staff_rls.sql | ⬜ |
| 12 | Jalankan 014_finance_customer_data_restriction.sql | ⬜ |
| 13 | Jalankan 015_add_attendance_selfies_bucket.sql | ⬜ |
| 14 | Jalankan 015_add_operational_staff_roles.sql | ⬜ |

---

## 3. STORAGE BUCKETS STATUS

### Buckets Required

Buat di **Supabase Dashboard → Storage → New Bucket**:

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `content-images` | ✅ Yes | Website content images |
| `portfolio-media` | ✅ Yes | Portfolio images & videos |
| `payment-proofs` | ❌ No | Customer payment proofs |
| `attendance-selfies` | ❌ No | Staff attendance selfies |

### SQL to Create Buckets

```sql
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
```

### RLS Policies for Buckets

Policies sudah ada di `rls-policies.sql` lines 815-895.

### Storage Bucket Status Checklist

| Bucket | Public | Created | RLS Applied |
|--------|--------|---------|-------------|
| `content-images` | ✅ Yes | ⬜ | ⬜ |
| `portfolio-media` | ✅ Yes | ⬜ | ⬜ |
| `payment-proofs` | ❌ No | ⬜ | ⬜ |
| `attendance-selfies` | ❌ No | ⬜ | ⬜ |

---

## 4. EDGE FUNCTIONS STATUS

### Functions Required

Deploy di **Supabase Dashboard → Edge Functions → Deploy**:

| Function | Purpose | Required |
|----------|---------|----------|
| `create-staff-user` | Create user with Supabase Auth | ✅ HIGH |
| `update-staff-user` | Update user profile | ✅ HIGH |
| `customer-bookings` | Secure customer booking access | ⚠️ MEDIUM (for customer portal) |

### Deploy via Supabase CLI

```bash
# Navigate to project
cd supabase

# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy create-staff-user
supabase functions deploy update-staff-user
supabase functions deploy customer-bookings
```

### Function Status Checklist

| Function | Deployed | Secrets Set | Tested |
|----------|----------|------------|--------|
| `create-staff-user` | ⬜ | ⬜ | ⬜ |
| `update-staff-user` | ⬜ | ⬜ | ⬜ |
| `customer-bookings` | ⬜ | ⬜ | ⬜ |

### Environment for Edge Functions

Edge functions butuh environment variables di Supabase:

```bash
# In Supabase Dashboard → Edge Functions → Settings → Secrets
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 5. SMOKE TEST RESULTS

### Test After Redeploy

Buka browser → Developer Console (F12) → Test:

#### Test 1: Public Booking

```
URL: https://danivisual.com/packages
Action: Pilih paket → Checkout
Expected: Booking berhasil, data masuk Supabase
Status: ⬜
```

#### Test 2: Admin Login

```
URL: https://danivisual.com/login
Credentials: superadmin@danivisual.test / Test123456
Expected: Redirect ke /admin
Status: ⬜
```

#### Test 3: Admin Dashboard

```
URL: https://danivisual.com/admin
Check: Dashboard loaded, tidak ada error console
Expected: Semua menu visible sesuai role
Status: ⬜
```

#### Test 4: Booking Masuk Admin

```
URL: https://danivisual.com/admin/bookings
Check: Booking dari test #1 visible
Expected: Data booking muncul
Status: ⬜
```

#### Test 5: Payment Verify (Finance)

```
URL: https://danivisual.com/admin/payments
Credentials: finance@danivisual.test / Test123456
Action: Verifikasi payment test
Expected: Status berubah, booking ter-update
Status: ⬜
```

#### Test 6: Finance Read-Only

```
URL: https://danivisual.com/admin/finance
Credentials: finance@danivisual.test / Test123456
Check: Tidak bisa edit, hanya view
Expected: Read-only access
Status: ⬜
```

#### Test 7: Attendance

```
URL: https://danivisual.com/admin/attendance
Credentials: staff@danivisual.test / Test123456
Action: Check-in attendance
Expected: Attendance recorded
Status: ⬜
```

---

## 6. BLOCKER CHECKLIST

Jika ada error, cek di bawah:

### Environment Issues

| Blocker | Solution |
|---------|----------|
| `VITE_SUPABASE_URL` not set | Set di Hostinger dashboard |
| `VITE_SUPABASE_ANON_KEY` not set | Set di Hostinger dashboard |
| Wrong URL format | Format: `https://xxx.supabase.co` |
| Placeholder values | Pastikan tidak ada placeholder di env |

### Database Issues

| Blocker | Solution |
|---------|----------|
| Tables not found | Jalankan semua schema SQL |
| RLS errors | Jalankan rls-policies.sql |
| Auth errors | Check Supabase Auth settings |

### Storage Issues

| Blocker | Solution |
|---------|----------|
| Upload failed | Buat bucket & policy |
| 403 Forbidden | Check RLS policies |

### Edge Function Issues

| Blocker | Solution |
|---------|----------|
| Function not found | Deploy function |
| Auth error | Set secrets |
| CORS error | Check CORS headers |

---

## 7. REDEPLOY CHECKLIST

### Step-by-Step

- [ ] 1. Set `VITE_SUPABASE_URL` di Hostinger
- [ ] 2. Set `VITE_SUPABASE_ANON_KEY` di Hostinger
- [ ] 3. Redeploy aplikasi di Hostinger
- [ ] 4. Cek browser console untuk error
- [ ] 5. Jalankan migration 011-015 di Supabase
- [ ] 6. Buat storage buckets
- [ ] 7. Deploy edge functions
- [ ] 8. Test public booking
- [ ] 9. Test admin login
- [ ] 10. Test payment verify

---

## 8. CONTACT & SUPPORT

### Supabase Dashboard
https://supabase.com/dashboard

### Supabase Docs
https://supabase.com/docs

### Project GitHub
https://github.com/Syarifdev-design/danivisual

---

**Last Updated:** 2026-06-06
**Status:** Ready for Deployment