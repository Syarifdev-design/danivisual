-- =============================================================================
-- SCHEMA OPERATIONAL - Production, HR & Attendance
-- =============================================================================
-- Purpose: Schema untuk operasional bisnis photography studio
-- Includes: Production tracking, Photo selections, Employees, Attendance
--
-- Dependencies:
--   - bookings table (from schema-bookings.sql)
--   - customers table (from schema-bookings.sql)
--   - admin_users table (from schema-admin.sql)
-- =============================================================================

-- =============================================================================
-- ENABLE UUID EXTENSION
-- =============================================================================
create extension if not exists "uuid-ossp";

-- =============================================================================
-- HELPER FUNCTION: Auto-update updated_at
-- =============================================================================
-- This function should already exist from other schema files
-- But we define it here to ensure it's available for this schema
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- =============================================================================
-- A. PRODUCTION_RECORDS
-- =============================================================================
-- Tracking alur produksi照片 dari booking hingga delivery
-- Setiap booking memiliki satu production record
-- Steps: pelunasan → photo sorting → editing → printing → finishing → delivery

create table if not exists production_records (
    id uuid primary key default uuid_generate_v4(),

    -- Link ke booking
    booking_id uuid references bookings(id) on delete cascade,

    -- Order info (denormalized for quick access)
    order_number text,
    customer_name text,
    customer_phone text,
    package_name text,

    -- Event details
    event_date date,
    event_location text,

    -- Production steps (stored as JSONB for flexibility)
    steps jsonb default '{
        "pelunasan": {"id": "pelunasan", "name": "Pelunasan & Sneak Peek", "status": "waiting", "note": "", "estimatedDate": null, "completedAt": null},
        "photoSorting": {"id": "photoSorting", "name": "Photo Sorting", "status": "waiting", "note": "", "estimatedDate": null, "completedAt": null},
        "editing": {"id": "editing", "name": "Editing", "status": "waiting", "note": "", "estimatedDate": null, "completedAt": null},
        "printing": {"id": "printing", "name": "Cetak", "status": "waiting", "note": "", "estimatedDate": null, "completedAt": null},
        "finishing": {"id": "finishing", "name": "Finishing", "status": "waiting", "note": "", "estimatedDate": null, "completedAt": null},
        "delivery": {"id": "delivery", "name": "Delivery", "status": "waiting", "note": "", "estimatedDate": null, "completedAt": null}
    }'::jsonb,

    -- Links
    google_drive_link text,
    gallery_link text,

    -- Customer notes (editing requests, etc.)
    customer_notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes for production records
create index if not exists idx_production_records_booking_id on production_records(booking_id);
create index if not exists idx_production_records_order_number on production_records(order_number);
create index if not exists idx_production_records_customer_name on production_records(customer_name);
create index if not exists idx_production_records_event_date on production_records(event_date);

-- =============================================================================
-- B. PHOTO_SELECTIONS
-- =============================================================================
-- Customer photo selection tracking untuk pilih foto hasil editing
-- Status flow: pending → submitted → approved/rejected

