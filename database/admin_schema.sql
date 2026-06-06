-- =============================================================================
-- DaniVisual Admin Panel Database Schema
-- Extended tables for admin management features
-- =============================================================================

USE danivisual_db;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- ADMINS TABLE
-- Multi-admin system with role-based access control
-- =============================================================================

CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role ENUM('super_admin', 'admin', 'editor', 'viewer') NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admins_username (username),
  INDEX idx_admins_role (role),
  INDEX idx_admins_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CUSTOMERS TABLE
-- Customer/Client management
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name),
  INDEX idx_customers_email (email),
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- BOOKINGS TABLE (Enhanced)
-- Core booking management with order tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id VARCHAR(36) NOT NULL,
  package_id VARCHAR(36) NULL,
  package_name VARCHAR(200) NOT NULL,
  service_type VARCHAR(100) NOT NULL DEFAULT 'Photo',
  event_date DATE NOT NULL,
  event_location VARCHAR(500) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  addon_ids JSON NULL,
  addon_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  dp_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_bookings_order (order_number),
  INDEX idx_bookings_customer (customer_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_date (event_date),
  INDEX idx_bookings_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PAYMENTS TABLE
-- Payment tracking and verification
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('transfer', 'cash', 'other') NOT NULL DEFAULT 'transfer',
  proof_image VARCHAR(500) NULL,
  status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  verified_by VARCHAR(36) NULL,
  verified_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_admin FOREIGN KEY (verified_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PACKAGE CATEGORIES TABLE
-- Service/package categories
-- =============================================================================

CREATE TABLE IF NOT EXISTS package_categories (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  eyebrow VARCHAR(200) NULL,
  note TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_active (is_active),
  INDEX idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PACKAGES TABLE
-- Service packages with pricing
-- =============================================================================

CREATE TABLE IF NOT EXISTS packages (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_most_selected BOOLEAN NOT NULL DEFAULT FALSE,
  starting_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NOT NULL,
  description TEXT NULL,
  benefits JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_packages_category FOREIGN KEY (category_id) REFERENCES package_categories(id) ON DELETE CASCADE,
  INDEX idx_packages_category (category_id),
  INDEX idx_packages_active (is_active),
  INDEX idx_packages_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ADDONS TABLE
-- Additional services/add-ons
-- =============================================================================

CREATE TABLE IF NOT EXISTS addons (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL,
  display_price VARCHAR(100) NULL,
  unit VARCHAR(50) NULL,
  has_quantity BOOLEAN NOT NULL DEFAULT FALSE,
  category_ids JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_addons_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FAQ TABLE
-- FAQ management
-- =============================================================================

CREATE TABLE IF NOT EXISTS faqs (
  id VARCHAR(36) PRIMARY KEY,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_faqs_category (category),
  INDEX idx_faqs_published (is_published),
  INDEX idx_faqs_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PORTFOLIO ALBUMS TABLE
-- Album management
-- =============================================================================

CREATE TABLE IF NOT EXISTS albums (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  cover_image VARCHAR(500) NULL,
  date DATE NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_albums_category (category),
  INDEX idx_albums_published (is_published),
  INDEX idx_albums_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ALBUM IMAGES TABLE
-- Images within albums
-- =============================================================================

CREATE TABLE IF NOT EXISTS album_images (
  id VARCHAR(36) PRIMARY KEY,
  album_id VARCHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_album_images_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  INDEX idx_album_images_album (album_id),
  INDEX idx_album_images_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CALENDAR EVENTS TABLE
-- Calendar and scheduling
-- =============================================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  type ENUM('booking', 'blocked', 'event') NOT NULL DEFAULT 'event',
  booking_id VARCHAR(36) NULL,
  description TEXT NULL,
  created_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_calendar_events_admin FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_calendar_events_date (date),
  INDEX idx_calendar_events_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- MEDIA FILES TABLE
-- Media library management
-- =============================================================================

CREATE TABLE IF NOT EXISTS media_files (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type ENUM('image', 'video', 'document') NOT NULL DEFAULT 'image',
  size BIGINT NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) NULL,
  album_id VARCHAR(36) NULL,
  uploaded_by VARCHAR(36) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_files_admin FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_media_files_type (type),
  INDEX idx_media_files_album (album_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ANALYTICS TABLE
-- Page views and booking analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS page_views (
  id VARCHAR(36) PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  referrer VARCHAR(500) NULL,
  user_agent TEXT NULL,
  ip_hash VARCHAR(64) NULL,
  country VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_page_views_path (path),
  INDEX idx_page_views_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_analytics (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  views INT NOT NULL DEFAULT 0,
  bookings INT NOT NULL DEFAULT 0,
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_analytics_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ACTIVITY LOGS TABLE
-- Admin activity tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  admin_id VARCHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_activity_logs_admin (admin_id),
  INDEX idx_activity_logs_action (action),
  INDEX idx_activity_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CONTENT SETTINGS TABLE
-- Extended content management
-- =============================================================================

CREATE TABLE IF NOT EXISTS content_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value LONGTEXT NOT NULL,
  setting_type ENUM('text', 'json', 'html', 'image') NOT NULL DEFAULT 'text',
  updated_by VARCHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_content_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- Initial data for the system
-- =============================================================================

INSERT INTO admins (id, username, password_hash, name, role, is_active, created_at) VALUES
('admin-001', 'admin', '$2a$10$demopasswordhashplaceholder123456', 'Admin Utama', 'super_admin', TRUE, NOW());

INSERT INTO package_categories (id, slug, name, eyebrow, sort_order, is_active) VALUES
('cat-wedding', 'wedding', 'Wedding', 'Dokumentasi Pernikahan', 1, TRUE),
('cat-prewedding', 'prewedding-outdoor', 'Prewedding Outdoor', 'Sesi di Lokasi', 2, TRUE),
('cat-engagement', 'engagement', 'Engagement', 'Lamaran', 3, TRUE),
('cat-studio', 'photo-studio', 'Photo Studio', 'Studio', 4, TRUE);

INSERT INTO faqs (id, category, question, answer, sort_order, is_published) VALUES
('faq-001', 'Booking', 'Bagaimana cara booking?', 'Pilih paket di website kami, kemudian hubungi via WhatsApp untuk konfirmasi tanggal dan detail.', 1, TRUE),
('faq-002', 'Booking', 'Apakah bisa custom paket?', 'Bisa! Silakan diskusikan kebutuhan Anda via WhatsApp dan kami akan bantu menyusun paket yang sesuai.', 2, TRUE),
('faq-003', 'Pembayaran', 'Metode pembayaran apa saja?', 'Transfer bank lokal (BCA, Mandiri, BRI) dan cash. Untuk transfer, bukti pembayaran bisa dikirim via WhatsApp.', 3, TRUE),
('faq-004', 'Pembayaran', 'Kapan harus lunas?', 'Pelunasan maksimal 1 minggu sebelum hari H acara.', 4, TRUE),
('faq-005', 'Hasil', 'Kapan hasil diberikan?', 'Soft file 2-4 minggu setelah acara. Album cetak 4-8 minggu tergantung kompleksitas.', 5, TRUE);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- NOTES
-- =============================================================================
-- 1. Password hash in seed data is a placeholder - replace with proper bcrypt hash in production
-- 2. Foreign key constraints are enabled by default
-- 3. All tables use VARCHAR(36) for IDs to support UUID generation from both frontend and backend
-- 4. Soft delete pattern can be implemented by adding 'deleted_at' column to any table as needed
-- =============================================================================