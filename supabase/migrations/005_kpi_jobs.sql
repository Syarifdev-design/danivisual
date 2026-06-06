-- =============================================================================
-- Migration: 005_kpi_jobs
-- Purpose: KPI job templates, KPI jobs, and per-employee KPI job assignments
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- Helpers
-- =============================================================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.dv_is_kpi_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dv_has_role(array['finance', 'editor', 'staff', 'photographer', 'videographer'])
$$;

-- Staff self-updates are intentionally narrow. RLS can decide which rows a user
-- may update, while this trigger prevents changes to review/scoring fields.
create or replace function public.dv_guard_kpi_assignment_staff_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.dv_is_admin() then
    return new;
  end if;

  if not public.dv_is_kpi_staff() or not public.dv_user_owns_employee(old.employee_id) then
    raise exception 'Not allowed to update this KPI assignment';
  end if;

  if new.status not in ('in_progress', 'submitted') then
    raise exception 'Staff can only start or submit KPI assignments';
  end if;

  if new.id is distinct from old.id
    or new.kpi_job_id is distinct from old.kpi_job_id
    or new.employee_id is distinct from old.employee_id
    or new.assigned_to_user_id is distinct from old.assigned_to_user_id
    or new.assigned_by is distinct from old.assigned_by
    or new.role is distinct from old.role
    or new.approved_at is distinct from old.approved_at
    or new.rejected_at is distinct from old.rejected_at
    or new.deadline is distinct from old.deadline
    or new.completion_score is distinct from old.completion_score
    or new.deadline_score is distinct from old.deadline_score
    or new.quality_score is distinct from old.quality_score
    or new.final_score is distinct from old.final_score
    or new.review_note is distinct from old.review_note
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Staff can only update progress and submission fields';
  end if;

  return new;
end;
$$;

-- =============================================================================
-- 1. KPI Job Templates
-- =============================================================================

create table if not exists public.kpi_job_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'general',
  target_role text,
  default_priority text default 'medium',
  default_weight numeric default 1,
  default_deadline_days integer default 7,
  scoring_rules jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.kpi_job_templates
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text default 'general',
  add column if not exists target_role text,
  add column if not exists default_priority text default 'medium',
  add column if not exists default_weight numeric default 1,
  add column if not exists default_deadline_days integer default 7,
  add column if not exists scoring_rules jsonb default '{}'::jsonb,
  add column if not exists is_active boolean default true,
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.kpi_job_templates
set
  title = coalesce(title, 'Untitled KPI Template'),
  category = coalesce(category, 'general')
where title is null
  or category is null;

alter table public.kpi_job_templates
  alter column title set not null,
  alter column category set not null;

-- =============================================================================
-- 2. KPI Jobs
-- =============================================================================

