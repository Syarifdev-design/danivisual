-- =============================================================================
-- BATCH 3: ADMIN USERS & ANALYTICS
-- =============================================================================
-- Created: 2024
-- Purpose: Schema untuk admin users, roles, dan analytics
-- =============================================================================

-- =============================================================================
-- 1. ADMIN_USERS
-- =============================================================================
-- User admin untuk dashboard

create table if not exists admin_users (
    id uuid primary key default uuid_generate_v4(),

    -- Auth-related (akan di-link dengan Supabase Auth)
    auth_id uuid references auth.users(id) on delete set null,

    -- Username untuk login (unique)
    username text not null unique,

    -- Password hash (untuk fallback, utama menggunakan Supabase Auth)
    password_hash text,

    -- Profile
    name text not null,
    email text,
    phone text,
    avatar_url text,

    -- Role (8 roles - including operational staff)
    role text not null default 'admin'
        check (role in ('super_admin', 'admin', 'finance', 'editor', 'staff', 'photographer', 'videographer', 'customer')),

    -- Status
    is_active boolean default true,

    -- Login tracking
    last_login timestamptz,
    login_count integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_admin_users_username on admin_users(username);
create index idx_admin_users_auth_id on admin_users(auth_id);
create index idx_admin_users_role on admin_users(role);
create index idx_admin_users_is_active on admin_users(is_active);

-- =============================================================================
-- 2. ADMIN_ACTIVITY_LOG
-- =============================================================================
-- Log aktivitas admin untuk audit trail

create table if not exists admin_activity_log (
    id uuid primary key default uuid_generate_v4(),

    -- User yang melakukan aksi
    user_id uuid references admin_users(id) on delete set null,
    username text not null,

    -- Aksi
    action text not null,
    entity_type text,
    entity_id text,

    -- Detail
    description text,
    old_data jsonb,
    new_data jsonb,

    -- IP dan user agent
    ip_address inet,
    user_agent text,

    -- Timestamps
    created_at timestamptz default now()
);

create index idx_admin_activity_log_user_id on admin_activity_log(user_id);
create index idx_admin_activity_log_action on admin_activity_log(action);
create index idx_admin_activity_log_entity on admin_activity_log(entity_type, entity_id);
create index idx_admin_activity_log_created_at on admin_activity_log(created_at);

-- =============================================================================
-- 3. ANALYTICS_DAILY
-- =============================================================================
-- Daily analytics data

create table if not exists analytics_daily (
    id uuid primary key default uuid_generate_v4(),

    -- Tanggal
    date date not null unique,

    -- Website views
    page_views integer default 0,
    unique_visitors integer default 0,

    -- Bookings
    booking_inquiries integer default 0,
    booking_confirmed integer default 0,
    booking_completed integer default 0,
    booking_cancelled integer default 0,

    -- Revenue
    revenue_total numeric(12, 0) default 0,
    revenue_dp integer default 0,
    revenue_full integer default 0,

    -- Popular packages
    popular_packages jsonb default '[]'::jsonb,

    -- Traffic sources
    traffic_sources jsonb default '{}'::jsonb,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_analytics_daily_date on analytics_daily(date);
create index idx_analytics_daily_revenue on analytics_daily(revenue_total);

-- =============================================================================
-- 4. ANALYTICS_PAGE_VIEWS
-- =============================================================================
-- Individual page view records

create table if not exists analytics_page_views (
    id uuid primary key default uuid_generate_v4(),

    -- Page info
    page_path text not null,
    page_title text,

    -- Visitor info
    visitor_id text, -- Cookie-based or anonymous ID
    session_id text,
    is_authenticated boolean default false,

    -- Source
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,

    -- Device
    device_type text,
    browser text,
    os text,

    -- Location (optional, from IP)
    country text,
    city text,

    -- Duration (if available)
    time_on_page integer, -- seconds

    -- Timestamps
    viewed_at timestamptz default now()
);

create index idx_analytics_page_views_page on analytics_page_views(page_path);
create index idx_analytics_page_views_visitor on analytics_page_views(visitor_id);
create index idx_analytics_page_views_viewed_at on analytics_page_views(viewed_at);

-- =============================================================================
-- 5. ANALYTICS_EVENTS
-- =============================================================================
-- Custom events (booking_started, package_selected, etc.)

create table if not exists analytics_events (
    id uuid primary key default uuid_generate_v4(),

    -- Event
    event_name text not null,
    event_category text,

    -- Properties
    properties jsonb default '{}'::jsonb,

    -- Visitor
    visitor_id text,
    session_id text,

    -- Source
    utm_source text,
    utm_medium text,
    utm_campaign text,

    -- Value (e.g., booking amount)
    event_value numeric,

    -- Timestamps
    created_at timestamptz default now()
);

create index idx_analytics_events_name on analytics_events(event_name);
create index idx_analytics_events_category on analytics_events(event_category);
create index idx_analytics_events_visitor on analytics_events(visitor_id);
create index idx_analytics_events_created_at on analytics_events(created_at);

-- =============================================================================
-- 6. CONTENT_MENUS
-- =============================================================================
-- Menu/page structure untuk CMS

create table if not exists content_menus (
    id uuid primary key default uuid_generate_v4(),

    -- Menu ID (home, services, portfolio, etc.)
    menu_id text not null unique,

    -- Display info
    label text not null,
    description text,

    -- Status
    status text default 'published'
        check (status in ('draft', 'published')),

    -- SEO
    seo_title text,
    seo_description text,
    seo_keywords text,
    canonical_path text,
    og_image_url text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    published_at timestamptz
);

create index idx_content_menus_menu_id on content_menus(menu_id);
create index idx_content_menus_status on content_menus(status);

-- =============================================================================
-- 7. MEDIA_FILES
-- =============================================================================
-- File/media management

create table if not exists media_files (
    id uuid primary key default uuid_generate_v4(),

    -- File info
    filename text not null,
    original_filename text,

    -- Storage
    storage_path text,
    storage_bucket text,

    -- URL (Supabase Storage or external)
    url text not null,

    -- Type
    file_type text not null
        check (file_type in ('image', 'video', 'document', 'other')),

    -- Metadata
    mime_type text,
    file_size bigint,
    width integer,
    height integer,
    duration integer, -- for video/audio in seconds

    -- Context
    album_id uuid references portfolios(id) on delete set null,
    usage_type text, -- 'content', 'portfolio', 'banner', etc.

    -- Uploader
    uploaded_by uuid references admin_users(id) on delete set null,
    uploader_name text,

    -- Alt text for images
    alt_text text,
    caption text,

    -- Status
    is_public boolean default true,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_media_files_album_id on media_files(album_id);
create index idx_media_files_file_type on media_files(file_type);
create index idx_media_files_usage_type on media_files(usage_type);
create index idx_media_files_uploaded_by on media_files(uploaded_by);
create index idx_media_files_created_at on media_files(created_at);

-- =============================================================================
-- 8. CALENDAR_EVENTS
-- =============================================================================
-- Calendar events (blocked dates, bookings, etc.)

create table if not exists calendar_events (
    id uuid primary key default uuid_generate_v4(),

    -- Date info
    event_date date not null,
    end_date date,

    -- Event details
    title text not null,
    description text,

    -- Type
    event_type text not null
        check (event_type in ('booking', 'blocked', 'event', 'holiday', 'deadline')),

    -- Related booking
    booking_id uuid references bookings(id) on delete set null,
    booking_order_number text,

    -- Color for calendar display
    color text default '#3B82F6',

    -- Creator
    created_by uuid references admin_users(id) on delete set null,
    created_by_name text,

    -- Is all day
    is_all_day boolean default true,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_calendar_events_date on calendar_events(event_date);
create index idx_calendar_events_type on calendar_events(event_type);
create index idx_calendar_events_booking_id on calendar_events(booking_id);

-- =============================================================================
-- TRIGGER: Auto-update updated_at
-- =============================================================================

create trigger update_admin_users_updated_at
    before update on admin_users
    for each row execute function update_updated_at_column();

create trigger update_analytics_daily_updated_at
    before update on analytics_daily
    for each row execute function update_updated_at_column();

create trigger update_media_files_updated_at
    before update on media_files
    for each row execute function update_updated_at_column();

create trigger update_calendar_events_updated_at
    before update on calendar_events
    for each row execute function update_updated_at_column();

create trigger update_content_menus_updated_at
    before update on content_menus
    for each row execute function update_updated_at_column();

-- =============================================================================
-- SEED: Default Admin Users (8 roles)
-- =============================================================================

-- Super Admin
insert into admin_users (username, name, role, is_active, password_hash) values
    ('superadmin', 'Super Admin Utama', 'super_admin', true, 'admin')
on conflict (username) do nothing;

-- Admin
insert into admin_users (username, name, role, is_active, password_hash) values
    ('admin', 'Admin Utama', 'admin', true, 'admin')
on conflict (username) do nothing;

-- Finance
insert into admin_users (username, name, role, is_active, password_hash) values
    ('finance', 'Finance Danivisual', 'finance', true, 'admin')
on conflict (username) do nothing;

-- Editor
insert into admin_users (username, name, role, is_active, password_hash) values
    ('editor', 'Editor Danivisual', 'editor', true, 'admin')
on conflict (username) do nothing;

-- Staff
insert into admin_users (username, name, role, is_active, password_hash) values
    ('staff', 'Staff Danivisual', 'staff', true, 'admin')
on conflict (username) do nothing;

-- Photographer
insert into admin_users (username, name, role, is_active, password_hash) values
    ('photographer', 'Photographer Danivisual', 'photographer', true, 'admin')
on conflict (username) do nothing;

-- Videographer
insert into admin_users (username, name, role, is_active, password_hash) values
    ('videographer', 'Videographer Danivisual', 'videographer', true, 'admin')
on conflict (username) do nothing;
