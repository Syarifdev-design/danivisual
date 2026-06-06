# MIGRATE FROM SUPABASE TO MYSQL

## Overview

This document explains how to migrate DaniVisual from Supabase (PostgreSQL) to MySQL + PHP native backend.

---

## Why Migrate?

| Supabase (PostgreSQL) | MySQL + PHP |
|----------------------|-------------|
| Free tier: 500MB storage | Unlimited (hosting dependent |
| Usage-based billing after quota | Fixed hosting cost |
| Connection pooling limits | Unlimited connections |
| Real-time features built-in | Need custom WebSocket |
| Edge Functions (Deno) | PHP server-side |
| RLS for security | PHP middleware |
| Storage buckets built-in | File system or S3 |

---

## Architecture Comparison

### Supabase (Current)
```
Frontend (Vite/React)
    ↓
Supabase Client (@supabase/supabase-js)
    ↓
Supabase PostgreSQL + Auth + Storage + Realtime
```

### MySQL + PHP (Target)
```
Frontend (Vite/React)
    ↓
REST API (PHP PDO)
    ↓
MySQL Database + File System
```

---

## PostgreSQL vs MySQL Features

### Supported Features (Auto-Converted)

| Feature | PostgreSQL | MySQL |
|---------|------------|-------|
| UUID primary keys | `uuid_generate_v4()` | `CHAR(36)` + PHP helper |
| Timestamps | `timestamptz` | `DATETIME` |
| Auto-update | Trigger | `ON UPDATE CURRENT_TIMESTAMP` |
| JSON data | `jsonb` | `JSON` |
| ENUM | PostgreSQL ENUM | MySQL ENUM |
| Foreign keys | `REFERENCES` | `FOREIGN KEY` |
| Indexes | `CREATE INDEX` | `CREATE INDEX` |
| Unique constraints | `UNIQUE` | `UNIQUE` |

### Not Available in MySQL (Need PHP Alternatives)

| PostgreSQL | MySQL Alternative |
|------------|------------------|
| Row Level Security (RLS) | PHP middleware |
| `auth.users` table | Custom users table |
| Storage buckets | File system / S3 |
| Edge Functions | PHP endpoints |
| Realtime subscriptions | Polling / WebSocket |
| PostgreSQL triggers | MySQL triggers (limited) |
| Full-text search (tsvector) | MySQL FULLTEXT / Elasticsearch |

---

## Files Converted

### Database Schema

| File | Status | Notes |
|------|--------|-------|
| `database/mysql-schema.sql` | ✅ Ready | 30 tables |
| `database/migration-notes.md` | ✅ Ready | Conversion notes |

### PHP Backend

| File | Purpose |
|------|---------|
| `api/config/database.php` | Database connection (PDO) |
| `api/config/cors.php` | CORS headers |
| `api/helpers/response.php` | JSON response helpers |
| `api/helpers/auth.php` | Authentication helpers |
| `api/auth/login.php` | POST /api/auth/login |
| `api/auth/logout.php` | POST /api/auth/logout |
| `api/auth/register.php` | POST /api/auth/register |
| `api/auth/me.php` | GET /api/auth/me |
| `api/packages/index.php` | CRUD /api/packages |
| `api/bookings/index.php` | CRUD /api/bookings |

### Files Not Converted (Need Custom Implementation)

| File | Reason |
|------|--------|
| Supabase Edge Functions | Replaced by PHP API |
| RLS policies | Replaced by PHP middleware |
| Storage buckets | Need external storage solution |
| Realtime subscriptions | Need WebSocket/polling |
| `supabase/schema-payment-accounts.sql` | Custom payment integration |

---

## Step-by-Step Migration

### Step 1: Create MySQL Database (Hostinger/cPanel)

1. Login ke Hostinger/cPanel
2. Buka **MySQL Databases** atau **Database Wizard**
3. Buat database baru: `danivisual`
4. Buat user dengan password kuat
5. Grant ALL PRIVILEGES ke user tersebut

### Step 2: Import Schema

```bash
# Method 1: phpMyAdmin
# 1. Buka phpMyAdmin
# 2. Pilih database
# 3. Klik "Import"
# 4. Upload database/mysql-schema.sql

# Method 2: Command Line
mysql -u username -p database_name < database/mysql-schema.sql
```

### Step 3: Configure Environment

Buat file `.env.local` di root project:

```env
# Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_NAME=danivisual
DB_USER=your_username
DB_PASS=your_strong_password

# Application
APP_ENV=production
APP_URL=https://danivisual.com
CORS_ORIGINS=https://danivisual.com,https://www.danivisual.com

# Security
API_SECRET=your-32-char-secret-key-here
```

**PENTING:** `.env.local` SUDAH ada di `.gitignore` - JANGAN push ke GitHub!

### Step 4: Upload PHP Backend

```bash
# Upload ke hosting (sesuaikan dengan struktur hosting Anda)
upload/
├── api/
│   ├── config/
│   ├── helpers/
│   ├── auth/
│   ├── packages/
│   └── bookings/
└── uploads/  # untuk file upload
```

### Step 5: Configure PHP Upload Limits

Tambah ke `php.ini` atau `.user.ini`:

```ini
upload_max_filesize = 20M
post_max_size = 25M
max_execution_time = 300
memory_limit = 256M
```

### Step 6: Update Frontend API Base URL

Tambah environment variable untuk production:

```env
# .env.production
VITE_API_URL=https://danivisual.com/api
```

---

## Frontend Changes Required

### Before (Supabase)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Query
const { data } = await supabase.from('packages').select()
```

### After (PHP API)
```typescript
const response = await fetch(`${API_URL}/packages`)
const data = await response.json()
```

### Example API Calls

```typescript
// GET packages
const res = await fetch('/api/packages')
const { data } = await res.json()

// Login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
const { data } = await res.json()

// Authenticated request
const res = await fetch('/api/bookings', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  }
})
```

---

## Security Considerations

### RLS → PHP Middleware

Supabase RLS policy:
```sql
-- PostgreSQL
CREATE POLICY "admin_can_view_all" ON bookings
    FOR SELECT USING (dv_is_admin());
