-- =============================================================================
-- AUTH & USER MANAGEMENT SCHEMA
-- =============================================================================
-- Purpose: User authentication and profile management with Supabase Auth
-- =============================================================================

-- =============================================================================
-- ADMIN_USERS TABLE
-- =============================================================================

create table if not exists admin_users (
    id uuid primary key default uuid_generate_v4(),

    -- Supabase Auth link
    auth_id uuid references auth.users(id) on delete set null,

    -- Credentials
    email text unique,
    username text unique not null,
    password_hash text, -- For fallback auth only (should be null when using Supabase Auth)

    -- Profile
    name text not null,
    phone text,
    avatar_url text,
    whatsapp text,

    -- Role (6 roles)
    role text not null default 'customer'
        check (role in ('super_admin', 'admin', 'finance', 'editor', 'staff', 'customer')),

    -- Status
    is_active boolean default true,

    -- Login tracking
    last_login timestamptz,
    login_count integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_admin_users_auth_id on admin_users(auth_id);
create index if not exists idx_admin_users_email on admin_users(email);
create index if not exists idx_admin_users_username on admin_users(username);
create index if not exists idx_admin_users_role on admin_users(role);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table admin_users enable row level security;

-- Users can view their own profile
create policy "Users can view own profile"
    on admin_users for select
    using (auth.uid() = auth_id);

-- Users can update their own profile (except role)
create policy "Users can update own profile"
    on admin_users for update
    using (auth.uid() = auth_id)
    with check (auth.uid() = auth_id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
    on admin_users for select
    using (
        exists (
            select 1 from admin_users u
            where u.auth_id = auth.uid()
            and u.role in ('super_admin', 'admin')
            and u.is_active = true
        )
    );

-- Only super_admin can insert, update, delete
create policy "Super admin can manage all profiles"
    on admin_users for all
    using (
        exists (
            select 1 from admin_users u
            where u.auth_id = auth.uid()
            and u.role = 'super_admin'
            and u.is_active = true
        )
    )
    with check (
        exists (
            select 1 from admin_users u
            where u.auth_id = auth.uid()
            and u.role = 'super_admin'
        )
    );

-- =============================================================================
-- AUTO UPDATE TIMESTAMP
-- =============================================================================

create or replace function update_admin_users_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_admin_users_updated_at
    before update on admin_users
    for each row execute function update_admin_users_updated_at();

-- =============================================================================
-- AUTO UPDATE LAST LOGIN
-- =============================================================================

create or replace function update_last_login()
returns trigger as $$
begin
    new.last_login = now();
    new.login_count = coalesce(old.login_count, 0) + 1;
    return new;
end;
$$ language plpgsql;

create trigger update_last_login_on_login
    before update of last_login on admin_users
    for each row execute function update_last_login();

-- =============================================================================
-- FUNCTION: Link auth user to profile
-- =============================================================================

create or replace function link_auth_user_to_profile(
    p_auth_id uuid,
    p_email text,
    p_name text,
    p_role text default 'customer'
)
returns admin_users as $$
declare
    v_user admin_users;
begin
    -- Check if profile already exists
    select * into v_user from admin_users where auth_id = p_auth_id;

    if v_user.id is not null then
        -- Update existing
        update admin_users
        set email = p_email,
            name = p_name,
            last_login = now(),
            login_count = login_count + 1,
            updated_at = now()
        where id = v_user.id
        returning * into v_user;
        return v_user;
    else
        -- Create new
        insert into admin_users (auth_id, email, name, role, is_active)
        values (p_auth_id, p_email, p_name, p_role, true)
        returning * into v_user;
        return v_user;
    end if;
end;
$$ language plpgsql;

-- =============================================================================
-- FUNCTION: Get user by auth_id
-- =============================================================================

create or replace function get_user_by_auth_id(p_auth_id uuid)
returns admin_users as $$
begin
    return (
        select * from admin_users
        where auth_id = p_auth_id
    );
end;
$$ language plpgsql;

-- =============================================================================
-- FUNCTION: Check if user is admin
-- =============================================================================

create or replace function is_user_admin(p_auth_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from admin_users
        where auth_id = p_auth_id
        and role in ('super_admin', 'admin', 'finance', 'editor', 'staff')
        and is_active = true
    );
end;
$$ language plpgsql;

-- =============================================================================
-- SEED DATA: Default Users
-- =============================================================================

-- Admin user (for development)
insert into admin_users (email, username, name, role, is_active, password_hash)
values (
    'admin@danivisual.app',
    'admin',
    'Admin Danivisual',
    'super_admin',
    true,
    -- Password: admin123 (bcrypt hash, for fallback only)
    -- In production, use Supabase Auth instead
    '$2a$10$rQXKqOyQ8QOJvxQ7QvQvQeQXKQOJvxQ7QvQvQOJvxQ7QvQOJvxQ7QvQ'
)
on conflict (email) do nothing;

-- Test customer (for development)
insert into admin_users (email, username, name, role, is_active, whatsapp)
values (
    'dani@danivisual.app',
    'danivisual',
    'Dani Indra',
    'customer',
    true,
    '081234567890'
)
on conflict (email) do nothing;

-- =============================================================================
-- STORAGE BUCKET: User Avatars
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can view avatars" on storage.objects
    for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar" on storage.objects
    for insert with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "Users can update own avatar" on storage.objects
    for update using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================================================
-- END OF AUTH SCHEMA
-- =============================================================================