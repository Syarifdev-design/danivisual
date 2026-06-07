-- =============================================================================
-- DaniVisual Seed Data
-- =============================================================================
-- Initial data untuk production deployment
-- Run setelah schema di-import
-- =============================================================================

SET NAMES utf8mb4;

-- =============================================================================
-- 1. Admin User (Super Admin)
-- =============================================================================
-- Default login: admin@danivisual.com / admin123

INSERT INTO users (id, email, username, password_hash, name, phone, role, is_active, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@danivisual.com', 'admin', '$2y$12$OjrmjSQtb5s8smNXYyjexeDEF76WANlzujduVqwZsltucfoLTsG3m', 'Admin Utama', '081234567890', 'super_admin', 1, NOW())
ON DUPLICATE KEY UPDATE email = email;

-- =============================================================================
-- 2. Package Categories
-- =============================================================================

INSERT INTO package_categories (id, category_id, name, eyebrow, note, is_active, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'wedding', 'Wedding', 'Dokumentasi Pernikahan', 'All time packages limited to max. 9 working hours', 1, 1),
('c0000000-0000-0000-0000-000000000002', 'ngunduh-mantu', 'Ngunduh Mantu', 'Adat Jawa', 'All time packages limited to max. 9 working hours', 1, 2),
('c0000000-0000-0000-0000-000000000003', 'prewedding-outdoor', 'Prewedding Outdoor', 'Sesi di Lokasi', 'All time packages limited to max. 4 working hours', 1, 3),
('c0000000-0000-0000-0000-000000000004', 'prewedding-studio', 'Prewedding Studio', 'Studio', 'All time packages limited to max. 1 working hour', 1, 4),
('c0000000-0000-0000-0000-000000000005', 'engagement', 'Engagement', 'Lamaran', 'All time packages limited to max. 6 working hours', 1, 5),
('c0000000-0000-0000-0000-000000000006', 'photo-studio', 'Photo Studio', 'Studio', NULL, 1, 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 3. Packages
-- =============================================================================

INSERT INTO packages (id, category_id, package_id, name, service_type, is_most_selected, starting_price, price, description, is_active, sort_order) VALUES
-- Wedding Basic
('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'basic', 'Wedding Basic', 'Photo', 0, 4500000, 5500000, 'Paket dokumentasi wedding basic dengan 4 jam kerja fotografer',1, 1),
-- Wedding Premium
('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'premium', 'Wedding Premium', 'Photo', 1, 6500000, 8500000, 'Paket dokumentasi wedding premium dengan 6 jam kerja + 2nd shooter', 1, 2),
-- Wedding Exclusive
('p0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'exclusive', 'Wedding Exclusive', 'Photo + Video', 0, 12000000, 15000000, 'Paket lengkap dokumentasi wedding exclusive full day + cinematic video', 1, 3),

-- Ngunduh Mantu Basic
('p0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'basic', 'Ngunduh Mantu Basic', 'Photo', 0, 3500000, 4500000, 'Paket dokumentasi ngunduh mantu basic', 1, 1),
-- Ngunduh Mantu Premium
('p0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'premium', 'Ngunduh Mantu Premium', 'Photo', 1, 5500000, 7000000, 'Paket dokumentasi ngunduh mantu premium dengan2nd shooter', 1, 2),

-- Prewedding Outdoor Basic
('p0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'basic', 'Prewedding Outdoor Basic', 'Photo', 0, 2000000, 2500000, 'Sesi pemotretan prewedding outdoor 2 jam', 1, 1),
-- Prewedding Outdoor Premium
('p0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'premium', 'Prewedding Outdoor Premium', 'Photo', 1, 3500000, 4500000, 'Sesi pemotretan prewedding outdoor4 jam + makeup', 1, 2),

-- Prewedding Studio Basic
('p0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'basic', 'Prewedding Studio Basic', 'Photo', 0, 1000000, 1500000, 'Sesi pemotretan prewedding studio 1 jam', 1, 1),
-- Prewedding Studio Premium
('p0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 'premium', 'Prewedding Studio Premium', 'Photo', 1, 2000000, 3000000, 'Sesi pemotretan prewedding studio 2 jam + makeup artist', 1, 2),

-- Engagement Basic
('p0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000005', 'basic', 'Engagement Basic', 'Photo', 0, 2500000, 3500000, 'Paket dokumentasi engagement 3 jam', 1, 1),
-- Engagement Premium
('p0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000005', 'premium', 'Engagement Premium', 'Photo', 1, 4000000, 5500000, 'Paket dokumentasi engagement6 jam + 2nd shooter', 1, 2),

-- Photo Studio
('p0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000006', 'basic', 'Photo Studio Session', 'Photo', 1, 500000, 750000, 'Sesi pemotretan studio 1 jam +5 cetakan 4R', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 4. Addons
-- =============================================================================

INSERT INTO addons (id, addon_id, name, description, price, display_price, unit, has_quantity, is_active, sort_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'album-magnetic-100-4r', 'Album Magnetic (100ft4R)', 'Album dengan 100 foto print ukuran 4R', 450000, '450k', NULL, 0, 1, 1),
('a0000000-0000-0000-0000-000000000002', 'photobook-premium', 'Photobook Premium', 'Photobook dengan finishing premium A4', 1000000, '1 jt', NULL, 0, 1, 2),
('a0000000-0000-0000-0000-000000000003', 'extra-day', 'Extra Day', 'Tambahan1 hari shooting', 1200000, '1,2 jt', 'hari', 1, 1, 3),
('a0000000-0000-0000-0000-000000000004', 'add-session-photo', 'Add Session Photo / Jam', 'Tambah jam sesi foto untuk photo', 150000, '150k', 'jam', 1, 1, 4),
('a0000000-0000-0000-0000-000000000005', 'add-session-video', 'Add Session Video / Jam', 'Tambah jam sesi foto untuk video', 250000, '250k', 'jam', 1, 1, 5),
('a0000000-0000-0000-0000-000000000006', 'print-12r-frame', 'Print 12R + Frame', 'Cetak foto 12R dengan bingkai', 150000, '150k', NULL, 0, 1, 6),
('a0000000-0000-0000-0000-000000000007', 'print-16r-frame', 'Print 16R + Frame', 'Cetak foto 16R dengan bingkai', 250000, '250k', NULL, 0, 1, 7),
('a0000000-0000-0000-0000-000000000008', 'drone-pilot', 'Drone + Pilot', 'Tambahan drone dan pilot', 400000, '400k', NULL, 0, 1, 8),
('a0000000-0000-0000-0000-000000000009', 'flashdisk', 'Flashdisk', 'Flashdisk untuk delivery hasil', 100000, '100k', NULL, 0, 1, 9)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 5. Services
-- =============================================================================

INSERT INTO services (id, service_id, name, eyebrow, description, narrative, duration, highlight, access, is_active, sort_order) VALUES
('s0000000-0000-0000-0000-000000000001', 'wedding', 'Wedding', 'Signature', 'Dokumentasi lengkap wedding dengan feel editorial', 'Paket lengkap dokumentasi wedding dari persiapan hingga resepsi.', 'Full Day Coverage', 'Cinematic Edit, 2nd Shooter', 'Digital Gallery + Printed Album', 1, 1),
('s0000000-0000-0000-0000-000000000002', 'prewedding', 'Prewedding', 'Editorial', 'Konsep prewedding indoor atau outdoor', 'Sesi pemotretan pra-wedding dengan konsep yang disesuaikan.', '4 Hours Session', 'Multiple Concepts, Stylist', 'Digital + Print Rights', 1, 2),
('s0000000-0000-0000-0000-000000000003', 'event', 'Event', 'Coverage', 'Dokumentasi event dan celebration', 'Layanan dokumentasi untuk berbagai jenis event.', 'Flexible Hours', 'Quick Delivery, Multi-angle', 'Digital Gallery', 1, 3),
('s0000000-0000-0000-0000-000000000004', 'studio', 'Studio', 'Portrait', 'Portrait, family, personal branding', 'Sesi pemotretan di studio dengan lighting profesional.', '2 Hours Session', 'Professional Lighting, Retouching', 'Digital + 10 Prints', 1, 4),
('s0000000-0000-0000-0000-000000000005', 'lainnya', 'Lainnya', 'Personal', 'Momen personal dan keluarga', 'Untuk momen-momen personal seperti anniversary.', 'Custom Session', 'Custom Concept, Flexible', 'Digital Only', 1, 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Service Includes
INSERT INTO service_includes (id, service_id, include_text, sort_order) VALUES
('si000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'Full day documentation (up to 12 hours)', 1),
('si000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000001', '2 Professional Photographers', 2),
('si000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000001', '500+ Edited Photos', 3),
('si000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000001', 'Cinematic Highlight Video', 4),
('si000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000001', 'Premium Photo Album', 5),
('si000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000002', '4 Hours Photo Session', 1),
('si000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000002', 'Multiple Location Options', 2),
('si000000-0000-0000-0000-000000000008', 's0000000-0000-0000-0000-000000000002', 'Professional Styling Guide', 3),
('si000000-0000-0000-0000-000000000009', 's0000000-0000-0000-0000-000000000002', '100+ Edited Photos', 4)
ON DUPLICATE KEY UPDATE include_text = VALUES(include_text);

-- =============================================================================
-- 6. FAQs
-- =============================================================================

INSERT INTO faqs (id, category, question, answer, sort_order, is_published) VALUES
('f0000000-0000-0000-0000-000000000001', 'Booking', 'Bagaimana cara booking?', 'Pilih paket di halaman kami, lalu hubungi via WhatsApp untuk konfirmasi.',1, 1),
('f0000000-0000-0000-0000-000000000002', 'Booking', 'Apakah bisa custom paket?', 'Bisa, silakan diskusikan kebutuhan Anda via WhatsApp.',2, 1),
('f0000000-0000-0000-0000-000000000003', 'Booking', 'Berapa lama sebelum hari H harus booking?', 'Minimal2 minggu sebelum hari H untuk memastikan ketersediaan.', 3, 1),
('f0000000-0000-0000-0000-000000000004', 'Pembayaran', 'Metode pembayaran apa saja?', 'Transfer bank lokal (BCA, Mandiri, BNI, BRI) dan cash.', 1, 1),
('f0000000-0000-0000-0000-000000000005', 'Pembayaran', 'Kapan harus lunas?', 'Pelunasan maksimal 1 minggu sebelum hari H.', 2, 1),
('f0000000-0000-0000-0000-000000000006', 'Pembayaran', 'Berapa DP yang harus dibayar?', 'DP minimum adalah Rp 500.000 untuk mengunci tanggal.', 3, 1),
('f0000000-0000-0000-0000-000000000007', 'Hasil', 'Kapan hasil diberikan?', 'Soft file 2-4 minggu setelah acara, album4-8 minggu.',1, 1),
('f0000000-0000-0000-0000-000000000008', 'Hasil', 'Format hasil apa saja?', 'Soft file format JPG/PNG via Google Drive atau Flashdisk.',2, 1),
('f0000000-0000-0000-0000-000000000009', 'Lainnya', 'Apakah bisa dapat raw file?', 'Bisa, dengan tambahan biaya. Silakan konsultasikan.',1, 1),
('f0000000-0000-0000-0000-000000000010', 'Lainnya', 'Apakah sudah termasuk makeup artist?', 'Tergantung paket yang dipilih. Beberapa paket sudah termasuk, beberapa tidak.',2, 1)
ON DUPLICATE KEY UPDATE question = VALUES(question);

-- =============================================================================
-- 7. Employees (Staff)
-- =============================================================================

INSERT INTO employees (id, name, email, phone, role, position, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'Dani Indra', 'dani@danivisual.com', '081234567890', 'admin', 'Owner', 1),
('e0000000-0000-0000-0000-000000000002', 'Sarah Photographer', 'sarah@danivisual.com', '081234567891', 'photographer', 'Lead Photographer', 1),
('e0000000-0000-0000-0000-000000000003', 'Budi Videographer', 'budi@danivisual.com', '081234567892', 'videographer', 'Videographer',1),
('e0000000-0000-0000-0000-000000000004', 'Anna Editor', 'anna@danivisual.com', '081234567893', 'editor', 'Photo Editor', 1),
('e0000000-0000-0000-0000-000000000005', 'Finance Team', 'finance@danivisual.com', '081234567894', 'finance', 'Finance',1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 8. Attendance Settings
-- =============================================================================

INSERT INTO attendance_settings (id, setting_key, setting_value, description) VALUES
('as000000-0000-0000-0000-000000000001', 'check_in_start', '08:00', 'Waktu mulai check-in'),
('as000000-0000-0000-0000-000000000002', 'check_in_end', '09:00', 'Batas waktu check-in'),
('as000000-0000-0000-0000-000000000003', 'check_out_time', '17:00', 'Waktu check-out normal'),
('as000000-0000-0000-0000-000000000004', 'late_threshold', '09:00', 'Batas keterlambatan')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- =============================================================================
-- 9. Content Fields (Sample)
-- =============================================================================

INSERT INTO content_fields (id, menu_id, section_id, field_id, value, field_type) VALUES
('cf000000-0000-0000-0000-000000000001', 'home', 'hero', 'hero_title', 'Dokumentasikan Momen Terindah Anda', 'text'),
('cf000000-0000-0000-0000-000000000002', 'home', 'hero', 'hero_subtitle', 'Wedding Photography& Videography Professional', 'text'),
('cf000000-0000-0000-0000-000000000003', 'home', 'about', 'about_title', 'Tentang Kami', 'text'),
('cf000000-0000-0000-0000-000000000004', 'home', 'about', 'about_description', 'DaniVisual adalah studio fotografi profesional yang spesialis dalam dokumentasi pernikahan dan acara spesial.', 'textarea'),
('cf000000-0000-0000-0000-000000000005', 'contact', 'info', 'whatsapp', '6281234567890', 'text'),
('cf000000-0000-0000-0000-000000000006', 'contact', 'info', 'email', 'info@danivisual.com', 'text'),
('cf000000-0000-0000-0000-000000000007', 'contact', 'info', 'address', 'Jakarta, Indonesia', 'text')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- =============================================================================
-- Verification
-- =============================================================================

SELECT 'Seed data inserted successfully!' as status;

-- Count records
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Package Categories', COUNT(*) FROM package_categories
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages
UNION ALL
SELECT 'Addons', COUNT(*) FROM addons
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'FAQs', COUNT(*) FROM faqs
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees;
