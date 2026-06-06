-- =============================================================================
-- DANIVISUAL SUPABASE SCHEMA - BATCH 1: CMS & RESERVASI
-- =============================================================================
-- Created: 2024
-- Purpose: Database schema untuk konten website dan reservasi
--
-- Catatan:
-- - Batch pertama fokus CMS dan reservasi
-- - Batch berikutnya: bookings, customers, payments, analytics
-- =============================================================================

-- =============================================================================
-- ENABLE UUID EXTENSION
-- =============================================================================
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. CONTENT_FIELDS
-- =============================================================================
-- Menyimpan nilai field untuk setiap section di setiap menu CMS
--
-- Contoh:
-- - home:hero:home_hero_title = "DANIVISUAL WEDDING STORY"
-- - home:featured_stories:home_featured_eyebrow = "Featured Stories"
-- =============================================================================

create table if not exists content_fields (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke menu (nullable untuk fleksibilitas)
    menu_id text not null,

    -- Section dalam menu
    section_id text not null,

    -- Field ID unik
    field_id text not null,

    -- Nilai field
    value text default '',

    -- Tipe field untuk validasi
    field_type text check (field_type in ('text', 'textarea', 'url', 'image', 'video', 'gallery')),

    -- Label untuk display admin
    label text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    -- Constraints
    unique (menu_id, section_id, field_id)
);

-- Index untuk query cepat
create index idx_content_fields_menu_id on content_fields(menu_id);
create index idx_content_fields_section_id on content_fields(section_id);
create index idx_content_fields_field_id on content_fields(field_id);

-- =============================================================================
-- 2. CONTENT_IMAGES
-- =============================================================================
-- Menyimpan mapping field_id ke URL gambar
-- Mendukung base64 (localStorage fallback) dan Supabase Storage URL

