-- =============================================================================
-- BATCH 2: BOOKINGS, CUSTOMERS & PAYMENTS
-- =============================================================================
-- Created: 2024
-- Purpose: Schema untuk booking system, customer management, dan payment tracking
--
-- Depends on: batch 1 (package_categories, packages)
-- =============================================================================

-- =============================================================================
-- 1. CUSTOMERS
-- =============================================================================
-- Data pelanggan/client

create table if not exists customers (
    id uuid primary key default uuid_generate_v4(),

    -- Data pribadi
    name text not null,
    email text,
    phone text not null,
    address text,

    -- Social media
    instagram text,

    -- Catatan internal
    notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_customers_phone on customers(phone);
create index idx_customers_email on customers(email);
create index idx_customers_name on customers(name);

-- =============================================================================
-- 2. BOOKINGS
-- =============================================================================
-- Booking/reservasi dari cliente

create table if not exists bookings (
    id uuid primary key default uuid_generate_v4(),

    -- Order number unik (DV-010124-001)
    order_number text not null unique,

    -- Foreign key ke customer
    customer_id uuid not null references customers(id),

    -- Data customer (denormalized untuk query cepat)
    customer_name text not null,
    customer_email text,
    customer_phone text not null,

    -- Package yang dipilih
    package_id text not null,
    package_name text not null,
    package_price numeric(12, 0) not null default 0,

    -- Service type (Photo, Video, Photo + Video)
    service_type text,

    -- Add-ons yang dipilih
    addon_ids text[], -- Array of addon IDs
    addon_total numeric(12, 0) default 0,

    -- Event details
    event_date date,
    event_time text,
    event_location text,
    event_type text,

    -- Financials
    total_amount numeric(12, 0) not null default 0,
    dp_amount numeric(12, 0) default 500000, -- Default DP Rp 500.000
    paid_amount numeric(12, 0) default 0,
    remaining_amount numeric(12, 0) default 0,

    -- Delivery
    delivery_method text check (delivery_method in ('expedition', 'cod-agent', 'pickup-office')),
    packing_fee numeric(12, 0) default 0,

    -- Status booking
    status text not null default 'pending'
        check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_bookings_order_number on bookings(order_number);
create index idx_bookings_customer_id on bookings(customer_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_event_date on bookings(event_date);
create index idx_bookings_package_id on bookings(package_id);
create index idx_bookings_created_at on bookings(created_at);

-- =============================================================================
-- 3. PAYMENTS
-- =============================================================================
-- History pembayaran untuk setiap booking

create table if not exists payments (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke booking
    booking_id uuid references bookings(id) on delete set null,

    -- Order number (denormalized)
    booking_order_number text not null,

    -- Customer name
    customer_name text,

    -- Amount
    amount numeric(12, 0) not null,

    -- Payment method
    method text not null default 'transfer'
        check (method in ('transfer', 'cash', 'other')),

    -- Payment type
    payment_type text not null default 'dp'
        check (payment_type in ('dp', 'final_payment')),

    -- Status
    status text not null default 'pending'
        check (status in ('pending', 'verified', 'rejected')),

    -- Bukti pembayaran
    proof_image_url text,

    -- Verification
    verified_by text,
    verified_at timestamptz,

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_payments_booking_id on payments(booking_id);
create index idx_payments_booking_order_number on payments(booking_order_number);
create index idx_payments_status on payments(status);
create index idx_payments_created_at on payments(created_at);

-- =============================================================================
-- 4. BOOKING_DELIVERY_INFO
-- =============================================================================
-- Detail lengkap untuk delivery/pengiriman hasil

create table if not exists booking_delivery_info (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke booking
    booking_id uuid not null references bookings(id) on delete cascade,

    -- Recipient info
    recipient_name text,
    recipient_phone text,
    recipient_address text,

    -- Expedition details
    expedition_name text,
    expedition_tracking_number text,
    estimated_delivery_date date,

    -- COD details
    cod_agent text,
    cod_amount numeric(12, 0),

    -- Pickup details
    pickup_office_address text,
    pickup_deadline date,

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_booking_delivery_booking_id on booking_delivery_info(booking_id);

-- =============================================================================
-- 5. BOOKING_EVENT_DETAILS
-- =============================================================================
-- Detail lengkap event untuk reference

create table if not exists booking_event_details (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke booking
    booking_id uuid not null references bookings(id) on delete cascade,

    -- Couple info
    couple_name text,
    decoration_plan text,

    -- Address
    full_address text,
    google_maps_link text,

    -- Contact
    active_whatsapp text,
    instagram_username text,

    -- MUA
    mua_plan text,
    mua_contact text,

    -- Timeline
    event_time_pending boolean default false,
    event_time_confirmed_at timestamptz,

    -- Admin notes
    admin_notes text,

    -- Timestamps
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_booking_event_details_booking_id on booking_event_details(booking_id);

-- =============================================================================
-- 6. BOOKING_STATUS_HISTORY
-- =============================================================================
-- History perubahan status booking

create table if not exists booking_status_history (
    id uuid primary key default uuid_generate_v4(),

    -- Foreign key ke booking
    booking_id uuid not null references bookings(id) on delete cascade,

    -- Status lama dan baru
    old_status text,
    new_status text not null,

    -- Siapa yang mengubah
    changed_by text,

    -- Alasan perubahan
    reason text,

    -- Timestamps
    created_at timestamptz default now()
);

create index idx_booking_status_history_booking_id on booking_status_history(booking_id);
create index idx_booking_status_history_created_at on booking_status_history(created_at);

-- =============================================================================
-- TRIGGER: Auto-update updated_at
-- =============================================================================

create trigger update_customers_updated_at
    before update on customers
    for each row execute function update_updated_at_column();

create trigger update_bookings_updated_at
    before update on bookings
    for each row execute function update_updated_at_column();

create trigger update_payments_updated_at
    before update on payments
    for each row execute function update_updated_at_column();

create trigger update_booking_delivery_info_updated_at
    before update on booking_delivery_info
    for each row execute function update_updated_at_column();

create trigger update_booking_event_details_updated_at
    before update on booking_event_details
    for each row execute function update_updated_at_column();

-- =============================================================================
-- FUNCTION: Auto-generate order number
-- =============================================================================

create or replace function generate_order_number()
returns text as $$
declare
    date_part text;
    random_part text;
    new_order_number text;
    seq int;
begin
    -- Format: DV-DDMMYY-XXX
    date_part := to_char(now(), 'DDMMYY');

    -- Get next sequence for today
    select coalesce(max(
        cast(substring(order_number from 'DV-[0-9]+-[0-9]+') as int)
    ), 0) + 1
    into seq
    from bookings
    where order_number like 'DV-' || date_part || '-%';

    random_part := lpad(seq::text, 3, '0');
    new_order_number := 'DV-' || date_part || '-' || random_part;

    return new_order_number;
end;
$$ language plpgsql;

-- =============================================================================
-- FUNCTION: Add booking payment (update booking paid_amount)
-- =============================================================================

create or replace function add_booking_payment(
    p_order_number text,
    p_amount numeric
)
returns void as $$
begin
    update bookings
    set
        paid_amount = paid_amount + p_amount,
        remaining_amount = total_amount - (paid_amount + p_amount),
        updated_at = now()
    where order_number = p_order_number;
end;
$$ language plpgsql;

-- =============================================================================
-- FUNCTION: Update booking status
-- =============================================================================

create or replace function update_booking_status(
    p_order_number text,
    p_status text,
    p_changed_by text default null
)
returns void as $$
begin
    -- Update status
    update bookings
    set
        status = p_status,
        updated_at = now()
    where order_number = p_order_number;

    -- Insert history
    insert into booking_status_history (booking_id, old_status, new_status, changed_by)
    select id, status, p_status, p_changed_by
    from bookings
    where order_number = p_order_number;
end;
$$ language plpgsql;
