-- ============================================================================
-- Seed FAQ Data
-- Source: src/app/data/defaultFaqs.ts
-- Contains 18 FAQs across 6 categories
-- Run with: psql or Supabase Dashboard SQL Editor
-- ============================================================================

-- Insert FAQs (with ON CONFLICT to prevent duplicates if run multiple times)
INSERT INTO faqs (id, category, question, answer, sort_order, is_published, created_at, updated_at)
VALUES
  -- Booking category (3 FAQs)
  ('faq-be-1', 'Booking', 'Bagaimana cara booking wedding di Danivisual?', 'Klik Booking Now, pilih paket Wedding, pilih jenis layanan Photo, Video, atau Photo + Video, isi data singkat, lalu upload bukti DP. Customer tidak perlu login atau register di awal.', 1, true, NOW(), NOW()),
  ('faq-be-2', 'Booking', 'Apakah tanggal langsung aman setelah booking?', 'Tanggal akan kami hold setelah bukti DP masuk. Tim admin akan melakukan verifikasi dan menghubungi Anda melalui WhatsApp untuk konfirmasi final.', 2, true, NOW(), NOW()),
  ('faq-be-3', 'Booking', 'Kapan sebaiknya saya melakukan booking?', 'Idealnya 2-4 bulan sebelum acara. Untuk tanggal ramai atau weekend besar, booking lebih awal akan lebih aman karena slot dokumentasi terbatas.', 3, true, NOW(), NOW()),

  -- Payment category (3 FAQs)
  ('faq-py-1', 'Payment', 'Berapa DP untuk mengamankan jadwal?', 'DP booking adalah Rp 500.000. DP digunakan untuk mengamankan tanggal dan akan masuk ke total pembayaran paket yang dipilih.', 4, true, NOW(), NOW()),
  ('faq-py-2', 'Payment', 'Bagaimana sistem pelunasan?', 'Sisa pembayaran akan dikonfirmasi admin setelah booking diverifikasi. Alur pelunasan mengikuti paket, add-on, dan kebutuhan dokumentasi yang disepakati.', 5, true, NOW(), NOW()),
  ('faq-py-3', 'Payment', 'Apakah DP bisa dikembalikan?', 'DP bersifat non-refundable karena tanggal sudah kami hold. Jika perlu reschedule, admin akan membantu mengecek ketersediaan tanggal pengganti.', 6, true, NOW(), NOW()),

  -- Package category (3 FAQs)
  ('faq-pk-1', 'Package', 'Apa perbedaan Basic, Premium, dan Exclusive?', 'Perbedaan ada pada jumlah output, album atau media fisik, serta kelengkapan dokumentasi. Detail include akan muncul setelah Anda memilih paket dan jenis layanan.', 7, true, NOW(), NOW()),
  ('faq-pk-2', 'Package', 'Apakah bisa memilih Photo saja atau Video saja?', 'Bisa. Setiap paket Wedding memiliki pilihan Photo, Video, dan Photo + Video dengan harga yang langsung terlihat sebelum checkout.', 8, true, NOW(), NOW()),
  ('faq-pk-3', 'Package', 'Apakah add-on bisa ditambahkan setelah booking?', 'Bisa selama masih memungkinkan secara jadwal dan teknis. Add-on seperti drone, extra session, album, atau print tambahan akan dikonfirmasi admin.', 9, true, NOW(), NOW()),

  -- Process category (3 FAQs)
  ('faq-pr-1', 'Process', 'Berapa lama durasi kerja paket wedding?', 'Semua paket wedding memiliki batas waktu maksimal 9 jam kerja untuk acara Akad + Resepsi, kecuali ada add-on tambahan durasi.', 10, true, NOW(), NOW()),
  ('faq-pr-2', 'Process', 'Apakah tim datang lebih awal?', 'Tim akan datang lebih awal untuk cek lokasi, lighting, rundown, dan koordinasi singkat dengan keluarga atau vendor acara.', 11, true, NOW(), NOW()),
  ('faq-pr-3', 'Process', 'Apakah bisa request angle atau momen tertentu?', 'Bisa. Masukkan catatan saat booking atau sampaikan ke admin, seperti request keluarga inti, detail dekorasi, prosesi khusus, atau angle yang diinginkan.', 12, true, NOW(), NOW()),

  -- Delivery category (3 FAQs)
  ('faq-dv-1', 'Delivery', 'Bagaimana hasil foto atau video dikirim?', 'Preview dan file digital akan dibagikan secara online. Untuk album fisik, metode pengiriman bisa dipilih melalui Ekspedisi, COD, atau ambil ke kantor.', 13, true, NOW(), NOW()),
  ('faq-dv-2', 'Delivery', 'Apakah alamat pengiriman perlu diisi saat booking?', 'Tidak perlu. Detail alamat pengiriman akan difollow up admin setelah hari H agar proses booking tetap singkat dan tidak terasa ribet.', 14, true, NOW(), NOW()),
  ('faq-dv-3', 'Delivery', 'Apakah ada biaya packing untuk ekspedisi?', 'Jika memilih Ekspedisi untuk album fisik, packing fee Rp 35.000 akan ditambahkan ke summary booking.', 15, true, NOW(), NOW()),

  -- Policy category (3 FAQs)
  ('faq-po-1', 'Policy', 'Apakah foto akan diposting di portfolio?', 'Kami menghargai privasi client. Publikasi portfolio akan disesuaikan dengan izin dan kenyamanan Anda.', 16, true, NOW(), NOW()),
  ('faq-po-2', 'Policy', 'Apakah file mentah diberikan?', 'File mentah tidak termasuk dalam paket utama. Jika membutuhkan file tambahan tertentu, silakan konsultasikan dengan admin sebagai add-on.', 17, true, NOW(), NOW()),
  ('faq-po-3', 'Policy', 'Bagaimana jika ada perubahan paket?', 'Perubahan paket atau add-on dilakukan melalui admin agar jadwal, kebutuhan tim, dan total pembayaran tetap tercatat dengan jelas.', 18, true, NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Verification query
SELECT
  category,
  COUNT(*) as count,
  STRING_AGG(question, ', ') as questions_preview
FROM faqs
GROUP BY category
ORDER BY MIN(sort_order);

-- Total count
SELECT COUNT(*) as total_faqs FROM faqs;