```

PHP equivalent:
```php
// api/config/auth.php
function requireAdmin(): void {
    if (!isset($_SESSION['user_role']) || !in_array($_SESSION['user_role'], ['super_admin', 'admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}
```

### SQL Injection Prevention

```php
// Use prepared statements
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$userId]);

// NEVER do this:
$sql = "SELECT * FROM users WHERE id = $id"; // DANGEROUS!
```

### Password Hashing

```php
// Hash password
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Verify password
if (password_verify($input, $storedHash)) {
    // Login success
}
```

---

## Testing Checklist

### Database
- [ ] All tables created
- [ ] Foreign keys working
- [ ] Indexes created
- [ ] UUID generation consistent

### Authentication
- [ ] User registration works
- [ ] Login/logout works
- [ ] Session persists
- [ ] Role-based access works

### API Endpoints
- [ ] Packages CRUD works
- [ ] Bookings CRUD works
- [ ] Payment verification works
- [ ] Error responses correct

### Security
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF tokens working
- [ ] CORS configured

### Performance
- [ ] Queries optimized (indexes)
- [ ] Pagination working
- [ ] No N+1 queries

---

## Rollback Plan

### If migration fails:

1. **Database**: Keep Supabase running
2. **Frontend**: Use Supabase client temporarily
3. **Data sync**: Export MySQL data, import to Supabase if needed

### Backup before migration:

```bash
# Export Supabase data
pg_dump -h host -U user -d database > backup.sql

# Keep Supabase running
# Don't delete Supabase project yet
```

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/register` | Create user (admin) |
| GET | `/api/auth/me` | Get current user |

### Packages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List packages |
| GET | `/api/packages/{id}` | Get package |
| POST | `/api/packages` | Create package (admin) |
| PUT | `/api/packages/{id}` | Update package (admin) |
| DELETE | `/api/packages/{id}` | Delete package (super_admin) |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings (admin) |
| GET | `/api/bookings/{id}` | Get booking |
| POST | `/api/bookings` | Create booking (public) |
| PUT | `/api/bookings/{id}` | Update booking (admin) |
| POST | `/api/bookings/verify-payment` | Verify payment (finance) |

---

## Support Resources

- [MySQL 8.0 Docs](https://dev.mysql.com/doc/refman/8.0/en/)
- [PHP PDO](https://www.php.net/manual/en/book.pdo.php)
- [Password Hashing](https://www.php.net/manual/en/function.password-hash.php)

---

**Last Updated:** 2026-06-06
**Version:** 1.0.0