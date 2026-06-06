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
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageIntro from "../components/PageIntro";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";
import { useAdmin } from "../contexts/AdminContext";

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

const faqCategoriesEn: FAQCategory[] = [
  {
    id: "booking",
    title: "Reservation",
    label: "Schedule & Reservation",
    icon: CalendarCheck,
    faqs: [
      {
        question: "How do I reserve a wedding date with Danivisual?",
        answer:
          "Start from Reserve Date, choose your wedding package and service format, complete the essential event details, then upload the booking deposit proof. You can begin without creating an account.",
      },
      {
        question: "Is my date secured immediately after booking?",
        answer:
          "Your date is held after the deposit proof is received. Our admin team will verify the payment and confirm the schedule with you via WhatsApp.",
      },
      {
        question: "When should I reserve my date?",
        answer:
          "We recommend reserving 2-4 months before the event. For weekend or high-demand dates, earlier reservation gives you a more comfortable planning window.",
      },
    ],
  },
  {
    id: "payment",
    title: "Payment",
    label: "Deposit & Settlement",
    icon: CreditCard,
    faqs: [
      {
        question: "How much is the booking deposit?",
        answer:
          "The booking deposit is IDR 500,000. It secures your date and will be counted toward the total package payment.",
      },
      {
        question: "How does the remaining payment work?",
        answer:
          "The remaining balance will be confirmed after your booking is verified. The final amount follows the selected package, add-ons, and documentation needs agreed with our team.",
      },
      {
        question: "Is the deposit refundable?",
        answer:
          "The deposit is non-refundable because the date is reserved for your event. If you need to reschedule, our admin will help check the closest available date.",
      },
    ],
  },
  {
    id: "package",
    title: "Packages",
    label: "Packages & Add-ons",
    icon: PackageCheck,
    faqs: [
      {
        question: "What is the difference between Basic, Premium, and Exclusive?",
        answer:
          "Each tier differs in output volume, album or physical deliverables, and documentation coverage. The full inclusions appear once you select a package and service format.",
      },
      {
        question: "Can I choose photo only or video only?",
        answer:
          "Yes. Wedding packages can be booked as Photo, Video, or Photo + Video, with transparent pricing shown before checkout.",
      },
      {
        question: "Can add-ons be added after booking?",
        answer:
          "Yes, as long as the schedule and production setup still allow it. Add-ons such as drone, extra session, albums, or additional prints will be confirmed by our admin.",
      },
    ],
  },
  {
    id: "process",
    title: "Coverage",
    label: "Event Day & Coverage",
    icon: Images,
    faqs: [
      {
        question: "How long does the wedding coverage last?",
        answer:
          "All wedding packages include up to 9 working hours for Akad and Reception coverage, unless you add extra coverage time.",
      },
      {
        question: "Will the team arrive before the event starts?",
        answer:
          "Yes. Our team arrives earlier to review the venue, lighting, rundown, and essential coordination with family or other vendors.",
      },
      {
        question: "Can we request specific angles or moments?",
        answer:
          "Absolutely. Share your notes during booking or with our admin, such as family portraits, decor details, special processions, or preferred visual references.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    label: "Files & Albums",
    icon: Truck,
    faqs: [
      {
        question: "How will the photo or video files be delivered?",
        answer:
          "Preview files and digital deliveries are shared online. For physical albums, delivery can be arranged through courier, COD, or office pickup.",
      },
      {
        question: "Do I need to add a delivery address during booking?",
        answer:
          "Not yet. Our admin will follow up on delivery details after the event, keeping the reservation flow short and effortless.",
      },
      {
        question: "Is there a packing fee for courier delivery?",
        answer:
          "If you choose courier delivery for a physical album, a packing fee of IDR 35,000 will be added to the booking summary.",
      },
    ],
  },
  {
    id: "policy",
    title: "Terms",
    label: "Privacy & Terms",
    icon: ShieldCheck,
    faqs: [
      {
        question: "Will our photos be published in the portfolio?",
        answer:
          "We respect every client’s privacy. Portfolio publication will always follow your permission and comfort level.",
      },
      {
        question: "Are raw files included?",
        answer:
          "Raw files are not included in the main packages. If you need specific additional files, our admin can help review them as an add-on request.",
      },
      {
        question: "What if I need to change my package?",
        answer:
          "Package or add-on changes are handled through our admin so the schedule, team needs, and total payment remain clearly documented.",
      },
    ],
  },
];

export default function FAQPage() {
  const { language, t } = useLanguage();
  const { getField } = useContent();
  const { faqs: adminFaqs } = useAdmin();
  const [activeCategoryId, setActiveCategoryId] = useState(faqCategories[0].id);
  const [openIndex, setOpenIndex] = useState(0);
  const adminFaqCategories = useMemo(() => {
    // Get all published FAQs from AdminContext
    // Note: loadFaqs() now ensures defaultFaqs are loaded when Supabase/localStorage are empty
    // So adminFaqs should always have data (from Supabase -> localStorage -> defaultFaqs fallback)
    const publishedFaqs = adminFaqs
      .filter((faq) => faq.isPublished)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (publishedFaqs.length === 0) return null;

    const groups = new Map<string, typeof publishedFaqs>();
    publishedFaqs.forEach((faq) => {
      const categoryName = faq.category || "FAQ";
      groups.set(categoryName, [...(groups.get(categoryName) || []), faq]);
    });

    const iconForCategory = (categoryName: string) => {
      const normalized = categoryName.toLowerCase();
      if (normalized.includes("booking") || normalized.includes("reservasi") || normalized.includes("jadwal")) return CalendarCheck;
      if (normalized.includes("payment") || normalized.includes("bayar") || normalized.includes("dp")) return CreditCard;
      if (normalized.includes("paket") || normalized.includes("package") || normalized.includes("add")) return PackageCheck;
      if (normalized.includes("proses") || normalized.includes("hari") || normalized.includes("dokumentasi")) return Images;
      if (normalized.includes("hasil") || normalized.includes("delivery") || normalized.includes("album")) return Truck;
      if (normalized.includes("privasi") || normalized.includes("policy") || normalized.includes("ketentuan")) return ShieldCheck;
      return HelpCircle;
    };

    return Array.from(groups.entries()).map(([categoryName, items]) => ({
      id: categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      title: categoryName,
      label: categoryName,
      icon: iconForCategory(categoryName),
      faqs: items.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    }));
  }, [adminFaqs]);
  const localizedFaqCategories = adminFaqCategories ?? (language === "ID" ? faqCategories : faqCategoriesEn);

  useEffect(() => {
    if (!localizedFaqCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(localizedFaqCategories[0].id);
      setOpenIndex(0);
    }
  }, [activeCategoryId, localizedFaqCategories]);

  const activeCategory = useMemo(
    () => localizedFaqCategories.find((category) => category.id === activeCategoryId) ?? localizedFaqCategories[0],
    [activeCategoryId, localizedFaqCategories],
  );

  const ActiveIcon = activeCategory.icon;

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setOpenIndex(0);
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      <PageIntro
        eyebrow={getField("faq", "intro", "eyebrow", t({ ID: "Panduan Klien", EN: "Client Guide" }))}
        title={getField("faq", "intro", "title", t({ ID: "Pertanyaan yang Sering Dibahas", EN: "Frequently Asked Questions" }))}
        description={getField("faq", "intro", "description", t({
          ID: "Jawaban ringkas untuk membantu Anda memahami alur reservasi, pilihan paket, pembayaran, hingga pengiriman hasil bersama Danivisual.",
          EN: "A polished guide to help you understand reservations, package options, payment flow, production process, and final delivery with Danivisual.",
        }))}
      />

      <section className="px-5 py-12 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-border-line bg-white p-3">
              {localizedFaqCategories.map((category, index) => {
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
                    {t({ ID: "Butuh Arahan", EN: "Need Guidance" })}
                  </p>
                  <h3 className="text-2xl leading-tight">
                    {t({ ID: "Masih menimbang?", EN: "Still deciding?" })}
                  </h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-foreground-secondary">
                {t({
                  ID: "Jika ada detail acara yang belum pasti, tetap bisa booking dahulu. Admin akan bantu follow up dekorasi, rundown, dan kebutuhan teknis setelah DP diverifikasi.",
                  EN: "If some event details are still evolving, you can reserve the date first. Our admin will follow up on decor, rundown, and technical needs after the deposit is verified.",
                })}
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  to="/booking"
                  className="group flex min-h-12 w-full items-center justify-between bg-dark-premium px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                >
                  {t({ ID: "Reservasi Sekarang", EN: "Reserve Date" })}
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="https://wa.me/6282337279636?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20booking%20Danivisual."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 w-full items-center justify-center border border-border-line bg-white px-5 text-sm font-semibold uppercase tracking-[0.18em] transition-colors hover:border-premium-beige hover:bg-background-soft"
                >
                  {t({ ID: "Chat Admin", EN: "Chat with Admin" })}
                </a>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border-line pt-5">
                <div>
                  <p className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {t({ ID: "9 Jam", EN: "9 Hours" })}
                  </p>
                  <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-foreground-secondary">
                    {t({ ID: "Akad + Resepsi", EN: "Ceremony + Reception" })}
                  </p>
                </div>
                <div>
                  <p className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                    500k
                  </p>
                  <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-foreground-secondary">
                    {t({ ID: "DP Booking", EN: "Booking Deposit" })}
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
