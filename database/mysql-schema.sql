-- =============================================================================
-- DANIVISUAL MYSQL SCHEMA
-- =============================================================================
-- Converted from PostgreSQL/Supabase schema
-- MySQL Version: 8.0+ (for JSON support)
--
-- MIGRATION NOTES:
-- - uuid_generate_v4() -> CHAR(36) with manual UUID generation
-- - timestamptz -> DATETIME
-- - auth.users -> users table (native auth)
-- - RLS policies -> PHP middleware
-- - Storage buckets -> file system / separate storage service
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. USERS TABLE (Replaces auth.users + admin_users)
-- =============================================================================
-- Native PHP authentication with password hashing

CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt password hash',
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `avatar_url` VARCHAR(500) DEFAULT NULL,
    `whatsapp` VARCHAR(20) DEFAULT NULL,
    `role` ENUM('super_admin', 'admin', 'finance', 'editor', 'photographer', 'videographer', 'staff', 'customer') NOT NULL DEFAULT 'customer',
    `position` VARCHAR(100) DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `last_login` DATETIME DEFAULT NULL,
    `login_count` INT UNSIGNED DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. CONTENT_FIELDS (CMS Key-Value Store)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `content_fields` (
    `id` CHAR(36) PRIMARY KEY,
    `menu_id` VARCHAR(100) NOT NULL COMMENT 'e.g., home, about, services',
    `section_id` VARCHAR(100) NOT NULL COMMENT 'e.g., hero, featured',
    `field_id` VARCHAR(100) NOT NULL COMMENT 'e.g., hero_title, hero_image',
    `value` TEXT DEFAULT '',
    `field_type` ENUM('text', 'textarea', 'url', 'image', 'video', 'gallery') DEFAULT 'text',
    `label` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_content_fields_menu_section_field` (`menu_id`, `section_id`, `field_id`),
    INDEX `idx_content_fields_menu_id` (`menu_id`),
    INDEX `idx_content_fields_section_id` (`section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. CONTENT_IMAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `content_images` (
    `id` CHAR(36) PRIMARY KEY,
    `field_id` VARCHAR(100) NOT NULL UNIQUE,
    `url` TEXT NOT NULL,
    `menu_id` VARCHAR(100) DEFAULT NULL,
    `mime_type` VARCHAR(100) DEFAULT NULL,
    `file_size` BIGINT UNSIGNED DEFAULT NULL,
    `alt_text` VARCHAR(500) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_content_images_field_id` (`field_id`),
    INDEX `idx_content_images_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. FAQS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `faqs` (
    `id` CHAR(36) PRIMARY KEY,
    `category` VARCHAR(100) NOT NULL COMMENT 'e.g., Booking, Pembayaran, Hasil',
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `is_published` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_faqs_category` (`category`),
    INDEX `idx_faqs_sort_order` (`sort_order`),
    INDEX `idx_faqs_published` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. SERVICES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `services` (
    `id` CHAR(36) PRIMARY KEY,
    `service_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g., wedding, prewedding, event',
    `name` VARCHAR(255) NOT NULL,
    `eyebrow` VARCHAR(100) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `narrative` TEXT DEFAULT NULL,
    `duration` VARCHAR(100) DEFAULT NULL,
    `highlight` TEXT DEFAULT NULL,
    `access` TEXT DEFAULT NULL,
    `header_image_url` TEXT DEFAULT NULL,
    `image_1_url` TEXT DEFAULT NULL,
    `image_2_url` TEXT DEFAULT NULL,
    `image_3_url` TEXT DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_services_service_id` (`service_id`),
    INDEX `idx_services_active` (`is_active`),
    INDEX `idx_services_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. SERVICE_INCLUDES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `service_includes` (
    `id` CHAR(36) PRIMARY KEY,
    `service_id` CHAR(36) NOT NULL,
    `include_text` TEXT NOT NULL,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
    INDEX `idx_service_includes_service_id` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. PORTFOLIOS (Albums)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `portfolios` (
    `id` CHAR(36) PRIMARY KEY,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `couple_name` VARCHAR(255) DEFAULT NULL,
    `category` VARCHAR(100) NOT NULL COMMENT 'wedding, prewed-studio, prewed-outdoor, event, studio, peristiwa-lainnya',
    `cover_image_url` TEXT DEFAULT NULL,
    `story` TEXT DEFAULT NULL,
    `location` VARCHAR(255) DEFAULT NULL,
    `event_date` DATE DEFAULT NULL,
    `date` DATE NOT NULL,
    `is_featured` TINYINT(1) DEFAULT 0,
    `is_published` TINYINT(1) DEFAULT 1,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `meta_title` VARCHAR(255) DEFAULT NULL,
    `meta_description` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_portfolios_slug` (`slug`),
    INDEX `idx_portfolios_category` (`category`),
    INDEX `idx_portfolios_featured` (`is_featured`),
    INDEX `idx_portfolios_published` (`is_published`),
    INDEX `idx_portfolios_sort_order` (`sort_order`),
    INDEX `idx_portfolios_event_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. PORTFOLIO_IMAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `portfolio_images` (
    `id` CHAR(36) PRIMARY KEY,
    `portfolio_id` CHAR(36) NOT NULL,
    `url` TEXT NOT NULL,
    `caption` TEXT DEFAULT NULL,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `image_type` VARCHAR(50) DEFAULT 'gallery' COMMENT 'gallery, detail, behind_the_scenes',
    `is_primary` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE,
    INDEX `idx_portfolio_images_portfolio_id` (`portfolio_id`),
    INDEX `idx_portfolio_images_sort` (`sort_order`),
    INDEX `idx_portfolio_images_primary` (`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. PACKAGE_CATEGORIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `package_categories` (
    `id` CHAR(36) PRIMARY KEY,
    `category_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'wedding, prewedding-outdoor, engagement',
    `name` VARCHAR(255) NOT NULL,
    `eyebrow` VARCHAR(255) DEFAULT NULL,
    `note` TEXT DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_package_categories_category_id` (`category_id`),
    INDEX `idx_package_categories_active` (`is_active`),
    INDEX `idx_package_categories_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. PACKAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `packages` (
    `id` CHAR(36) PRIMARY KEY,
    `category_id` CHAR(36) NOT NULL,
    `package_id` VARCHAR(50) NOT NULL COMMENT 'basic, premium, exclusive',
    `name` VARCHAR(255) NOT NULL,
    `service_type` ENUM('Photo', 'Video', 'Photo + Video') DEFAULT 'Photo',
    `is_most_selected` TINYINT(1) DEFAULT 0,
    `starting_price` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `price` DECIMAL(15,0) UNSIGNED NOT NULL,
    `description` TEXT DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `package_categories`(`id`) ON DELETE RESTRICT,
    UNIQUE KEY `uk_packages_category_package` (`category_id`, `package_id`),
    INDEX `idx_packages_category_id` (`category_id`),
    INDEX `idx_packages_most_selected` (`is_most_selected`),
    INDEX `idx_packages_active` (`is_active`),
    INDEX `idx_packages_sort` (`sort_order`),
    INDEX `idx_packages_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. PACKAGE_SERVICE_TYPES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `package_service_types` (
    `id` CHAR(36) PRIMARY KEY,
    `package_id` CHAR(36) NOT NULL,
    `service_type_id` VARCHAR(50) NOT NULL COMMENT 'photo, video, photo_video',
    `name` ENUM('Photo', 'Video', 'Photo + Video') NOT NULL,
    `price` DECIMAL(15,0) UNSIGNED NOT NULL,
    `sample_images` JSON DEFAULT NULL COMMENT 'Array of image URLs',
    `sample_video_url` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_package_service_types` (`package_id`, `service_type_id`),
    INDEX `idx_package_service_types_package_id` (`package_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. PACKAGE_BENEFITS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `package_benefits` (
    `id` CHAR(36) PRIMARY KEY,
    `package_id` CHAR(36) NOT NULL,
    `service_type_id` CHAR(36) DEFAULT NULL COMMENT 'NULL = applies to all service types',
    `benefit_text` TEXT NOT NULL,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_type_id`) REFERENCES `package_service_types`(`id`) ON DELETE SET NULL,
    INDEX `idx_package_benefits_package_id` (`package_id`),
    INDEX `idx_package_benefits_service_type` (`service_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. ADDONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `addons` (
    `id` CHAR(36) PRIMARY KEY,
    `addon_id` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `price` DECIMAL(15,0) UNSIGNED NOT NULL,
    `display_price` VARCHAR(50) DEFAULT NULL COMMENT 'e.g., 450k, 1 jt',
    `unit` VARCHAR(20) DEFAULT NULL COMMENT 'e.g., pcs, jam, hari',
    `has_quantity` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_addons_addon_id` (`addon_id`),
    INDEX `idx_addons_active` (`is_active`),
    INDEX `idx_addons_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 14. ADDON_CATEGORIES (Many-to-Many)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `addon_categories` (
    `id` CHAR(36) PRIMARY KEY,
    `addon_id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`addon_id`) REFERENCES `addons`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `package_categories`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_addon_categories` (`addon_id`, `category_id`),
    INDEX `idx_addon_categories_addon_id` (`addon_id`),
    INDEX `idx_addon_categories_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 15. CUSTOMERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `customers` (
    `id` CHAR(36) PRIMARY KEY,
    `user_id` CHAR(36) DEFAULT NULL COMMENT 'Link to users table if registered',
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address` TEXT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customers_user_id` (`user_id`),
    INDEX `idx_customers_email` (`email`),
    INDEX `idx_customers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 16. BOOKINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `bookings` (
    `id` CHAR(36) PRIMARY KEY,
    `order_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g., DV-010626-001',
    `customer_id` CHAR(36) NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_email` VARCHAR(255) DEFAULT NULL,
    `customer_phone` VARCHAR(20) NOT NULL,
    `package_id` CHAR(36) DEFAULT NULL,
    `package_name` VARCHAR(255) DEFAULT NULL,
    `package_price` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `addon_ids` JSON DEFAULT NULL COMMENT 'Array of addon IDs',
    `addon_total` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `event_date` DATE NOT NULL,
    `event_time` TIME DEFAULT NULL,
    `event_location` VARCHAR(500) DEFAULT NULL,
    `event_type` VARCHAR(100) DEFAULT NULL,
    `service_type` VARCHAR(50) DEFAULT NULL,
    `total_amount` DECIMAL(15,0) UNSIGNED NOT NULL,
    `dp_amount` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `paid_amount` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `remaining_amount` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `status` ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    `delivery_method` VARCHAR(100) DEFAULT NULL,
    `packing_fee` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
    INDEX `idx_bookings_order_number` (`order_number`),
    INDEX `idx_bookings_customer_id` (`customer_id`),
    INDEX `idx_bookings_status` (`status`),
    INDEX `idx_bookings_event_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 17. PAYMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `payments` (
    `id` CHAR(36) PRIMARY KEY,
    `booking_id` CHAR(36) NOT NULL,
    `booking_order_number` VARCHAR(50) DEFAULT NULL,
    `customer_name` VARCHAR(255) DEFAULT NULL,
    `amount` DECIMAL(15,0) UNSIGNED NOT NULL,
    `method` ENUM('transfer', 'cash', 'other') DEFAULT 'transfer',
    `payment_type` ENUM('dp', 'final_payment') DEFAULT 'dp',
    `status` ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    `proof_image_url` TEXT DEFAULT NULL,
    `sender_name` VARCHAR(255) DEFAULT NULL,
    `verified_by` VARCHAR(255) DEFAULT NULL,
    `verified_at` DATETIME DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
    INDEX `idx_payments_booking_id` (`booking_id`),
    INDEX `idx_payments_status` (`status`),
    INDEX `idx_payments_type` (`payment_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 18. EMPLOYEES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `employees` (
    `id` CHAR(36) PRIMARY KEY,
    `user_id` CHAR(36) DEFAULT NULL COMMENT 'Link to users table',
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `role` ENUM('admin', 'finance', 'editor', 'photographer', 'videographer', 'staff') NOT NULL,
    `position` VARCHAR(100) DEFAULT NULL,
    `join_date` DATE DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_employees_user_id` (`user_id`),
    INDEX `idx_employees_role` (`role`),
    INDEX `idx_employees_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 19. ATTENDANCE
-- =============================================================================

CREATE TABLE IF NOT EXISTS `attendance` (
    `id` CHAR(36) PRIMARY KEY,
    `employee_id` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
    `check_in_time` TIME DEFAULT NULL,
    `check_out_time` TIME DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `selfie_url` TEXT DEFAULT NULL COMMENT 'Path to attendance selfie',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_attendance_employee_date` (`employee_id`, `date`),
    INDEX `idx_attendance_employee_id` (`employee_id`),
    INDEX `idx_attendance_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 20. ATTENDANCE_RECORDS (Detailed attendance log)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `attendance_records` (
    `id` CHAR(36) PRIMARY KEY,
    `employee_id` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `record_type` VARCHAR(50) NOT NULL COMMENT 'check_in, check_out, status_change',
    `value` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    INDEX `idx_attendance_records_employee` (`employee_id`),
    INDEX `idx_attendance_records_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 21. ATTENDANCE_SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `attendance_settings` (
    `id` CHAR(36) PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 22. STAFF_TASKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `staff_tasks` (
    `id` CHAR(36) PRIMARY KEY,
    `booking_id` CHAR(36) DEFAULT NULL,
    `assigned_to` CHAR(36) DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'in_progress', 'completed', 'revision') DEFAULT 'pending',
    `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    `due_date` DATE DEFAULT NULL,
    `completed_at` DATETIME DEFAULT NULL,
    `quality_score` INT DEFAULT NULL COMMENT '1-100',
    `notes` TEXT DEFAULT NULL,
    `created_by` CHAR(36) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`assigned_to`) REFERENCES `employees`(`id`) ON DELETE SET NULL,
    INDEX `idx_staff_tasks_assigned` (`assigned_to`),
    INDEX `idx_staff_tasks_booking` (`booking_id`),
    INDEX `idx_staff_tasks_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 23. KPI_JOBS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `kpi_jobs` (
    `id` CHAR(36) PRIMARY KEY,
    `employee_id` CHAR(36) NOT NULL,
    `job_type` VARCHAR(100) NOT NULL COMMENT 'photos_delivered, videos_delivered, editing_turnaround',
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `target` DECIMAL(10,2) DEFAULT 0,
    `actual` DECIMAL(10,2) DEFAULT 0,
    `score` INT DEFAULT NULL COMMENT '1-100',
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    INDEX `idx_kpi_jobs_employee` (`employee_id`),
    INDEX `idx_kpi_jobs_period` (`period_start`, `period_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 24. KPI_REVIEWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `kpi_reviews` (
    `id` CHAR(36) PRIMARY KEY,
    `employee_id` CHAR(36) NOT NULL,
    `review_date` DATE NOT NULL,
    `overall_score` INT DEFAULT NULL COMMENT '1-100',
    `strengths` TEXT DEFAULT NULL,
    `improvements` TEXT DEFAULT NULL,
    `goals` TEXT DEFAULT NULL,
    `reviewer_id` CHAR(36) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewer_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL,
    INDEX `idx_kpi_reviews_employee` (`employee_id`),
    INDEX `idx_kpi_reviews_date` (`review_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 25. INQUIRIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `inquiries` (
    `id` CHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `service_type` VARCHAR(100) DEFAULT NULL,
    `event_date` DATE DEFAULT NULL,
    `message` TEXT DEFAULT NULL,
    `source` VARCHAR(100) DEFAULT NULL COMMENT 'website, whatsapp, instagram',
    `status` ENUM('new', 'contacted', 'converted', 'lost') DEFAULT 'new',
    `converted_to_customer_id` CHAR(36) DEFAULT NULL COMMENT 'Link if converted to customer/booking',
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_inquiries_status` (`status`),
    INDEX `idx_inquiries_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 26. MEDIA_FILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS `media_files` (
    `id` CHAR(36) PRIMARY KEY,
    `filename` VARCHAR(255) NOT NULL,
    `original_filename` VARCHAR(255) DEFAULT NULL,
    `storage_path` VARCHAR(500) DEFAULT NULL,
    `storage_bucket` VARCHAR(100) DEFAULT NULL COMMENT 'content-images, portfolio-media',
    `url` TEXT NOT NULL,
    `file_type` ENUM('image', 'video', 'document', 'other') NOT NULL,
    `mime_type` VARCHAR(100) DEFAULT NULL,
    `file_size` BIGINT UNSIGNED DEFAULT NULL,
    `width` INT UNSIGNED DEFAULT NULL,
    `height` INT UNSIGNED DEFAULT NULL,
    `duration` INT UNSIGNED DEFAULT NULL COMMENT 'seconds for video/audio',
    `album_id` CHAR(36) DEFAULT NULL COMMENT 'Link to portfolios if applicable',
    `usage_type` VARCHAR(100) DEFAULT NULL COMMENT 'content, portfolio, banner',
    `uploaded_by` CHAR(36) DEFAULT NULL,
    `uploader_name` VARCHAR(255) DEFAULT NULL,
    `alt_text` TEXT DEFAULT NULL,
    `caption` TEXT DEFAULT NULL,
    `is_public` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_media_files_album` (`album_id`),
    INDEX `idx_media_files_type` (`file_type`),
    INDEX `idx_media_files_bucket` (`storage_bucket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 27. CALENDAR_EVENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `calendar_events` (
    `id` CHAR(36) PRIMARY KEY,
    `event_date` DATE NOT NULL,
    `end_date` DATE DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `event_type` ENUM('booking', 'blocked', 'event', 'holiday', 'deadline') NOT NULL,
    `booking_id` CHAR(36) DEFAULT NULL,
    `booking_order_number` VARCHAR(50) DEFAULT NULL,
    `color` VARCHAR(20) DEFAULT '#3B82F6',
    `created_by` CHAR(36) DEFAULT NULL,
    `created_by_name` VARCHAR(255) DEFAULT NULL,
    `is_all_day` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_calendar_events_date` (`event_date`),
    INDEX `idx_calendar_events_type` (`event_type`),
    INDEX `idx_calendar_events_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 28. ANALYTICS_DAILY
-- =============================================================================

CREATE TABLE IF NOT EXISTS `analytics_daily` (
    `id` CHAR(36) PRIMARY KEY,
    `date` DATE NOT NULL UNIQUE,
    `page_views` INT UNSIGNED DEFAULT 0,
    `unique_visitors` INT UNSIGNED DEFAULT 0,
    `booking_inquiries` INT UNSIGNED DEFAULT 0,
    `booking_confirmed` INT UNSIGNED DEFAULT 0,
    `booking_completed` INT UNSIGNED DEFAULT 0,
    `booking_cancelled` INT UNSIGNED DEFAULT 0,
    `revenue_total` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `revenue_dp` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `revenue_full` DECIMAL(15,0) UNSIGNED DEFAULT 0,
    `popular_packages` JSON DEFAULT NULL COMMENT 'Array of package IDs with counts',
    `traffic_sources` JSON DEFAULT NULL COMMENT 'Object of source => count',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_analytics_daily_date` (`date`),
    INDEX `idx_analytics_daily_revenue` (`revenue_total`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 29. ANALYTICS_EVENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS `analytics_events` (
    `id` CHAR(36) PRIMARY KEY,
    `event_name` VARCHAR(100) NOT NULL,
    `event_category` VARCHAR(100) DEFAULT NULL,
    `properties` JSON DEFAULT NULL,
    `visitor_id` VARCHAR(100) DEFAULT NULL,
    `session_id` VARCHAR(100) DEFAULT NULL,
    `utm_source` VARCHAR(100) DEFAULT NULL,
    `utm_medium` VARCHAR(100) DEFAULT NULL,
    `utm_campaign` VARCHAR(255) DEFAULT NULL,
    `event_value` DECIMAL(15,2) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_analytics_events_name` (`event_name`),
    INDEX `idx_analytics_events_category` (`event_category`),
    INDEX `idx_analytics_events_visitor` (`visitor_id`),
    INDEX `idx_analytics_events_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 30. ADMIN_ACTIVITY_LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS `admin_activity_log` (
    `id` CHAR(36) PRIMARY KEY,
    `user_id` CHAR(36) DEFAULT NULL,
    `username` VARCHAR(255) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) DEFAULT NULL,
    `entity_id` VARCHAR(100) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `old_data` JSON DEFAULT NULL,
    `new_data` JSON DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_activity_log_user` (`user_id`),
    INDEX `idx_activity_log_action` (`action`),
    INDEX `idx_activity_log_entity` (`entity_type`, `entity_id`),
    INDEX `idx_activity_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ENABLE FOREIGN KEY CHECKS
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- POST-MIGRATION NOTES:
-- =============================================================================
-- TODO: Create indexes for commonly queried JSON fields:
--   - bookings.addon_ids
--   - package_service_types.sample_images
--   - analytics_daily.popular_packages
--   - analytics_daily.traffic_sources
--
-- TODO: Consider adding fulltext indexes for search:
--   - portfolios(story, name)
--   - faqs(question, answer)
--   - packages(description)
--
-- TODO: Create views for common queries:
--   - Active bookings with customer info
--   - Revenue summary by month
--   - Staff attendance summary
-- =============================================================================