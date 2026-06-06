/**
 * Default FAQ Data
 *
 * Shared FAQ data untuk frontend dan admin panel.
 * Dipakai sebagai fallback terakhir jika Supabase dan localStorage kosong/tidak tersedia.
 *
 * Data diambil dari FAQPage.tsx frontend dengan struktur yang kompatibel dengan:
 * - AdminContext FAQ interface
 * - faqService FAQ interface
 * - Supabase faqs table schema
 */

export interface DefaultFAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}

// Frontend FAQ categories mapped to structured data
// 6 kategori, 18 FAQs total

const defaultFaqsData: Omit<DefaultFAQ, "isPublished">[] = [
  // Booking category (3 FAQs)
  {
    id: "faq-be-1",
    category: "Booking",
    question: "Bagaimana cara booking wedding di Danivisual?",
    answer: "Klik Booking Now, pilih paket Wedding, pilih jenis layanan Photo, Video, atau Photo + Video, isi data singkat, lalu upload bukti DP. Customer tidak perlu login atau register di awal.",
    sortOrder: 1,
  },
  {
    id: "faq-be-2",
    category: "Booking",
    question: "Apakah tanggal langsung aman setelah booking?",
    answer: "Tanggal akan kami hold setelah bukti DP masuk. Tim admin akan melakukan verifikasi dan menghubungi Anda melalui WhatsApp untuk konfirmasi final.",
    sortOrder: 2,
  },
  {
    id: "faq-be-3",
    category: "Booking",
    question: "Kapan sebaiknya saya melakukan booking?",
    answer: "Idealnya 2-4 bulan sebelum acara. Untuk tanggal ramai atau weekend besar, booking lebih awal akan lebih aman karena slot dokumentasi terbatas.",
    sortOrder: 3,
  },

  // Payment category (3 FAQs)
  {
    id: "faq-py-1",
    category: "Payment",
    question: "Berapa DP untuk mengamankan jadwal?",
    answer: "DP booking adalah Rp 500.000. DP digunakan untuk mengamankan tanggal dan akan masuk ke total pembayaran paket yang dipilih.",
    sortOrder: 4,
  },
  {
    id: "faq-py-2",
    category: "Payment",
    question: "Bagaimana sistem pelunasan?",
    answer: "Sisa pembayaran akan dikonfirmasi admin setelah booking diverifikasi. Alur pelunasan mengikuti paket, add-on, dan kebutuhan dokumentasi yang disepakati.",
    sortOrder: 5,
  },
  {
    id: "faq-py-3",
    category: "Payment",
    question: "Apakah DP bisa dikembalikan?",
    answer: "DP bersifat non-refundable karena tanggal sudah kami hold. Jika perlu reschedule, admin akan membantu mengecek ketersediaan tanggal pengganti.",
    sortOrder: 6,
  },

  // Package category (3 FAQs)
  {
    id: "faq-pk-1",
    category: "Package",
    question: "Apa perbedaan Basic, Premium, dan Exclusive?",
    answer: "Perbedaan ada pada jumlah output, album atau media fisik, serta kelengkapan dokumentasi. Detail include akan muncul setelah Anda memilih paket dan jenis layanan.",
    sortOrder: 7,
  },
  {
    id: "faq-pk-2",
    category: "Package",
    question: "Apakah bisa memilih Photo saja atau Video saja?",
    answer: "Bisa. Setiap paket Wedding memiliki pilihan Photo, Video, dan Photo + Video dengan harga yang langsung terlihat sebelum checkout.",
    sortOrder: 8,
  },
  {
    id: "faq-pk-3",
    category: "Package",
    question: "Apakah add-on bisa ditambahkan setelah booking?",
    answer: "Bisa selama masih memungkinkan secara jadwal dan teknis. Add-on seperti drone, extra session, album, atau print tambahan akan dikonfirmasi admin.",
    sortOrder: 9,
  },

  // Process category (3 FAQs)
  {
    id: "faq-pr-1",
    category: "Process",
    question: "Berapa lama durasi kerja paket wedding?",
    answer: "Semua paket wedding memiliki batas waktu maksimal 9 jam kerja untuk acara Akad + Resepsi, kecuali ada add-on tambahan durasi.",
    sortOrder: 10,
  },
  {
    id: "faq-pr-2",
    category: "Process",
    question: "Apakah tim datang lebih awal?",
    answer: "Tim akan datang lebih awal untuk cek lokasi, lighting, rundown, dan koordinasi singkat dengan keluarga atau vendor acara.",
    sortOrder: 11,
  },
  {
    id: "faq-pr-3",
    category: "Process",
    question: "Apakah bisa request angle atau momen tertentu?",
    answer: "Bisa. Masukkan catatan saat booking atau sampaikan ke admin, seperti request keluarga inti, detail dekorasi, prosesi khusus, atau angle yang diinginkan.",
    sortOrder: 12,
  },

  // Delivery category (3 FAQs)
  {
    id: "faq-dv-1",
    category: "Delivery",
    question: "Bagaimana hasil foto atau video dikirim?",
    answer: "Preview dan file digital akan dibagikan secara online. Untuk album fisik, metode pengiriman bisa dipilih melalui Ekspedisi, COD, atau ambil ke kantor.",
    sortOrder: 13,
  },
  {
    id: "faq-dv-2",
    category: "Delivery",
    question: "Apakah alamat pengiriman perlu diisi saat booking?",
    answer: "Tidak perlu. Detail alamat pengiriman akan difollow up admin setelah hari H agar proses booking tetap singkat dan tidak terasa ribet.",
    sortOrder: 14,
  },
  {
    id: "faq-dv-3",
    category: "Delivery",
    question: "Apakah ada biaya packing untuk ekspedisi?",
    answer: "Jika memilih Ekspedisi untuk album fisik, packing fee Rp 35.000 akan ditambahkan ke summary booking.",
    sortOrder: 15,
  },

  // Policy category (3 FAQs)
  {
    id: "faq-po-1",
    category: "Policy",
    question: "Apakah foto akan diposting di portfolio?",
    answer: "Kami menghargai privasi client. Publikasi portfolio akan disesuaikan dengan izin dan kenyamanan Anda.",
    sortOrder: 16,
  },
  {
    id: "faq-po-2",
    category: "Policy",
    question: "Apakah file mentah diberikan?",
    answer: "File mentah tidak termasuk dalam paket utama. Jika membutuhkan file tambahan tertentu, silakan konsultasikan dengan admin sebagai add-on.",
    sortOrder: 17,
  },
  {
    id: "faq-po-3",
    category: "Policy",
    question: "Bagaimana jika ada perubahan paket?",
    answer: "Perubahan paket atau add-on dilakukan melalui admin agar jadwal, kebutuhan tim, dan total pembayaran tetap tercatat dengan jelas.",
    sortOrder: 18,
  },
];

// Apply default isPublished = true to all FAQs
export const defaultFaqs: DefaultFAQ[] = defaultFaqsData.map((faq) => ({
  ...faq,
  isPublished: true,
}));

// Kategori yang digunakan untuk filter di Admin Panel
export const faqCategories = [
  "Booking",
  "Payment",
  "Package",
  "Process",
  "Delivery",
  "Policy",
] as const;

export type FAQCategory = (typeof faqCategories)[number];
