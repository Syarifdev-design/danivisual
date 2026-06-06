-- =============================================================================
-- Danivisual Portfolio Seed Script
-- Seeds portfolio_albums table from frontend defaults
-- Run this in Supabase SQL Editor or via migration
-- =============================================================================

-- =============================================================================
-- Portfolio Albums with Real Image URLs
-- =============================================================================

INSERT INTO portfolio_albums (id, title, slug, name, couple_name, category, cover_image, gallery_images, images, location, story, event_date, date, is_featured, is_published, sort_order)
VALUES
  -- Wedding Albums
  ('portfolio-1', 'Dani & Sinta', 'dani-sinta', 'Dani & Sinta', 'Dani & Sinta', 'wedding', '/images/couple-portrait.jpg', '["/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/ceremony-table.jpg","/images/outdoor-couple.jpg","/images/family-stage.jpg"]', '["/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/ceremony-table.jpg","/images/outdoor-couple.jpg","/images/family-stage.jpg"]', 'Four Seasons Jakarta', 'Pernikahan Dani dan Sinta adalah perayaan cinta yang intim dan penuh kehangatan. Dikelilingi oleh keluarga dan teman terdekat, mereka berjanji untuk saling mendukung dalam setiap langkah kehidupan.', '2026-01-20', '2026-01-20', true, true, 1),
  ('portfolio-2', 'Naufal & Kirana', 'naufal-kirana', 'Naufal & Kirana', 'Naufal & Kirana', 'wedding', '/images/hero-akad.jpg', '["/images/hero-akad.jpg","/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/ceremony-table.jpg","/images/outdoor-couple.jpg"]', '["/images/hero-akad.jpg","/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/ceremony-table.jpg","/images/outdoor-couple.jpg"]', 'The Langham Jakarta', 'Rangkaian akad yang hangat, dirawat lewat detail keluarga, gesture kecil, dan ritme dokumentasi yang tenang.', '2025-12-28', '2025-12-28', false, true, 2),
  ('portfolio-3', 'Arga & Meira', 'arga-meira', 'Arga & Meira', 'Arga & Meira', 'wedding', '/images/detail-portrait.jpg', '["/images/detail-portrait.jpg","/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/ceremony-table.jpg","/images/outdoor-couple.jpg"]', '["/images/detail-portrait.jpg","/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/ceremony-table.jpg","/images/outdoor-couple.jpg"]', 'Plataran Menteng', 'Cerita wedding yang klasik dan lembut, dengan fokus pada prosesi, detail cincin, dan potret pasangan.', '2025-12-18', '2025-12-18', false, true, 3),
  ('portfolio-4', 'Rizky & Anindya', 'rizky-anindya', 'Rizky & Anindya', 'Rizky & Anindya', 'wedding', '/images/ceremony-table.jpg', '["/images/ceremony-table.jpg","/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/outdoor-couple.jpg","/images/family-stage.jpg"]', '["/images/ceremony-table.jpg","/images/couple-portrait.jpg","/images/hero-ring.jpg","/images/ceremony.jpg","/images/outdoor-couple.jpg","/images/family-stage.jpg"]', 'Ayana Midplaza', 'Perayaan formal yang tetap personal, diabadikan melalui portrait keluarga, dekorasi pelaminan, dan detail seremoni.', '2025-11-30', '2025-11-30', false, true, 4),

  -- Prewedding Studio Albums
  ('portfolio-5', 'Rama & Dita', 'rama-dita', 'Rama & Dita', 'Rama & Dita', 'prewed-studio', '/images/ring-portrait.jpg', '["/images/ring-portrait.jpg","/images/detail-portrait.jpg","/images/hero-ring.jpg","/images/couple-portrait.jpg"]', '["/images/ring-portrait.jpg","/images/detail-portrait.jpg","/images/hero-ring.jpg","/images/couple-portrait.jpg"]', 'Studio Danivisual', 'Sesi prewedding studio dengan arahan pose yang tenang, fokus pada chemistry pasangan dan detail editorial.', '2026-01-15', '2026-01-15', true, true, 5),
  ('portfolio-7', 'Bagas & Livia', 'bagas-livia', 'Bagas & Livia', 'Bagas & Livia', 'prewed-studio', '/images/hero-ring.jpg', '["/images/hero-ring.jpg","/images/ring-portrait.jpg","/images/detail-portrait.jpg"]', '["/images/hero-ring.jpg","/images/ring-portrait.jpg","/images/detail-portrait.jpg"]', 'Studio Editorial Danivisual', 'Sesi editorial studio yang bersih, modern, dan diarahkan untuk menghasilkan potret pasangan yang timeless.', '2025-11-09', '2025-11-09', false, true, 6),

  -- Prewedding Outdoor Albums
  ('portfolio-6', 'Andi & Maya', 'andi-maya', 'Andi & Maya', 'Andi & Maya', 'prewed-outdoor', '/images/outdoor-couple.jpg', '["/images/outdoor-couple.jpg","/images/hero-ring.jpg","/images/hero-moment.jpg","/images/ring-portrait.jpg"]', '["/images/outdoor-couple.jpg","/images/hero-ring.jpg","/images/hero-moment.jpg","/images/ring-portrait.jpg"]', 'Bromo, Jawa Timur', 'Prewedding outdoor dengan cahaya natural dan lanskap terbuka, dibuat untuk terasa cinematic namun tetap personal.', '2026-01-10', '2026-01-10', false, true, 7),
  ('portfolio-8', 'Fajar & Sari', 'fajar-sari', 'Fajar & Sari', 'Fajar & Sari', 'prewed-outdoor', '/images/family-stage.jpg', '["/images/family-stage.jpg","/images/outdoor-couple.jpg","/images/hero-moment.jpg"]', '["/images/family-stage.jpg","/images/outdoor-couple.jpg","/images/hero-moment.jpg"]', 'Taman Suropati', 'Sesi outdoor ringan dengan pendekatan natural dan dokumenter.', '2025-12-22', '2025-12-22', false, true, 8),

  -- Event Albums
  ('portfolio-9', 'Corporate Gala Night', 'corporate-gala-night', 'Corporate Gala Night', 'Corporate Gala', 'event', '/images/group-stage.jpg', '["/images/group-stage.jpg","/images/family-stage.jpg","/images/ceremony-table.jpg"]', '["/images/group-stage.jpg","/images/family-stage.jpg","/images/ceremony-table.jpg"]', 'Grand Hyatt Jakarta', 'Dokumentasi event yang menangkap ambience, interaksi tamu, dan momen utama acara.', '2026-01-05', '2026-01-05', true, true, 9),
  ('portfolio-10', 'Private Engagement Dinner', 'private-engagement-dinner', 'Private Engagement Dinner', 'Engagement Dinner', 'event', '/images/ceremony-table.jpg', '["/images/ceremony-table.jpg","/images/ceremony.jpg","/images/family-stage.jpg"]', '["/images/ceremony-table.jpg","/images/ceremony.jpg","/images/family-stage.jpg"]', 'Park Hyatt Jakarta', 'Engagement dinner dengan visual hangat, intim, dan detail dekorasi yang rapi.', '2025-12-24', '2025-12-24', false, true, 10),
  ('portfolio-11', 'Luxury Product Dinner', 'luxury-product-dinner', 'Luxury Product Dinner', 'Product Dinner', 'event', '/images/ceremony.jpg', '["/images/ceremony.jpg","/images/ceremony-table.jpg","/images/group-stage.jpg"]', '["/images/ceremony.jpg","/images/ceremony-table.jpg","/images/group-stage.jpg"]', 'The Dharmawangsa', 'Event dinner elegan dengan dokumentasi detail program dan atmosfer ruang.', '2025-12-16', '2025-12-16', false, true, 11),
  ('portfolio-12', 'Family Celebration', 'family-celebration', 'Family Celebration', 'Family Celebration', 'event', '/images/family-stage.jpg', '["/images/family-stage.jpg","/images/group-stage.jpg","/images/couple-portrait.jpg"]', '["/images/family-stage.jpg","/images/group-stage.jpg","/images/couple-portrait.jpg"]', 'InterContinental Jakarta', 'Perayaan keluarga yang dirangkai dengan momen candid dan portrait hangat.', '2025-12-12', '2025-12-12', false, true, 12),

  -- Studio Albums
  ('portfolio-13', 'Alya Portrait Session', 'alya-portrait', 'Alya Portrait Session', 'Alya Portrait', 'studio', '/images/ring-portrait.jpg', '["/images/ring-portrait.jpg","/images/detail-portrait.jpg","/images/hero-ring.jpg"]', '["/images/ring-portrait.jpg","/images/detail-portrait.jpg","/images/hero-ring.jpg"]', 'Studio Danivisual', 'Portrait studio dengan lighting rapi dan arahan visual yang elegan.', '2025-12-03', '2025-12-03', false, true, 13),
  ('portfolio-14', 'Rendra Family Portrait', 'rendra-family', 'Rendra Family Portrait', 'Rendra Family', 'studio', '/images/family-stage.jpg', '["/images/family-stage.jpg","/images/group-stage.jpg","/images/couple-portrait.jpg"]', '["/images/family-stage.jpg","/images/group-stage.jpg","/images/couple-portrait.jpg"]', 'Studio Danivisual', 'Sesi keluarga dengan komposisi bersih dan ekspresi natural.', '2025-11-29', '2025-11-29', false, true, 14),
  ('portfolio-15', 'Editorial Couple Portrait', 'editorial-couple', 'Editorial Couple Portrait', 'Editorial Couple', 'studio', '/images/couple-portrait.jpg', '["/images/couple-portrait.jpg","/images/ring-portrait.jpg","/images/detail-portrait.jpg"]', '["/images/couple-portrait.jpg","/images/ring-portrait.jpg","/images/detail-portrait.jpg"]', 'Studio Danivisual', 'Portrait pasangan dengan gaya editorial yang sederhana dan timeless.', '2025-11-19', '2025-11-19', false, true, 15),
  ('portfolio-16', 'Personal Branding Set', 'personal-branding', 'Personal Branding Set', 'Personal Branding', 'studio', '/images/hero-moment.jpg', '["/images/hero-moment.jpg","/images/hero-ring.jpg","/images/ring-portrait.jpg"]', '["/images/hero-moment.jpg","/images/hero-ring.jpg","/images/ring-portrait.jpg"]', 'Studio Danivisual', 'Set personal branding dengan visual profesional dan tetap personal.', '2025-11-11', '2025-11-11', false, true, 16),

  -- Other Events Albums
  ('portfolio-17', 'Siraman Intimate', 'siraman-intimate', 'Siraman Intimate', 'Siraman Intimate', 'peristiwa-lainnya', '/images/ceremony.jpg', '["/images/ceremony.jpg","/images/family-stage.jpg","/images/ceremony-table.jpg"]', '["/images/ceremony.jpg","/images/family-stage.jpg","/images/ceremony-table.jpg"]', 'Private Residence', 'Prosesi siraman intimate dengan dokumentasi detail budaya dan keluarga.', '2025-11-07', '2025-11-07', false, true, 17),
  ('portfolio-18', 'Pengajian Keluarga', 'pengajian-keluarga', 'Pengajian Keluarga', 'Pengajian Keluarga', 'peristiwa-lainnya', '/images/group-stage.jpg', '["/images/group-stage.jpg","/images/family-stage.jpg","/images/ceremony.jpg"]', '["/images/group-stage.jpg","/images/family-stage.jpg","/images/ceremony.jpg"]', 'South Jakarta', 'Pengajian keluarga yang hangat, tenang, dan penuh momen personal.', '2025-11-02', '2025-11-02', false, true, 18),
  ('portfolio-19', 'Lamaran Elegant', 'lamaran-elegant', 'Lamaran Elegant', 'Lamaran Elegant', 'peristiwa-lainnya', '/images/hero-ring.jpg', '["/images/hero-ring.jpg","/images/ceremony-table.jpg","/images/couple-portrait.jpg"]', '["/images/hero-ring.jpg","/images/ceremony-table.jpg","/images/couple-portrait.jpg"]', 'Private Garden', 'Lamaran elegan dengan detail dekorasi dan gesture keluarga yang dekat.', '2025-10-24', '2025-10-24', false, true, 19),
  ('portfolio-20', 'Family Milestone', 'family-milestone', 'Family Milestone', 'Family Milestone', 'peristiwa-lainnya', '/images/family-stage.jpg', '["/images/family-stage.jpg","/images/group-stage.jpg","/images/couple-portrait.jpg"]', '["/images/family-stage.jpg","/images/group-stage.jpg","/images/couple-portrait.jpg"]', 'Jakarta Selatan', 'Milestone keluarga yang didokumentasikan dengan pendekatan hangat dan timeless.', '2025-10-18', '2025-10-18', false, true, 20)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  couple_name = EXCLUDED.couple_name,
  category = EXCLUDED.category,
  cover_image = EXCLUDED.cover_image,
  gallery_images = EXCLUDED.gallery_images,
  images = EXCLUDED.images,
  location = EXCLUDED.location,
  story = EXCLUDED.story,
  event_date = EXCLUDED.event_date,
  date = EXCLUDED.date,
  is_featured = EXCLUDED.is_featured,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- Verification
-- =============================================================================

SELECT 'Portfolio Albums' as table_name, COUNT(*) as count FROM portfolio_albums;