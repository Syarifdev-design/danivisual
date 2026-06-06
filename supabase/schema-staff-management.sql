-- ============================================================================
-- Staff Management Schema
-- Table untuk mengelola employees, attendance, tasks, dan KPI
-- ============================================================================

-- =============================================================================
-- 1. EMPLOYEES TABLE
-- =============================================================================

create table if not exists employees (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,

    -- Basic info
    name text not null,
    email text,
    phone text,

    -- Role dan position
    role text not null check (role in ('photographer', 'videographer', 'editor', 'admin', 'finance', 'staff')),
    position text,

    -- Photo
    photo_url text,

    -- Status
    is_active boolean default true,

    -- Join info
    join_date date,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =============================================================================
-- 2. ATTENDANCE RECORDS TABLE
-- =============================================================================

create table if not exists attendance_records (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,

    -- Employee info (cached for display)
    employee_name text,
    employee_role text,

    -- Date
    date date not null,

    -- Check-in time
    check_in_time timestamptz,
    check_in_selfie_url text,
    check_in_latitude numeric(10, 7),
    check_in_longitude numeric(10, 7),

    -- Check-out time
    check_out_time timestamptz,
    check_out_selfie_url text,
    check_out_latitude numeric(10, 7),
    check_out_longitude numeric(10, 7),

    -- Status
    status text not null default 'present' check (status in ('present', 'late', 'absent', 'leave', 'remote')),

    -- Calculated fields
    late_minutes integer default 0,
    work_duration_minutes integer,

    -- Notes
    notes text,

    -- Approval
    approved_by uuid references employees(id) on delete set null,
    approved_at timestamptz,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    -- Unique constraint: one attendance record per employee per day
    unique (employee_id, date)
);

-- =============================================================================
-- 3. STAFF TASKS TABLE
-- =============================================================================

create table if not exists staff_tasks (
    id uuid primary key default gen_random_uuid(),

    -- Task info
    title text not null,
    description text,

    -- Assignment
    assigned_to uuid not null references employees(id) on delete cascade,
    assigned_to_name text,
    assigned_by uuid references employees(id) on delete set null,
    assigned_by_name text,

    -- Link to booking/production (optional)
    booking_id uuid references bookings(id) on delete set null,
    booking_order_number text,
    production_record_id uuid references production_records(id) on delete set null,

    -- Priority
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),

    -- Status
    status text not null default 'todo' check (status in ('todo', 'in_progress', 'submitted', 'revision', 'completed', 'cancelled', 'overdue')),

    -- Timeline
    deadline timestamptz,
    started_at timestamptz,
    submitted_at timestamptz,
    completed_at timestamptz,

    -- Result
    result_note text,
    result_url text,
    revision_note text,
    quality_score integer check (quality_score >= 1 and quality_score <= 5),

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =============================================================================
-- 4. TASK COMMENTS TABLE
-- =============================================================================

create table if not exists task_comments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references staff_tasks(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,

    -- Comment
    comment text not null,
    attachment_url text,

    -- Timestamps
    created_at timestamptz default now()
);

-- =============================================================================
-- 5. KPI REVIEWS TABLE
-- =============================================================================

create table if not exists kpi_reviews (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,

    -- Period
    period_month integer not null check (period_month >= 1 and period_month <= 12),
    period_year integer not null check (period_year >= 2020),

    -- Scores
    attendance_score numeric(5, 2) default 0,
    task_completion_score numeric(5, 2) default 0,
    deadline_score numeric(5, 2) default 0,
    quality_score numeric(5, 2) default 0,

    -- Final score
    final_score numeric(5, 2) default 0,

    -- Notes
    notes text,

    -- Reviewer
    reviewed_by uuid references employees(id) on delete set null,

    -- Unique: one review per employee per month/year
    unique (employee_id, period_month, period_year),

    -- Timestamps
    created_at timestamptz default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Employees indexes
create index if not exists idx_employees_user_id on employees(user_id);
create index if not exists idx_employees_role on employees(role);
create index if not exists idx_employees_is_active on employees(is_active);
create index if not exists idx_employees_name on employees(name);

-- Attendance indexes
create index if not exists idx_attendance_employee_id on attendance_records(employee_id);
create index if not exists idx_attendance_user_id on attendance_records(user_id);
create index if not exists idx_attendance_date on attendance_records(date);
create index if not exists idx_attendance_status on attendance_records(status);
create index if not exists idx_attendance_employee_date on attendance_records(employee_id, date);

-- Staff tasks indexes
create index if not exists idx_staff_tasks_assigned_to on staff_tasks(assigned_to);
create index if not exists idx_staff_tasks_assigned_by on staff_tasks(assigned_by);
create index if not exists idx_staff_tasks_booking_id on staff_tasks(booking_id);
create index if not exists idx_staff_tasks_production_record_id on staff_tasks(production_record_id);
create index if not exists idx_staff_tasks_status on staff_tasks(status);
create index if not exists idx_staff_tasks_priority on staff_tasks(priority);
create index if not exists idx_staff_tasks_deadline on staff_tasks(deadline);

-- Task comments indexes
create index if not exists idx_task_comments_task_id on task_comments(task_id);
create index if not exists idx_task_comments_user_id on task_comments(user_id);

-- KPI reviews indexes
create index if not exists idx_kpi_reviews_employee_id on kpi_reviews(employee_id);
create index if not exists idx_kpi_reviews_period on kpi_reviews(period_year, period_month);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at
-- =============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Employees trigger
drop trigger if exists employees_updated_at on employees;
create trigger employees_updated_at
    before update on employees
    for each row execute function update_updated_at_column();

-- Attendance trigger
drop trigger if exists attendance_records_updated_at on attendance_records;
create trigger attendance_records_updated_at
    before update on attendance_records
    for each row execute function update_updated_at_column();

-- Staff tasks trigger
drop trigger if exists staff_tasks_updated_at on staff_tasks;
create trigger staff_tasks_updated_at
    before update on staff_tasks
    for each row execute function update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (enabled only - policies managed by rls-policies.sql
-- and migration 011_harden_staff_tables_rls.sql)
-- =============================================================================

alter table employees enable row level security;
alter table attendance_records enable row level security;
alter table staff_tasks enable row level security;
alter table task_comments enable row level security;
alter table kpi_reviews enable row level security;

-- =============================================================================
-- MINIMAL PERMISSIONS (RLS policies control access; grants here are for
-- Supabase internals only. No grant to anon for staff tables.)
-- =============================================================================

-- Employees: authenticated can perform operations allowed by RLS policies
grant select, insert, update, delete on employees to authenticated;
grant all on employees to service_role;

-- Attendance: authenticated can perform operations allowed by RLS policies
grant select, insert, update, delete on attendance_records to authenticated;
grant all on attendance_records to service_role;

-- Staff tasks: authenticated can perform operations allowed by RLS policies
grant select, insert, update, delete on staff_tasks to authenticated;
grant all on staff_tasks to service_role;

-- Task comments: authenticated can perform operations allowed by RLS policies
grant select, insert, update, delete on task_comments to authenticated;
grant all on task_comments to service_role;

-- KPI reviews: authenticated can perform operations allowed by RLS policies
grant select, insert, update, delete on kpi_reviews to authenticated;
grant all on kpi_reviews to service_role;
