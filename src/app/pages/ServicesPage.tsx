import { ArrowRight, Check, Clock3, GalleryHorizontal, LayoutDashboard, Sparkles } from "lucide-react";
import { Link } from "react-router";
import PageIntro from "../components/PageIntro";
import { mediaAssets } from "../data/mediaAssets";

export default function ServicesPage() {
  const services = [
    {
      id: "wedding",
      eyebrow: "Signature Service",
      title: "Wedding Photography",
      description:
        "Dokumentasi akad, pemberkatan, resepsi, intimate wedding, family moment, detail dekorasi, candid, dan momen utama.",
      narrative:
        "Setiap rangkaian wedding kami arahkan dengan pendekatan tenang dan editorial, menjaga emosi keluarga, detail dekorasi, serta momen sakral tetap terasa natural dan timeless.",
      image: mediaAssets.wedding.couplePortrait,
      meta: [
        { label: "Coverage", value: "Full Day" },
        { label: "Highlight", value: "H+2 Story" },
        { label: "Access", value: "Client Portal" },
      ],
      includes: [
        "Full day coverage",
        "Edited photos",
        "Online gallery",
        "Private dashboard",
        "H+2 story photos",
        "Album selection",
      ],
    },
    {
      id: "prewedding",
      eyebrow: "Editorial Session",
      title: "Prewedding",
      description:
        "Konsep indoor atau outdoor dengan moodboard editorial, arahan pose, dan visual romantic modern.",
      narrative:
        "Prewedding dirancang sebagai sesi visual yang personal: mulai dari moodboard, pilihan lokasi, wardrobe direction, sampai arahan pose yang membuat pasangan tetap nyaman.",
      image: mediaAssets.editorial.outdoorCouple,
      meta: [
        { label: "Direction", value: "Moodboard" },
        { label: "Session", value: "Indoor / Outdoor" },
        { label: "Style", value: "Romantic Editorial" },
      ],
      includes: [
        "Location planning",
        "Concept direction",
        "Moodboard",
        "Edited photos",
        "Online gallery",
      ],
    },
    {
      id: "event",
      eyebrow: "Event Storytelling",
      title: "Event Documentation",
      description:
        "Dokumentasi engagement, birthday, corporate, gathering, private celebration, dan event lainnya.",
      narrative:
        "Kami menangkap ritme acara secara utuh: ambience venue, interaksi tamu, detail program, dan momen penting yang perlu terasa hidup saat dilihat kembali.",
      image: mediaAssets.wedding.group,
      meta: [
        { label: "Coverage", value: "Flexible Hours" },
        { label: "Output", value: "Highlight Photos" },
        { label: "Focus", value: "Candid Moments" },
      ],
      includes: [
        "Event coverage",
        "Candid documentation",
        "Highlight photos",
        "Edited photos",
        "Online gallery",
      ],
    },
    {
      id: "studio",
      eyebrow: "Studio Portrait",
      title: "Studio",
      description:
        "Portrait studio, family session, product lookbook, dan kebutuhan visual personal branding.",
      narrative:
        "Sesi studio dibuat dengan lighting yang rapi, konsep yang jelas, dan arahan visual yang membantu subjek tampil percaya diri tanpa kehilangan karakter personal.",
      image: mediaAssets.wedding.ringPortrait,
      meta: [
        { label: "Setup", value: "Premium Lighting" },
        { label: "Concept", value: "Directed Session" },
        { label: "Output", value: "Online Gallery" },
      ],
      includes: [
        "Studio session",
        "Lighting setup",
        "Concept direction",
        "Online gallery",
      ],
    },
    {
      id: "others",
      eyebrow: "Personal Moments",
      title: "Peristiwa Lainnya",
      description:
        "Dokumentasi momen keluarga, syukuran, wisuda, lamaran, dan peristiwa personal lainnya.",
      narrative:
        "Untuk momen personal yang lebih kecil, kami tetap menjaga pendekatan visual yang hangat, bersih, dan terkurasi agar dokumentasi terasa berharga.",
      image: mediaAssets.wedding.family,
      meta: [
        { label: "Coverage", value: "Flexible" },
        { label: "Delivery", value: "Edited Photos" },
        { label: "Mood", value: "Warm & Honest" },
      ],
      includes: ["Flexible coverage", "Edited photos", "Online gallery", "Highlight photos"],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <PageIntro
        eyebrow="Curated Services"
        title="Our Services"
        description="Pilih layanan dokumentasi yang sesuai dengan kebutuhan momen Anda, dirancang dengan arahan visual yang rapi, hangat, dan editorial."
      />

      {/* Services */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-20 lg:space-y-24">
          {services.map((service, index) => (
            <div
              key={service.id}
              id={service.id}
              className="grid grid-cols-1 items-center gap-10 border-b border-border-line pb-20 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1fr)] lg:gap-16"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div className="relative mx-auto max-w-[520px] overflow-hidden rounded-sm bg-background-soft lg:max-w-none">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="aspect-[4/5] max-h-[720px] w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/80">{service.eyebrow}</p>
                  </div>
                </div>
              </div>
              <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                <div className="mb-6 h-[1px] w-12 bg-premium-beige" />
                <p className="mb-3 text-xs uppercase tracking-[0.24em] text-premium-beige">
                  {service.eyebrow}
                </p>
                <h2
                  className="text-3xl lg:text-4xl mb-4"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {service.title}
                </h2>
                <p className="mb-4 text-lg leading-relaxed text-foreground-secondary">
                  {service.description}
                </p>
                <p className="mb-7 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                  {service.narrative}
                </p>

                <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {service.meta.map((item) => (
                    <div key={item.label} className="border border-border-line bg-background-soft px-4 py-3">
                      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-foreground-secondary">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-3">
                    <Sparkles size={16} className="text-premium-beige" />
                    <h3 className="text-sm uppercase tracking-widest font-medium">
                      Included Experience
                    </h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {service.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 border border-border-line px-4 py-3 text-sm text-foreground-secondary">
                        <Check size={15} className="text-premium-beige shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-3 text-sm text-foreground-secondary sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-premium-beige" />
                    <span>Clear timeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GalleryHorizontal size={16} className="text-premium-beige" />
                    <span>Curated gallery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-premium-beige" />
                    <span>Private review</span>
                  </div>
                </div>

                <Link
                  to="/packages"
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-dark-premium px-6 py-3 text-sm text-white transition-all hover:bg-dark-premium/90"
                >
                  Book This Service
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