create table if not exists photo_selections (
    id uuid primary key default uuid_generate_v4(),

    -- Link ke booking
    booking_id uuid references bookings(id) on delete cascade,

    -- Link ke customer (for direct customer access)
    customer_id uuid references customers(id) on delete set null,

    -- Gallery link (link ke Google Drive atau platform lain)
    gallery_link text,

    -- Selected photos
    editing_selections text, -- Array atau list foto yang dipilih untuk editing
    printing_selections text, -- Array atau list foto yang dipilih untuk cetak

    -- Notes
    additional_notes text,

    -- Status tracking
    status text default 'pending' check (status in ('pending', 'submitted', 'approved', 'rejected')),

    -- Timestamps
    submitted_at timestamptz,
    approved_at timestamptz,
    approved_by uuid references admin_users(id) on delete set null,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes for photo selections
create index if not exists idx_photo_selections_booking_id on photo_selections(booking_id);
create index if not exists idx_photo_selections_customer_id on photo_selections(customer_id);
create index if not exists idx_photo_selections_status on photo_selections(status);
create index if not exists idx_photo_selections_submitted_at on photo_selections(submitted_at);

-- =============================================================================
-- C. EMPLOYEES
-- =============================================================================
-- Data karyawan tim produksi photography

create table if not exists employees (
    id uuid primary key default uuid_generate_v4(),

    -- Basic info
    name text not null,
    email text,
    phone text,

    -- Role dalam tim
    role text not null check (role in ('photographer', 'videographer', 'editor', 'admin', 'finance', 'staff')),

    -- Status
    is_active boolean default true,

    -- Join info
    join_date date,
    notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes for employees
create index if not exists idx_employees_role on employees(role);
create index if not exists idx_employees_is_active on employees(is_active);
create index if not exists idx_employees_name on employees(name);
create index if not exists idx_employees_phone on employees(phone);

-- =============================================================================
-- D. ATTENDANCE (LEGACY - DO NOT USE)
-- =============================================================================
-- STATUS: LEGACY TABLE
-- This table is deprecated. Use attendance_records instead.
-- See: supabase/migrations/README_ATTENDANCE_TABLES.md
--
-- Kehadiran harian karyawan
-- DO NOT CREATE NEW RECORDS IN THIS TABLE
-- Active table: attendance_records (in schema-staff-management.sql)

create table if not exists attendance (
    id uuid primary key default uuid_generate_v4(),

    -- Link ke employee
    employee_id uuid references employees(id) on delete cascade,

    -- Employee info (denormalized for quick access)
    employee_name text,
    employee_role text,

    -- Date
    date date not null,

    -- Time tracking
    check_in timestamptz,
    check_out timestamptz,

    -- Status
    status text default 'present' check (status in ('present', 'late', 'absent', 'leave')),

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    -- Unique constraint: one attendance record per employee per day
    unique (employee_id, date)
);

-- Indexes for attendance
create index if not exists idx_attendance_employee_id on attendance(employee_id);
create index if not exists idx_attendance_date on attendance(date);
create index if not exists idx_attendance_status on attendance(status);
create index if not exists idx_attendance_employee_date on attendance(employee_id, date);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at
-- =============================================================================

create trigger update_production_records_updated_at
    before update on production_records
    for each row execute function update_updated_at_column();

create trigger update_photo_selections_updated_at
    before update on photo_selections
    for each row execute function update_updated_at_column();

create trigger update_employees_updated_at
    before update on employees
    for each row execute function update_updated_at_column();

create trigger update_attendance_updated_at
    before update on attendance
    for each row execute function update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Get production record by booking ID
create or replace function fn_get_production_by_booking(p_booking_id uuid)
returns production_records as $$
begin
    return (
        select * from production_records
        where booking_id = p_booking_id
        limit 1
    );
end;
$$ language plpgsql;

-- Function: Get attendance for employee in date range
create or replace function fn_get_employee_attendance(
    p_employee_id uuid,
    p_start_date date,
    p_end_date date
)
returns setof attendance as $$
begin
    return query
    select * from attendance
    where employee_id = p_employee_id
      and date >= p_start_date
      and date <= p_end_date
    order by date desc;
end;
$$ language plpgsql;

-- Function: Get monthly attendance summary
create or replace function fn_get_monthly_attendance_summary(
    p_year integer,
    p_month integer
)
returns table (
    employee_id uuid,
    employee_name text,
    total_days integer,
    present_days integer,
    late_days integer,
    absent_days integer,
    leave_days integer
) as $$
begin
    return query
    select
        a.employee_id,
        e.name as employee_name,
        count(*) as total_days,
        count(*) filter (where a.status = 'present') as present_days,
        count(*) filter (where a.status = 'late') as late_days,
        count(*) filter (where a.status = 'absent') as absent_days,
        count(*) filter (where a.status = 'leave') as leave_days
    from attendance a
    join employees e on e.id = a.employee_id
    where extract(year from a.date) = p_year
      and extract(month from a.date) = p_month
    group by a.employee_id, e.name
    order by e.name;
end;
$$ language plpgsql;

-- =============================================================================
-- SEED DATA: Default Employees (Optional - for development)
-- =============================================================================
-- Uncomment jika ingin seed data default

-- insert into employees (name, email, phone, role, is_active, join_date) values
--     ('Ahmad Photographer', 'ahmad@danivisual.app', '081234567890', 'photographer', true, '2024-01-01'),
--     ('Budi Videographer', 'budi@danivisual.app', '081234567891', 'videographer', true, '2024-02-01'),
--     ('Cita Editor', 'cita@danivisual.app', '081234567892', 'editor', true, '2024-03-01'),
--     ('Dewi Staff', 'dewi@danivisual.app', '081234567893', 'staff', true, '2024-04-01')
-- on conflict do nothing;

-- =============================================================================
-- ADDITIONAL MIGRATION: Payments sender_name
-- =============================================================================
-- Kolom tambahan untuk payments table yang mungkin belum ada
-- Ini adalah migration terpisah, tidak wajib dijalankan jika schema utama sudah include

-- Uncomment baris berikut untuk menambahkan sender_name ke payments:
-- alter table payments add column if not exists sender_name text;

-- =============================================================================
-- END OF SCHEMA OPERATIONAL
-- =============================================================================