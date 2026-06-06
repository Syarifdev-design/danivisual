-- =============================================================================
-- MYSQL MIGRATION NOTES
-- =============================================================================
-- Differences between PostgreSQL/Supabase and MySQL implementation
-- =============================================================================

## POSTGRESQL TO MYSQL CONVERSION MAPPING

### 1. UUID Generation

| PostgreSQL | MySQL |
|------------|-------|
| `uuid_generate_v4()` | PHP: `generateUUID()` helper |
| `id uuid primary key default uuid_generate_v4()` | `id CHAR(36) PRIMARY KEY` |

**Solution:** Generate UUIDs in PHP before INSERT:
```php
function generateUUID(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
```

### 2. Data Types

| PostgreSQL | MySQL |
|------------|-------|
| `uuid` | `CHAR(36)` |
| `timestamptz` | `DATETIME` |
| `boolean` | `TINYINT(1)` |
| `text` | `TEXT` |
| `numeric(12, 0)` | `DECIMAL(15,0)` |
| `jsonb` | `JSON` (MySQL 5.7+) |
| `text[]` | `JSON` array |
| `check (...)` | `ENUM(...)` |

### 3. Timestamps

| PostgreSQL | MySQL |
|------------|-------|
| `created_at timestamptz default now()` | `created_at DATETIME DEFAULT CURRENT_TIMESTAMP` |
| `updated_at timestamptz default now()` | `updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

### 4. Row Level Security (RLS)

PostgreSQL RLS is NOT available in MySQL.

**PHP Alternative:**
- Implement in PHP middleware
- Check user role before each query
- Use prepared statements to prevent SQL injection

Example:
```php
function requireRole(string ...$roles): void {
    if (!isset($_SESSION['user_role']) || !in_array($_SESSION['user_role'], $roles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}
```

### 5. Storage Buckets

Supabase Storage not available in MySQL.

**Alternatives:**
- Local file system + public directory
- AWS S3 / Google Cloud Storage
- Separate media hosting service

### 6. Auth Users

Supabase Auth `auth.users` table not available.

**Solution:** Use native PHP session + password_hash():
```php
// Login
$hash = password_hash($password, PASSWORD_BCRYPT);

// Verify
password_verify($password, $stored_hash);
```

### 7. Functions and Triggers

PostgreSQL functions (`CREATE OR REPLACE FUNCTION`) not available in MySQL.

**Solution:** 
- Use PHP for complex logic
- MySQL triggers still work but limited

### 8. ON CONFLICT

PostgreSQL: `ON CONFLICT DO NOTHING`
MySQL: Use `INSERT IGNORE` or `INSERT ... ON DUPLICATE KEY UPDATE`

### 9. UNIQUE Constraint

| PostgreSQL | MySQL |
|------------|-------|
| `unique (menu_id, section_id, field_id)` | `UNIQUE KEY uk_name (col1, col2, col3)` |

### 10. Array Types

PostgreSQL arrays (`text[]`, `uuid[]`) not natively supported.

**Solution:** Use JSON column:
```sql
-- PostgreSQL
`addon_ids text[]`

-- MySQL
`addon_ids JSON`
```

---

## FEATURES NOT YET CONVERTED

### Needs PHP Implementation:

1. **Real-time subscriptions** - Supabase Realtime
   - Alternative: WebSocket server or polling

2. **Edge Functions** - Supabase Edge Functions
   - Alternative: PHP API endpoints

3. **Database Functions** - PostgreSQL stored procedures
   - Alternative: PHP business logic

4. **Triggers** - PostgreSQL triggers
   - Alternative: MySQL triggers (limited) or PHP callbacks

5. **Full-text search** - PostgreSQL tsvector
   - Alternative: MySQL FULLTEXT index or Elasticsearch

---

## TABLES SKIPPED / NEEDS REVIEW

1. **supabase/storage/** - Storage buckets
   - Requires external storage solution

2. **supabase/schema-payment-accounts.sql** - Payment accounts
   - May need custom implementation

3. **supabase/rls-policies.sql** - RLS policies
   - Replaced by PHP middleware

---

## TESTING CHECKLIST

After migration, verify:

- [ ] All tables created with correct structure
- [ ] Foreign keys working properly
- [ ] UUID generation consistent
- [ ] JSON fields storing/retrieving correctly
- [ ] User authentication working
- [ ] Role-based access control working
- [ ] File uploads working (if applicable)
- [ ] API endpoints responding correctly
- [ ] No SQL injection vulnerabilities
- [ ] Performance acceptable