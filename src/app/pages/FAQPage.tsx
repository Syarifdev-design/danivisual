import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: typeof HelpCircle;
  faqs: FAQ[];
}

export default function FAQPage() {
  const [openIndexes, setOpenIndexes] = useState<{ [key: string]: number | null }>({});

  const toggleFAQ = (categoryIndex: number, faqIndex: number) => {
    const key = `${categoryIndex}`;
    setOpenIndexes((prev) => ({
      ...prev,
      [key]: prev[key] === faqIndex ? null : faqIndex,
    }));
  };

  const faqCategories: FAQCategory[] = [
    {
      title: "Booking & Pembayaran",
      icon: HelpCircle,
      faqs: [
        {
          question: "Bagaimana cara melakukan booking layanan Danivisual?",
          answer:
            "Anda dapat langsung memilih paket di halaman booking publik, mengisi checkout, dan upload bukti DP Rp 500.000. Customer tidak perlu register manual. Setelah DP diverifikasi, akun customer dibuat otomatis dan username serta password dikirim melalui WhatsApp.",
        },
        {
          question: "Berapa lama sebelum acara saya harus booking?",
          answer:
            "Kami sangat merekomendasikan untuk melakukan booking minimal 3-6 bulan sebelum hari H, terutama untuk tanggal-tanggal peak season (Mei-Juni dan Oktober-Desember). Untuk prewedding outdoor yang memerlukan persiapan konsep dan location scouting, booking 2-3 bulan lebih awal akan memberikan hasil maksimal. Namun, kami tetap menerima booking mendadak dengan ketersediaan slot yang terbatas.",
        },
        {
          question: "Bagaimana sistem pembayaran di Danivisual?",
          answer:
            "Sistem pembayaran kami terdiri dari dua tahap: (1) DP awal Rp 500.000 dibayarkan saat booking untuk mengamankan tanggal. (2) Pelunasan sisa biaya paket wajib dilakukan maksimal H+2 setelah hari acara. Kami menerima pembayaran via transfer bank BRI. Setelah pelunasan dikonfirmasi, proses editing dan finalisasi album akan segera dimulai. Tanpa pelunasan, file raw tidak akan diproses lebih lanjut.",
        },
        {
          question: "Apakah DP dapat dikembalikan jika saya membatalkan acara?",
          answer:
            "DP sebesar Rp 500.000 bersifat non-refundable karena sudah mengamankan slot tanggal kami dan menolak klien lain. Namun, jika terjadi force majeure (bencana alam, pandemi, dll), DP dapat dialihkan ke tanggal lain dengan pemberitahuan minimal H-14. Reschedule tanpa biaya tambahan hanya berlaku satu kali. Untuk pembatalan dari pihak klien tanpa alasan force majeure, DP tidak dapat dikembalikan.",
        },
        {
          question: "Apakah ada biaya tambahan di luar paket yang dipilih?",
          answer:
            "Paket yang Anda pilih sudah mencakup fotografer, editing, online gallery, dan dashboard pribadi. Namun, beberapa biaya tambahan mungkin berlaku untuk: (1) Lokasi outdoor di luar kota Jakarta (transport dan akomodasi fotografer), (2) Overtime jika acara melebihi durasi paket (Rp 500.000/jam), (3) Add-ons seperti album cetak tambahan, videografer, drone, extra fotografer. Semua biaya tambahan akan dikomunikasikan dan disetujui sebelum hari H.",
        },
      ],
    },
    {
      title: "Paket & Layanan",
      icon: HelpCircle,
      faqs: [
        {
          question: "Apa perbedaan antara paket Basic, Premium, dan Deluxe?",
          answer:
            "Perbedaan utama terletak pada durasi coverage, jumlah fotografer, dan output foto: Paket Basic cocok untuk acara intimate dengan 1 fotografer dan durasi terbatas (4-6 jam). Paket Premium adalah pilihan paling populer dengan 2 fotografer, durasi lebih panjang, dan sudah termasuk album cetak. Paket Deluxe memberikan full day coverage dengan 2-3 fotografer, unlimited edited photos, drone documentation, dan album premium. Semua paket sudah include dashboard pribadi untuk tracking progress real-time.",
        },
        {
          question: "Berapa jumlah foto yang akan saya terima?",
          answer:
            "Jumlah foto edited bergantung paket: Wedding Basic (200 foto), Wedding Premium (500 foto), Wedding Deluxe (unlimited). Untuk prewedding, berkisar 50-250 foto tergantung paket. Semua foto diedit secara konsisten dengan tone premium kami. Anda juga akan menerima foto story (highlight) maksimal H+2 dalam jumlah 30-50 foto untuk dibagikan di social media. File raw tidak diberikan karena kami menjaga kualitas dan konsistensi brand visual kami.",
        },
        {
          question: "Apakah saya bisa request gaya editing tertentu?",
          answer:
            "Kami memiliki signature style editorial modern yang timeless dan elegant. Namun, kami terbuka untuk diskusi tone warna dan mood yang Anda inginkan (bright & airy, moody & dramatic, warm & cinematic). Pada saat konsultasi pra-acara, Anda dapat menunjukkan referensi visual yang Anda suka. Tim editing kami akan menyesuaikan dalam koridor estetika Danivisual agar hasil tetap konsisten dan premium. Revisi minor tone warna dapat dilakukan di tahap review.",
        },
        {
          question: "Apakah bisa menambah add-ons setelah booking?",
          answer:
            "Ya, Anda dapat menambahkan add-ons kapan saja sebelum H-7 acara, seperti: videografer, drone, extra fotografer, album cetak tambahan, foto studio couple, atau canvas/frame. Add-ons yang ditambahkan setelah booking akan dikenakan biaya tambahan sesuai price list. Untuk add-ons yang memerlukan persiapan teknis (drone, videografer), harap informasikan minimal H-7 agar kami dapat mengatur tim dan equipment.",
        },
        {
          question: "Apa yang dimaksud dengan 'Private Dashboard'?",
          answer:
            "Private Dashboard adalah portal client yang aktif setelah DP booking diverifikasi. Isinya dibuat sederhana: My Booking untuk melihat detail booking, pembayaran, add-on, dan delivery; serta Progress untuk memantau Photo Sorting, Editing, Preview, Pelunasan, dan Delivery.",
        },
      ],
    },
    {
      title: "Proses Dokumentasi",
      icon: HelpCircle,
      faqs: [
        {
          question: "Bagaimana persiapan sebelum hari acara?",
          answer:
            "Setelah booking dikonfirmasi, kami akan mengadakan konsultasi pra-acara (bisa via video call atau tatap muka). Dalam sesi ini, kami akan membahas: (1) Rundown acara dan momen penting yang harus diabadikan, (2) Daftar family portrait yang Anda inginkan, (3) Detail lokasi dan venue, (4) Preferensi gaya dan tone foto, (5) Koordinasi dengan vendor lain (WO, dekorator, dll). Anda juga akan diminta mengisi data acara lengkap melalui dashboard untuk persiapan yang lebih matang.",
        },
        {
          question: "Berapa jumlah fotografer yang akan datang di hari H?",
          answer:
            "Jumlah fotografer sesuai paket yang Anda pilih: Paket Basic (1 fotografer), Paket Premium (2 fotografer), Paket Deluxe (2-3 fotografer). Dengan lebih dari satu fotografer, kami dapat mengcover multi-angle secara bersamaan—misalnya satu fokus pada pengantin, satu fokus candid tamu, dan satu lagi untuk detail dekorasi. Semua fotografer kami berpengalaman minimal 5 tahun dan terbiasa bekerja dalam tim untuk hasil yang konsisten.",
        },
        {
          question: "Apakah fotografer akan datang lebih awal?",
          answer:
            "Ya, tim fotografer kami akan tiba 30-60 menit sebelum waktu mulai coverage untuk survey lokasi, cek lighting, dan koordinasi dengan tim vendor lain. Kami memastikan semua equipment siap dan posisi strategis sudah diidentifikasi sebelum momen penting dimulai. Ini bagian dari komitmen kami untuk tidak melewatkan satupun momen berharga di hari istimewa Anda.",
        },
        {
          question: "Bagaimana jika acara melebihi durasi paket?",
          answer:
            "Jika acara berjalan melebihi durasi yang tertera di paket (misalnya paket 6 jam tapi acara berlangsung 8 jam), akan dikenakan biaya overtime sebesar Rp 500.000 per jam per fotografer. Biaya overtime akan dihitung di invoice pelunasan. Kami selalu fleksibel dan memastikan fotografer tetap standby hingga momen terakhir jika diperlukan, namun transparansi biaya tetap kami jaga.",
        },
        {
          question: "Apakah saya bisa request pose atau komposisi tertentu?",
          answer:
            "Tentu saja. Kami menggabungkan pendekatan candid natural dengan directed portrait yang disengaja. Jika Anda memiliki referensi pose atau komposisi tertentu yang Anda sukai (dari Pinterest, Instagram, dll), silakan bagikan saat konsultasi pra-acara. Fotografer kami akan mengarahkan pose dengan natural sehingga hasilnya tetap terlihat authentic dan tidak kaku. Untuk family portrait, kami juga akan membantu mengatur komposisi yang balance dan estetis.",
        },
      ],
    },
    {
      title: "Delivery & Album",
      icon: HelpCircle,
      faqs: [
        {
          question: "Kapan saya bisa menerima foto story dan foto final?",
          answer:
            "Timeline delivery kami sangat transparan dan dapat Anda tracking via dashboard: (1) H+2: Foto story (30-50 foto highlight untuk social media), (2) H+14 sampai H+30: Foto final sudah selesai diedit dan upload ke dashboard untuk Anda review dan selection album, (3) H+45 sampai H+60: Album cetak finishing dan ready untuk pengiriman. Setiap tahap akan ada notifikasi otomatis ke email dan dashboard Anda.",
        },
        {
          question: "Dalam format apa foto akan dikirimkan?",
          answer:
            "Semua foto final dikirim dalam format high-resolution JPEG (minimal 3000px di sisi terpanjang, RGB color space) tanpa watermark. File-file ini dapat langsung Anda download dari dashboard pribadi dan tersimpan di cloud gallery selama 2 tahun. Anda bebas mencetak, membagikan ke keluarga, atau posting di media sosial tanpa batasan. Kami tidak memberikan file RAW karena menjaga konsistensi kualitas editing dan brand identity visual kami.",
        },
        {
          question: "Apakah foto disimpan di cloud atau dikirim via hardisk?",
          answer:
            "Foto Anda disimpan di online gallery yang dapat diakses via dashboard selama 2 tahun. Anda dapat download kapan saja dengan koneksi internet. Jika Anda menginginkan backup fisik, kami menyediakan add-on pengiriman file via USB Flashdisk custom (dikenakan biaya tambahan Rp 150.000). Kami juga menyarankan Anda untuk membackup sendiri ke hardisk eksternal atau cloud storage pribadi untuk keamanan jangka panjang.",
        },
        {
          question: "Bagaimana cara memilih foto untuk album cetak?",
          answer:
            "Setelah semua foto final di-upload ke dashboard, Anda akan masuk ke tahap Selection. Di halaman Selection, Anda dapat menandai foto favorit yang ingin masuk ke album cetak. Jumlah foto yang bisa dipilih sesuai paket (biasanya 40-60 foto untuk album standar). Setelah selection selesai, tim desain kami akan menyusun layout album dengan komposisi yang estetis dan storytelling yang koheren. Anda akan mendapat preview layout sebelum cetak final.",
        },
        {
          question: "Apakah album dapat di-customize (ukuran, jenis kertas, cover)?",
          answer:
            "Ya, album cetak kami menggunakan material premium dengan beberapa pilihan: Cover bahan leather atau linen dengan emboss nama, ukuran 30x30cm atau 25x25cm, kertas art paper tebal 260gsm dengan finishing matte atau glossy. Jika Anda menginginkan upgrade ke album acrylic, photobook magazine-style, atau menambah jumlah halaman, dapat dikomunikasikan saat tahap selection. Biaya tambahan akan disesuaikan dengan jenis upgrade yang dipilih.",
        },
        {
          question: "Bagaimana metode pengiriman album cetak?",
          answer:
            "Kami menyediakan tiga opsi pengiriman album: (1) Ekspedisi (JNE/Sicepat) dengan packaging aman dan asuransi, ongkir ditanggung klien, (2) COD (Cash on Delivery) khusus area Jakarta, biaya admin Rp 50.000, (3) Pickup langsung di studio kami di Jakarta (gratis). Semua album dipacking dengan bubble wrap dan kardus ekstra tebal untuk memastikan sampai dengan aman. Nomor resi tracking akan dikirim via WhatsApp dan dashboard.",
        },
      ],
    },
    {
      title: "Revisi & Kualitas",
      icon: HelpCircle,
      faqs: [
        {
          question: "Apakah saya bisa request revisi hasil foto?",
          answer:
            "Ya, kami memberikan kesempatan revisi minor untuk memastikan Anda 100% puas. Revisi yang dapat dilakukan meliputi: penyesuaian tone warna, brightness/contrast, cropping komposisi, atau penghapusan object kecil (noda, jerawat). Revisi major seperti mengganti background, manipulasi besar-besaran, atau perubahan total konsep editing tidak termasuk dalam paket dan akan dikenakan biaya tambahan. Anda dapat submit request revisi via dashboard di tahap Review.",
        },
        {
          question: "Berapa kali saya bisa melakukan revisi?",
          answer:
            "Setiap paket sudah include 1 kali sesi revisi minor (maksimal 10-15 foto yang di-revisi). Jika setelah revisi pertama masih ada penyesuaian yang diinginkan, revisi tambahan dapat dilakukan dengan biaya Rp 200.000 per sesi. Kami sangat mendorong komunikasi yang jelas di awal agar ekspektasi tone dan style sudah align, sehingga revisi bisa diminimalisir dan prosesnya lebih efisien.",
        },
        {
          question: "Bagaimana jika ada foto yang blur atau tidak fokus?",
          answer:
            "Kami sangat menjaga quality control di setiap tahap. Fotografer kami menggunakan equipment profesional dan double-check hasil shoot di lokasi. Namun, jika terdapat foto yang secara teknis bermasalah (blur, motion, underexposed parah), foto tersebut tidak akan kami kirimkan dalam final delivery. Kami hanya mengirim foto dengan kualitas terbaik. Jika Anda merasa ada momen penting yang terlewat atau kualitasnya tidak sesuai, silakan hubungi kami untuk klarifikasi.",
        },
      ],
    },
    {
      title: "Kebijakan & Lainnya",
      icon: HelpCircle,
      faqs: [
        {
          question: "Apakah foto saya akan diposting di media sosial atau portfolio?",
          answer:
            "Kami menghargai privasi klien kami. Secara default, kami akan meminta izin terlebih dahulu sebelum memposting foto Anda di Instagram, website portfolio, atau media promosi lainnya. Jika Anda tidak berkeberatan, beberapa foto terbaik akan kami showcase dengan mencantumkan credit nama Anda (atau anonymous jika Anda prefer). Jika Anda menginginkan full privacy dan tidak ingin foto dipublikasikan sama sekali, silakan informasikan sejak awal dan kami akan menghormati keputusan tersebut.",
        },
        {
          question: "Bagaimana jika fotografer berhalangan hadir di hari H?",
          answer:
            "Kami memiliki backup fotografer profesional dengan skill setara yang siap standby untuk situasi darurat (sakit, kecelakaan, force majeure). Jika hal ini terjadi, kami akan segera menginformasikan Anda dan mengirimkan replacement fotografer yang sudah familiar dengan style Danivisual. Kualitas hasil tetap terjaga karena semua fotografer kami melalui training dan quality control yang ketat. Kejadian seperti ini sangat jarang, namun komitmen kami adalah acara Anda tetap terdokumentasi dengan sempurna.",
        },
        {
          question: "Apakah Danivisual melayani dokumentasi di luar Jakarta?",
          answer:
            "Ya, kami melayani dokumentasi wedding dan prewedding outdoor di seluruh Indonesia. Untuk acara di luar Jakarta, akan ada biaya tambahan untuk transport dan akomodasi tim fotografer (pesawat/kereta, hotel, meal allowance). Biaya ini akan kami hitung dan informasikan di awal berdasarkan lokasi tujuan. Kami sudah berpengalaman cover wedding di Bali, Yogyakarta, Bandung, Surabaya, hingga destination wedding di Labuan Bajo dan Raja Ampat.",
        },
        {
          question: "Bagaimana kebijakan hak cipta foto?",
          answer:
            "Hak cipta foto tetap berada di tangan Danivisual sebagai creator. Namun, Anda memiliki hak penuh untuk menggunakan foto-foto tersebut untuk keperluan personal: cetak, bagikan ke keluarga, posting di media sosial, buat album digital, atau kenang-kenangan lainnya. Yang tidak diperbolehkan adalah penggunaan komersial (dijual, digunakan untuk iklan produk, atau publikasi berbayar) tanpa izin tertulis dari kami. Jika ada kebutuhan komersial, silakan diskusikan untuk licensing agreement.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-20 px-6 lg:px-8 bg-background-soft border-b border-border-line">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-16 h-[1px] bg-premium-beige mx-auto mb-8" />
          <h1
            className="text-4xl lg:text-6xl mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Frequently Asked Questions
          </h1>
          <p className="text-foreground-secondary max-w-2xl mx-auto">
            Temukan jawaban lengkap untuk pertanyaan seputar layanan, proses, dan kebijakan Danivisual
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {faqCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <div key={categoryIndex} className="bg-white border border-border-line rounded-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-premium-beige/10 rounded-sm flex items-center justify-center">
                    <Icon size={20} className="text-premium-beige" />
                  </div>
                  <h2
                    className="text-2xl lg:text-3xl"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {category.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const isOpen = openIndexes[categoryIndex] === faqIndex;
                    return (
                      <div
                        key={faqIndex}
                        className="border border-border-line rounded-sm overflow-hidden"
                      >
                        <button
                          onClick={() => toggleFAQ(categoryIndex, faqIndex)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-background-soft transition-colors"
                        >
                          <h3
                            className="text-base lg:text-lg pr-4"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {faq.question}
                          </h3>
                          <ChevronDown
                            size={20}
                            className={`shrink-0 text-premium-beige transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 pt-2">
                            <p className="text-foreground-secondary leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-8 bg-background-soft border-t border-border-line">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl lg:text-4xl mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Masih Ada Pertanyaan?
          </h2>
          <p className="text-foreground-secondary mb-8 max-w-2xl mx-auto">
            Tim kami siap membantu menjawab pertanyaan spesifik Anda. Jangan ragu untuk menghubungi kami via WhatsApp atau kirim inquiry detail melalui form contact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/6282337279636"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm tracking-wide"
            >
              Chat via WhatsApp
            </a>
            <Link
              to="/packages"
              className="inline-flex items-center justify-center px-8 py-4 border border-border-line text-foreground hover:bg-white transition-all rounded-sm text-sm tracking-wide"
            >
              Lihat Paket Lengkap
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
