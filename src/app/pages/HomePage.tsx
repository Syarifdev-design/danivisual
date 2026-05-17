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
    id: "opening-film",
    type: "video",
    src: mediaAssets.hero.openingVideo,
    poster: mediaAssets.hero.akad,
    alt: "Video pembuka wedding Danivisual",
  },
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

const visualServices = [
  {
    number: "01",
    title: "Wedding",
    description: "Dokumentasi wedding dengan feel editorial, clean, dan timeless.",
    image: mediaAssets.wedding.couplePortrait,
    label: "Signature",
    cta: "Booking Wedding",
  },
  {
    number: "02",
    title: "Prewedding",
    description: "Indoor atau outdoor dengan mood yang matang.",
    image: mediaAssets.editorial.outdoorCouple,
    label: "Editorial",
    cta: "Explore",
  },
  {
    number: "03",
    title: "Event",
    description: "Celebration, gathering, dan corporate moment.",
    image: mediaAssets.wedding.group,
    label: "Coverage",
    cta: "Explore",
  },
  {
    number: "04",
    title: "Studio",
    description: "Portrait, family, dan personal branding.",
    image: mediaAssets.wedding.ringPortrait,
    label: "Portrait",
    cta: "Explore",
  },
  {
    number: "05",
    title: "Lainnya",
    description: "Momen personal dan keluarga yang ingin disimpan.",
    image: mediaAssets.wedding.family,
    label: "Personal",
    cta: "Explore",
  },
];

