-- =============================================================================
-- Danivisual Package Seed Script
-- Seeds package_categories, packages, and addons tables from frontend defaults
-- Run this in Supabase SQL Editor or via migration
-- =============================================================================

-- =============================================================================
-- 1. Package Categories
-- =============================================================================

INSERT INTO package_categories (id, name, eyebrow, note, is_active, sort_order)
VALUES
  ('wedding', 'Wedding', 'Dokumentasi Pernikahan', 'All time packages are limited to a max. of 9 working hours (Akad - Reception)', true, 1),
  ('ngunduh-mantu', 'Ngunduh Mantu', 'Adat Jawa', 'All time packages are limited to a max. of 9 working hours', true, 2),
  ('prewedding-outdoor', 'Prewedding Outdoor', 'Sesi di Lokasi', 'All time packages are limited to a max. of 4 working hours', true, 3),
  ('prewedding-studio', 'Prewedding Studio', 'Studio', 'All time packages are limited to a max. of 1 working hour', true, 4),
  ('engagement', 'Engagement', 'Lamaran', 'All time packages are limited to a max. of 6 working hours', true, 5),
  ('photo-studio', 'Photo Studio', 'Studio', '', true, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  eyebrow = EXCLUDED.eyebrow,
  note = EXCLUDED.note,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- 2. Packages
-- =============================================================================

INSERT INTO packages (id, category_id, category_name, name, service_type, is_most_selected, starting_price, price, description, benefits, is_active, sort_order)
VALUES
  -- Wedding Packages
  ('wedding-basic', 'wedding', 'Wedding', 'Wedding Basic', 'Photo', false, 1900000, 1900000, '', ARRAY['150+ photo edited', 'Album magnetic (premium)', '80 foto print 4R', 'Print 12R + Frame', 'Link g drive'], true, 1),
  ('wedding-basic-video', 'wedding', 'Wedding', 'Wedding Basic', 'Video', false, 1900000, 2000000, '', ARRAY['2 min. full highlights', '1 min. IG highlights'], true, 2),
  ('wedding-basic-combo', 'wedding', 'Wedding', 'Wedding Basic', 'Photo + Video', false, 1900000, 3800000, '', ARRAY['200+ photo edited', 'Album magnetic (premium)', 'Print 12R + Frame', '100 foto print 4R', 'Video 2 min. full highlights', 'Video 1 min. IG highlights', 'Link g drive'], true, 3),
  ('wedding-premium', 'wedding', 'Wedding', 'Wedding Premium', 'Photo', true, 2400000, 2400000, '', ARRAY['200+ foto edited', 'Photobook (premium)', 'Print 12R + Frame', 'Flashdisk'], true, 4),
  ('wedding-premium-video', 'wedding', 'Wedding', 'Wedding Premium', 'Video', false, 2400000, 3000000, '', ARRAY['3 min. full highlights', '1 min. IG highlights'], true, 5),
  ('wedding-premium-combo', 'wedding', 'Wedding', 'Wedding Premium', 'Photo + Video', false, 2400000, 4400000, '', ARRAY['200+ photo edited', 'Photobook (premium)', 'Print 12R + Frame', 'Video 3 min. full highlights', 'Video 1 min. IG highlights', 'Link g drive'], true, 6),
  ('wedding-exclusive', 'wedding', 'Wedding', 'Wedding Exclusive', 'Photo', false, 3300000, 3300000, '', ARRAY['250+ foto edited', 'Photobook (premium)', 'Print 12R + Frame', 'Print 16R + Frame', 'Flashdisk'], true, 7),
  ('wedding-exclusive-video', 'wedding', 'Wedding', 'Wedding Exclusive', 'Video', false, 3300000, 4000000, '', ARRAY['4 min. full highlights', '1 min. IG highlights', 'SDE'], true, 8),
  ('wedding-exclusive-combo', 'wedding', 'Wedding', 'Wedding Exclusive', 'Photo + Video', false, 3300000, 5000000, '', ARRAY['250+ photo edited', 'Photobook (premium)', 'Album foto keluarga (premium)', 'Print 16R + Frame', 'Video 4 min. full highlights', 'Video 1 min. IG highlights', 'Flashdisk'], true, 9),

  -- Ngunduh Mantu Packages
  ('ngunduh-basic', 'ngunduh-mantu', 'Ngunduh Mantu', 'Ngunduh Mantu Basic', 'Photo', false, 1300000, 1500000, '', ARRAY['120+ photo edited', 'File only', 'Link g drive'], true, 10),
  ('ngunduh-basic-video', 'ngunduh-mantu', 'Ngunduh Mantu', 'Ngunduh Mantu Basic', 'Video', false, 1300000, 1300000, '', ARRAY['1 min. IG highlights'], true, 11),
  ('ngunduh-basic-combo', 'ngunduh-mantu', 'Ngunduh Mantu', 'Ngunduh Mantu Basic', 'Photo + Video', false, 1300000, 2900000, '', ARRAY['120+ photo edited', '2 min. IG highlights', 'Link g drive'], true, 12),
  ('ngunduh-premium', 'ngunduh-mantu', 'Ngunduh Mantu', 'Ngunduh Mantu Premium', 'Photo', true, 2000000, 2000000, '', ARRAY['150+ photo edited', 'Photobook (premium)', 'Link g drive'], true, 13),
  ('ngunduh-premium-video', 'ngunduh-mantu', 'Ngunduh Mantu', 'Ngunduh Mantu Premium', 'Video', false, 2000000, 2000000, '', ARRAY['3 min. full highlights', '1 min. IG highlights'], true, 14),
  ('ngunduh-premium-combo', 'ngunduh-mantu', 'Ngunduh Mantu', 'Ngunduh Mantu Premium', 'Photo + Video', false, 2000000, 3300000, '', ARRAY['150+ photo edited', 'Photobook (premium)', '3 min. full highlights', 'Link g drive'], true, 15),

  -- Prewedding Outdoor Packages
  ('prewedding-outdoor-basic', 'prewedding-outdoor', 'Prewedding Outdoor', 'Prewedding Outdoor Basic', 'Photo', false, 1300000, 1900000, '', ARRAY['120+ photo edited', '1 loc', '1 consept', 'File only', 'Link g drive'], true, 16),
  ('prewedding-outdoor-basic-video', 'prewedding-outdoor', 'Prewedding Outdoor', 'Prewedding Outdoor Basic', 'Video', false, 1300000, 1300000, '', ARRAY['1 min. IG highlights'], true, 17),
  ('prewedding-outdoor-basic-combo', 'prewedding-outdoor', 'Prewedding Outdoor', 'Prewedding Outdoor Basic', 'Photo + Video', false, 1300000, 2900000, '', ARRAY['120+ photo edited', '2 min. IG highlights', '1 loc', '1 consept', 'Link g drive'], true, 18),
  ('prewedding-outdoor-premium', 'prewedding-outdoor', 'Prewedding Outdoor', 'Prewedding Outdoor Premium', 'Photo', true, 2000000, 2500000, '', ARRAY['150+ photo edited', '1 loc', '1 consept', 'Photobook (premium)', 'Link g drive'], true, 19),
  ('prewedding-outdoor-premium-video', 'prewedding-outdoor', 'Prewedding Outdoor', 'Prewedding Outdoor Premium', 'Video', false, 2000000, 2000000, '', ARRAY['3 min. full highlights', '1 min. IG highlights'], true, 20),
  ('prewedding-outdoor-premium-combo', 'prewedding-outdoor', 'Prewedding Outdoor', 'Prewedding Outdoor Premium', 'Photo + Video', false, 2000000, 3800000, '', ARRAY['150+ photo edited', 'Photobook (premium)', '3 min. full highlights', '1 loc', '1 consept', 'Link g drive'], true, 21),

  -- Prewedding Studio Packages
  ('prewedding-studio-basic', 'prewedding-studio', 'Prewedding Studio', 'Prewedding Studio Basic', 'Photo', false, 900000, 900000, '', ARRAY['120+ photo edited', '1 loc', '1 consept', 'File only', 'Link g drive'], true, 22),
  ('prewedding-studio-basic-video', 'prewedding-studio', 'Prewedding Studio', 'Prewedding Studio Basic', 'Video', false, 900000, 1300000, '', ARRAY['1 min. IG highlights'], true, 23),
  ('prewedding-studio-basic-combo', 'prewedding-studio', 'Prewedding Studio', 'Prewedding Studio Basic', 'Photo + Video', false, 900000, 2000000, '', ARRAY['120+ photo edited', '2 min. IG highlights', '1 loc', '1 consept', 'Link g drive'], true, 24),
  ('prewedding-studio-premium', 'prewedding-studio', 'Prewedding Studio', 'Prewedding Studio Premium', 'Photo', true, 2000000, 2000000, '', ARRAY['150+ photo edited', '1 loc', '1 consept', 'Photobook (premium)', 'Link g drive'], true, 25),
  ('prewedding-studio-premium-video', 'prewedding-studio', 'Prewedding Studio', 'Prewedding Studio Premium', 'Video', false, 2000000, 2000000, '', ARRAY['3 min. full highlights', '1 min. IG highlights'], true, 26),
  ('prewedding-studio-premium-combo', 'prewedding-studio', 'Prewedding Studio', 'Prewedding Studio Premium', 'Photo + Video', false, 2000000, 3000000, '', ARRAY['150+ photo edited', 'Photobook (premium)', '3 min. full highlights', '1 loc', '1 consept', 'Link g drive'], true, 27),

  -- Engagement Packages
  ('engagement-basic', 'engagement', 'Engagement', 'Engagement Basic', 'Photo', false, 1300000, 1500000, '', ARRAY['120+ photo edited', 'File only', 'Link g drive'], true, 28),
  ('engagement-basic-video', 'engagement', 'Engagement', 'Engagement Basic', 'Video', false, 1300000, 1300000, '', ARRAY['1 min. IG highlights'], true, 29),
  ('engagement-basic-combo', 'engagement', 'Engagement', 'Engagement Basic', 'Photo + Video', false, 1300000, 2500000, '', ARRAY['120+ photo edited', '1 min. IG highlights', 'Link g drive'], true, 30),
  ('engagement-premium', 'engagement', 'Engagement', 'Engagement Premium', 'Photo', true, 2000000, 2000000, '', ARRAY['150+ photo edited', 'Photobook (premium)', 'Link g drive'], true, 31),
  ('engagement-premium-video', 'engagement', 'Engagement', 'Engagement Premium', 'Video', false, 2000000, 2000000, '', ARRAY['3 min. full highlights', '1 min. IG highlights'], true, 32),
  ('engagement-premium-combo', 'engagement', 'Engagement', 'Engagement Premium', 'Photo + Video', false, 2000000, 3300000, '', ARRAY['150+ photo edited', 'Photobook (premium)', '3 min. full highlights', 'Link g drive'], true, 33),

  -- Photo Studio Packages
  ('photo-studio-family', 'photo-studio', 'Photo Studio', 'Foto Keluarga', 'Photo', false, 480000, 480000, '', ARRAY['50ft edited', '1 jam sesi foto', 'Link via g drive'], true, 34),
  ('photo-studio-group', 'photo-studio', 'Photo Studio', 'Foto Group', 'Photo', true, 580000, 580000, '', ARRAY['50ft edited', 'Max. 30 orang', '1 jam sesi foto', 'Link via g drive'], true, 35)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  category_name = EXCLUDED.category_name,
  name = EXCLUDED.name,
  service_type = EXCLUDED.service_type,
  is_most_selected = EXCLUDED.is_most_selected,
  starting_price = EXCLUDED.starting_price,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- 3. Addons
-- =============================================================================

INSERT INTO addons (id, category_ids, name, description, price, display_price, unit, has_quantity, is_active)
VALUES
  -- Wedding Addons
  ('album-magnetic-100-4r', ARRAY['wedding'], 'Album magnetic (100ft print 4R)', '', 450000, '450k', NULL, false, true),
  ('photobook-premium', ARRAY['wedding'], 'Photobook (premium)', '', 1000000, '1 jt', NULL, false, true),
  ('extra-day', ARRAY['wedding'], 'Extra day', '', 1200000, '1,2 jt', 'hari', true, true),
  ('add-session-photo', ARRAY['wedding'], 'Add session photo / jam', '', 150000, '150k', 'jam', true, true),
  ('add-session-video', ARRAY['wedding'], 'Add session video / jam', '', 250000, '250k', 'jam', true, true),
  ('print-12r-frame', ARRAY['wedding'], 'Print 12R + frame', '', 150000, '150k', NULL, false, true),
  ('print-16r-frame', ARRAY['wedding'], 'Print 16R + frame', '', 250000, '250k', NULL, false, true),
  ('drone-pilot', ARRAY['wedding'], 'Drone + pilot', '', 400000, '400k', NULL, false, true),
  ('flashdisk', ARRAY['wedding'], 'Flashdisk', '', 100000, '100k', NULL, false, true),
  ('file-mentah-video', ARRAY['wedding'], 'File mentah video', '', 250000, '250k', NULL, false, true),
  ('mini-studio', ARRAY['wedding'], 'Mini studio', '', 550000, '550k', NULL, false, true),

  -- Ngunduh Mantu, Engagement, Photo Studio Addons
  ('album-magnetic-100-4r-small', ARRAY['ngunduh-mantu', 'engagement', 'photo-studio'], 'Album magnetic (100ft print 4R)', '', 400000, '400k', NULL, false, true),
  ('photobook-premium-small', ARRAY['ngunduh-mantu', 'engagement', 'photo-studio'], 'Photobook (premium)', '', 750000, '750k', NULL, false, true),
  ('one-hour-session', ARRAY['ngunduh-mantu', 'engagement', 'photo-studio'], '+ 1 hour session', '', 350000, '350k', 'jam', true, true),
  ('print-12r-frame-small', ARRAY['ngunduh-mantu', 'engagement', 'photo-studio'], 'Print 12R + frame', '', 120000, '120k', NULL, false, true),
  ('print-14r-frame-small', ARRAY['ngunduh-mantu', 'engagement', 'photo-studio'], 'Print 14R + frame', '', 180000, '180k', NULL, false, true),
  ('drone-pilot-small', ARRAY['ngunduh-mantu', 'engagement'], 'Drone + pilot', '', 500000, '500k', NULL, false, true),
  ('flashdisk-small', ARRAY['ngunduh-mantu', 'engagement'], 'Flashdisk', '', 100000, '100k', NULL, false, true),
  ('flashdisk-studio', ARRAY['photo-studio'], 'Flashdisk', '', 55000, '55k', NULL, false, true),

  -- Prewedding Addons
  ('print-12r-frame-prewed', ARRAY['prewedding-outdoor', 'prewedding-studio'], 'Print 12R + frame', '', 200000, '200k', NULL, false, true),
  ('extra-time-hour-prewed', ARRAY['prewedding-outdoor', 'prewedding-studio'], 'Extra time / hour', '', 200000, '200k', 'jam', true, true),
  ('add-location-prewed', ARRAY['prewedding-outdoor', 'prewedding-studio'], 'Add 1 location', '', 500000, '500k', NULL, true, true),
  ('add-consept-costum-prewed', ARRAY['prewedding-outdoor', 'prewedding-studio'], 'Add 1 consept/costum', '', 250000, '250k', NULL, true, true),
  ('print-14r-frame-prewed', ARRAY['prewedding-outdoor', 'prewedding-studio'], 'Print 14R + frame', '', 250000, '250k', NULL, false, true),
  ('drone-pilot-prewed', ARRAY['prewedding-outdoor'], 'Drone + pilot', '', 350000, '350k', NULL, false, true),
  ('flashdisk-prewed', ARRAY['prewedding-outdoor', 'prewedding-studio'], 'Flashdisk', '', 120000, '120k', NULL, false, true),
  ('mua-studio', ARRAY['prewedding-studio'], 'MUA', '', 400000, '400k', NULL, false, true),
  ('mua-costum-studio', ARRAY['prewedding-studio'], 'MUA + costum by rekues', '', 750000, '750k', NULL, false, true)
ON CONFLICT (id) DO UPDATE SET
  category_ids = EXCLUDED.category_ids,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  display_price = EXCLUDED.display_price,
  unit = EXCLUDED.unit,
  has_quantity = EXCLUDED.has_quantity,
  is_active = EXCLUDED.is_active;

-- =============================================================================
-- Verification
-- =============================================================================

-- SELECT 'Categories' as table_name, COUNT(*) as count FROM package_categories
-- UNION ALL
-- SELECT 'Packages', COUNT(*) FROM packages
-- UNION ALL
-- SELECT 'Addons', COUNT(*) FROM addons;