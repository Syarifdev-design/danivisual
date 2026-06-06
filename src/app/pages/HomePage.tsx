import { Link } from "react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { mediaAssets } from "../data/mediaAssets";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function HomePage() {
  const { t } = useLanguage();
  const { getField, getImage } = useContent();
  const [slide, setSlide] = useState(0);

  // Get all images from content
  const slides = [
    { src: getImage("home_slide_1", mediaAssets.hero.bannerHome[0]), fallback: mediaAssets.hero.bannerHome[0] },
    { src: getImage("home_slide_2", mediaAssets.hero.bannerHome[1]), fallback: mediaAssets.hero.bannerHome[1] },
    { src: getImage("home_slide_3", mediaAssets.hero.bannerHome[2]), fallback: mediaAssets.hero.bannerHome[2] },
    { src: getImage("home_slide_4", mediaAssets.hero.bannerHome[3]), fallback: mediaAssets.hero.bannerHome[3] },
    { src: getImage("home_slide_5", mediaAssets.hero.bannerHome[4]), fallback: mediaAssets.hero.bannerHome[4] },
    { src: getImage("home_slide_6", mediaAssets.hero.bannerHome[5]), fallback: mediaAssets.hero.bannerHome[5] },
    { src: getImage("home_slide_7", mediaAssets.hero.bannerHome[6]), fallback: mediaAssets.hero.bannerHome[6] },
    { src: getImage("home_slide_8", mediaAssets.hero.bannerHome[7]), fallback: mediaAssets.hero.bannerHome[7] },
  ].filter(Boolean);

  // Get featured stories from content
  const stories = [
    {
      category: getField("home", "featured_stories", "home_story_1_category"),
      title: getField("home", "featured_stories", "home_story_1_title"),
      location: getField("home", "featured_stories", "home_story_1_location"),
      date: getField("home", "featured_stories", "home_story_1_date"),
      image: getImage("home_story_1_image", mediaAssets.wedding.couplePortrait),
      fallback: mediaAssets.wedding.couplePortrait,
    },
    {
      category: getField("home", "featured_stories", "home_story_2_category"),
      title: getField("home", "featured_stories", "home_story_2_title"),
      location: getField("home", "featured_stories", "home_story_2_location"),
      date: getField("home", "featured_stories", "home_story_2_date"),
      image: getImage("home_story_2_image", mediaAssets.wedding.ringPortrait),
      fallback: mediaAssets.wedding.ringPortrait,
    },
    {
      category: getField("home", "featured_stories", "home_story_3_category"),
      title: getField("home", "featured_stories", "home_story_3_title"),
      location: getField("home", "featured_stories", "home_story_3_location"),
      date: getField("home", "featured_stories", "home_story_3_date"),
      image: getImage("home_story_3_image", mediaAssets.editorial.outdoorCouple),
      fallback: mediaAssets.editorial.outdoorCouple,
    },
    {
      category: getField("home", "featured_stories", "home_story_4_category"),
      title: getField("home", "featured_stories", "home_story_4_title"),
      location: getField("home", "featured_stories", "home_story_4_location"),
      date: getField("home", "featured_stories", "home_story_4_date"),
      image: getImage("home_story_4_image", mediaAssets.wedding.group),
      fallback: mediaAssets.wedding.group,
    },
    {
      category: getField("home", "featured_stories", "home_story_5_category"),
      title: getField("home", "featured_stories", "home_story_5_title"),
      location: getField("home", "featured_stories", "home_story_5_location"),
      date: getField("home", "featured_stories", "home_story_5_date"),
      image: getImage("home_story_5_image", mediaAssets.hero.akad),
      fallback: mediaAssets.hero.akad,
    },
    {
      category: getField("home", "featured_stories", "home_story_6_category"),
      title: getField("home", "featured_stories", "home_story_6_title"),
      location: getField("home", "featured_stories", "home_story_6_location"),
      date: getField("home", "featured_stories", "home_story_6_date"),
      image: getImage("home_story_6_image", mediaAssets.wedding.detailPortrait),
      fallback: mediaAssets.wedding.detailPortrait,
    },
  ];

  // Get services from content
  const services = [
    {
      title: getField("home", "services", "home_svc_wedding_title") || "Wedding",
      desc: getField("home", "services", "home_svc_wedding_desc"),
      image: getImage("home_svc_wedding_image", mediaAssets.wedding.couplePortrait),
      fallback: mediaAssets.wedding.couplePortrait,
      label: getField("home", "services", "home_svc_wedding_label"),
      cta: getField("home", "services", "home_svc_wedding_cta"),
    },
    {
      title: getField("home", "services", "home_svc_prewedding_title") || "Prewedding",
      desc: getField("home", "services", "home_svc_prewedding_desc"),
      image: getImage("home_svc_prewedding_image", mediaAssets.editorial.outdoorCouple),
      fallback: mediaAssets.editorial.outdoorCouple,
      label: getField("home", "services", "home_svc_prewedding_label"),
      cta: getField("home", "services", "home_svc_prewedding_cta"),
    },
    {
      title: getField("home", "services", "home_svc_event_title") || "Event",
      desc: getField("home", "services", "home_svc_event_desc"),
      image: getImage("home_svc_event_image", mediaAssets.wedding.group),
      fallback: mediaAssets.wedding.group,
      label: getField("home", "services", "home_svc_event_label"),
      cta: getField("home", "services", "home_svc_event_cta"),
    },
    {
      title: getField("home", "services", "home_svc_studio_title") || "Studio",
      desc: getField("home", "services", "home_svc_studio_desc"),
      image: getImage("home_svc_studio_image", mediaAssets.wedding.ringPortrait),
      fallback: mediaAssets.wedding.ringPortrait,
      label: getField("home", "services", "home_svc_studio_label"),
      cta: getField("home", "services", "home_svc_studio_cta"),
    },
    {
      title: getField("home", "services", "home_svc_lainnya_title") || "Lainnya",
      desc: getField("home", "services", "home_svc_lainnya_desc"),
      image: getImage("home_svc_lainnya_image", mediaAssets.wedding.family),
      fallback: mediaAssets.wedding.family,
      label: getField("home", "services", "home_svc_lainnya_label"),
      cta: getField("home", "services", "home_svc_lainnya_cta"),
    },
  ];

  // Auto slide
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSlide(s => (s + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  const formatDate = (date: string) => {
    const [day, month, year] = date.split(" ");
    return { day, monthYear: `${month.slice(0, 3).toUpperCase()} ${year}` };
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative h-[100svh] min-h-[620px] flex items-center justify-center overflow-hidden sm:h-[100dvh]">
        <div className="absolute inset-0 bg-black">
          {slides.map((src, i) => (
            <ImageWithFallback
              key={i}
              src={src.src}
              fallbackSrc={src.fallback}
              alt={`Slide ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/62 via-black/20 to-black/72 sm:from-black/54 sm:via-black/22 sm:to-black/68" />
        <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/60 to-transparent sm:h-40" />

        {/* Nav Arrows */}
        <button onClick={() => setSlide(s => (s - 1 + slides.length) % slides.length)}
          className="absolute left-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/95 text-white sm:flex hover:bg-white/15">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.9 6.8C12.6 8 11.4 9.6 11.4 11.9C11.4 14.2 12.6 15.8 14.9 17M11.6 12C10.8 11.1 9.9 10.8 8.8 10.9" /></svg>
        </button>
        <button onClick={() => setSlide(s => (s + 1) % slides.length)}
          className="absolute right-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/95 text-white sm:flex hover:bg-white/15">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9.1 6.8C11.4 8 12.6 9.6 12.6 11.9C12.6 14.2 11.4 15.8 9.1 17M12.4 12C13.2 11.1 14.1 10.8 15.2 10.9" /></svg>
        </button>

        {/* Caption */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 text-white sm:bottom-16">
          <p className="text-[12px] uppercase tracking-[0.35em] text-white/90 sm:text-[13px]">
            {getField("home", "hero", "home_hero_kicker") || "SIDE BY SIDE"}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.26em] text-white/82 sm:text-[12px]">
            {getField("home", "hero", "home_hero_title") || "DANIVISUAL WEDDING & PREWEDDING STORY"}
          </p>
        </div>

        {/* Dots */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className="h-4 w-4 rounded-full border transition-all"
              style={{ backgroundColor: i === slide ? '#ffffff' : 'transparent' }}
            />
          ))}
        </div>
      </section>

      {/* Featured Stories */}
      <section className="bg-background px-5 py-14 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-2xl text-center lg:mb-14">
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-premium-beige">
              {getField("home", "featured_stories", "home_featured_eyebrow") || "Featured Stories"}
            </p>
            <h2 className="mb-4 text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
              {getField("home", "featured_stories", "home_featured_title") || "Cerita Terpilih"}
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-foreground-secondary">
              {getField("home", "featured_stories", "home_featured_desc") || "Kurasi cerita wedding dan editorial"}
            </p>
          </div>

          <div className="mx-auto grid max-w-[1180px] gap-20 lg:gap-24">
            {stories.map((story, i) => {
              const parts = formatDate(story.date);
              return (
                <Link key={i} to="/portfolio" className="group block">
                  <div className="grid aspect-[16/10] overflow-hidden bg-background-soft">
                    {[story.image].map((img, j) => (
                      <ImageWithFallback key={j} src={img} fallbackSrc={story.fallback} alt={story.title} loading={i === 0 ? "eager" : "lazy"}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                    ))}
                  </div>
                  <div className="mt-8 grid gap-6 md:grid-cols-[120px_1fr] md:gap-12 lg:mt-10">
                    <div className="flex items-start gap-5 text-foreground-secondary md:block">
                      <span className="mt-3 hidden h-px w-8 bg-border-line md:inline-block" />
                      <div>
                        <p className="mt-3 text-3xl leading-none text-foreground md:mt-2" style={{ fontFamily: "var(--font-heading)" }}>{parts.day}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.08em]">{parts.monthYear}</p>
                      </div>
                    </div>
                    <div className="max-w-3xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-premium-beige">
                        {story.category}
                      </p>
                      <h3 className="mt-2 text-2xl uppercase tracking-[0.08em] lg:text-3xl" style={{ fontFamily: "var(--font-body)" }}>
                        {story.title}
                      </h3>
                      <p className="mt-1 text-[12px] uppercase tracking-[0.22em] text-foreground-secondary/70">{story.location}</p>
                      <p className="mt-2 max-w-xl text-sm leading-5 text-foreground-secondary">
                        {t({ ID: "Masuk ke galeri lengkap untuk melihat alur cerita", EN: "View Story" })}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground transition group-hover:text-premium-beige">
                        {t({ ID: "Lihat Cerita", EN: "View Story" })} <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-background-soft px-5 py-12 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 grid gap-5 border-b border-border-line pb-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-premium-beige">
                {getField("home", "services", "home_services_eyebrow") || "Services"}
              </p>
              <h2 className="text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                {getField("home", "services", "home_services_title") || "Our Visual Experiences"}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-foreground-secondary lg:justify-self-end">
              {getField("home", "services", "home_services_desc") || "Pilihan layanan"}
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            {/* First service (large */}
            <Link to="/packages" className="group grid overflow-hidden border border-border-line bg-white hover:border-premium-beige">
              <div className="relative min-h-[300px] overflow-hidden md:min-h-[360px]">
                <ImageWithFallback src={services[0].image} fallbackSrc={services[0].fallback} alt={services[0].title}
                  loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="mb-3 block text-[10px] uppercase tracking-[0.26em] text-white/70">{services[0].label} Service</span>
                  <p className="max-w-xs text-sm leading-relaxed text-white/90">
                    {services[0].desc}
                  </p>
                </div>
              </div>
            </Link>

            {/* Other services */}
            <div className="grid gap-3 sm:grid-cols-2">
              {services.slice(1).map((svc) => (
                <Link key={svc.title} to="/packages" className="group grid overflow-hidden border border-border-line bg-white hover:border-premium-beige">
                  <div className="h-32 overflow-hidden bg-gray-50">
                    <ImageWithFallback src={svc.image} fallbackSrc={svc.fallback} alt={svc.title} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex h-32 flex-col justify-between p-4">
                    <div>
                      <div className="mb-3 flex items-center gap-3 text-[10px] text-foreground-secondary">
                        <span className="text-premium-beige">{svc.label}</span>
                      </div>
                      <h3 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>{svc.title}</h3>
                      <p className="text-xs leading-relaxed text-foreground-secondary">{svc.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground transition group-hover:text-premium-beige">
                      {svc.cta} <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-black px-6 py-20 text-white lg:px-8 lg:py-32">
        {getImage("home_cta_image") ? (
          <ImageWithFallback src={getImage("home_cta_image")} fallbackSrc={mediaAssets.ui.ctaBackground} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.78]" />
        ) : (
          <video autoPlay muted loop playsInline aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-[0.78]" src={getImage("home_cta_video", mediaAssets.ui.ctaBackgroundVideo)} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,199,163,0.16) 0%,rgba(0,0,0,0.12) 32%,rgba(0,0,0,0.76) 76%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-soft-gold/55" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mx-auto mb-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-soft-gold/80" />
            <span className="text-[10px] tracking-[0.32em] text-soft-gold">
              {getField("home", "cta", "home_cta_eyebrow") || "Mulai Cerita Anda"}
            </span>
            <span className="h-px flex-1 bg-soft-gold/80" />
          </p>
          <h2 className="mb-6 text-4xl leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)] lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
            {getField("home", "cta", "home_cta_title") || "Mari Ciptakan Visual Story Anda"}
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-base leading-8 text-white/88 sm:text-lg">
            {getField("home", "cta", "home_cta_desc") || "Ceritakan rencana wedding Anda"}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/packages" className="rounded-full border border-white bg-white px-8 py-4 text-sm font-medium tracking-wide text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:bg-soft-gold hover:text-black">
              {getField("home", "cta", "home_cta_btn_primary") || "Lihat Paket"}
            </Link>
            <a href="https://wa.me/6282337279636" target="_blank" rel="noopener noreferrer"
              className="rounded-full border border-white/70 bg-black/18 px-8 py-4 text-sm font-medium tracking-wide text-white backdrop-blur-[2px] transition-all hover:-translate-y-0.5 hover:border-soft-gold hover:bg-white/12">
              Chat via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