const aboutSlides = [
  {
    id: "vow-detail",
    image: mediaAssets.wedding.detailPortrait,
    alt: "Pasangan wedding Danivisual saat momen cincin",
  },
  {
    id: "couple-stage",
    image: mediaAssets.wedding.couplePortrait,
    alt: "Potret pasangan wedding Danivisual di pelaminan",
  },
  {
    id: "akad-close",
    image: mediaAssets.wedding.ceremony,
    alt: "Momen akad wedding Danivisual",
  },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeAboutSlide, setActiveAboutSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveAboutSlide((current) => (current + 1) % aboutSlides.length);
    }, 5200);

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

        <div className="relative z-20 mx-auto flex h-full w-full max-w-5xl items-end justify-center px-6 pb-14 pt-24 text-center text-white sm:items-center sm:px-8 sm:pb-0 sm:pt-20">
          <div className="w-full max-w-[430px] border border-white/18 bg-black/18 px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-[2px] sm:max-w-[560px] sm:px-8 sm:py-8">
            <div className="mx-auto mb-5 flex items-center justify-center gap-4 sm:mb-6">
              <span className="h-px w-12 bg-soft-gold" />
              <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/82">Wedding Date</span>
              <span className="h-px w-12 bg-soft-gold" />
            </div>
            <h1 className="mx-auto mb-4 max-w-[360px] text-4xl leading-[1.02] sm:max-w-none sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 400 }}>
              Reserve Your Story
            </h1>
            <p className="mx-auto mb-7 max-w-[310px] text-sm leading-relaxed text-white/84 sm:max-w-[440px] sm:text-base">
              Amankan tanggal wedding Anda dengan booking cepat, clean, dan tanpa proses yang ribet.
            </p>
            <Link
              to="/packages"
              className="group mx-auto flex min-h-[60px] w-full items-center justify-between rounded-full border border-soft-gold/70 bg-black px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_45px_rgba(0,0,0,0.36)] transition-all hover:-translate-y-0.5 hover:border-white/80 hover:bg-white hover:text-black sm:max-w-[390px]"
            >
              <span className="pl-2">BOOKING NOW</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-all group-hover:bg-black group-hover:text-white">
                <ArrowRight size={17} />
              </span>
            </Link>
            <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/62">Wedding Basic starts from 1,9 jt</p>
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
      <section className="bg-background-soft px-5 py-12 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 grid gap-5 border-b border-border-line pb-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
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
              Pilihan layanan dibuat ringkas, fokus, dan mudah diarahkan ke booking tanpa membaca terlalu banyak di awal.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <Link
              to="/packages"
              className="group grid overflow-hidden border border-border-line bg-white transition-all hover:border-premium-beige md:grid-cols-[0.95fr_1.05fr]"
            >
              <div className="relative min-h-[300px] overflow-hidden bg-background md:min-h-[360px]">
                <img
                  src={visualServices[0].image}
                  alt={visualServices[0].title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="mb-3 block text-[10px] uppercase tracking-[0.26em] text-white/70">{visualServices[0].label} Service</span>
                  <p className="max-w-xs text-sm leading-relaxed text-white/90">
                    Fokus utama Danivisual untuk momen akad dan resepsi dengan visual yang rapi, hangat, dan editorial.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between p-6 lg:p-8">
                <div>
                  <div className="mb-8 flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-premium-beige">{visualServices[0].number}</span>
                    <div className="h-px flex-1 bg-border-line" />
                  </div>
                  <h3 className="mb-4 text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {visualServices[0].title}
                  </h3>
                  <p className="max-w-sm text-sm leading-relaxed text-foreground-secondary">
                    {visualServices[0].description}
                  </p>
                </div>
                <div className="mt-8 inline-flex w-fit items-center gap-3 border-b border-premium-beige pb-2 text-xs uppercase tracking-[0.2em] text-foreground transition group-hover:text-premium-beige">
                  {visualServices[0].cta}
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>

            <div className="grid gap-3 sm:grid-cols-2">
              {visualServices.slice(1).map((service) => (
                <Link
                  key={service.number}
                  to="/packages"
                  className="group grid grid-cols-[116px_1fr] overflow-hidden border border-border-line bg-white transition-all hover:border-premium-beige sm:grid-cols-1"
                >
                  <div className="h-full min-h-[132px] overflow-hidden bg-background sm:h-32 sm:min-h-0">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-h-[132px] flex-col justify-between p-4">
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-premium-beige">{service.number}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground-secondary">{service.label}</span>
                      </div>
                      <h3 className="mb-2 text-xl" style={{ fontFamily: "var(--font-heading)" }}>{service.title}</h3>
                      <p className="text-xs leading-relaxed text-foreground-secondary">{service.description}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground transition group-hover:text-premium-beige">
                      {service.cta}
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="bg-background px-5 py-14 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden border border-border-line bg-white lg:grid-cols-[0.95fr_0.82fr]">
            <div className="flex items-center px-6 py-10 md:px-10 lg:px-14">
              <div className="max-w-xl">
                <div className="mb-6 flex items-center gap-4">
                  <span className="h-px w-12 bg-premium-beige" />
                  <span className="text-[10px] uppercase tracking-[0.28em] text-premium-beige">About Danivisual</span>
                </div>
                <h2
                  className="mb-5 text-3xl leading-tight lg:text-4xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Every Frame Has a Feeling
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-foreground-secondary">
                  Danivisual adalah studio visual yang berfokus pada cerita, rasa, dan detail. Dari
                  janji pernikahan, prewedding, hingga event penting, setiap frame dibuat untuk
                  menjadi kenangan yang bertahan lama.
                </p>
                <p className="mb-7 text-sm leading-relaxed text-foreground-secondary">
                  Kami percaya bahwa fotografi bukan hanya tentang mengabadikan momen, tetapi tentang
                  merasakan kembali emosi yang terjadi di dalamnya.
                </p>
                <div className="mb-7 grid max-w-md grid-cols-3 border-y border-border-line py-4 text-center">
                  <div>
                    <p className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>Editorial</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-foreground-secondary">Style</p>
                  </div>
                  <div className="border-x border-border-line">
                    <p className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>Wedding</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-foreground-secondary">Focus</p>
                  </div>
                  <div>
                    <p className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>Timeless</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-foreground-secondary">Mood</p>
                  </div>
                </div>
                <Link
                  to="/about"
                  className="group inline-flex min-h-12 items-center gap-3 border border-dark-premium bg-dark-premium px-6 text-xs uppercase tracking-[0.18em] text-white transition-all hover:bg-white hover:text-dark-premium"
                >
                  Meet Danivisual
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[360px] overflow-hidden bg-background-soft lg:min-h-[520px]">
              {aboutSlides.map((slide, index) => (
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.alt}
                  loading={index === 0 ? "eager" : "lazy"}
                  className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform,filter] duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                    activeAboutSlide === index
                      ? "scale-100 opacity-100 blur-0"
                      : "scale-[1.045] opacity-0 blur-[1px]"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.08)_44%,rgba(0,0,0,0.34)_100%)]" />
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 to-transparent" />
              <div className="absolute bottom-5 left-5 border border-white/35 bg-black/20 px-4 py-3 text-white backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Crafted for</p>
                <p className="mt-1 text-sm">Wedding Stories</p>
              </div>
              <div className="absolute bottom-6 right-5 flex items-center gap-2" aria-label="About photo slider">
                {aboutSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Show ${slide.alt}`}
                    onClick={() => setActiveAboutSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      activeAboutSlide === index ? "w-9 bg-white" : "w-3 bg-white/45 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background-soft px-5 py-16 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="mb-5 flex items-center justify-center gap-4">
              <span className="h-px w-10 bg-premium-beige" />
              <span className="text-[10px] uppercase tracking-[0.32em] text-premium-beige">Booking Flow</span>
              <span className="h-px w-10 bg-premium-beige" />
            </div>
            <h2
              className="mb-4 text-4xl leading-tight lg:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              How It Works
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-foreground-secondary">
              Empat tahap sederhana untuk mengunci tanggal dan memastikan setiap detail dokumentasi tertata rapi.
            </p>
          </div>

          <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[42px] hidden h-px bg-gradient-to-r from-transparent via-premium-beige/55 to-transparent lg:block" />
            {[
              { step: "01", title: "Pilih Paket", description: "Pilih kategori, paket, dan jenis layanan." },
              { step: "02", title: "Checkout & DP", description: "Isi data acara dan upload bukti DP." },
              { step: "03", title: "Akun Otomatis", description: "Akun customer dibuat setelah DP diverifikasi." },
              { step: "04", title: "Pantau Progress", description: "Lihat My Booking dan Progress di portal client." },
            ].map((item, index) => (
              <div
                key={item.step}
                className="group relative overflow-hidden border border-border-line bg-white px-6 py-7 shadow-[0_18px_55px_rgba(24,20,16,0.04)] transition-all duration-500 hover:-translate-y-1 hover:border-premium-beige/70 hover:shadow-[0_24px_70px_rgba(24,20,16,0.08)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-premium-beige/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="mb-7 flex items-center justify-between">
                  <span
                    className="text-5xl leading-none text-premium-beige/18 transition-colors duration-500 group-hover:text-premium-beige/32"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.step}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center border border-premium-beige/35 bg-background-soft text-[10px] uppercase tracking-[0.12em] text-premium-beige">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mb-3 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.title}
                </h3>
                <p className="min-h-[3rem] text-sm leading-relaxed text-foreground-secondary">{item.description}</p>
                <div className="mt-7 h-px w-12 bg-premium-beige/45 transition-all duration-500 group-hover:w-20 group-hover:bg-premium-beige" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="relative overflow-hidden bg-black px-6 py-20 text-white lg:px-8 lg:py-32">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.78] saturate-[1.08] contrast-[1.14]"
          src={mediaAssets.ui.ctaBackgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.90)_0%,rgba(0,0,0,0.56)_36%,rgba(0,0,0,0.50)_64%,rgba(0,0,0,0.90)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,199,163,0.16)_0%,rgba(0,0,0,0.12)_32%,rgba(0,0,0,0.76)_76%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-soft-gold/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-soft-gold/45 to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-soft-gold/80" />
            <span className="text-[10px] uppercase tracking-[0.32em] text-soft-gold">Start Your Story</span>
            <span className="h-px w-12 bg-soft-gold/80" />
          </div>
          <h2
            className="mb-6 text-4xl leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)] lg:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Let's Create Your Visual Story
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-base leading-8 text-white/88 sm:text-lg">
            Ceritakan rencana wedding, prewedding, atau event Anda. Tim Danivisual siap membantu
            mengabadikannya dengan indah.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/packages"
              className="border border-white bg-white px-8 py-4 text-sm font-medium tracking-wide text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:bg-soft-gold hover:text-black"
            >
              View Packages
            </Link>
            <a
              href="https://wa.me/6282337279636"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/70 bg-black/18 px-8 py-4 text-sm font-medium tracking-wide text-white backdrop-blur-[2px] transition-all hover:-translate-y-0.5 hover:border-soft-gold hover:bg-white/12"
            >
              Chat via WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
