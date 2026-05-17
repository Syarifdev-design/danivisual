CREATE DATABASE IF NOT EXISTS danivisual_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE danivisual_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS dashboard_help_faqs;
DROP TABLE IF EXISTS download_file_packages;
DROP TABLE IF EXISTS download_folders;
DROP TABLE IF EXISTS payment_breakdown_items;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS progress_step_actions;
DROP TABLE IF EXISTS progress_step_details;
DROP TABLE IF EXISTS progress_steps;
DROP TABLE IF EXISTS booking_timeline;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS form_fields;
DROP TABLE IF EXISTS faq_items;
DROP TABLE IF EXISTS faq_categories;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS stats;
DROP TABLE IF EXISTS album_images;
DROP TABLE IF EXISTS portfolio_albums;
DROP TABLE IF EXISTS package_features;
DROP TABLE IF EXISTS service_packages;
DROP TABLE IF EXISTS service_addons;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS page_sections;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS contact_channels;
DROP TABLE IF EXISTS nav_links;
DROP TABLE IF EXISTS site_settings;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE site_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE nav_links (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  path VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  area ENUM('main','footer_menu','footer_services','dashboard') NOT NULL DEFAULT 'main'
) ENGINE=InnoDB;

CREATE TABLE contact_channels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  channel VARCHAR(80) NOT NULL,
  label VARCHAR(160) NOT NULL,
  value TEXT NOT NULL,
  url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE pages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  path VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT NULL,
  hero_image TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE page_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_id BIGINT UNSIGNED NOT NULL,
  section_key VARCHAR(120) NOT NULL,
  title VARCHAR(255) NULL,
  subtitle TEXT NULL,
  body LONGTEXT NULL,
  image_url TEXT NULL,
  cta_label VARCHAR(160) NULL,
  cta_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  extra JSON NULL,
  CONSTRAINT fk_page_sections_page
    FOREIGN KEY (page_id) REFERENCES pages(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE services (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  short_title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE service_packages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  price_label VARCHAR(80) NOT NULL,
  price_amount INT NULL,
  recommended TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_service_packages_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE package_features (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  package_id BIGINT UNSIGNED NOT NULL,
  feature TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_package_features_package
    FOREIGN KEY (package_id) REFERENCES service_packages(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE service_addons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  price_label VARCHAR(100) NOT NULL,
  price_amount INT NULL,
  description TEXT NOT NULL,
  has_quantity TINYINT(1) NOT NULL DEFAULT 0,
  icon VARCHAR(80) NULL,
  color VARCHAR(40) NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE portfolio_albums (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_id INT NULL,
  service_id BIGINT UNSIGNED NULL,
  category_label VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  couple VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  event_date_label VARCHAR(120) NOT NULL,
  cover_image TEXT NOT NULL,
  story TEXT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_portfolio_albums_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE album_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  album_id BIGINT UNSIGNED NOT NULL,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_album_images_album
    FOREIGN KEY (album_id) REFERENCES portfolio_albums(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE stats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  number_label VARCHAR(80) NOT NULL,
  label VARCHAR(160) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE testimonials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  event_label VARCHAR(180) NOT NULL,
  testimonial_text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE faq_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE faq_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  question TEXT NOT NULL,
  answer LONGTEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_faq_items_category
    FOREIGN KEY (category_id) REFERENCES faq_categories(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE form_fields (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  form_key VARCHAR(120) NOT NULL,
  label VARCHAR(180) NOT NULL,
  field_type VARCHAR(60) NOT NULL,
  placeholder VARCHAR(255) NULL,
  options_json JSON NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  couple_name VARCHAR(180) NOT NULL,
  service_label VARCHAR(120) NOT NULL,
  package_name VARCHAR(180) NOT NULL,
  event_date_label VARCHAR(120) NOT NULL,
  location VARCHAR(255) NOT NULL,
  payment_status VARCHAR(120) NOT NULL,
  booking_status VARCHAR(120) NOT NULL,
  current_stage VARCHAR(160) NOT NULL,
  cover_image TEXT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE booking_timeline (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  event_date_label VARCHAR(120) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  status VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_booking_timeline_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE progress_steps (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  step_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT NOT NULL,
  status VARCHAR(60) NOT NULL,
  payment_note TEXT NULL,
  system_note TEXT NULL,
  warning TEXT NULL,
  important_note TEXT NULL,
  CONSTRAINT fk_progress_steps_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE progress_step_details (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  progress_step_id BIGINT UNSIGNED NOT NULL,
  detail_label VARCHAR(160) NOT NULL,
  detail_value VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_progress_step_details_step
    FOREIGN KEY (progress_step_id) REFERENCES progress_steps(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE progress_step_actions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  progress_step_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(160) NOT NULL,
  link VARCHAR(255) NOT NULL,
  disabled TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_progress_step_actions_step
    FOREIGN KEY (progress_step_id) REFERENCES progress_steps(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  payment_type VARCHAR(80) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  amount_label VARCHAR(80) NOT NULL,
  status VARCHAR(80) NOT NULL,
  uploaded_at_label VARCHAR(80) NULL,
  verified_at_label VARCHAR(80) NULL,
  sender_name VARCHAR(160) NULL,
  deadline_label VARCHAR(120) NULL,
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payment_breakdown_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(160) NOT NULL,
  amount_label VARCHAR(80) NOT NULL,
  item_type VARCHAR(60) NOT NULL DEFAULT 'line',
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_payment_breakdown_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE download_folders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  album_title VARCHAR(255) NOT NULL,
  category_label VARCHAR(160) NOT NULL,
  date_label VARCHAR(120) NOT NULL,
  cover_image TEXT NOT NULL,
  status VARCHAR(60) NOT NULL,
  folder_name VARCHAR(255) NOT NULL,
  folder_url TEXT NOT NULL,
  CONSTRAINT fk_download_folders_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE download_file_packages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  download_folder_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  status VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_download_file_packages_folder
    FOREIGN KEY (download_folder_id) REFERENCES download_folders(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dashboard_help_faqs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  answer LONGTEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO site_settings (setting_key, setting_value) VALUES
('brand_name', 'Danivisual'),
('tagline', 'Wedding, Prewedding & Event Photography'),
('description', 'Mengabadikan momen penuh rasa melalui visual yang elegan, jujur, dan abadi.'),
('whatsapp_number', '082337279636'),
('whatsapp_url', 'https://wa.me/6282337279636'),
('instagram', '@danivisual.photo'),
('instagram_url', 'https://www.instagram.com/danivisual.photo'),
('youtube', 'DANIVISUAL OFFICIAL'),
('youtube_url', 'https://www.youtube.com/@danivisualofficial'),
('address', 'Utara lapangan, Mudah, Ngadirejan, Kec. Pringkuku, Kabupaten Pacitan, Jawa Timur 63552'),
('maps_url', 'https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5'),
('bank_name', 'BRI'),
('bank_account_number', '645201020316531'),
('bank_account_name', 'DANI INDRA FIRMANSYAH'),
('booking_deposit', 'Rp 500.000');

INSERT INTO nav_links (label, path, sort_order, area) VALUES
('Home', '/', 1, 'main'),
('Portfolio', '/portfolio', 2, 'main'),
('Services', '/services', 3, 'main'),
('About', '/about', 4, 'main'),
('FAQ', '/faq', 5, 'main'),
('Contact', '/contact', 6, 'main'),
('Home', '/', 1, 'footer_menu'),
('Portfolio', '/portfolio', 2, 'footer_menu'),
('Services', '/services', 3, 'footer_menu'),
('About', '/about', 4, 'footer_menu'),
('Wedding', '/services#wedding', 1, 'footer_services'),
('Prewed Studio', '/services#prewed-studio', 2, 'footer_services'),
('Prewed Outdoor', '/services#prewed-outdoor', 3, 'footer_services'),
('Event', '/services#event', 4, 'footer_services'),
('Dashboard Overview', '/dashboard', 1, 'dashboard'),
('Choose Package', '/dashboard/choose-package', 2, 'dashboard'),
('Checkout', '/dashboard/checkout', 3, 'dashboard'),
('My Booking', '/dashboard/my-booking', 4, 'dashboard'),
('Progress', '/dashboard/progress', 5, 'dashboard'),
('Payment Status', '/dashboard/payment-status', 6, 'dashboard'),
('My Albums', '/dashboard/my-albums', 7, 'dashboard'),
('Download File', '/dashboard/download-file', 8, 'dashboard'),
('Favorite Photos', '/dashboard/favorite-photos', 9, 'dashboard'),
('Profile Settings', '/dashboard/profile-settings', 10, 'dashboard'),
('Help', '/dashboard/help', 11, 'dashboard');

INSERT INTO contact_channels (channel, label, value, url, sort_order) VALUES
('whatsapp', 'WhatsApp', '082337279636', 'https://wa.me/6282337279636', 1),
('instagram', 'Instagram', '@danivisual.photo', 'https://www.instagram.com/danivisual.photo', 2),
('youtube', 'YouTube', 'DANIVISUAL OFFICIAL', 'https://www.youtube.com/@danivisualofficial', 3),
('address', 'Alamat', 'Utara lapangan, Mudah, Ngadirejan, Kec. Pringkuku, Kabupaten Pacitan, Jawa Timur 63552', 'https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5', 4);

INSERT INTO pages (slug, path, title, subtitle, hero_image, sort_order) VALUES
('home', '/', 'Danivisual', 'Wedding, Prewedding & Event Photography', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80', 1),
('portfolio', '/portfolio', 'Portfolio', 'Cerita visual dari wedding, prewedding, dan event yang kami abadikan.', NULL, 2),
('services', '/services', 'Our Services', 'Pilih layanan dokumentasi yang sesuai dengan kebutuhan momen Anda.', NULL, 3),
('about', '/about', 'Every Frame Has a Feeling', 'Danivisual adalah lebih dari sekadar fotografi. Kami adalah storyteller yang mengabadikan emosi, momen, dan kenangan yang akan Anda hargai selamanya.', NULL, 4),
('faq', '/faq', 'Frequently Asked Questions', 'Temukan jawaban lengkap untuk pertanyaan seputar layanan, proses, dan kebijakan Danivisual', NULL, 5),
('contact', '/contact', 'Get in Touch', 'Mari ceritakan rencana wedding, prewedding, atau event Anda', NULL, 6),
('login', '/login', 'Welcome Back', 'Masuk untuk melihat album, memilih paket, dan melanjutkan proses booking.', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', 7),
('register', '/register', 'Create Your Account', 'Daftar untuk mulai memilih paket dan mengelola kebutuhan dokumentasi acara Anda.', 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80', 8),
('not-found', '*', '404', 'Halaman yang Anda cari tidak ditemukan.', NULL, 99),
('dashboard-home', '/dashboard', 'Dashboard Overview', 'Ringkasan status booking, pembayaran, dan progress album Anda.', NULL, 101),
('dashboard-choose-package', '/dashboard/choose-package', 'Pilih Paket Dokumentasi', 'Pilih kategori layanan dan paket terbaik sesuai kebutuhan acara Anda.', NULL, 102),
('dashboard-checkout', '/dashboard/checkout', 'Checkout Booking', 'Lengkapi data booking, pilih metode pengiriman album, dan lakukan pembayaran awal untuk mengamankan tanggal acara.', NULL, 103),
('dashboard-my-booking', '/dashboard/my-booking', 'My Booking', 'Kelola booking Anda', NULL, 104),
('dashboard-progress', '/dashboard/progress', 'Progress Booking & Album', 'Pantau setiap tahap proses dokumentasi dan pengerjaan album Anda', NULL, 105),
('dashboard-payment-status', '/dashboard/payment-status', 'Payment Status', 'Kelola pembayaran DP awal dan pelunasan booking Anda', NULL, 106),
('dashboard-my-albums', '/dashboard/my-albums', 'My Albums', NULL, NULL, 107),
('dashboard-album-viewer', '/dashboard/album-viewer/:albumId', 'Album Viewer', NULL, NULL, 108),
('dashboard-download-file', '/dashboard/download-file', 'Download File', 'Akses file final Anda melalui link Google Drive yang telah disiapkan oleh tim Danivisual', NULL, 109),
('dashboard-favorite-photos', '/dashboard/favorite-photos', 'Favorite Photos', NULL, NULL, 110),
('dashboard-help', '/dashboard/help', 'Butuh Bantuan?', 'Tim Danivisual siap membantu Anda dalam proses booking, pembayaran, progress album, dan download file.', NULL, 111);

INSERT INTO page_sections (page_id, section_key, title, subtitle, body, image_url, cta_label, cta_url, sort_order, extra)
SELECT id, 'hero', 'Danivisual', 'Wedding, Prewedding & Event Photography', 'Mengabadikan momen penuh rasa melalui visual yang elegan, jujur, dan abadi.', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80', 'View Portfolio', '/portfolio', 1,
JSON_OBJECT('secondaryCtaLabel', 'Book a Session')
FROM pages WHERE slug = 'home';

INSERT INTO page_sections (page_id, section_key, title, subtitle, body, image_url, cta_label, cta_url, sort_order, extra)
SELECT id, 'featured_stories', 'Featured Stories', 'Kumpulan cerita visual dari momen terbaik yang kami abadikan.', NULL, NULL, 'View Album', '/portfolio/:id', 2, NULL FROM pages WHERE slug = 'home'
UNION ALL
SELECT id, 'service_categories', 'Our Visual Experiences', NULL, NULL, NULL, 'Explore Service', '/services', 3, NULL FROM pages WHERE slug = 'home'
UNION ALL
SELECT id, 'about_preview', 'Every Frame Has a Feeling', NULL, 'Danivisual adalah studio visual yang berfokus pada cerita, rasa, dan detail. Dari janji pernikahan, prewedding, hingga event penting, setiap frame dibuat untuk menjadi kenangan yang bertahan lama.\n\nKami percaya bahwa fotografi bukan hanya tentang mengabadikan momen, tetapi tentang merasakan kembali emosi yang terjadi di dalamnya.', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80', 'Meet Danivisual', '/about', 4, NULL FROM pages WHERE slug = 'home'
UNION ALL
SELECT id, 'how_it_works', 'How It Works', NULL, NULL, NULL, NULL, NULL, 5, JSON_ARRAY(JSON_OBJECT('step','01','title','Consultation','description','Diskusi kebutuhan dan konsep'),JSON_OBJECT('step','02','title','Planning','description','Persiapan detail dan timeline'),JSON_OBJECT('step','03','title','Photoshoot','description','Pelaksanaan dokumentasi'),JSON_OBJECT('step','04','title','Delivery','description','Penyerahan album final')) FROM pages WHERE slug = 'home'
UNION ALL
SELECT id, 'booking_cta', 'Let''s Create Your Visual Story', NULL, 'Ceritakan rencana wedding, prewedding, atau event Anda. Tim Danivisual siap membantu mengabadikannya dengan indah.', NULL, 'View Packages', NULL, 6, JSON_OBJECT('secondaryCtaLabel','Chat via WhatsApp','secondaryCtaUrl','https://wa.me/6282337279636') FROM pages WHERE slug = 'home';

INSERT INTO page_sections (page_id, section_key, title, subtitle, body, image_url, cta_label, cta_url, sort_order, extra)
SELECT id, 'our_story', 'Our Story', NULL, 'Danivisual lahir dari keyakinan sederhana: bahwa setiap momen istimewa dalam hidup layak untuk diingat dengan cara yang indah dan jujur.\n\nDimulai pada tahun 2019, kami telah mendokumentasikan ratusan cerita cinta-dari pernikahan intimate di backyard hingga celebration megah di venue mewah. Setiap pasangan mengajarkan kami sesuatu yang baru tentang cinta, keluarga, dan apa arti sebenarnya dari commitment.\n\nKami bukan hanya pengamat. Kami adalah bagian dari hari besar Anda, merekam setiap tawa, air mata, dan momen tak terduga yang membuat cerita Anda unik.\n\nKami percaya bahwa fotografi terbaik terjadi ketika Anda melupakan kamera dan hanya merasakan momen.', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80', NULL, NULL, 1, NULL FROM pages WHERE slug = 'about'
UNION ALL
SELECT id, 'philosophy', 'Our Philosophy', 'Prinsip yang memandu setiap frame yang kami ciptakan', NULL, NULL, NULL, NULL, 2, JSON_ARRAY(JSON_OBJECT('title','Cerita yang Jujur','description','Kami tidak hanya mengambil foto. Kami merekam emosi, senyum tulus, air mata bahagia, dan momen-momen tak terduga yang membuat pernikahan Anda unik.'),JSON_OBJECT('title','Detail yang Bermakna','description','Dari cincin yang berkilau hingga sentuhan tangan yang lembut, setiap detail kecil memiliki cerita besar. Kami memastikan tidak ada yang terlewat.'),JSON_OBJECT('title','Estetika yang Abadi','description','Kami tidak mengikuti tren sesaat. Gaya visual kami dirancang untuk tetap indah dan relevan bahkan puluhan tahun ke depan.'),JSON_OBJECT('title','Pendekatan Personal','description','Setiap pasangan memiliki cerita yang berbeda. Kami mendengarkan, memahami, dan menyesuaikan pendekatan kami dengan kepribadian dan visi Anda.')) FROM pages WHERE slug = 'about'
UNION ALL
SELECT id, 'why_choose_us', 'Why Choose Danivisual', NULL, 'Kami memahami bahwa memilih fotografer untuk hari besar Anda adalah keputusan penting. Inilah yang membuat kami berbeda:', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', NULL, NULL, 4, JSON_ARRAY('Tim fotografer profesional dengan pengalaman 7+ tahun di industri wedding photography','Gaya editorial modern yang elegan dan timeless','Full control atas proses editing untuk hasil yang konsisten dan premium','Dashboard pribadi untuk tracking progress real-time','File high resolution tanpa watermark','Album cetak premium dengan finishing berkualitas tinggi','Komunikasi responsif via WhatsApp dan dashboard','Komitmen pada timeline yang jelas dan transparan') FROM pages WHERE slug = 'about'
UNION ALL
SELECT id, 'commitment', 'Our Commitment to You', NULL, 'Ketika Anda memilih Danivisual, Anda tidak hanya mendapatkan fotografer. Anda mendapatkan partner yang akan memastikan setiap momen berharga terabadikan dengan sempurna. Kami berkomitmen untuk transparansi, kualitas, dan pengalaman yang tak terlupakan-dari konsultasi pertama hingga penyerahan album final.', NULL, NULL, NULL, 6, JSON_OBJECT('since','Since 2019') FROM pages WHERE slug = 'about'
UNION ALL
SELECT id, 'cta', 'Let''s Create Your Story Together', NULL, 'Ceritakan rencana wedding, prewedding, atau event Anda. Mari kita wujudkan visual story yang akan Anda kenang selamanya.', NULL, 'View Packages', NULL, 7, JSON_OBJECT('secondaryCtaLabel','View Our Work','secondaryCtaUrl','/portfolio') FROM pages WHERE slug = 'about';

INSERT INTO page_sections (page_id, section_key, title, subtitle, body, image_url, cta_label, cta_url, sort_order, extra)
SELECT id, 'contact_information', 'Contact Information', NULL, NULL, NULL, NULL, NULL, 1, NULL FROM pages WHERE slug = 'contact'
UNION ALL
SELECT id, 'inquiry_form', 'Send an Inquiry', NULL, NULL, NULL, 'Submit Inquiry', NULL, 2, JSON_OBJECT('alternateLabel','View All Packages') FROM pages WHERE slug = 'contact'
UNION ALL
SELECT id, 'faq_cta', 'Masih Ada Pertanyaan?', NULL, 'Tim kami siap membantu menjawab pertanyaan spesifik Anda. Jangan ragu untuk menghubungi kami via WhatsApp atau kirim inquiry detail melalui form contact.', NULL, 'Chat via WhatsApp', 'https://wa.me/6282337279636', 3, JSON_OBJECT('secondaryCtaLabel','Lihat Paket Lengkap') FROM pages WHERE slug = 'faq'
UNION ALL
SELECT id, 'auth_demo', 'Demo Credentials:', NULL, 'Username: admin\nPassword: admin', NULL, NULL, NULL, 1, NULL FROM pages WHERE slug = 'login'
UNION ALL
SELECT id, 'register_note', NULL, NULL, 'Pastikan nomor WhatsApp aktif karena akan digunakan untuk konfirmasi booking dan komunikasi dengan admin.', NULL, NULL, NULL, 1, NULL FROM pages WHERE slug = 'register';

INSERT INTO services (slug, title, short_title, description, image_url, sort_order) VALUES
('wedding', 'Wedding Photography', 'Wedding', 'Dokumentasi akad, pemberkatan, resepsi, intimate wedding, family moment, detail dekorasi, candid, dan momen utama.', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', 1),
('prewed-studio', 'Prewed Studio', 'Prewed Studio', 'Konsep indoor, lighting controlled, portrait editorial, clean backdrop, modern romantic style.', 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80', 2),
('prewed-outdoor', 'Prewed Outdoor', 'Prewed Outdoor', 'Konsep outdoor dengan nuansa natural, cityscape, garden, beach, mountain, atau destination prewedding.', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', 3),
('event', 'Event Documentation', 'Event', 'Dokumentasi engagement, birthday, corporate, gathering, private celebration, dan event lainnya.', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80', 4);

INSERT INTO service_packages (service_id, name, price_label, price_amount, recommended, sort_order)
SELECT id, 'Wedding Basic', 'Rp 5.000.000', 5000000, 0, 1 FROM services WHERE slug='wedding'
UNION ALL SELECT id, 'Wedding Premium', 'Rp 8.000.000', 8000000, 1, 2 FROM services WHERE slug='wedding'
UNION ALL SELECT id, 'Wedding Deluxe', 'Rp 12.000.000', 12000000, 0, 3 FROM services WHERE slug='wedding'
UNION ALL SELECT id, 'Studio Basic', 'Rp 2.500.000', 2500000, 0, 1 FROM services WHERE slug='prewed-studio'
UNION ALL SELECT id, 'Studio Premium', 'Rp 4.000.000', 4000000, 1, 2 FROM services WHERE slug='prewed-studio'
UNION ALL SELECT id, 'Studio Deluxe', 'Rp 6.000.000', 6000000, 0, 3 FROM services WHERE slug='prewed-studio'
UNION ALL SELECT id, 'Outdoor Basic', 'Rp 3.500.000', 3500000, 0, 1 FROM services WHERE slug='prewed-outdoor'
UNION ALL SELECT id, 'Outdoor Premium', 'Rp 5.500.000', 5500000, 1, 2 FROM services WHERE slug='prewed-outdoor'
UNION ALL SELECT id, 'Outdoor Deluxe', 'Rp 8.000.000', 8000000, 0, 3 FROM services WHERE slug='prewed-outdoor'
UNION ALL SELECT id, 'Event Basic', 'Rp 3.000.000', 3000000, 0, 1 FROM services WHERE slug='event'
UNION ALL SELECT id, 'Event Premium', 'Rp 5.000.000', 5000000, 1, 2 FROM services WHERE slug='event'
UNION ALL SELECT id, 'Event Deluxe', 'Rp 8.500.000', 8500000, 0, 3 FROM services WHERE slug='event';

INSERT INTO package_features (package_id, feature, sort_order)
SELECT p.id, jt.feature, jt.ord
FROM service_packages p
JOIN JSON_TABLE(
  CASE p.name
    WHEN 'Wedding Basic' THEN '["6 hours coverage","1 fotografer","200 edited photos","Online gallery","H+2 story photos","Private dashboard"]'
    WHEN 'Wedding Premium' THEN '["Full day coverage","2 fotografer","500 edited photos","Online gallery","H+2 story photos","Album cetak","Private dashboard"]'
    WHEN 'Wedding Deluxe' THEN '["Full day coverage","3 fotografer","Unlimited edited photos","Online gallery","H+2 story photos","Album cetak premium","Drone documentation","Private dashboard"]'
    WHEN 'Studio Basic' THEN '["2 hours studio session","1 konsep foto","1 fotografer","50 edited photos","Online gallery","Private dashboard"]'
    WHEN 'Studio Premium' THEN '["4 hours studio session","2 konsep foto","1 fotografer","100 edited photos","Lighting setup","Online gallery","Private dashboard"]'
    WHEN 'Studio Deluxe' THEN '["Full studio session","3 konsep foto","2 fotografer","150 edited photos","Premium lighting setup","Album mini","Online gallery","Private dashboard"]'
    WHEN 'Outdoor Basic' THEN '["1 lokasi outdoor","3 hours session","1 fotografer","80 edited photos","Online gallery","Private dashboard"]'
    WHEN 'Outdoor Premium' THEN '["2 lokasi outdoor","5 hours session","2 fotografer","150 edited photos","Moodboard direction","Online gallery","Private dashboard"]'
    WHEN 'Outdoor Deluxe' THEN '["3 lokasi outdoor","Full day session","2 fotografer","250 edited photos","Concept direction","Drone documentation","Album cetak","Private dashboard"]'
    WHEN 'Event Basic' THEN '["4 hours coverage","1 fotografer","150 edited photos","Online gallery","H+2 highlight photos","Private dashboard"]'
    WHEN 'Event Premium' THEN '["6 hours coverage","2 fotografer","300 edited photos","Online gallery","H+2 highlight photos","Private dashboard"]'
    WHEN 'Event Deluxe' THEN '["Full event coverage","2 fotografer","1 videografer","500 edited photos","Highlight video","Online gallery","Private dashboard"]'
  END,
  '$[*]' COLUMNS (ord FOR ORDINALITY, feature TEXT PATH '$')
) jt;

INSERT INTO service_addons (slug, name, price_label, price_amount, description, has_quantity, icon, color, sort_order) VALUES
('extra-photographer', 'Tambahan Fotografer', 'Rp 1.000.000', 1000000, 'Tambahan fotografer untuk coverage lebih luas.', 0, 'Camera', 'blue', 1),
('extra-videographer', 'Tambahan Videografer', 'Rp 1.500.000', 1500000, 'Dokumentasi video tambahan untuk momen penting.', 0, 'Video', 'red', 2),
('extra-hours', 'Extra Hours', 'Rp 500.000 / jam', 500000, 'Tambahan durasi dokumentasi acara.', 1, 'Clock', 'amber', 3),
('same-day-edit', 'Same Day Edit', 'Rp 2.000.000', 2000000, 'Editing cepat untuk kebutuhan display di hari yang sama.', 0, 'Zap', 'yellow', 4),
('drone', 'Drone Documentation', 'Rp 1.500.000', 1500000, 'Pengambilan visual udara untuk lokasi outdoor atau venue besar.', 0, 'Plane', 'sky', 5),
('album-premium', 'Album Cetak Premium', 'Rp 1.200.000', 1200000, 'Album cetak premium dengan finishing elegan.', 0, 'BookImage', 'purple', 6),
('print-large', 'Cetak Foto Besar', 'Rp 350.000', 350000, 'Cetak foto ukuran besar untuk display atau kenangan.', 0, 'Image', 'pink', 7),
('ig-reels', 'Instagram Highlight Reels', 'Rp 750.000', 750000, 'Reels singkat untuk kebutuhan posting media sosial.', 0, 'Instagram', 'fuchsia', 8),
('flashdisk', 'Flashdisk Custom', 'Rp 250.000', 250000, 'Flashdisk custom berisi file pilihan.', 0, 'Usb', 'green', 9),
('transport', 'Transport Luar Kota', 'Menunggu konfirmasi', NULL, 'Biaya transport untuk lokasi di luar area utama.', 0, 'MapPin', 'orange', 10);

INSERT INTO portfolio_albums (source_id, service_id, category_label, title, couple, location, event_date_label, cover_image, story, featured, sort_order)
SELECT 1, id, 'WEDDING', 'Dani & Sinta', 'Dani & Sinta', 'Four Seasons Jakarta', '20 Januari 2026', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', 'Pernikahan Dani dan Sinta adalah perayaan cinta yang intim dan penuh kehangatan. Dikelilingi oleh keluarga dan teman terdekat, mereka berjanji untuk saling mendukung dalam setiap langkah kehidupan.', 1, 1 FROM services WHERE slug='wedding'
UNION ALL SELECT 2, id, 'PREWED STUDIO', 'Rama & Dita', 'Rama & Dita', 'Studio Danivisual', '15 Januari 2026', 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80', NULL, 1, 2 FROM services WHERE slug='prewed-studio'
UNION ALL SELECT 3, id, 'PREWED OUTDOOR', 'Andi & Maya', 'Andi & Maya', 'Bromo, Jawa Timur', '10 Januari 2026', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', NULL, 1, 3 FROM services WHERE slug='prewed-outdoor'
UNION ALL SELECT 4, id, 'EVENT', 'Corporate Gala Night', 'Corporate Gala', 'Grand Hyatt Jakarta', '5 Januari 2026', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80', NULL, 1, 4 FROM services WHERE slug='event'
UNION ALL SELECT 5, id, 'WEDDING', 'Budi & Lina', 'Budi & Lina', 'The Ritz-Carlton', '28 Desember 2025', 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80', NULL, 0, 5 FROM services WHERE slug='wedding'
UNION ALL SELECT 6, id, 'PREWED OUTDOOR', 'Fajar & Sari', 'Fajar & Sari', 'Taman Suropati', '22 Desember 2025', 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80', NULL, 0, 6 FROM services WHERE slug='prewed-outdoor';

INSERT INTO album_images (album_id, image_url, alt_text, sort_order)
SELECT id, 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80', 'Gallery 1', 1 FROM portfolio_albums WHERE source_id=1
UNION ALL SELECT id, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', 'Gallery 2', 2 FROM portfolio_albums WHERE source_id=1
UNION ALL SELECT id, 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', 'Gallery 3', 3 FROM portfolio_albums WHERE source_id=1
UNION ALL SELECT id, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80', 'Gallery 4', 4 FROM portfolio_albums WHERE source_id=1
UNION ALL SELECT id, 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80', 'Gallery 5', 5 FROM portfolio_albums WHERE source_id=1
UNION ALL SELECT id, 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80', 'Gallery 6', 6 FROM portfolio_albums WHERE source_id=1;

INSERT INTO stats (number_label, label, sort_order) VALUES
('500+', 'Couples Documented', 1),
('7+', 'Years Experience', 2),
('50K+', 'Photos Captured', 3),
('100%', 'Client Satisfaction', 4);

INSERT INTO testimonials (name, event_label, testimonial_text, image_url, sort_order) VALUES
('Dani & Sinta', 'Wedding at Four Seasons', 'Danivisual tidak hanya memotret pernikahan kami, mereka merekam setiap rasa yang kami alami hari itu. Ketika melihat album, kami bisa merasakan kembali kebahagiaan, haru, dan kehangatan yang sama.', 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80', 1),
('Rama & Dita', 'Prewedding Studio Session', 'Tim Danivisual sangat profesional dan membuat kami merasa nyaman. Foto-foto yang dihasilkan sangat natural dan indah. Exactly what we wanted!', 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=80', 2),
('Andi & Maya', 'Prewedding at Bromo', 'Perjalanan jauh ke Bromo sangat worth it! Danivisual tahu cara memanfaatkan cahaya dan landscape dengan sempurna. Hasilnya beyond our expectations.', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80', 3);

INSERT INTO faq_categories (title, sort_order) VALUES
('Booking & Pembayaran', 1),
('Paket & Layanan', 2),
('Proses Dokumentasi', 3),
('Delivery & Album', 4),
('Revisi & Kualitas', 5),
('Kebijakan & Lainnya', 6);

INSERT INTO faq_items (category_id, question, answer, sort_order)
SELECT id, 'Bagaimana cara melakukan booking layanan Danivisual?', 'Anda dapat melakukan booking melalui tiga cara: (1) Login ke dashboard dan pilih paket langsung, (2) Hubungi kami via WhatsApp di 082337279636, atau (3) Kirim inquiry melalui halaman Contact. Setelah diskusi kebutuhan dan konfirmasi tanggal tersedia, Anda akan diminta membayar DP awal sebesar Rp 500.000 untuk mengamankan slot tanggal acara Anda. DP ini bersifat non-refundable dan akan dipotong dari total biaya paket.', 1 FROM faq_categories WHERE title='Booking & Pembayaran'
UNION ALL SELECT id, 'Berapa lama sebelum acara saya harus booking?', 'Kami sangat merekomendasikan untuk melakukan booking minimal 3-6 bulan sebelum hari H, terutama untuk tanggal-tanggal peak season (Mei-Juni dan Oktober-Desember). Untuk prewedding outdoor yang memerlukan persiapan konsep dan location scouting, booking 2-3 bulan lebih awal akan memberikan hasil maksimal. Namun, kami tetap menerima booking mendadak dengan ketersediaan slot yang terbatas.', 2 FROM faq_categories WHERE title='Booking & Pembayaran'
UNION ALL SELECT id, 'Bagaimana sistem pembayaran di Danivisual?', 'Sistem pembayaran kami terdiri dari dua tahap: (1) DP awal Rp 500.000 dibayarkan saat booking untuk mengamankan tanggal. (2) Pelunasan sisa biaya paket wajib dilakukan maksimal H+2 setelah hari acara. Kami menerima pembayaran via transfer bank BRI. Setelah pelunasan dikonfirmasi, proses editing dan finalisasi album akan segera dimulai. Tanpa pelunasan, file raw tidak akan diproses lebih lanjut.', 3 FROM faq_categories WHERE title='Booking & Pembayaran'
UNION ALL SELECT id, 'Apakah DP dapat dikembalikan jika saya membatalkan acara?', 'DP sebesar Rp 500.000 bersifat non-refundable karena sudah mengamankan slot tanggal kami dan menolak klien lain. Namun, jika terjadi force majeure (bencana alam, pandemi, dll), DP dapat dialihkan ke tanggal lain dengan pemberitahuan minimal H-14. Reschedule tanpa biaya tambahan hanya berlaku satu kali. Untuk pembatalan dari pihak klien tanpa alasan force majeure, DP tidak dapat dikembalikan.', 4 FROM faq_categories WHERE title='Booking & Pembayaran'
UNION ALL SELECT id, 'Apakah ada biaya tambahan di luar paket yang dipilih?', 'Paket yang Anda pilih sudah mencakup fotografer, editing, online gallery, dan dashboard pribadi. Namun, beberapa biaya tambahan mungkin berlaku untuk: (1) Lokasi outdoor di luar kota Jakarta (transport dan akomodasi fotografer), (2) Overtime jika acara melebihi durasi paket (Rp 500.000/jam), (3) Add-ons seperti album cetak tambahan, videografer, drone, extra fotografer. Semua biaya tambahan akan dikomunikasikan dan disetujui sebelum hari H.', 5 FROM faq_categories WHERE title='Booking & Pembayaran'
UNION ALL SELECT id, 'Apa perbedaan antara paket Basic, Premium, dan Deluxe?', 'Perbedaan utama terletak pada durasi coverage, jumlah fotografer, dan output foto: Paket Basic cocok untuk acara intimate dengan 1 fotografer dan durasi terbatas (4-6 jam). Paket Premium adalah pilihan paling populer dengan 2 fotografer, durasi lebih panjang, dan sudah termasuk album cetak. Paket Deluxe memberikan full day coverage dengan 2-3 fotografer, unlimited edited photos, drone documentation, dan album premium. Semua paket sudah include dashboard pribadi untuk tracking progress real-time.', 1 FROM faq_categories WHERE title='Paket & Layanan'
UNION ALL SELECT id, 'Berapa jumlah foto yang akan saya terima?', 'Jumlah foto edited bergantung paket: Wedding Basic (200 foto), Wedding Premium (500 foto), Wedding Deluxe (unlimited). Untuk prewedding, berkisar 50-250 foto tergantung paket. Semua foto diedit secara konsisten dengan tone premium kami. Anda juga akan menerima foto story (highlight) maksimal H+2 dalam jumlah 30-50 foto untuk dibagikan di social media. File raw tidak diberikan karena kami menjaga kualitas dan konsistensi brand visual kami.', 2 FROM faq_categories WHERE title='Paket & Layanan'
UNION ALL SELECT id, 'Apakah saya bisa request gaya editing tertentu?', 'Kami memiliki signature style editorial modern yang timeless dan elegant. Namun, kami terbuka untuk diskusi tone warna dan mood yang Anda inginkan (bright & airy, moody & dramatic, warm & cinematic). Pada saat konsultasi pra-acara, Anda dapat menunjukkan referensi visual yang Anda suka. Tim editing kami akan menyesuaikan dalam koridor estetika Danivisual agar hasil tetap konsisten dan premium. Revisi minor tone warna dapat dilakukan di tahap review.', 3 FROM faq_categories WHERE title='Paket & Layanan'
UNION ALL SELECT id, 'Apakah bisa menambah add-ons setelah booking?', 'Ya, Anda dapat menambahkan add-ons kapan saja sebelum H-7 acara, seperti: videografer, drone, extra fotografer, album cetak tambahan, foto studio couple, atau canvas/frame. Add-ons yang ditambahkan setelah booking akan dikenakan biaya tambahan sesuai price list. Untuk add-ons yang memerlukan persiapan teknis (drone, videografer), harap informasikan minimal H-7 agar kami dapat mengatur tim dan equipment.', 4 FROM faq_categories WHERE title='Paket & Layanan'
UNION ALL SELECT id, 'Apa yang dimaksud dengan Private Dashboard?', 'Private Dashboard adalah portal online eksklusif untuk setiap klien, dapat diakses setelah login. Di dashboard, Anda dapat: (1) Melihat progress editing real-time dari H+2 hingga delivery final, (2) Melakukan selection foto untuk album cetak, (3) Request minor revision, (4) Mengisi data acara dan pengiriman album, (5) Melihat invoice dan status pembayaran, (6) Download high-res files saat sudah ready. Dashboard membuat proses lebih transparan, efisien, dan Anda punya kontrol penuh.', 5 FROM faq_categories WHERE title='Paket & Layanan'
UNION ALL SELECT id, 'Bagaimana persiapan sebelum hari acara?', 'Setelah booking dikonfirmasi, kami akan mengadakan konsultasi pra-acara (bisa via video call atau tatap muka). Dalam sesi ini, kami akan membahas: (1) Rundown acara dan momen penting yang harus diabadikan, (2) Daftar family portrait yang Anda inginkan, (3) Detail lokasi dan venue, (4) Preferensi gaya dan tone foto, (5) Koordinasi dengan vendor lain (WO, dekorator, dll). Anda juga akan diminta mengisi data acara lengkap melalui dashboard untuk persiapan yang lebih matang.', 1 FROM faq_categories WHERE title='Proses Dokumentasi'
UNION ALL SELECT id, 'Berapa jumlah fotografer yang akan datang di hari H?', 'Jumlah fotografer sesuai paket yang Anda pilih: Paket Basic (1 fotografer), Paket Premium (2 fotografer), Paket Deluxe (2-3 fotografer). Dengan lebih dari satu fotografer, kami dapat mengcover multi-angle secara bersamaan-misalnya satu fokus pada pengantin, satu fokus candid tamu, dan satu lagi untuk detail dekorasi. Semua fotografer kami berpengalaman minimal 5 tahun dan terbiasa bekerja dalam tim untuk hasil yang konsisten.', 2 FROM faq_categories WHERE title='Proses Dokumentasi'
UNION ALL SELECT id, 'Apakah fotografer akan datang lebih awal?', 'Ya, tim fotografer kami akan tiba 30-60 menit sebelum waktu mulai coverage untuk survey lokasi, cek lighting, dan koordinasi dengan tim vendor lain. Kami memastikan semua equipment siap dan posisi strategis sudah diidentifikasi sebelum momen penting dimulai. Ini bagian dari komitmen kami untuk tidak melewatkan satupun momen berharga di hari istimewa Anda.', 3 FROM faq_categories WHERE title='Proses Dokumentasi'
UNION ALL SELECT id, 'Bagaimana jika acara melebihi durasi paket?', 'Jika acara berjalan melebihi durasi yang tertera di paket (misalnya paket 6 jam tapi acara berlangsung 8 jam), akan dikenakan biaya overtime sebesar Rp 500.000 per jam per fotografer. Biaya overtime akan dihitung di invoice pelunasan. Kami selalu fleksibel dan memastikan fotografer tetap standby hingga momen terakhir jika diperlukan, namun transparansi biaya tetap kami jaga.', 4 FROM faq_categories WHERE title='Proses Dokumentasi'
UNION ALL SELECT id, 'Apakah saya bisa request pose atau komposisi tertentu?', 'Tentu saja. Kami menggabungkan pendekatan candid natural dengan directed portrait yang disengaja. Jika Anda memiliki referensi pose atau komposisi tertentu yang Anda sukai (dari Pinterest, Instagram, dll), silakan bagikan saat konsultasi pra-acara. Fotografer kami akan mengarahkan pose dengan natural sehingga hasilnya tetap terlihat authentic dan tidak kaku. Untuk family portrait, kami juga akan membantu mengatur komposisi yang balance dan estetis.', 5 FROM faq_categories WHERE title='Proses Dokumentasi'
UNION ALL SELECT id, 'Kapan saya bisa menerima foto story dan foto final?', 'Timeline delivery kami sangat transparan dan dapat Anda tracking via dashboard: (1) H+2: Foto story (30-50 foto highlight untuk social media), (2) H+14 sampai H+30: Foto final sudah selesai diedit dan upload ke dashboard untuk Anda review dan selection album, (3) H+45 sampai H+60: Album cetak finishing dan ready untuk pengiriman. Setiap tahap akan ada notifikasi otomatis ke email dan dashboard Anda.', 1 FROM faq_categories WHERE title='Delivery & Album'
UNION ALL SELECT id, 'Dalam format apa foto akan dikirimkan?', 'Semua foto final dikirim dalam format high-resolution JPEG (minimal 3000px di sisi terpanjang, RGB color space) tanpa watermark. File-file ini dapat langsung Anda download dari dashboard pribadi dan tersimpan di cloud gallery selama 2 tahun. Anda bebas mencetak, membagikan ke keluarga, atau posting di media sosial tanpa batasan. Kami tidak memberikan file RAW karena menjaga konsistensi kualitas editing dan brand identity visual kami.', 2 FROM faq_categories WHERE title='Delivery & Album'
UNION ALL SELECT id, 'Apakah foto disimpan di cloud atau dikirim via hardisk?', 'Foto Anda disimpan di online gallery yang dapat diakses via dashboard selama 2 tahun. Anda dapat download kapan saja dengan koneksi internet. Jika Anda menginginkan backup fisik, kami menyediakan add-on pengiriman file via USB Flashdisk custom (dikenakan biaya tambahan Rp 150.000). Kami juga menyarankan Anda untuk membackup sendiri ke hardisk eksternal atau cloud storage pribadi untuk keamanan jangka panjang.', 3 FROM faq_categories WHERE title='Delivery & Album'
UNION ALL SELECT id, 'Bagaimana cara memilih foto untuk album cetak?', 'Setelah semua foto final di-upload ke dashboard, Anda akan masuk ke tahap Selection. Di halaman Selection, Anda dapat menandai foto favorit yang ingin masuk ke album cetak. Jumlah foto yang bisa dipilih sesuai paket (biasanya 40-60 foto untuk album standar). Setelah selection selesai, tim desain kami akan menyusun layout album dengan komposisi yang estetis dan storytelling yang koheren. Anda akan mendapat preview layout sebelum cetak final.', 4 FROM faq_categories WHERE title='Delivery & Album'
UNION ALL SELECT id, 'Apakah album dapat di-customize (ukuran, jenis kertas, cover)?', 'Ya, album cetak kami menggunakan material premium dengan beberapa pilihan: Cover bahan leather atau linen dengan emboss nama, ukuran 30x30cm atau 25x25cm, kertas art paper tebal 260gsm dengan finishing matte atau glossy. Jika Anda menginginkan upgrade ke album acrylic, photobook magazine-style, atau menambah jumlah halaman, dapat dikomunikasikan saat tahap selection. Biaya tambahan akan disesuaikan dengan jenis upgrade yang dipilih.', 5 FROM faq_categories WHERE title='Delivery & Album'
UNION ALL SELECT id, 'Bagaimana metode pengiriman album cetak?', 'Kami menyediakan tiga opsi pengiriman album: (1) Ekspedisi (JNE/Sicepat) dengan packaging aman dan asuransi, ongkir ditanggung klien, (2) COD (Cash on Delivery) khusus area Jakarta, biaya admin Rp 50.000, (3) Pickup langsung di studio kami di Jakarta (gratis). Semua album dipacking dengan bubble wrap dan kardus ekstra tebal untuk memastikan sampai dengan aman. Nomor resi tracking akan dikirim via WhatsApp dan dashboard.', 6 FROM faq_categories WHERE title='Delivery & Album'
UNION ALL SELECT id, 'Apakah saya bisa request revisi hasil foto?', 'Ya, kami memberikan kesempatan revisi minor untuk memastikan Anda 100% puas. Revisi yang dapat dilakukan meliputi: penyesuaian tone warna, brightness/contrast, cropping komposisi, atau penghapusan object kecil (noda, jerawat). Revisi major seperti mengganti background, manipulasi besar-besaran, atau perubahan total konsep editing tidak termasuk dalam paket dan akan dikenakan biaya tambahan. Anda dapat submit request revisi via dashboard di tahap Review.', 1 FROM faq_categories WHERE title='Revisi & Kualitas'
UNION ALL SELECT id, 'Berapa kali saya bisa melakukan revisi?', 'Setiap paket sudah include 1 kali sesi revisi minor (maksimal 10-15 foto yang di-revisi). Jika setelah revisi pertama masih ada penyesuaian yang diinginkan, revisi tambahan dapat dilakukan dengan biaya Rp 200.000 per sesi. Kami sangat mendorong komunikasi yang jelas di awal agar ekspektasi tone dan style sudah align, sehingga revisi bisa diminimalisir dan prosesnya lebih efisien.', 2 FROM faq_categories WHERE title='Revisi & Kualitas'
UNION ALL SELECT id, 'Bagaimana jika ada foto yang blur atau tidak fokus?', 'Kami sangat menjaga quality control di setiap tahap. Fotografer kami menggunakan equipment profesional dan double-check hasil shoot di lokasi. Namun, jika terdapat foto yang secara teknis bermasalah (blur, motion, underexposed parah), foto tersebut tidak akan kami kirimkan dalam final delivery. Kami hanya mengirim foto dengan kualitas terbaik. Jika Anda merasa ada momen penting yang terlewat atau kualitasnya tidak sesuai, silakan hubungi kami untuk klarifikasi.', 3 FROM faq_categories WHERE title='Revisi & Kualitas'
UNION ALL SELECT id, 'Apakah foto saya akan diposting di media sosial atau portfolio?', 'Kami menghargai privasi klien kami. Secara default, kami akan meminta izin terlebih dahulu sebelum memposting foto Anda di Instagram, website portfolio, atau media promosi lainnya. Jika Anda tidak berkeberatan, beberapa foto terbaik akan kami showcase dengan mencantumkan credit nama Anda (atau anonymous jika Anda prefer). Jika Anda menginginkan full privacy dan tidak ingin foto dipublikasikan sama sekali, silakan informasikan sejak awal dan kami akan menghormati keputusan tersebut.', 1 FROM faq_categories WHERE title='Kebijakan & Lainnya'
UNION ALL SELECT id, 'Bagaimana jika fotografer berhalangan hadir di hari H?', 'Kami memiliki backup fotografer profesional dengan skill setara yang siap standby untuk situasi darurat (sakit, kecelakaan, force majeure). Jika hal ini terjadi, kami akan segera menginformasikan Anda dan mengirimkan replacement fotografer yang sudah familiar dengan style Danivisual. Kualitas hasil tetap terjaga karena semua fotografer kami melalui training dan quality control yang ketat. Kejadian seperti ini sangat jarang, namun komitmen kami adalah acara Anda tetap terdokumentasi dengan sempurna.', 2 FROM faq_categories WHERE title='Kebijakan & Lainnya'
UNION ALL SELECT id, 'Apakah Danivisual melayani dokumentasi di luar Jakarta?', 'Ya, kami melayani dokumentasi wedding dan prewedding outdoor di seluruh Indonesia. Untuk acara di luar Jakarta, akan ada biaya tambahan untuk transport dan akomodasi tim fotografer (pesawat/kereta, hotel, meal allowance). Biaya ini akan kami hitung dan informasikan di awal berdasarkan lokasi tujuan. Kami sudah berpengalaman cover wedding di Bali, Yogyakarta, Bandung, Surabaya, hingga destination wedding di Labuan Bajo dan Raja Ampat.', 3 FROM faq_categories WHERE title='Kebijakan & Lainnya'
UNION ALL SELECT id, 'Bagaimana kebijakan hak cipta foto?', 'Hak cipta foto tetap berada di tangan Danivisual sebagai creator. Namun, Anda memiliki hak penuh untuk menggunakan foto-foto tersebut untuk keperluan personal: cetak, bagikan ke keluarga, posting di media sosial, buat album digital, atau kenang-kenangan lainnya. Yang tidak diperbolehkan adalah penggunaan komersial (dijual, digunakan untuk iklan produk, atau publikasi berbayar) tanpa izin tertulis dari kami. Jika ada kebutuhan komersial, silakan diskusikan untuk licensing agreement.', 4 FROM faq_categories WHERE title='Kebijakan & Lainnya';

INSERT INTO form_fields (form_key, label, field_type, placeholder, options_json, required, sort_order) VALUES
('contact_inquiry', 'Nama', 'text', 'Nama', NULL, 1, 1),
('contact_inquiry', 'Email', 'email', 'Email', NULL, 1, 2),
('contact_inquiry', 'WhatsApp', 'text', 'WhatsApp', NULL, 1, 3),
('contact_inquiry', 'Jenis Layanan', 'select', 'Jenis Layanan', JSON_ARRAY('Wedding','Prewed Studio','Prewed Outdoor','Event'), 1, 4),
('contact_inquiry', 'Pesan', 'textarea', 'Pesan', NULL, 1, 5),
('login', 'Email / Nomor WhatsApp', 'text', 'admin', NULL, 1, 1),
('login', 'Password', 'password', 'admin', NULL, 1, 2),
('register', 'Nama Lengkap', 'text', 'Nama lengkap', NULL, 1, 1),
('register', 'Email', 'email', 'email@example.com', NULL, 1, 2),
('register', 'Nomor WhatsApp', 'text', '+62 812 3456 7890', NULL, 1, 3),
('register', 'Password', 'password', 'password', NULL, 1, 4),
('register', 'Konfirmasi Password', 'password', 'password', NULL, 1, 5),
('register', 'Service Interest', 'checkbox_group', NULL, JSON_ARRAY('Wedding','Prewed Studio','Prewed Outdoor','Event'), 0, 6),
('checkout_event', 'Nama Pasangan', 'text', 'Dani & Sinta', NULL, 1, 1),
('checkout_event', 'Nama Pembooking', 'text', 'Nama lengkap', NULL, 1, 2),
('checkout_event', 'Nomor WhatsApp', 'text', '+62 812 3456 7890', NULL, 1, 3),
('checkout_event', 'Email', 'email', 'email@example.com', NULL, 1, 4),
('checkout_event', 'Username Instagram', 'text', '@username', NULL, 0, 5),
('checkout_event', 'Tanggal Acara', 'date', NULL, NULL, 1, 6),
('checkout_event', 'Jam Acara', 'time', NULL, NULL, 1, 7),
('checkout_event', 'Lokasi Acara / Venue', 'text', 'Nama venue', NULL, 1, 8),
('checkout_event', 'Alamat Lengkap', 'textarea', 'Alamat lengkap', NULL, 1, 9),
('checkout_event', 'Rencana MUA', 'text', 'Nama MUA', NULL, 0, 10),
('checkout_event', 'Rencana Dekorasi', 'text', 'Nama dekorator', NULL, 0, 11),
('checkout_event', 'Catatan untuk Admin', 'textarea', 'Tuliskan request angle, rundown, dresscode, momen penting, keluarga inti, detail dekorasi, atau kebutuhan khusus lainnya.', NULL, 0, 12),
('help_message', 'Topik Bantuan', 'select', 'Pilih topik', JSON_ARRAY('Checkout & Booking','Pembayaran','Progress Album','Download File','Lainnya'), 1, 1),
('help_message', 'Pesan', 'textarea', 'Tuliskan pertanyaan atau masalah yang Anda alami...', NULL, 1, 2),
('help_message', 'Upload File (opsional)', 'file', NULL, NULL, 0, 3);

INSERT INTO bookings (couple_name, service_label, package_name, event_date_label, location, payment_status, booking_status, current_stage, cover_image) VALUES
('Dani & Sinta', 'Wedding', 'Wedding Premium', '20 Januari 2026', 'Four Seasons Jakarta', 'DP Received', 'Confirmed', 'Editing Process', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80');

INSERT INTO booking_timeline (booking_id, event_date_label, event_name, status, sort_order)
SELECT id, '10 Jan 2026', 'Akun dibuat', 'completed', 1 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, '10 Jan 2026', 'Paket dipilih', 'completed', 2 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, '10 Jan 2026', 'Checkout dikirim', 'completed', 3 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, '11 Jan 2026', 'DP diterima - Booking confirmed', 'completed', 4 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, '13 Jan 2026', 'H-7 Validasi', 'completed', 5 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, '20 Jan 2026', 'Hari H Pelaksanaan', 'completed', 6 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, '22 Jan 2026', 'H+2 Pelunasan + File sementara', 'completed', 7 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, '25 Jan 2026', 'Editing process', 'in-progress', 8 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'Pending', 'Album finishing', 'waiting', 9 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'Pending', 'Delivery', 'waiting', 10 FROM bookings WHERE couple_name='Dani & Sinta';

INSERT INTO progress_steps (booking_id, step_number, title, description, status, payment_note, system_note, warning, important_note)
SELECT id, 1, 'H-7 Validasi', 'Tim Danivisual melakukan validasi data acara, lokasi, rundown, paket, catatan khusus, rencana MUA, rencana dekorasi, dan kebutuhan teknis sebelum hari pelaksanaan.', 'completed', NULL, NULL, NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 2, 'Hari H Pelaksanaan', 'Tim Danivisual melakukan dokumentasi sesuai paket, jadwal, lokasi, dan catatan acara yang telah dikonfirmasi.', 'completed', NULL, NULL, NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 3, 'H+2 Pelunasan + File Sementara', 'User melakukan pelunasan maksimal H+2 setelah acara. Tim Danivisual mengirim file sementara berupa momen penting, pose utama, dan highlight acara.', 'completed', 'BRI 645201020316531 DANI INDRA FIRMANSYAH', NULL, NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 4, 'File Backup + Sorting', 'Tim Danivisual melakukan backup seluruh file dokumentasi dan sorting foto terbaik sebelum masuk ke tahap selection.', 'completed', NULL, 'Proses ini dilakukan oleh tim Danivisual untuk memastikan file aman sebelum masuk ke proses seleksi.', NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 5, 'Foto Selection', 'User dapat memilih foto secara mandiri atau menyerahkan pilihan kepada tim Danivisual. Batas waktu pemilihan maksimal 24 jam.', 'completed', NULL, NULL, 'Jika user belum melakukan selection dalam 24 jam, tim Danivisual dapat melanjutkan proses selection agar pengerjaan tetap sesuai timeline.', NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 6, 'Editing Process', 'Foto pilihan masuk ke tahap editing, color grading, retouching, dan finalisasi visual sesuai karakter Danivisual.', 'finishing', NULL, NULL, NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 7, 'Revisi Session', 'User dapat melakukan pengecekan hasil editing dan mengajukan revisi sesuai ketentuan yang berlaku.', 'waiting', NULL, NULL, NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 8, 'Album Finishing', 'Tim Danivisual melakukan finalisasi file, layout album, export high resolution, persiapan cetak, packaging, dan persiapan upload Google Drive.', 'waiting', NULL, NULL, NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 9, 'Delivery', 'Album dan file final dikirim sesuai metode yang dipilih: ekspedisi, COD dengan agent, atau diambil ke kantor. Sebelum proses delivery dilanjutkan, user wajib mengisi kritik, saran, dan penilaian.', 'waiting', NULL, NULL, NULL, 'Kritik, saran, dan penilaian wajib diisi. Jika belum diisi, proses delivery tidak dapat dilanjutkan.' FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 10, 'Success', 'Seluruh proses dokumentasi, editing, revisi, pengiriman album, dan akses file final telah selesai.', 'waiting', NULL, NULL, NULL, NULL FROM bookings WHERE couple_name='Dani & Sinta';

INSERT INTO progress_step_details (progress_step_id, detail_label, detail_value, sort_order)
SELECT id, 'Tanggal Mulai', '25 Januari 2026', 1 FROM progress_steps WHERE step_number=6
UNION ALL SELECT id, 'Estimasi Selesai', '5 Februari 2026', 2 FROM progress_steps WHERE step_number=6
UNION ALL SELECT id, 'Foto Masuk Editing', '250 foto', 3 FROM progress_steps WHERE step_number=6
UNION ALL SELECT id, 'Status Editor', 'In Progress', 4 FROM progress_steps WHERE step_number=6;

INSERT INTO progress_step_actions (progress_step_id, label, link, disabled, sort_order)
SELECT id, 'Lihat Data Booking', '/dashboard/my-booking', 0, 1 FROM progress_steps WHERE step_number=1
UNION ALL SELECT id, 'Chat Admin', '/dashboard/help', 0, 2 FROM progress_steps WHERE step_number=1
UNION ALL SELECT id, 'Lihat Detail Acara', '/dashboard/my-booking', 0, 1 FROM progress_steps WHERE step_number=2
UNION ALL SELECT id, 'Upload Bukti Pelunasan', '/dashboard/payment-status', 0, 1 FROM progress_steps WHERE step_number=3
UNION ALL SELECT id, 'Lihat File Sementara', '/dashboard/my-albums', 0, 2 FROM progress_steps WHERE step_number=3
UNION ALL SELECT id, 'Pilih Foto Sekarang', '/dashboard/album-viewer/1', 0, 1 FROM progress_steps WHERE step_number=5
UNION ALL SELECT id, 'Serahkan ke Tim', '#', 0, 2 FROM progress_steps WHERE step_number=5
UNION ALL SELECT id, 'Lihat Progress Editing', '#', 0, 1 FROM progress_steps WHERE step_number=6
UNION ALL SELECT id, 'Review Foto', '#', 1, 1 FROM progress_steps WHERE step_number=7
UNION ALL SELECT id, 'Ajukan Revisi', '#', 1, 2 FROM progress_steps WHERE step_number=7
UNION ALL SELECT id, 'Download File', '/dashboard/download-file', 1, 1 FROM progress_steps WHERE step_number=10
UNION ALL SELECT id, 'Beri Testimoni', '#', 1, 2 FROM progress_steps WHERE step_number=10;

INSERT INTO payments (booking_id, payment_type, title, description, amount_label, status, uploaded_at_label, verified_at_label, sender_name, deadline_label)
SELECT id, 'deposit', 'DP Awal', 'Pembayaran awal untuk mengamankan tanggal acara', 'Rp 500.000', 'Diterima', '11 Jan 2026', '11 Jan 2026', 'Dani Indra', NULL FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'settlement', 'Pelunasan', 'Pembayaran sisa booking (H+2 setelah acara)', 'Rp 10.035.000', 'Lunas', NULL, NULL, NULL, '22 Jan 2026 (H+2)' FROM bookings WHERE couple_name='Dani & Sinta';

INSERT INTO payment_breakdown_items (booking_id, label, amount_label, item_type, sort_order)
SELECT id, 'Harga Paket', 'Rp 8.000.000', 'line', 1 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'Add-ons', 'Rp 2.500.000', 'line', 2 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'Biaya Packing', 'Rp 35.000', 'line', 3 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'Total', 'Rp 10.535.000', 'total', 4 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'DP Dibayar', 'Rp 500.000', 'paid', 5 FROM bookings WHERE couple_name='Dani & Sinta'
UNION ALL SELECT id, 'Sisa Dibayar', 'Rp 10.035.000', 'remaining', 6 FROM bookings WHERE couple_name='Dani & Sinta';

INSERT INTO download_folders (booking_id, album_title, category_label, date_label, cover_image, status, folder_name, folder_url)
SELECT id, 'Dani & Sinta Wedding', 'Wedding Package', '20 Januari 2026', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', 'ready', 'Dani & Sinta - Final Files', 'https://drive.google.com/drive/folders/1234567890' FROM bookings WHERE couple_name='Dani & Sinta';

INSERT INTO download_file_packages (download_folder_id, name, status, sort_order)
SELECT id, 'High Resolution Photos', 'ready', 1 FROM download_folders
UNION ALL SELECT id, 'Edited Selection Photos', 'ready', 2 FROM download_folders
UNION ALL SELECT id, 'Album Layout Preview', 'ready', 3 FROM download_folders
UNION ALL SELECT id, 'H+2 Story Photos', 'ready', 4 FROM download_folders
UNION ALL SELECT id, 'Printed Album Files', 'ready', 5 FROM download_folders;

INSERT INTO dashboard_help_faqs (question, answer, sort_order) VALUES
('Bagaimana cara memilih paket?', 'Klik menu "Choose Package" di sidebar, pilih kategori layanan (Wedding, Prewed Studio, Prewed Outdoor, atau Event), lalu pilih paket yang sesuai dengan kebutuhan Anda.', 1),
('Apakah bisa mengganti paket setelah checkout?', 'Perubahan paket dapat dilakukan sebelum hari H dengan menghubungi admin. Namun, perubahan setelah pembayaran DP mungkin dikenakan biaya administrasi.', 2),
('Bagaimana cara upload bukti pembayaran?', 'Masuk ke menu "Payment Status" atau pada step Pembayaran di Checkout. Upload foto bukti transfer, isi nama pengirim, tanggal, dan nominal transfer. Admin akan memverifikasi dalam 1x24 jam.', 3),
('Kapan file sementara dikirim?', 'File sementara berupa momen penting, pose utama, dan highlight acara akan dikirim maksimal H+2 setelah acara selesai.', 4),
('Bagaimana cara memilih foto selection?', 'Setelah file backup selesai, Anda akan mendapat notifikasi untuk foto selection. Buka menu "Progress" dan pilih foto yang ingin diedit, atau serahkan pilihan ke tim Danivisual. Batas waktu maksimal 24 jam.', 5),
('Bagaimana cara download file Google Drive?', 'Masuk ke menu "Download File" setelah proses editing selesai. Klik link Google Drive yang tersedia untuk membuka folder dan download file Anda.', 6),
('Kenapa delivery terkunci?', 'Delivery terkunci karena Anda belum mengisi form kritik, saran, dan penilaian. Form ini wajib diisi sebelum tim Danivisual melanjutkan proses pengiriman album.', 7),
('Bagaimana cara menghubungi admin?', 'Klik tombol "Chat Admin" di halaman Help, atau langsung chat via WhatsApp ke +62 123 456 789. Admin siap membantu Anda dari Senin-Sabtu, 09:00-18:00 WIB.', 8);

CREATE OR REPLACE VIEW v_page_content AS
SELECT
  p.slug,
  p.path,
  p.title AS page_title,
  p.subtitle AS page_subtitle,
  ps.section_key,
  ps.title AS section_title,
  ps.subtitle AS section_subtitle,
  ps.body,
  ps.image_url,
  ps.cta_label,
  ps.cta_url,
  ps.sort_order
FROM pages p
LEFT JOIN page_sections ps ON ps.page_id = p.id
ORDER BY p.sort_order, ps.sort_order;

CREATE OR REPLACE VIEW v_service_packages AS
SELECT
  s.slug AS service_slug,
  s.title AS service_title,
  p.name AS package_name,
  p.price_label,
  p.recommended,
  GROUP_CONCAT(f.feature ORDER BY f.sort_order SEPARATOR ' | ') AS features
FROM services s
JOIN service_packages p ON p.service_id = s.id
LEFT JOIN package_features f ON f.package_id = p.id
GROUP BY s.slug, s.title, p.id, p.name, p.price_label, p.recommended, p.sort_order
ORDER BY s.sort_order, p.sort_order;
