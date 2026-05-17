import { Link } from "react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { mediaAssets } from "../data/mediaAssets";

type HeroSlide = {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
};

const heroSlides: HeroSlide[] = [
  {
    id: "wedding-story",
    type: "image",
    src: mediaAssets.hero.akad,
    alt: "Dokumentasi akad wedding Danivisual",
  },
  {
    id: "outdoor-couple",
    type: "image",
    src: mediaAssets.editorial.outdoorCouple,
    alt: "Potret wedding outdoor Danivisual",
  },
  {
    id: "wedding-moment",
    type: "image",
    src: mediaAssets.hero.moment,
    alt: "Momen wedding Danivisual",
  },
];

const featuredStories = [
  {
    id: 1,
    category: "WEDDING",
    title: "Dani & Sinta",
    location: "Four Seasons Jakarta",
    date: "20 Januari 2026",
    image: mediaAssets.wedding.couplePortrait,
  },
  {
    id: 2,
    category: "PREWED STUDIO",
    title: "Rama & Dita",
    location: "Studio Danivisual",
    date: "15 Januari 2026",
    image: mediaAssets.wedding.ringPortrait,
  },
  {
    id: 3,
    category: "PREWED OUTDOOR",
    title: "Andi & Maya",
    location: "Bromo, Jawa Timur",
    date: "10 Januari 2026",
    image: mediaAssets.editorial.outdoorCouple,
  },
  {
    id: 4,
    category: "EVENT",
    title: "Corporate Gala Night",
    location: "Grand Hyatt Jakarta",
    date: "5 Januari 2026",
    image: mediaAssets.wedding.group,
  },
  {
    id: 5,
    category: "AKAD CEREMONY",
    title: "Naufal & Kirana",
    location: "The Langham Jakarta",
    date: "28 Desember 2025",
    image: mediaAssets.hero.akad,
  },
  {
    id: 6,
    category: "INTIMATE WEDDING",
    title: "Arga & Meira",
    location: "Plataran Menteng",
    date: "18 Desember 2025",
    image: mediaAssets.wedding.detailPortrait,
  },
  {
    id: 7,
    category: "FAMILY SESSION",
    title: "Hendra Family",
    location: "InterContinental Jakarta",
    date: "12 Desember 2025",
    image: mediaAssets.wedding.family,
  },
  {
    id: 8,
    category: "RECEPTION",
    title: "Rizky & Anindya",
    location: "Ayana Midplaza",
    date: "30 November 2025",
    image: mediaAssets.wedding.table,
  },
  {
    id: 9,
    category: "DETAIL STORY",
    title: "The Ring Moment",
    location: "Private Residence",
    date: "22 November 2025",
    image: mediaAssets.hero.ring,
  },
  {
    id: 10,
    category: "EDITORIAL WEDDING",
    title: "Bagas & Livia",
    location: "Tugu Kunstkring Paleis",
    date: "9 November 2025",
    image: mediaAssets.hero.moment,
  },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative flex h-[100svh] min-h-[620px] items-center justify-center overflow-hidden sm:h-[100dvh] sm:min-h-[640px]">
        <div className="absolute inset-0 bg-black">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                activeSlide === index ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={activeSlide !== index}
            >
              {slide.type === "video" ? (
                <video
                  className="h-full w-full object-cover object-center"
                  src={slide.src}
                  poster={slide.poster}
                  autoPlay={activeSlide === index}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="h-full w-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/62 via-black/20 to-black/72 sm:from-black/54 sm:via-black/22 sm:to-black/68" />
        <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/60 to-transparent sm:h-40" />

        <div className="relative z-20 mx-auto flex h-full w-full max-w-5xl items-end justify-center px-6 pb-16 pt-24 text-center text-white sm:items-center sm:px-8 sm:pb-0 sm:pt-20">
          <div className="w-full max-w-[420px] sm:max-w-xl">
            <div className="mx-auto mb-6 h-[1px] w-14 bg-soft-gold sm:mb-7 sm:w-16" />
            <p className="mx-auto mb-7 max-w-[280px] text-xs font-medium uppercase tracking-[0.22em] text-white/88 sm:max-w-none sm:text-sm">
              Reserve your wedding date with Danivisual.
            </p>
            <Link
              to="/packages"
              className="mx-auto flex min-h-14 w-full items-center justify-center rounded-xl bg-black px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition-all hover:bg-black/90 sm:min-h-[58px] sm:max-w-[360px]"
            >
              BOOKING NOW
            </Link>
          </div>
        </div>

      </section>

      {/* Featured Stories */}
      <section className="bg-background px-5 py-14 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-2xl text-center lg:mb-14">
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-premium-beige">Selected works</p>
            <h2
              className="mb-4 text-3xl lg:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Featured Stories
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-foreground-secondary">
              Kurasi singkat dari cerita wedding dan editorial yang dibuat dengan rasa tenang, detail, dan timeless.
            </p>
          </div>

          <div className="story-marquee -mx-5 overflow-hidden px-5 lg:-mx-8 lg:px-8">
            <div className="story-marquee-track flex w-max gap-4">
              {[...featuredStories, ...featuredStories].map((story, index) => (
              <Link
                key={`${story.id}-${index}`}
                to={`/portfolio/${story.id}`}
                className="group relative w-[78vw] max-w-[310px] shrink-0 overflow-hidden border border-border-line bg-white transition-all hover:border-premium-beige sm:w-[320px] lg:w-[292px]"
                aria-hidden={index >= featuredStories.length}
                tabIndex={index >= featuredStories.length ? -1 : 0}
              >
                <div className="aspect-[5/6] overflow-hidden bg-background-soft">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4 md:p-5">
                  <span className="text-[10px] tracking-[0.22em] text-premium-beige uppercase">
                    {story.category}
                  </span>
                  <h3
                    className="mt-2 mb-1 text-xl"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {story.title}
                  </h3>
                  <p className="mb-1 text-xs text-foreground-secondary">{story.location}</p>
                  <p className="text-xs text-foreground-secondary">{story.date}</p>
                  <div className="mt-4 flex items-center text-xs uppercase tracking-[0.16em] text-foreground transition group-hover:text-premium-beige">
                    View Story <ArrowRight size={14} className="ml-2" />
                  </div>
                </div>
              </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="bg-background-soft px-5 py-14 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-5 border-b border-border-line pb-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-premium-beige">Services</p>
            <h2
              className="text-3xl lg:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Our Visual Experiences
            </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-foreground-secondary lg:justify-self-end">
              Pilihan layanan dibuat ringkas agar customer mudah memilih kebutuhan visual tanpa membaca terlalu banyak di awal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            {[
              {
                number: "01",
                title: "Wedding",
                description: "Dokumentasi lengkap momen pernikahan Anda",
                image: mediaAssets.wedding.couplePortrait,
              },
              {
                number: "02",
                title: "Prewedding",
                description: "Konsep editorial indoor atau outdoor",
                image: mediaAssets.editorial.outdoorCouple,
              },
              {
                number: "03",
                title: "Event",
                description: "Dokumentasi celebration dan corporate",
                image: mediaAssets.wedding.group,
              },
              {
                number: "04",
                title: "Studio",
                description: "Portrait, family, dan personal branding",
                image: mediaAssets.wedding.ringPortrait,
              },
              {
                number: "05",
                title: "Peristiwa Lainnya",
                description: "Momen keluarga dan peristiwa personal",
                image: mediaAssets.wedding.family,
              },
            ].map((service, index) => (
              <div
                key={index}
                className="group border border-border-line bg-white transition-all hover:border-premium-beige"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-background">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-premium-beige">{service.number}</span>
                    <div className="h-px flex-1 bg-border-line" />
                  </div>
                  <h3 className="mb-2 text-xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {service.title}
                  </h3>
                  <p className="min-h-[38px] text-xs leading-relaxed text-foreground-secondary">{service.description}</p>
                  <Link
                    to="/packages"
                    className="mt-4 inline-flex items-center border-b border-premium-beige/60 pb-1 text-xs uppercase tracking-[0.16em] text-foreground transition hover:text-premium-beige"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 lg:py-32 px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-12 h-[1px] bg-premium-beige mb-8" />
              <h2
                className="text-4xl lg:text-5xl mb-6"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Every Frame Has a Feeling
              </h2>
              <p className="text-foreground-secondary leading-relaxed mb-6">
                Danivisual adalah studio visual yang berfokus pada cerita, rasa, dan detail. Dari
                janji pernikahan, prewedding, hingga event penting, setiap frame dibuat untuk
                menjadi kenangan yang bertahan lama.
              </p>
              <p className="text-foreground-secondary leading-relaxed mb-8">
                Kami percaya bahwa fotografi bukan hanya tentang mengabadikan momen, tetapi tentang
                merasakan kembali emosi yang terjadi di dalamnya.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
              >
                Meet Danivisual
              </Link>
            </div>
            <div className="relative">
              <img
                src={mediaAssets.wedding.detailPortrait}
                alt="About Danivisual"
                className="w-full rounded-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-32 px-5 lg:px-8 bg-background-soft">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl lg:text-5xl mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              How It Works
            </h2>
          </div>

          <div className="relative mx-auto max-w-2xl space-y-8 md:grid md:max-w-none md:grid-cols-2 md:space-y-0 lg:grid-cols-4 md:gap-8">
            {[
              { step: "01", title: "Pilih Paket", description: "Pilih kategori, paket, dan jenis layanan." },
              { step: "02", title: "Checkout & DP", description: "Isi data acara dan upload bukti DP." },
              { step: "03", title: "Akun Otomatis", description: "Akun customer dibuat setelah DP diverifikasi." },
              { step: "04", title: "Pantau Progress", description: "Lihat My Booking dan Progress di portal client." },
            ].map((item, index) => (
              <div key={index} className="relative pl-12 text-left md:pl-0 md:text-center">
                {index < 3 && <div className="absolute left-[15px] top-10 h-[calc(100%+32px)] w-px bg-premium-beige/50 md:hidden" />}
                <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center border border-premium-beige bg-background-soft text-xs text-premium-beige md:static md:mx-auto md:mb-4 md:h-auto md:w-auto md:border-0 md:bg-transparent md:text-6xl md:text-premium-beige/20" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.step}
                </div>
                <h3 className="text-xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.title}
                </h3>
                <p className="text-sm text-foreground-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="relative overflow-hidden px-6 py-20 text-white lg:px-8 lg:py-32">
        <img
          src={mediaAssets.ui.ctaBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.42),transparent_28%,transparent_72%,rgba(0,0,0,0.42))]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2
            className="text-4xl lg:text-5xl mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Let's Create Your Visual Story
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Ceritakan rencana wedding, prewedding, atau event Anda. Tim Danivisual siap membantu
            mengabadikannya dengan indah.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/packages"
              className="px-8 py-4 bg-white text-foreground hover:bg-white/90 transition-all rounded-sm text-sm tracking-wide"
            >
              View Packages
            </Link>
            <a
              href="https://wa.me/6282337279636"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white text-white hover:bg-white/10 transition-all rounded-sm text-sm tracking-wide"
            >
              Chat via WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
