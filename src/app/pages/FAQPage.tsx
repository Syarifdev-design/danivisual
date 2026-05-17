import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Images,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { mediaAssets } from "../data/mediaAssets";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  label: string;
  icon: typeof HelpCircle;
  faqs: FAQ[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "booking",
    title: "Booking",
    label: "Jadwal & Reservasi",
    icon: CalendarCheck,
    faqs: [
      {
        question: "Bagaimana cara booking wedding di Danivisual?",
        answer:
          "Klik Booking Now, pilih paket Wedding, pilih jenis layanan Photo, Video, atau Photo + Video, isi data singkat, lalu upload bukti DP. Customer tidak perlu login atau register di awal.",
      },
      {
        question: "Apakah tanggal langsung aman setelah booking?",
        answer:
          "Tanggal akan kami hold setelah bukti DP masuk. Tim admin akan melakukan verifikasi dan menghubungi Anda melalui WhatsApp untuk konfirmasi final.",
      },
      {
        question: "Kapan sebaiknya saya melakukan booking?",
        answer:
          "Idealnya 2-4 bulan sebelum acara. Untuk tanggal ramai atau weekend besar, booking lebih awal akan lebih aman karena slot dokumentasi terbatas.",
      },
    ],
  },
  {
    id: "payment",
    title: "Payment",
    label: "DP & Pelunasan",
    icon: CreditCard,
    faqs: [
      {
        question: "Berapa DP untuk mengamankan jadwal?",
        answer:
          "DP booking adalah Rp 500.000. DP digunakan untuk mengamankan tanggal dan akan masuk ke total pembayaran paket yang dipilih.",
      },
      {
        question: "Bagaimana sistem pelunasan?",
        answer:
          "Sisa pembayaran akan dikonfirmasi admin setelah booking diverifikasi. Alur pelunasan mengikuti paket, add-on, dan kebutuhan dokumentasi yang disepakati.",
      },
      {
        question: "Apakah DP bisa dikembalikan?",
        answer:
          "DP bersifat non-refundable karena tanggal sudah kami hold. Jika perlu reschedule, admin akan membantu mengecek ketersediaan tanggal pengganti.",
      },
    ],
  },
  {
    id: "package",
    title: "Package",
    label: "Paket & Add-On",
    icon: PackageCheck,
    faqs: [
      {
        question: "Apa perbedaan Basic, Premium, dan Exclusive?",
        answer:
          "Perbedaan ada pada jumlah output, album atau media fisik, serta kelengkapan dokumentasi. Detail include akan muncul setelah Anda memilih paket dan jenis layanan.",
      },
      {
        question: "Apakah bisa memilih Photo saja atau Video saja?",
        answer:
          "Bisa. Setiap paket Wedding memiliki pilihan Photo, Video, dan Photo + Video dengan harga yang langsung terlihat sebelum checkout.",
      },
      {
        question: "Apakah add-on bisa ditambahkan setelah booking?",
        answer:
          "Bisa selama masih memungkinkan secara jadwal dan teknis. Add-on seperti drone, extra session, album, atau print tambahan akan dikonfirmasi admin.",
      },
    ],
  },
  {
    id: "process",
    title: "Process",
    label: "Hari H & Dokumentasi",
    icon: Images,
    faqs: [
      {
        question: "Berapa lama durasi kerja paket wedding?",
        answer:
          "Semua paket wedding memiliki batas waktu maksimal 9 jam kerja untuk acara Akad + Resepsi, kecuali ada add-on tambahan durasi.",
      },
      {
        question: "Apakah tim datang lebih awal?",
        answer:
          "Tim akan datang lebih awal untuk cek lokasi, lighting, rundown, dan koordinasi singkat dengan keluarga atau vendor acara.",
      },
      {
        question: "Apakah bisa request angle atau momen tertentu?",
        answer:
          "Bisa. Masukkan catatan saat booking atau sampaikan ke admin, seperti request keluarga inti, detail dekorasi, prosesi khusus, atau angle yang diinginkan.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    label: "Hasil & Album",
    icon: Truck,
    faqs: [
      {
        question: "Bagaimana hasil foto atau video dikirim?",
        answer:
          "Preview dan file digital akan dibagikan secara online. Untuk album fisik, metode pengiriman bisa dipilih melalui Ekspedisi, COD, atau ambil ke kantor.",
      },
      {
        question: "Apakah alamat pengiriman perlu diisi saat booking?",
        answer:
          "Tidak perlu. Detail alamat pengiriman akan difollow up admin setelah hari H agar proses booking tetap singkat dan tidak terasa ribet.",
      },
      {
        question: "Apakah ada biaya packing untuk ekspedisi?",
        answer:
          "Jika memilih Ekspedisi untuk album fisik, packing fee Rp 35.000 akan ditambahkan ke summary booking.",
      },
    ],
  },
  {
    id: "policy",
    title: "Policy",
    label: "Privasi & Ketentuan",
    icon: ShieldCheck,
    faqs: [
      {
        question: "Apakah foto akan diposting di portfolio?",
        answer:
          "Kami menghargai privasi client. Publikasi portfolio akan disesuaikan dengan izin dan kenyamanan Anda.",
      },
      {
        question: "Apakah file mentah diberikan?",
        answer:
          "File mentah tidak termasuk dalam paket utama. Jika membutuhkan file tambahan tertentu, silakan konsultasikan dengan admin sebagai add-on.",
      },
      {
        question: "Bagaimana jika ada perubahan paket?",
        answer:
          "Perubahan paket atau add-on dilakukan melalui admin agar jadwal, kebutuhan tim, dan total pembayaran tetap tercatat dengan jelas.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(faqCategories[0].id);
  const [openIndex, setOpenIndex] = useState(0);

  const activeCategory = useMemo(
    () => faqCategories.find((category) => category.id === activeCategoryId) ?? faqCategories[0],
    [activeCategoryId],
  );

  const ActiveIcon = activeCategory.icon;

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setOpenIndex(0);
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      <section className="border-b border-border-line bg-background-soft px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-end gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
          <div className="max-w-3xl">
            <div className="mb-7 flex items-center gap-5">
              <span className="h-px w-14 bg-premium-beige" />
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.42em] text-premium-beige">
                Client Guide
              </span>
            </div>
            <h1 className="max-w-3xl text-[3rem] leading-[0.96] tracking-[-0.01em] sm:text-[4.75rem] lg:text-[6rem]">
              Frequently Asked Questions
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-foreground-secondary sm:text-lg">
              Jawaban singkat untuk hal yang paling sering ditanyakan sebelum melakukan booking
              wedding bersama Danivisual.
            </p>
          </div>

          <div className="overflow-hidden border border-border-line bg-white">
            <div className="relative h-64 sm:h-80">
              <img
                src={mediaAssets.wedding.ringPortrait}
                alt="Danivisual wedding detail"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.36em] text-white/75">
                  Quick Booking
                </p>
                <p className="mt-2 max-w-xs text-lg leading-7">
                  Pilih paket, upload DP, lalu admin akan follow up detail acara Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-border-line bg-white p-3">
              {faqCategories.map((category, index) => {
                const Icon = category.icon;
                const isActive = category.id === activeCategoryId;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`group flex min-h-16 w-full items-center gap-4 border px-4 py-3 text-left transition-all ${
                      isActive
                        ? "border-premium-beige bg-background-soft"
                        : "border-transparent hover:border-border-line hover:bg-background-soft/70"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center border transition-colors ${
                        isActive
                          ? "border-premium-beige bg-white text-dark-premium"
                          : "border-border-line text-premium-beige"
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.68rem] uppercase tracking-[0.28em] text-premium-beige">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="mt-1 block text-sm font-semibold uppercase tracking-[0.18em]">
                        {category.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main>
            <div className="mb-8 border-b border-border-line pb-7">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center border border-premium-beige bg-background-soft text-premium-beige">
                  <ActiveIcon size={20} strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-premium-beige">
                    {activeCategory.label}
                  </p>
                  <h2 className="mt-1 text-3xl leading-tight sm:text-4xl">{activeCategory.title}</h2>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border-line border-y border-border-line">
              {activeCategory.faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <article key={faq.question} className="bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                      className="grid w-full grid-cols-[42px_minmax(0,1fr)_36px] items-center gap-4 py-6 text-left transition-colors hover:bg-background-soft/70 sm:grid-cols-[56px_minmax(0,1fr)_42px] sm:px-4"
                    >
                      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-premium-beige">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xl leading-snug sm:text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                        {faq.question}
                      </span>
                      <span
                        className={`flex h-9 w-9 items-center justify-center border border-border-line text-premium-beige transition-all ${
                          isOpen ? "rotate-180 bg-background-soft" : ""
                        }`}
                      >
                        <ChevronDown size={18} strokeWidth={1.6} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="pb-7 pl-[58px] pr-4 sm:pl-[76px]">
                        <p className="max-w-3xl text-[0.96rem] leading-8 text-foreground-secondary">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-border-line bg-background-soft p-6">
              <div className="flex items-center gap-3 border-b border-border-line pb-5">
                <span className="flex h-10 w-10 items-center justify-center bg-dark-premium text-white">
                  <MessageCircle size={18} strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-premium-beige">
                    Need Help
                  </p>
                  <h3 className="text-2xl leading-tight">Still deciding?</h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-foreground-secondary">
                Jika ada detail acara yang belum pasti, tetap bisa booking dahulu. Admin akan bantu
                follow up dekorasi, rundown, dan kebutuhan teknis setelah DP diverifikasi.
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  to="/booking"
                  className="group flex min-h-12 w-full items-center justify-between bg-dark-premium px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                >
                  Booking Now
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="https://wa.me/6282337279636?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20booking%20Danivisual."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 w-full items-center justify-center border border-border-line bg-white px-5 text-sm font-semibold uppercase tracking-[0.18em] transition-colors hover:border-premium-beige hover:bg-background-soft"
                >
                  Chat Admin
                </a>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border-line pt-5">
                <div>
                  <p className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                    9 Jam
                  </p>
                  <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-foreground-secondary">
                    Akad + Resepsi
                  </p>
                </div>
                <div>
                  <p className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                    500k
                  </p>
                  <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-foreground-secondary">
                    DP Booking
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
