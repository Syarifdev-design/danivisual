-- =============================================================================
-- MIGRATION: Attendance Settings
-- =============================================================================

create table if not exists public.attendance_settings (
  id text primary key default 'default',
  work_start_time text not null default '09:00',
  work_end_time text not null default '17:00',
  late_tolerance_minutes integer not null default 15,
  earliest_check_in_time text not null default '07:00',
  latest_check_in_time text not null default '12:00',
  earliest_check_out_time text not null default '16:00',
  require_selfie boolean not null default true,
  require_gps boolean not null default false,
  allow_checkout_without_checkin boolean not null default false,
  allow_multiple_checkin_per_day boolean not null default false,
  working_days text[] not null default array['monday','tuesday','wednesday','thursday','friday','saturday'],
  auto_mark_late boolean not null default true,
  auto_mark_absent boolean not null default false,
  required_attendance_roles text[] not null default array['staff','editor','photographer','videographer'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.attendance_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.attendance_settings enable row level security;

drop policy if exists "dv_admin_manage_attendance_settings" on public.attendance_settings;
drop policy if exists "dv_staff_read_attendance_settings" on public.attendance_settings;

create policy "dv_admin_manage_attendance_settings"
on public.attendance_settings for all
using (public.dv_is_admin())
with check (public.dv_is_admin());

create policy "dv_staff_read_attendance_settings"
on public.attendance_settings for select
using (public.dv_is_staff());
