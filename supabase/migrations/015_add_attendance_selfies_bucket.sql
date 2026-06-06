-- =============================================================================
-- MIGRATION: 015_add_attendance_selfies_bucket.sql
-- Purpose: Provision private attendance selfie storage with own-folder access.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('attendance-selfies', 'attendance-selfies', false)
on conflict (id) do update set public = false;

drop policy if exists "dv_staff_upload_own_attendance_selfies" on storage.objects;
drop policy if exists "dv_staff_read_own_attendance_selfies" on storage.objects;
drop policy if exists "dv_staff_update_own_attendance_selfies" on storage.objects;
drop policy if exists "dv_admin_manage_attendance_selfies" on storage.objects;

create policy "dv_staff_upload_own_attendance_selfies"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  );

create policy "dv_staff_read_own_attendance_selfies"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  );

create policy "dv_staff_update_own_attendance_selfies"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  )
  with check (
    bucket_id = 'attendance-selfies'
    and public.dv_is_staff()
    and (storage.foldername(name))[1] = public.dv_current_employee_id()::text
  );

create policy "dv_admin_manage_attendance_selfies"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'attendance-selfies' and public.dv_is_admin())
  with check (bucket_id = 'attendance-selfies' and public.dv_is_admin());
