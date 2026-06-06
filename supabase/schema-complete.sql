-- =============================================================================
-- DANIVISUAL SUPABASE SCHEMA - COMPLETE
-- =============================================================================
-- Version: 1.0.0
-- Last Updated: 2024
--
-- Contents:
--   1. Base tables (CMS, Reservasi)
--   2. Bookings, Customers, Payments
--   3. Admin Users, Analytics
--   4. RLS Policies
--   5. Seed Data
--
-- Usage:
--   Run this in Supabase SQL Editor or via migration
-- =============================================================================

-- =============================================================================
-- ENABLE UUID EXTENSION
-- =============================================================================
create extension if not exists "uuid-ossp";

-- =============================================================================
-- HELPER FUNCTION: Auto-update updated_at
-- =============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- =============================================================================
-- 1. CMS TABLES
-- =============================================================================

-- Content Fields
create table if not exists content_fields (
    id uuid primary key default uuid_generate_v4(),
    menu_id text not null,
    section_id text not null,
    field_id text not null,
    value text default '',
    field_type text,
    label text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (menu_id, section_id, field_id)
);
create index idx_content_fields_menu_id on content_fields(menu_id);
create index idx_content_fields_field_id on content_fields(field_id);

-- Content Images
create table if not exists content_images (
    id uuid primary key default uuid_generate_v4(),
    field_id text not null unique,
    url text not null,
    menu_id text,
    mime_type text,
    file_size bigint,
    alt_text text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_content_images_field_id on content_images(field_id);
create index idx_content_images_menu_id on content_images(menu_id);

-- Content Menus
create table if not exists content_menus (
    id uuid primary key default uuid_generate_v4(),
    menu_id text not null unique,
    label text not null,
    description text,
    status text default 'published' check (status in ('draft', 'published')),
    seo_title text,
    seo_description text,
    seo_keywords text,
    canonical_path text,
    og_image_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    published_at timestamptz
);
create index idx_content_menus_menu_id on content_menus(menu_id);
create index idx_content_menus_status on content_menus(status);

-- =============================================================================
-- 2. FAQS
-- =============================================================================

create table if not exists faqs (
    id uuid primary key default uuid_generate_v4(),
    category text not null,
    question text not null,
    answer text not null,
    sort_order integer default 0,
    is_published boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_faqs_category on faqs(category);
create index idx_faqs_sort_order on faqs(sort_order);
create index idx_faqs_is_published on faqs(is_published);

-- =============================================================================
-- 3. SERVICES
-- =============================================================================

create table if not exists services (
    id uuid primary key default uuid_generate_v4(),
    service_id text not null unique,
    name text not null,
    eyebrow text,
    description text,
    narrative text,
    duration text,
    highlight text,
    access text,
    header_image_url text,
    image_1_url text,
    image_2_url text,
    image_3_url text,
    is_active boolean default true,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_services_service_id on services(service_id);
create index idx_services_is_active on services(is_active);
create index idx_services_sort_order on services(sort_order);

create table if not exists service_includes (
    id uuid primary key default uuid_generate_v4(),
    service_id uuid not null references services(id) on delete cascade,
    include_text text not null,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_service_includes_service_id on service_includes(service_id);

-- =============================================================================
-- 4. PORTFOLIOS
-- =============================================================================

create table if not exists portfolios (
    id uuid primary key default uuid_generate_v4(),
    slug text not null unique,
    name text not null,
    couple_name text,
    category text not null,
    cover_image_url text,
    story text,
    location text,
    event_date date,
    date date not null,
    is_featured boolean default false,
    is_published boolean default true,
    sort_order integer default 0,
    meta_title text,
    meta_description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_portfolios_slug on portfolios(slug);
create index idx_portfolios_category on portfolios(category);
create index idx_portfolios_is_featured on portfolios(is_featured);
create index idx_portfolios_is_published on portfolios(is_published);
create index idx_portfolios_sort_order on portfolios(sort_order);

create table if not exists portfolio_images (
    id uuid primary key default uuid_generate_v4(),
    portfolio_id uuid not null references portfolios(id) on delete cascade,
    url text not null,
    caption text,
    sort_order integer default 0,
    image_type text default 'gallery',
    is_primary boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_portfolio_images_portfolio_id on portfolio_images(portfolio_id);
create index idx_portfolio_images_sort_order on portfolio_images(sort_order);
create index idx_portfolio_images_is_primary on portfolio_images(is_primary);

-- =============================================================================
-- 5. PACKAGE CATEGORIES
-- =============================================================================

create table if not exists package_categories (
    id uuid primary key default uuid_generate_v4(),
    category_id text not null unique,
    name text not null,
    eyebrow text,
    note text,
    is_active boolean default true,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_package_categories_category_id on package_categories(category_id);
create index idx_package_categories_is_active on package_categories(is_active);
create index idx_package_categories_sort_order on package_categories(sort_order);

-- =============================================================================
-- 6. PACKAGES
-- =============================================================================

create table if not exists packages (
    id uuid primary key default uuid_generate_v4(),
    category_id uuid not null references package_categories(id) on delete restrict,
    package_id text not null,
    name text not null,
    service_type text check (service_type in ('Photo', 'Video', 'Photo + Video')),
    is_most_selected boolean default false,
    starting_price numeric(12, 0) default 0,
    price numeric(12, 0) not null,
    description text,
    is_active boolean default true,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (category_id, package_id)
);
create index idx_packages_category_id on packages(category_id);
create index idx_packages_package_id on packages(package_id);
create index idx_packages_is_most_selected on packages(is_most_selected);
create index idx_packages_is_active on packages(is_active);
create index idx_packages_price on packages(price);

create table if not exists package_service_types (
    id uuid primary key default uuid_generate_v4(),
    package_id uuid not null references packages(id) on delete cascade,
    service_type_id text not null,
    name text not null check (name in ('Photo', 'Video', 'Photo + Video')),
    price numeric(12, 0) not null,
    sample_images text[],
    sample_video_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (package_id, service_type_id)
);
create index idx_package_service_types_package_id on package_service_types(package_id);

create table if not exists package_benefits (
    id uuid primary key default uuid_generate_v4(),
    package_id uuid not null references packages(id) on delete cascade,
    service_type_id uuid references package_service_types(id) on delete set null,
    benefit_text text not null,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_package_benefits_package_id on package_benefits(package_id);

-- =============================================================================
-- 7. ADDONS
-- =============================================================================

create table if not exists addons (
    id uuid primary key default uuid_generate_v4(),
    addon_id text not null unique,
    name text not null,
    description text,
    price numeric(12, 0) not null,
    display_price text,
    unit text,
    has_quantity boolean default false,
    is_active boolean default true,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_addons_addon_id on addons(addon_id);
create index idx_addons_is_active on addons(is_active);
create index idx_addons_sort_order on addons(sort_order);

create table if not exists addon_categories (
    id uuid primary key default uuid_generate_v4(),
    addon_id uuid not null references addons(id) on delete cascade,
    category_id uuid not null references package_categories(id) on delete cascade,
    created_at timestamptz default now(),
    unique (addon_id, category_id)
);
create index idx_addon_categories_addon_id on addon_categories(addon_id);
create index idx_addon_categories_category_id on addon_categories(category_id);

-- =============================================================================
-- 8. CUSTOMERS
-- =============================================================================

create table if not exists customers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text,
    phone text not null,
    address text,
    instagram text,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_customers_phone on customers(phone);
create index idx_customers_email on customers(email);

-- =============================================================================
-- 9. BOOKINGS
-- =============================================================================

create table if not exists bookings (
    id uuid primary key default uuid_generate_v4(),
    order_number text not null unique,
    customer_id uuid not null references customers(id),
    customer_name text not null,
    customer_email text,
    customer_phone text not null,
    package_id text not null,
    package_name text not null,
    package_price numeric(12, 0) not null default 0,
    service_type text,
    addon_ids text[],
    addon_total numeric(12, 0) default 0,
    event_date date,
    event_time text,
    event_location text,
    event_type text,
    total_amount numeric(12, 0) not null default 0,
    dp_amount numeric(12, 0) default 500000,
    paid_amount numeric(12, 0) default 0,
    remaining_amount numeric(12, 0) default 0,
    delivery_method text check (delivery_method in ('expedition', 'cod-agent', 'pickup-office')),
    packing_fee numeric(12, 0) default 0,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_bookings_order_number on bookings(order_number);
create index idx_bookings_customer_id on bookings(customer_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_event_date on bookings(event_date);
create index idx_bookings_created_at on bookings(created_at);

create table if not exists booking_event_details (
    id uuid primary key default uuid_generate_v4(),
    booking_id uuid not null references bookings(id) on delete cascade,
    couple_name text,
    decoration_plan text,
    full_address text,
    google_maps_link text,
    active_whatsapp text,
    instagram_username text,
    mua_plan text,
    event_time_pending boolean default false,
    admin_notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_booking_event_details_booking_id on booking_event_details(booking_id);

-- =============================================================================
-- 10. PAYMENTS
-- =============================================================================

create table if not exists payments (
    id uuid primary key default uuid_generate_v4(),
    booking_id uuid references bookings(id) on delete set null,
    booking_order_number text not null,
    customer_name text,
    amount numeric(12, 0) not null,
    method text not null default 'transfer' check (method in ('transfer', 'cash', 'other')),
    payment_type text not null default 'dp' check (payment_type in ('dp', 'final_payment')),
    status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
    proof_image_url text,
    verified_by text,
    verified_at timestamptz,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_payments_booking_id on payments(booking_id);
create index idx_payments_booking_order_number on payments(booking_order_number);
create index idx_payments_status on payments(status);
create index idx_payments_created_at on payments(created_at);

-- =============================================================================
-- 11. ADMIN USERS
-- =============================================================================

create table if not exists admin_users (
    id uuid primary key default uuid_generate_v4(),
    auth_id uuid references auth.users(id) on delete set null,
    username text not null unique,
    password_hash text,
    name text not null,
    email text,
    phone text,
    avatar_url text,
    role text not null default 'admin' check (role in ('super_admin', 'admin', 'finance', 'editor', 'staff', 'customer')),
    is_active boolean default true,
    last_login timestamptz,
    login_count integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_admin_users_username on admin_users(username);
create index idx_admin_users_auth_id on admin_users(auth_id);
create index idx_admin_users_role on admin_users(role);

-- =============================================================================
-- 12. MEDIA FILES
-- =============================================================================

create table if not exists media_files (
    id uuid primary key default uuid_generate_v4(),
    filename text not null,
    original_filename text,
    storage_path text,
    storage_bucket text,
    url text not null,
    file_type text not null check (file_type in ('image', 'video', 'document', 'other')),
    mime_type text,
    file_size bigint,
    width integer,
    height integer,
    duration integer,
    album_id uuid references portfolios(id) on delete set null,
    usage_type text,
    uploaded_by uuid references admin_users(id) on delete set null,
    uploader_name text,
    alt_text text,
    caption text,
    is_public boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_media_files_album_id on media_files(album_id);
create index idx_media_files_file_type on media_files(file_type);
create index idx_media_files_usage_type on media_files(usage_type);

-- =============================================================================
-- 13. CALENDAR EVENTS
-- =============================================================================

create table if not exists calendar_events (
    id uuid primary key default uuid_generate_v4(),
    event_date date not null,
    end_date date,
    title text not null,
    description text,
    event_type text not null check (event_type in ('booking', 'blocked', 'event', 'holiday', 'deadline')),
    booking_id uuid references bookings(id) on delete set null,
    booking_order_number text,
    color text default '#3B82F6',
    created_by uuid references admin_users(id) on delete set null,
    created_by_name text,
    is_all_day boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_calendar_events_date on calendar_events(event_date);
create index idx_calendar_events_type on calendar_events(event_type);
create index idx_calendar_events_booking_id on calendar_events(booking_id);

-- =============================================================================
-- 14. ANALYTICS
-- =============================================================================

create table if not exists analytics_daily (
    id uuid primary key default uuid_generate_v4(),
    date date not null unique,
    page_views integer default 0,
    unique_visitors integer default 0,
    booking_inquiries integer default 0,
    booking_confirmed integer default 0,
    revenue_total numeric(12, 0) default 0,
    popular_packages jsonb default '[]'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_analytics_daily_date on analytics_daily(date);

create table if not exists analytics_events (
    id uuid primary key default uuid_generate_v4(),
    event_name text not null,
    event_category text,
    properties jsonb default '{}'::jsonb,
    visitor_id text,
    session_id text,
    event_value numeric,
    created_at timestamptz default now()
);
create index idx_analytics_events_name on analytics_events(event_name);
create index idx_analytics_events_created_at on analytics_events(created_at);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at
-- =============================================================================

create trigger tr_content_fields_updated_at before update on content_fields for each row execute function update_updated_at_column();
create trigger tr_content_images_updated_at before update on content_images for each row execute function update_updated_at_column();
create trigger tr_content_menus_updated_at before update on content_menus for each row execute function update_updated_at_column();
create trigger tr_faqs_updated_at before update on faqs for each row execute function update_updated_at_column();
create trigger tr_services_updated_at before update on services for each row execute function update_updated_at_column();
create trigger tr_service_includes_updated_at before update on service_includes for each row execute function update_updated_at_column();
create trigger tr_portfolios_updated_at before update on portfolios for each row execute function update_updated_at_column();
create trigger tr_portfolio_images_updated_at before update on portfolio_images for each row execute function update_updated_at_column();
create trigger tr_package_categories_updated_at before update on package_categories for each row execute function update_updated_at_column();
create trigger tr_packages_updated_at before update on packages for each row execute function update_updated_at_column();
create trigger tr_package_service_types_updated_at before update on package_service_types for each row execute function update_updated_at_column();
create trigger tr_package_benefits_updated_at before update on package_benefits for each row execute function update_updated_at_column();
create trigger tr_addons_updated_at before update on addons for each row execute function update_updated_at_column();
create trigger tr_customers_updated_at before update on customers for each row execute function update_updated_at_column();
create trigger tr_bookings_updated_at before update on bookings for each row execute function update_updated_at_column();
create trigger tr_booking_event_details_updated_at before update on booking_event_details for each row execute function update_updated_at_column();
create trigger tr_payments_updated_at before update on payments for each row execute function update_updated_at_column();
create trigger tr_admin_users_updated_at before update on admin_users for each row execute function update_updated_at_column();
create trigger tr_media_files_updated_at before update on media_files for each row execute function update_updated_at_column();
create trigger tr_calendar_events_updated_at before update on calendar_events for each row execute function update_updated_at_column();
create trigger tr_analytics_daily_updated_at before update on analytics_daily for each row execute function update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate order number
create or replace function generate_order_number()
returns text as $$
declare
    date_part text;
    seq int;
begin
    date_part := to_char(now(), 'DDMMYY');
    select coalesce(max(
        cast(substring(order_number from 'DV-[0-9]+-[0-9]+') as int)
    ), 0) + 1 into seq
    from bookings
    where order_number like 'DV-' || date_part || '-%';
    return 'DV-' || date_part || '-' || lpad(seq::text, 3, '0');
end;
$$ language plpgsql;

-- Add booking payment
create or replace function add_booking_payment(p_order_number text, p_amount numeric)
returns void as $$
begin
    update bookings set
        paid_amount = paid_amount + p_amount,
        remaining_amount = total_amount - (paid_amount + p_amount),
        updated_at = now()
    where order_number = p_order_number;
end;
$$ language plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
alter table content_fields enable row level security;
alter table content_images enable row level security;
alter table content_menus enable row level security;
alter table faqs enable row level security;
alter table services enable row level security;
alter table service_includes enable row level security;
alter table portfolios enable row level security;
alter table portfolio_images enable row level security;
alter table package_categories enable row level security;
alter table packages enable row level security;
alter table package_service_types enable row level security;
alter table package_benefits enable row level security;
alter table addons enable row level security;
alter table addon_categories enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table booking_event_details enable row level security;
alter table payments enable row level security;
alter table admin_users enable row level security;
alter table media_files enable row level security;
alter table calendar_events enable row level security;
alter table analytics_daily enable row level security;
alter table analytics_events enable row level security;

-- Public read for CMS content (allow anonymous reads)
create policy "Public can read published content" on content_menus for select using (status = 'published');
create policy "Public can read published FAQs" on faqs for select using (is_published = true);
create policy "Public can read active services" on services for select using (is_active = true);
create policy "Public can read published portfolios" on portfolios for select using (is_published = true);
create policy "Public can read active categories" on package_categories for select using (is_active = true);
create policy "Public can read active packages" on packages for select using (is_active = true);
create policy "Public can read active addons" on addons for select using (is_active = true);

-- Admin policies (authenticated users can modify)
create policy "Admins can manage content fields" on content_fields for all using (true);
create policy "Admins can manage content images" on content_images for all using (true);
create policy "Admins can manage content menus" on content_menus for all using (true);
create policy "Admins can manage FAQs" on faqs for all using (true);
create policy "Admins can manage services" on services for all using (true);
create policy "Admins can manage service includes" on service_includes for all using (true);
create policy "Admins can manage portfolios" on portfolios for all using (true);
create policy "Admins can manage portfolio images" on portfolio_images for all using (true);
create policy "Admins can manage categories" on package_categories for all using (true);
create policy "Admins can manage packages" on packages for all using (true);
create policy "Admins can manage service types" on package_service_types for all using (true);
create policy "Admins can manage benefits" on package_benefits for all using (true);
create policy "Admins can manage addons" on addons for all using (true);
create policy "Admins can manage addon categories" on addon_categories for all using (true);
create policy "Admins can manage customers" on customers for all using (true);
create policy "Admins can manage bookings" on bookings for all using (true);
create policy "Admins can manage booking details" on booking_event_details for all using (true);
create policy "Admins can manage payments" on payments for all using (true);
create policy "Admins can manage admin users" on admin_users for all using (true);
create policy "Admins can manage media files" on media_files for all using (true);
create policy "Admins can manage calendar events" on calendar_events for all using (true);
create policy "Admins can manage analytics" on analytics_daily for all using (true);
create policy "Admins can manage analytics events" on analytics_events for all using (true);

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Content images bucket
insert into storage.buckets (id, name, public) values ('content-images', 'content-images', true);
create policy "Public can access content images" on storage.objects for select using (bucket_id = 'content-images');
create policy "Admins can upload content images" on storage.objects for all using (bucket_id = 'content-images');

-- Portfolio media bucket
insert into storage.buckets (id, name, public) values ('portfolio-media', 'portfolio-media', true);
create policy "Public can access portfolio media" on storage.objects for select using (bucket_id = 'portfolio-media');
create policy "Admins can upload portfolio media" on storage.objects for all using (bucket_id = 'portfolio-media');

-- Payment proofs bucket
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false);
create policy "Admins can manage payment proofs" on storage.objects for all using (bucket_id = 'payment-proofs');

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Package Categories
insert into package_categories (category_id, name, eyebrow, note, is_active, sort_order) values
    ('wedding', 'Wedding', 'Dokumentasi Pernikahan', 'All time packages limited to max. 9 working hours', true, 1),
    ('ngunduh-mantu', 'Ngunduh Mantu', 'Adat Jawa', 'All time packages limited to max. 9 working hours', true, 2),
    ('prewedding-outdoor', 'Prewedding Outdoor', 'Sesi di Lokasi', 'All time packages limited to max. 4 working hours', true, 3),
    ('prewedding-studio', 'Prewedding Studio', 'Studio', 'All time packages limited to max. 1 working hour', true, 4),
    ('engagement', 'Engagement', 'Lamaran', 'All time packages limited to max. 6 working hours', true, 5),
    ('photo-studio', 'Photo Studio', 'Studio', null, true, 6)
on conflict (category_id) do nothing;

-- FAQs
insert into faqs (category, question, answer, sort_order, is_published) values
    ('Booking', 'Bagaimana cara booking?', 'Pilih paket di halaman kami, lalu hubungi via WhatsApp untuk konfirmasi.', 1, true),
    ('Booking', 'Apakah bisa custom paket?', 'Bisa, silakan diskusikan kebutuhan Anda via WhatsApp.', 2, true),
    ('Pembayaran', 'Metode pembayaran apa saja?', 'Transfer bank lokal dan cash.', 3, true),
    ('Pembayaran', 'Kapan harus lunas?', 'Pelunasan maksimal 1 minggu sebelum hari H.', 4, true),
    ('Pembayaran', 'Berapa DP yang harus dibayar?', 'DP minimum adalah Rp 500.000 untuk mengunci tanggal.', 5, true),
    ('Hasil', 'Kapan hasil diberikan?', 'Soft file 2-4 minggu setelah acara, album 4-8 minggu.', 6, true),
    ('Lainnya', 'Apakah bisa dapat raw file?', 'Bisa, dengan tambahan biaya.', 7, true)
on conflict do nothing;

-- Services
insert into services (service_id, name, eyebrow, description, narrative, duration, highlight, access, is_active, sort_order) values
    ('wedding', 'Wedding', 'Signature', 'Dokumentasi lengkap wedding dengan feel editorial', 'Paket lengkap dokumentasi wedding dari persiapan hingga resepsi.', 'Full Day Coverage', 'Cinematic Edit, 2nd Shooter', 'Digital Gallery + Printed Album', true, 1),
    ('prewedding', 'Prewedding', 'Editorial', 'Konsep prewedding indoor atau outdoor', 'Sesi pemotretan pra-wedding dengan konsep yang disesuaikan.', '4 Hours Session', 'Multiple Concepts, Stylist', 'Digital + Print Rights', true, 2),
    ('event', 'Event', 'Coverage', 'Dokumentasi event dan celebration', 'Layanan dokumentasi untuk berbagai jenis event.', 'Flexible Hours', 'Quick Delivery, Multi-angle', 'Digital Gallery', true, 3),
    ('studio', 'Studio', 'Portrait', 'Portrait, family, personal branding', 'Sesi pemotretan di studio dengan lighting profesional.', '2 Hours Session', 'Professional Lighting, Retouching', 'Digital + 10 Prints', true, 4),
    ('lainnya', 'Lainnya', 'Personal', 'Momen personal dan keluarga', 'Untuk momen-momen personal seperti anniversary.', 'Custom Session', 'Custom Concept, Flexible', 'Digital Only', true, 5)
on conflict (service_id) do nothing;

-- Addons
insert into addons (addon_id, name, description, price, display_price, unit, has_quantity, is_active, sort_order) values
    ('album-magnetic-100-4r', 'Album magnetic (100ft print 4R)', 'Album dengan 100 foto print ukuran 4R', 450000, '450k', null, false, true, 1),
    ('photobook-premium', 'Photobook (premium)', 'Photobook dengan finishing premium', 1000000, '1 jt', null, false, true, 2),
    ('extra-day', 'Extra day', 'Tambahan 1 hari shooting', 1200000, '1,2 jt', 'hari', true, true, 3),
    ('add-session-photo', 'Add session photo / jam', 'Tambah jam sesi foto untuk photo', 150000, '150k', 'jam', true, true, 4),
    ('add-session-video', 'Add session video / jam', 'Tambah jam sesi foto untuk video', 250000, '250k', 'jam', true, true, 5),
    ('print-12r-frame', 'Print 12R + frame', 'Cetak foto 12R dengan bingkai', 150000, '150k', null, false, true, 6),
    ('print-16r-frame', 'Print 16R + frame', 'Cetak foto 16R dengan bingkai', 250000, '250k', null, false, true, 7),
    ('drone-pilot', 'Drone + pilot', 'Tambahan drone dan pilot', 400000, '400k', null, false, true, 8),
    ('flashdisk', 'Flashdisk', 'Flashdisk untuk delivery', 100000, '100k', null, false, true, 9)
on conflict (addon_id) do nothing;

-- Admin user
insert into admin_users (username, name, role, is_active) values ('admin', 'Admin Utama', 'super_admin', true)
on conflict (username) do nothing;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