create table if not exists content_images (
    id uuid primary key default uuid_generate_v4(),

    -- Field ID yang связано dengan image ini
    field_id text not null unique,

    -- URL gambar (base64 data URI atau Supabase Storage URL)
    url text not null,

    -- Menu ID untuk grouping (optional)
    menu_id text,

    -- Tipe file
    mime_type text,

    -- Ukuran file dalam bytes
    file_size bigint,

    -- Alt text untuk SEO
    alt_text text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_content_images_field_id on content_images(field_id);
create index idx_content_images_menu_id on content_images(menu_id);

-- =============================================================================
-- 3. FAQS
-- =============================================================================
-- Frequently Asked Questions dengan kategori dan ordering

create table if not exists faqs (
    id uuid primary key default uuid_generate_v4(),

    -- Kategori FAQ (Booking, Pembayaran, Hasil, dll)
    category text not null,

    -- Pertanyaan
    question text not null,

    -- Jawaban (support rich text / markdown)
    answer text not null,

    -- Urutan tampil
    sort_order integer default 0,

    -- Status publish
    is_published boolean default true,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_faqs_category on faqs(category);
create index idx_faqs_sort_order on faqs(sort_order);
create index idx_faqs_is_published on faqs(is_published);

-- =============================================================================
-- 4. SERVICES (Layanan Dokumentasi)
-- =============================================================================
-- Jenis layanan utama: Wedding, Prewedding, Event, Studio, Lainnya

create table if not exists services (
    id uuid primary key default uuid_generate_v4(),

    -- ID unik untuk referensi (wedding, prewedding, event, studio, lainnya)
    service_id text not null unique,

    -- Nama layanan
    name text not null,

    -- Label eyebrow (e.g., "Signature", "Editorial")
    eyebrow text,

    -- Deskripsi singkat
    description text,

    -- Narrative/paragraf penjelasan
    narrative text,

    -- Duration (e.g., "Full Day Coverage", "4 Hours Session")
    duration text,

    -- Highlight fitur
    highlight text,

    -- Access/benefit utama
    access text,

    -- Gambar header (URL)
    header_image_url text,

    -- Gambar gallery 1
    image_1_url text,

    -- Gambar gallery 2
    image_2_url text,

    -- Gambar gallery 3
    image_3_url text,

    -- Status aktif
    is_active boolean default true,

    -- Urutan tampil
    sort_order integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_services_service_id on services(service_id);
create index idx_services_is_active on services(is_active);
create index idx_services_sort_order on services(sort_order);

-- =============================================================================
-- 5. SERVICE_INCLUDES
-- =============================================================================
-- Item yang termasuk dalam setiap service

create table if not exists service_includes (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke service
    service_id uuid not null references services(id) on delete cascade,

    -- Teks include (e.g., "Full day documentation", "Cinematic photo editing")
    include_text text not null,

    -- Urutan tampil
    sort_order integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_service_includes_service_id on service_includes(service_id);

-- =============================================================================
-- 6. PORTFOLIOS (Albums)
-- =============================================================================
-- Portfolio/album yang ditampilkan di halaman portfolio

create table if not exists portfolios (
    id uuid primary key default uuid_generate_v4(),

    -- Slug untuk URL (e.g., "wedding-dian-rina")
    slug text not null unique,

    -- Nama album
    name text not null,

    -- Nama pasangan (e.g., "Dian & Rina")
    couple_name text,

    -- Kategori (Wedding, Prewedding, Event, Studio, Lainnya)
    category text not null,

    -- Cover image URL
    cover_image_url text,

    -- Deskripsi/story album
    story text,

    -- Lokasi event
    location text,

    -- Tanggal event
    event_date date,

    -- Tanggal upload
    date date not null,

    -- Tampilkan di featured
    is_featured boolean default false,

    -- Status publish
    is_published boolean default true,

    -- Urutan tampil
    sort_order integer default 0,

    -- Metadata SEO
    meta_title text,
    meta_description text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_portfolios_slug on portfolios(slug);
create index idx_portfolios_category on portfolios(category);
create index idx_portfolios_is_featured on portfolios(is_featured);
create index idx_portfolios_is_published on portfolios(is_published);
create index idx_portfolios_sort_order on portfolios(sort_order);
create index idx_portfolios_event_date on portfolios(event_date);

-- =============================================================================
-- 7. PORTFOLIO_IMAGES
-- =============================================================================
-- Gambar-gambar dalam setiap portfolio album

create table if not exists portfolio_images (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke portfolio
    portfolio_id uuid not null references portfolios(id) on delete cascade,

    -- URL gambar
    url text not null,

    -- Caption/alt text
    caption text,

    -- Urutan tampil dalam album
    sort_order integer default 0,

    -- Tipe: gallery, detail, behind_the_scenes
    image_type text default 'gallery',

    -- Apakah ini cover/primary image
    is_primary boolean default false,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_portfolio_images_portfolio_id on portfolio_images(portfolio_id);
create index idx_portfolio_images_sort_order on portfolio_images(sort_order);
create index idx_portfolio_images_is_primary on portfolio_images(is_primary);

-- =============================================================================
-- 8. PACKAGE_CATEGORIES
-- =============================================================================
-- Kategori paket (Wedding, Prewedding, Engagement, dll)

create table if not exists package_categories (
    id uuid primary key default uuid_generate_v4(),

    -- ID unik untuk referensi (wedding, prewedding-outdoor, engagement, dll)
    category_id text not null unique,

    -- Nama kategori
    name text not null,

    -- Eyebrow text
    eyebrow text,

    -- Catatan (e.g., "All time packages limited to 9 working hours")
    note text,

    -- Status aktif
    is_active boolean default true,

    -- Urutan tampil
    sort_order integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_package_categories_category_id on package_categories(category_id);
create index idx_package_categories_is_active on package_categories(is_active);
create index idx_package_categories_sort_order on package_categories(sort_order);

-- =============================================================================
-- 9. PACKAGES
-- =============================================================================
-- Paket dokumentasi (Basic, Premium, Exclusive)

create table if not exists packages (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke category
    category_id uuid not null references package_categories(id) on delete restrict,

    -- ID unik untuk referensi dalam category
    package_id text not null,

    -- Nama paket (e.g., "Wedding Basic", "Prewedding Premium")
    name text not null,

    -- Tipe layanan: Photo, Video, Photo + Video
    service_type text check (service_type in ('Photo', 'Video', 'Photo + Video')),

    -- Apakah ini paket yang paling sering dipilih
    is_most_selected boolean default false,

    -- Harga awal (untuk display range)
    starting_price numeric(12, 0) default 0,

    -- Harga paket
    price numeric(12, 0) not null,

    -- Deskripsi paket
    description text,

    -- Status aktif
    is_active boolean default true,

    -- Urutan tampil
    sort_order integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    -- Unique constraint
    unique (category_id, package_id)
);

create index idx_packages_category_id on packages(category_id);
create index idx_packages_package_id on packages(package_id);
create index idx_packages_is_most_selected on packages(is_most_selected);
create index idx_packages_is_active on packages(is_active);
create index idx_packages_sort_order on packages(sort_order);
create index idx_packages_price on packages(price);

-- =============================================================================
-- 10. PACKAGE_SERVICE_TYPES
-- =============================================================================
-- Tipe layanan dalam setiap paket (Photo, Video, Photo + Video)

create table if not exists package_service_types (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke package
    package_id uuid not null references packages(id) on delete cascade,

    -- ID unik untuk service type dalam paket
    service_type_id text not null,

    -- Nama service type
    name text not null check (name in ('Photo', 'Video', 'Photo + Video')),

    -- Harga service type ini
    price numeric(12, 0) not null,

    -- Sample images (array of URLs)
    sample_images text[],

    -- Sample video URL
    sample_video_url text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    unique (package_id, service_type_id)
);

create index idx_package_service_types_package_id on package_service_types(package_id);

-- =============================================================================
-- 11. PACKAGE_BENEFITS
-- =============================================================================
-- Benefit/manfaat yang included dalam paket

create table if not exists package_benefits (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke package
    package_id uuid not null references packages(id) on delete cascade,

    -- Foreign key ke service type (nullable - jika null, benefit berlaku untuk semua service type)
    service_type_id uuid references package_service_types(id) on delete set null,

    -- Teks benefit (e.g., "150+ photo edited", "Album magnetic (premium)")
    benefit_text text not null,

    -- Urutan tampil
    sort_order integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_package_benefits_package_id on package_benefits(package_id);
create index idx_package_benefits_service_type_id on package_benefits(service_type_id);

-- =============================================================================
-- 12. ADDONS
-- =============================================================================
-- Add-ons/extra yang bisa dipilih cliente

create table if not exists addons (
    id uuid primary key default uuid_generate_v4(),

    -- ID unik untuk referensi
    addon_id text not null unique,

    -- Nama addon
    name text not null,

    -- Deskripsi
    description text,

    -- Harga
    price numeric(12, 0) not null,

    -- Display price (e.g., "450k", "1 jt")
    display_price text,

    -- Unit (e.g., "pcs", "jam", "hari") - nullable jika tidak pakai unit
    unit text,

    -- Apakah quantity selector diperbolehkan
    has_quantity boolean default false,

    -- Status aktif
    is_active boolean default true,

    -- Urutan tampil
    sort_order integer default 0,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_addons_addon_id on addons(addon_id);
create index idx_addons_is_active on addons(is_active);
create index idx_addons_sort_order on addons(sort_order);

-- =============================================================================
-- 13. ADDON_CATEGORIES (Many-to-Many)
-- =============================================================================
-- Relasi many-to-many antara addons dan package_categories
-- Sebuah addon bisa visible untuk beberapa category

create table if not exists addon_categories (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke addon
    addon_id uuid not null references addons(id) on delete cascade,

    -- Foreign key ke category
    category_id uuid not null references package_categories(id) on delete cascade,

    -- Timestamps
    created_at timestamptz default now(),

    unique (addon_id, category_id)
);

create index idx_addon_categories_addon_id on addon_categories(addon_id);
create index idx_addon_categories_category_id on addon_categories(category_id);

-- =============================================================================
-- TRIGGER: Auto-update updated_at
-- =============================================================================

-- Function untuk auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Apply trigger ke semua tabel
create trigger update_content_fields_updated_at
    before update on content_fields
    for each row execute function update_updated_at_column();

create trigger update_content_images_updated_at
    before update on content_images
    for each row execute function update_updated_at_column();

create trigger update_faqs_updated_at
    before update on faqs
    for each row execute function update_updated_at_column();

create trigger update_services_updated_at
    before update on services
    for each row execute function update_updated_at_column();

create trigger update_service_includes_updated_at
    before update on service_includes
    for each row execute function update_updated_at_column();

create trigger update_portfolios_updated_at
    before update on portfolios
    for each row execute function update_updated_at_column();

create trigger update_portfolio_images_updated_at
    before update on portfolio_images
    for each row execute function update_updated_at_column();

create trigger update_package_categories_updated_at
    before update on package_categories
    for each row execute function update_updated_at_column();

create trigger update_packages_updated_at
    before update on packages
    for each row execute function update_updated_at_column();

create trigger update_package_service_types_updated_at
    before update on package_service_types
    for each row execute function update_updated_at_column();

create trigger update_package_benefits_updated_at
    before update on package_benefits
    for each row execute function update_updated_at_column();

create trigger update_addons_updated_at
    before update on addons
    for each row execute function update_updated_at_column();

-- =============================================================================
-- SEED DATA: Default Values
-- =============================================================================

-- Package Categories
insert into package_categories (category_id, name, eyebrow, note, is_active, sort_order) values
    ('wedding', 'Wedding', 'Dokumentasi Pernikahan', 'All time packages are limited to max. 9 working hours (Akad - Reception)', true, 1),
    ('ngunduh-mantu', 'Ngunduh Mantu', 'Adat Jawa', 'All time packages are limited to max. 9 working hours', true, 2),
    ('prewedding-outdoor', 'Prewedding Outdoor', 'Sesi di Lokasi', 'All time packages are limited to max. 4 working hours', true, 3),
    ('prewedding-studio', 'Prewedding Studio', 'Studio', 'All time packages are limited to max. 1 working hour', true, 4),
    ('engagement', 'Engagement', 'Lamaran', 'All time packages are limited to max. 6 working hours', true, 5),
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
    ('Hasil', 'Format hasil apa yang diterima?', 'JPG dan PNG untuk foto, MP4 untuk video.', 7, true),
    ('Lainnya', 'Apakah bisa dapat raw file?', 'Bisa, dengan tambahan biaya.', 8, true)
on conflict do nothing;

-- Services
insert into services (service_id, name, eyebrow, description, narrative, duration, highlight, access, is_active, sort_order) values
    ('wedding', 'Wedding', 'Signature', 'Dokumentasi lengkap wedding dengan feel editorial', 'Paket lengkap dokumentasi wedding dari persiapan hingga resepsi. Dengan pendekatan cinematic dan editorial, kami mengabadikan setiap momen dengan estetika yang tinggi dan kehangatan yang autentik.', 'Full Day Coverage', 'Cinematic Edit, 2nd Shooter', 'Digital Gallery + Printed Album', true, 1),
    ('prewedding', 'Prewedding', 'Editorial', 'Konsep prewedding indoor atau outdoor', 'Sesi pemotretan pra-wedding dengan konsep yang disesuaikan dengan keinginan Anda. Baik indoor di studio maupun outdoor dengan lokasi yang dipilih, kami memastikan hasilnya estetik dan bermakna.', '4 Hours Session', 'Multiple Concepts, Stylist', 'Digital + Print Rights', true, 2),
    ('event', 'Event', 'Coverage', 'Dokumentasi event dan celebration', 'Layanan dokumentasi untuk berbagai jenis event - dari celebration personal hingga corporate gathering. Dengan fleksibilitas dalam coverage, kami menangkap esensi setiap acara.', 'Flexible Hours', 'Quick Delivery, Multi-angle', 'Digital Gallery', true, 3),
    ('studio', 'Studio', 'Portrait', 'Portrait, family, personal branding', 'Sesi pemotretan di studio dengan lighting profesional untuk portrait, family, atau personal branding. Dengan peralatan studio yang lengkap, kami menghasilkan gambar berkualitas tinggi.', '2 Hours Session', 'Professional Lighting, Retouching', 'Digital + 10 Prints', true, 4),
    ('lainnya', 'Lainnya', 'Personal', 'Momen personal dan keluarga', 'Untuk momen-momen personal seperti anniversary, family gathering, atau sekadar capturing everyday life. Fleksibel dan customizable sesuai kebutuhan Anda.', 'Custom Session', 'Custom Concept, Flexible', 'Digital Only', true, 5)
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
    ('drone-pilot', 'Drone + pilot', 'Tambahan drone dan pilot untuk aerial shot', 400000, '400k', null, false, true, 8),
    ('flashdisk', 'Flashdisk', 'Flashdisk untuk交付', 100000, '100k', null, false, true, 9),
    ('file-mentah-video', 'File mentah video', 'Raw footage video', 250000, '250k', null, false, true, 10),
    ('mini-studio', 'Mini studio', 'Setup mini studio di lokasi', 550000, '550k', null, false, true, 11)
on conflict (addon_id) do nothing;

-- Link addons to categories (simplified - in real app would use addon_categories table)
-- This is just reference; actual linking should be done via addon_categories table