create table if not exists public.kpi_jobs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.kpi_job_templates(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'general',
  assignment_mode text not null default 'specific_role',
  target_roles text[] default '{}',
  target_employee_ids uuid[] default '{}',
  priority text default 'medium',
  weight numeric default 1,
  deadline timestamptz,
  period_month integer,
  period_year integer,
  status text default 'active',
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.kpi_jobs
  add column if not exists template_id uuid references public.kpi_job_templates(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text default 'general',
  add column if not exists assignment_mode text default 'specific_role',
  add column if not exists target_roles text[] default '{}',
  add column if not exists target_employee_ids uuid[] default '{}',
  add column if not exists priority text default 'medium',
  add column if not exists weight numeric default 1,
  add column if not exists deadline timestamptz,
  add column if not exists period_month integer,
  add column if not exists period_year integer,
  add column if not exists status text default 'active',
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.kpi_jobs
set
  title = coalesce(title, 'Untitled KPI Job'),
  category = coalesce(category, 'general'),
  assignment_mode = coalesce(assignment_mode, 'specific_role')
where title is null
  or category is null
  or assignment_mode is null;

alter table public.kpi_jobs
  alter column title set not null,
  alter column category set not null,
  alter column assignment_mode set not null;

-- =============================================================================
-- 3. KPI Job Assignments
-- =============================================================================

create table if not exists public.kpi_job_assignments (
  id uuid primary key default gen_random_uuid(),
  kpi_job_id uuid references public.kpi_jobs(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  assigned_to_user_id uuid,
  assigned_by uuid,
  role text,
  status text default 'todo',
  started_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  deadline timestamptz,
  completion_score numeric default 0,
  deadline_score numeric default 0,
  quality_score numeric default 0,
  final_score numeric default 0,
  submission_note text,
  submission_url text,
  review_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.kpi_job_assignments
  add column if not exists kpi_job_id uuid references public.kpi_jobs(id) on delete cascade,
  add column if not exists employee_id uuid references public.employees(id) on delete cascade,
  add column if not exists assigned_to_user_id uuid,
  add column if not exists assigned_by uuid,
  add column if not exists role text,
  add column if not exists status text default 'todo',
  add column if not exists started_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists deadline timestamptz,
  add column if not exists completion_score numeric default 0,
  add column if not exists deadline_score numeric default 0,
  add column if not exists quality_score numeric default 0,
  add column if not exists final_score numeric default 0,
  add column if not exists submission_note text,
  add column if not exists submission_url text,
  add column if not exists review_note text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- =============================================================================
-- Constraints
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.kpi_jobs'::regclass
      and conname = 'kpi_jobs_assignment_mode_check'
  ) then
    alter table public.kpi_jobs
      add constraint kpi_jobs_assignment_mode_check
      check (assignment_mode in ('all_employees', 'specific_role', 'multiple_roles', 'specific_employee', 'multiple_employees'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.kpi_jobs'::regclass
      and conname = 'kpi_jobs_status_check'
  ) then
    alter table public.kpi_jobs
      add constraint kpi_jobs_status_check
      check (status in ('draft', 'active', 'completed', 'cancelled'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.kpi_job_assignments'::regclass
      and conname = 'kpi_job_assignments_status_check'
  ) then
    alter table public.kpi_job_assignments
      add constraint kpi_job_assignments_status_check
      check (status in ('todo', 'in_progress', 'submitted', 'revision', 'approved', 'rejected', 'completed', 'overdue', 'cancelled'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.kpi_job_assignments'::regclass
      and conname = 'kpi_job_assignments_job_employee_unique'
  ) then
    alter table public.kpi_job_assignments
      add constraint kpi_job_assignments_job_employee_unique
      unique (kpi_job_id, employee_id);
  end if;
end $$;

-- =============================================================================
-- Indexes
-- =============================================================================

create index if not exists idx_kpi_jobs_created_by on public.kpi_jobs(created_by);
create index if not exists idx_kpi_jobs_target_roles on public.kpi_jobs using gin(target_roles);
create index if not exists idx_kpi_job_assignments_employee_id on public.kpi_job_assignments(employee_id);
create index if not exists idx_kpi_job_assignments_kpi_job_id on public.kpi_job_assignments(kpi_job_id);
create index if not exists idx_kpi_job_assignments_status on public.kpi_job_assignments(status);
create index if not exists idx_kpi_job_assignments_deadline on public.kpi_job_assignments(deadline);

-- =============================================================================
-- updated_at Triggers
-- =============================================================================

drop trigger if exists kpi_job_templates_updated_at on public.kpi_job_templates;
create trigger kpi_job_templates_updated_at
  before update on public.kpi_job_templates
  for each row execute function public.update_updated_at_column();

drop trigger if exists kpi_jobs_updated_at on public.kpi_jobs;
create trigger kpi_jobs_updated_at
  before update on public.kpi_jobs
  for each row execute function public.update_updated_at_column();

drop trigger if exists kpi_job_assignments_updated_at on public.kpi_job_assignments;
create trigger kpi_job_assignments_updated_at
  before update on public.kpi_job_assignments
  for each row execute function public.update_updated_at_column();

drop trigger if exists kpi_job_assignments_staff_update_guard on public.kpi_job_assignments;
create trigger kpi_job_assignments_staff_update_guard
  before update on public.kpi_job_assignments
  for each row execute function public.dv_guard_kpi_assignment_staff_update();

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.kpi_job_templates enable row level security;
alter table public.kpi_jobs enable row level security;
alter table public.kpi_job_assignments enable row level security;

-- Templates
drop policy if exists "dv_admin_select_kpi_job_templates" on public.kpi_job_templates;
drop policy if exists "dv_super_admin_manage_kpi_job_templates" on public.kpi_job_templates;

create policy "dv_admin_select_kpi_job_templates"
on public.kpi_job_templates
for select
using (public.dv_is_admin());

create policy "dv_super_admin_manage_kpi_job_templates"
on public.kpi_job_templates
for all
using (public.dv_has_role(array['super_admin']))
with check (public.dv_has_role(array['super_admin']));

-- KPI jobs
drop policy if exists "dv_admin_select_kpi_jobs" on public.kpi_jobs;
drop policy if exists "dv_staff_select_assigned_kpi_jobs" on public.kpi_jobs;
drop policy if exists "dv_super_admin_insert_kpi_jobs" on public.kpi_jobs;
drop policy if exists "dv_super_admin_update_kpi_jobs" on public.kpi_jobs;
drop policy if exists "dv_super_admin_delete_kpi_jobs" on public.kpi_jobs;

create policy "dv_admin_select_kpi_jobs"
on public.kpi_jobs
for select
using (public.dv_is_admin());

create policy "dv_staff_select_assigned_kpi_jobs"
on public.kpi_jobs
for select
using (
  public.dv_is_kpi_staff()
  and exists (
    select 1
    from public.kpi_job_assignments a
    where a.kpi_job_id = kpi_jobs.id
      and public.dv_user_owns_employee(a.employee_id)
  )
);

create policy "dv_super_admin_insert_kpi_jobs"
on public.kpi_jobs
for insert
with check (public.dv_has_role(array['super_admin']));

create policy "dv_super_admin_update_kpi_jobs"
on public.kpi_jobs
for update
using (public.dv_has_role(array['super_admin']))
with check (public.dv_has_role(array['super_admin']));

create policy "dv_super_admin_delete_kpi_jobs"
on public.kpi_jobs
for delete
using (public.dv_has_role(array['super_admin']));

-- KPI job assignments
drop policy if exists "dv_admin_select_kpi_job_assignments" on public.kpi_job_assignments;
drop policy if exists "dv_admin_review_kpi_job_assignments" on public.kpi_job_assignments;
drop policy if exists "dv_super_admin_insert_kpi_job_assignments" on public.kpi_job_assignments;
drop policy if exists "dv_super_admin_delete_kpi_job_assignments" on public.kpi_job_assignments;
drop policy if exists "dv_staff_select_own_kpi_job_assignments" on public.kpi_job_assignments;
drop policy if exists "dv_staff_update_own_kpi_job_assignments" on public.kpi_job_assignments;

create policy "dv_admin_select_kpi_job_assignments"
on public.kpi_job_assignments
for select
using (public.dv_is_admin());

create policy "dv_admin_review_kpi_job_assignments"
on public.kpi_job_assignments
for update
using (public.dv_is_admin())
with check (public.dv_is_admin());

create policy "dv_super_admin_insert_kpi_job_assignments"
on public.kpi_job_assignments
for insert
with check (public.dv_has_role(array['super_admin']));

create policy "dv_super_admin_delete_kpi_job_assignments"
on public.kpi_job_assignments
for delete
using (public.dv_has_role(array['super_admin']));

create policy "dv_staff_select_own_kpi_job_assignments"
on public.kpi_job_assignments
for select
using (
  public.dv_is_kpi_staff()
  and public.dv_user_owns_employee(employee_id)
);

create policy "dv_staff_update_own_kpi_job_assignments"
on public.kpi_job_assignments
for update
using (
  public.dv_is_kpi_staff()
  and public.dv_user_owns_employee(employee_id)
)
with check (
  public.dv_is_kpi_staff()
  and public.dv_user_owns_employee(employee_id)
  and status in ('in_progress', 'submitted')
);

-- =============================================================================
-- Grants
-- =============================================================================

grant select, insert, update, delete on public.kpi_job_templates to authenticated;
grant select, insert, update, delete on public.kpi_jobs to authenticated;
grant select, insert, update, delete on public.kpi_job_assignments to authenticated;

-- Public/anon receives no grant here. RLS policies above allow no customer/public access.

-- =============================================================================
-- END 005_kpi_jobs
-- =============================================================================
