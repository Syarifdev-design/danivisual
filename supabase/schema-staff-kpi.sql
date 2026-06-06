-- ============================================================================
-- Staff KPI MVP Schema
-- Danivisual
--
-- Purpose:
-- - KPI reviews per employee per month
-- - Minimal supporting columns for attendance_records and staff_tasks
-- - Idempotent migration style for Supabase/Postgres
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- Helper: Auto-update updated_at
-- ============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. ATTENDANCE RECORDS SUPPORT
-- ============================================================================

create table if not exists attendance_records (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid references employees(id) on delete cascade,
    date date,
    status text default 'present',
    check_in_time timestamptz,
    check_out_time timestamptz,
    late_minutes integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table attendance_records
    add column if not exists employee_id uuid references employees(id) on delete cascade,
    add column if not exists date date,
    add column if not exists status text default 'present',
    add column if not exists check_in_time timestamptz,
    add column if not exists check_out_time timestamptz,
    add column if not exists late_minutes integer default 0,
    add column if not exists created_at timestamptz default now(),
    add column if not exists updated_at timestamptz default now();

drop trigger if exists attendance_records_updated_at on attendance_records;
create trigger attendance_records_updated_at
    before update on attendance_records
    for each row execute function update_updated_at_column();

-- ============================================================================
-- 2. STAFF TASKS SUPPORT
-- ============================================================================

create table if not exists staff_tasks (
    id uuid primary key default gen_random_uuid(),
    assigned_to uuid references employees(id) on delete cascade,
    assigned_by uuid references employees(id) on delete set null,
    status text default 'pending',
    deadline timestamptz,
    completed_at timestamptz,
    quality_score numeric,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table staff_tasks
    add column if not exists assigned_to uuid references employees(id) on delete cascade,
    add column if not exists assigned_by uuid references employees(id) on delete set null,
    add column if not exists status text default 'pending',
    add column if not exists deadline timestamptz,
    add column if not exists completed_at timestamptz,
    add column if not exists quality_score numeric,
    add column if not exists created_at timestamptz default now(),
    add column if not exists updated_at timestamptz default now();

drop trigger if exists staff_tasks_updated_at on staff_tasks;
create trigger staff_tasks_updated_at
    before update on staff_tasks
    for each row execute function update_updated_at_column();

-- ============================================================================
-- 3. KPI REVIEWS
-- ============================================================================

create table if not exists kpi_reviews (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid references employees(id) on delete cascade,
    period_month integer not null,
    period_year integer not null,
    attendance_score numeric default 0,
    task_completion_score numeric default 0,
    deadline_score numeric default 0,
    quality_score numeric default 0,
    final_score numeric default 0,
    level text,
    notes text,
    reviewed_by uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table kpi_reviews
    add column if not exists employee_id uuid references employees(id) on delete cascade,
    add column if not exists period_month integer,
    add column if not exists period_year integer,
    add column if not exists attendance_score numeric default 0,
    add column if not exists task_completion_score numeric default 0,
    add column if not exists deadline_score numeric default 0,
    add column if not exists quality_score numeric default 0,
    add column if not exists final_score numeric default 0,
    add column if not exists level text,
    add column if not exists notes text,
    add column if not exists reviewed_by uuid,
    add column if not exists created_at timestamptz default now(),
    add column if not exists updated_at timestamptz default now();

alter table kpi_reviews
    alter column period_month set not null,
    alter column period_year set not null;

-- Constraints are added with explicit names so this file can be rerun safely.
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'kpi_reviews'::regclass
          and conname = 'kpi_reviews_period_month_check'
    ) then
        alter table kpi_reviews
            add constraint kpi_reviews_period_month_check
            check (period_month between 1 and 12)
            not valid;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'kpi_reviews'::regclass
          and conname = 'kpi_reviews_final_score_check'
    ) then
        alter table kpi_reviews
            add constraint kpi_reviews_final_score_check
            check (final_score between 0 and 100)
            not valid;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'kpi_reviews'::regclass
          and conname = 'kpi_reviews_level_check'
    ) then
        alter table kpi_reviews
            add constraint kpi_reviews_level_check
            check (level in ('excellent', 'good', 'needs_improve', 'poor'))
            not valid;
    end if;
end;
$$;

create index if not exists idx_kpi_reviews_employee_id
    on kpi_reviews(employee_id);

create index if not exists idx_kpi_reviews_period
    on kpi_reviews(period_year, period_month);

create index if not exists idx_kpi_reviews_employee_period
    on kpi_reviews(employee_id, period_year, period_month);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'kpi_reviews'::regclass
          and contype = 'u'
          and conkey = array[
              (select attnum from pg_attribute where attrelid = 'kpi_reviews'::regclass and attname = 'employee_id'),
              (select attnum from pg_attribute where attrelid = 'kpi_reviews'::regclass and attname = 'period_month'),
              (select attnum from pg_attribute where attrelid = 'kpi_reviews'::regclass and attname = 'period_year')
          ]::smallint[]
    ) then
        alter table kpi_reviews
            add constraint kpi_reviews_employee_period_unique
            unique (employee_id, period_month, period_year);
    end if;
end;
$$;

drop trigger if exists kpi_reviews_updated_at on kpi_reviews;
create trigger kpi_reviews_updated_at
    before update on kpi_reviews
    for each row execute function update_updated_at_column();

-- ============================================================================
-- END OF STAFF KPI MVP SCHEMA
-- ============================================================================
