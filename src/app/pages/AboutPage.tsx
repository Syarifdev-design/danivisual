import { Heart, Eye, Users, Camera, Sparkles, CheckCircle, Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import PageIntro from "../components/PageIntro";
import { mediaAssets } from "../data/mediaAssets";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";

export default function AboutPage() {
  const { t } = useLanguage();
  const { getField, getImage } = useContent();
  const [storyInView, setStoryInView] = useState(false);
  const brandStoryRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = brandStoryRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStoryInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.22 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const values = [
    {
      icon: Heart,
      title: getField("about", "philosophy", "heart_title", t({ ID: "Passion", EN: "Passion" })),
      description: getField("about", "philosophy", "heart_desc", t({
        ID: "Kami mengerjakan setiap proyek dengan ketulusan",
        EN: "We approach every project with sincerity",
      })),
    },
    {
      icon: Eye,
      title: getField("about", "philosophy", "eye_title", t({ ID: "Detail", EN: "Detail" })),
      description: getField("about", "philosophy", "eye_desc", t({
        ID: "Memperhatikan setiap detail momen",
        EN: "Attentive to every moment detail",
      })),
    },
    {
      icon: Sparkles,
      title: getField("about", "philosophy", "sparkles_title", t({ ID: "Quality", EN: "Quality" })),
      description: getField("about", "philosophy", "sparkles_desc", t({
        ID: "Standar kualitas tinggi di setiap deliverable",
        EN: "High quality standards in every deliverable",
      })),
    },
    {
      icon: Users,
      title: getField("about", "philosophy", "users_title", t({ ID: "Connection", EN: "Connection" })),
      description: getField("about", "philosophy", "users_desc", t({
        ID: "Membangun koneksi emosional dengan klien",
        EN: "Building emotional connection with clients",
      })),
    },
  ];

  const whyChooseUs = [
    getField("about", "why_choose_us", "about_why_1", t({ ID: "Tim fotografer profesional dengan pengalaman 7+ tahun di industri wedding photography", EN: "A professional photography team with 7+ years of wedding industry experience" })),
    getField("about", "why_choose_us", "about_why_2", t({ ID: "Gaya editorial modern yang elegan dan timeless", EN: "A modern editorial style that feels elegant, warm, and timeless" })),
    getField("about", "why_choose_us", "about_why_3", t({ ID: "Full control atas proses editing untuk hasil yang konsisten dan premium", EN: "Full editing control for consistent, premium-quality results" })),
    getField("about", "why_choose_us", "about_why_4", t({ ID: "Client portal sederhana untuk My Booking dan Progress", EN: "A clear client portal for booking details and progress updates" })),
    getField("about", "why_choose_us", "about_why_5", t({ ID: "File high resolution tanpa watermark", EN: "High-resolution files without watermark" })),
    getField("about", "why_choose_us", "about_why_6", t({ ID: "Album cetak premium dengan finishing berkualitas tinggi", EN: "Premium printed albums with refined finishing" })),
    getField("about", "why_choose_us", "about_why_7", t({ ID: "Komunikasi responsif via WhatsApp dan dashboard", EN: "Responsive communication through WhatsApp and dashboard" })),
    getField("about", "why_choose_us", "about_why_8", t({ ID: "Komitmen pada timeline yang jelas dan transparan", EN: "A clear, transparent timeline from reservation to delivery" })),
  ];

  const testimonials = [
    {
      name: getField("about", "testimonials", "about_testimonial_1_name", "Dani & Sinta"),
      wedding: getField("about", "testimonials", "about_testimonial_1_wedding", t({ ID: "Wedding di Four Seasons", EN: "Wedding at Four Seasons" })),
      text: getField("about", "testimonials", "about_testimonial_1_quote", t({
        ID: "Danivisual tidak hanya memotret pernikahan kami, mereka merekam setiap rasa yang kami alami hari itu. Ketika melihat album, kami bisa merasakan kembali kebahagiaan, haru, dan kehangatan yang sama.",
        EN: "Danivisual did not simply photograph our wedding. They preserved the feeling of the day. Looking through the album brings back the same joy, warmth, and emotion.",
      })),
      image: getImage("about_testimonial_1_image", mediaAssets.wedding.couplePortrait),
    },
    {
      name: getField("about", "testimonials", "about_testimonial_2_name", "Rama & Dita"),
      wedding: getField("about", "testimonials", "about_testimonial_2_wedding", t({ ID: "Sesi Prewedding Studio", EN: "Prewedding Studio Session" })),
      text: getField("about", "testimonials", "about_testimonial_2_quote", t({
        ID: "Tim Danivisual sangat profesional dan membuat kami merasa nyaman. Foto-foto yang dihasilkan natural, bersih, dan sesuai dengan visual yang kami bayangkan.",
        EN: "The Danivisual team was professional and made us feel at ease. The photos felt natural, refined, and exactly aligned with what we imagined.",
      })),
      image: getImage("about_testimonial_2_image", mediaAssets.wedding.ringPortrait),
    },
    {
      name: getField("about", "testimonials", "about_testimonial_3_name", "Andi & Maya"),
      wedding: getField("about", "testimonials", "about_testimonial_3_wedding", "Prewedding at Bromo"),
      text: getField("about", "testimonials", "about_testimonial_3_quote", t({
        ID: "Perjalanan jauh ke Bromo terasa sangat layak. Danivisual tahu cara membaca cahaya dan lanskap dengan tepat. Hasilnya melampaui ekspektasi kami.",
        EN: "The trip to Bromo was absolutely worth it. Danivisual knew how to shape the light and landscape beautifully. The result exceeded our expectations.",
      })),
      image: getImage("about_testimonial_3_image", mediaAssets.editorial.outdoorCouple),
    },
  ];

  const stats = [
    { number: getField("about", "stats", "about_stats_couples_count", "500+"), label: t({ ID: "Pasangan Terdokumentasi", EN: "Couples Documented" }) },
    { number: getField("about", "stats", "about_stats_years_count", "7+"), label: t({ ID: "Tahun Pengalaman", EN: "Years Experience" }) },
    { number: getField("about", "stats", "about_stats_photos_count", "50K+"), label: t({ ID: "Foto Terkurasi", EN: "Photos Captured" }) },
    { number: getField("about", "stats", "about_stats_satisfaction_count", "100%"), label: t({ ID: "Kepuasan Klien", EN: "Client Satisfaction" }) },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageIntro
        eyebrow={getField("about", "intro", "eyebrow", t({ ID: "Tentang Studio", EN: "About the Studio" }))}
        title={getField("about", "intro", "title", t({ ID: "Setiap Bingkai Menyimpan Rasa", EN: "Every Frame Holds a Feeling" }))}
        description={getField("about", "intro", "description", t({
          ID: "Danivisual mendokumentasikan momen dengan pendekatan editorial yang tenang, jujur, dan penuh perhatian, agar kenangan besar Anda tetap hidup dengan elegan.",
          EN: "Danivisual documents meaningful occasions with a calm editorial eye, honest emotion, and meticulous care, preserving your most important memories with quiet elegance.",
        }))}
      />

      {/* Our Story */}
      <section
        ref={brandStoryRef}
        className={`brand-story-section px-6 py-20 md:px-8 lg:py-28 ${storyInView ? "is-visible" : ""}`}
      >
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-[0.96fr_0.86fr] lg:gap-24 xl:gap-[120px]">
          <div className="brand-story-copy max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-12 bg-[#b99a62]" />
              <span className="text-[10px] font-medium tracking-[0.3em] text-[#8f6f3d]">
                {t({ ID: "Cerita Kami", EN: "Our Story" })}
              </span>
            </div>
            <h2
              className="brand-story-heading mb-7 text-[#111111]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {t({ ID: "Cerita Kami", EN: "Our Story" })}
            </h2>
            <div className="space-y-5 text-[15px] leading-[1.85] text-[#625d55] lg:text-base">
              <p>
                {getField("about", "brand_story", "about_brand_paragraph_1", t({
                  ID: "Danivisual lahir dari keyakinan sederhana: setiap momen istimewa layak dikenang dengan cara yang indah, jujur, dan penuh rasa.",
                  EN: "Danivisual was born from a simple belief: every meaningful moment deserves to be remembered beautifully, honestly, and with feeling.",
                }))}
              </p>
              <p>
                {getField("about", "brand_story", "about_brand_paragraph_2", t({
                  ID: "Sejak 2019, kami mendokumentasikan ratusan cerita cinta, dari pernikahan intimate hingga perayaan yang megah. Bagi kami, dokumentasi terbaik bukan hanya tentang gambar yang indah, tetapi tentang rasa yang tetap hidup saat dikenang kembali.",
                  EN: "Since 2019, we have documented hundreds of love stories, from intimate weddings to grand celebrations. To us, the finest documentation is not only beautiful imagery, but feeling that remains alive when revisited.",
                }))}
              </p>
              <p>
                {getField("about", "brand_story", "about_brand_paragraph_3", t({
                  ID: "Kami hadir bukan sekadar sebagai pengamat. Kami menjadi bagian dari hari besar Anda, menangkap tawa, air mata, dan momen kecil yang sering kali menjadi cerita paling berarti.",
                  EN: "We are present as more than observers. We become part of your day with care, capturing laughter, tears, and the quiet moments that often become the most meaningful memories.",
                }))}
              </p>
            </div>
            <figure className="mt-8 border-l border-[#b99a62]/65 pl-6">
              <blockquote
                className="text-[22px] leading-[1.35] text-[#151515] lg:text-2xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {t({
                  ID: "“Kami percaya foto terbaik terjadi ketika Anda lupa pada kamera, dan benar-benar merasakan momennya.”",
                  EN: "“We believe the best photographs happen when you forget the camera and fully feel the moment.”",
                })}
              </blockquote>
              <figcaption className="mt-5 text-[10px] font-medium uppercase tracking-[0.28em] text-[#8f6f3d]">
                Since 2019 · Wedding Documentation
              </figcaption>
            </figure>
          </div>

          <div className="brand-story-photo-wrap">
            <figure className="brand-story-frame">
              <div className="brand-story-image overflow-hidden">
                <img
                  src={mediaAssets.wedding.couplePortrait}
                  alt="Cerita wedding Danivisual dengan pasangan di pelaminan"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,transparent_42%,rgba(17,17,17,0.08)_100%)]" />
              </div>
              <figcaption className="mt-4 text-center text-[10px] uppercase tracking-[0.22em] text-[#8f6f3d]/80">
                Wedding stories captured with care.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="py-24 px-6 lg:px-8 bg-background-soft">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-[1px] bg-premium-beige mx-auto mb-8" />
            <h2 className="text-4xl lg:text-5xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              {t({ ID: "Filosofi Kami", EN: "Our Philosophy" })}
            </h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              {t({
                ID: "Prinsip yang memandu setiap frame yang kami ciptakan",
                EN: "The principles guiding every frame we create",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-border-line rounded-sm p-8 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-premium-beige/10 rounded-sm flex items-center justify-center mb-6">
                    <Icon size={24} className="text-premium-beige" />
                  </div>
                  <h3 className="text-2xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    {value.title}
                  </h3>
                  <p className="text-foreground-secondary leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative overflow-hidden bg-dark-premium px-6 py-20 text-white lg:px-8 lg:py-24">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-36 mix-blend-screen"
          src={mediaAssets.ui.statsBackground}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.74)_48%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,199,163,0.16),transparent_46%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-soft-gold/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-soft-gold/35 to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="group relative text-center">
                {index > 0 && (
                  <div className="absolute bottom-2 left-0 top-2 hidden w-px bg-gradient-to-b from-transparent via-white/18 to-transparent lg:block" />
                )}
                <div
                  className="mb-3 text-5xl text-soft-gold drop-shadow-[0_8px_26px_rgba(216,199,163,0.16)] transition-colors duration-500 group-hover:text-white lg:text-6xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {stat.number}
                </div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/76 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-background px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -left-5 -top-5 h-28 w-28 border-l border-t border-premium-beige/60" />
              <div className="absolute -bottom-5 -right-5 h-28 w-28 border-b border-r border-premium-beige/60" />
              <div className="relative overflow-hidden border border-border-line bg-background-soft p-3 shadow-[0_26px_80px_rgba(24,20,16,0.08)]">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={mediaAssets.wedding.ringWide}
                    alt="Why Choose Us"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-3 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.30)_100%)]" />
                <div className="absolute bottom-7 left-7 border border-white/35 bg-black/25 px-4 py-3 text-white backdrop-blur-sm">
                  <p className="text-[10px] tracking-[0.24em] text-white/72">
                    {t({ ID: "Detail Premium", EN: "Premium Detail" })}
                  </p>
                  <p className="mt-1 text-sm">{t({ ID: "Kualitas Visual Konsisten", EN: "Consistent Visual Quality" })}</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-5 flex items-center gap-4">
                <span className="h-px w-12 bg-premium-beige" />
                <span className="text-[10px] tracking-[0.3em] text-premium-beige">
                  {t({ ID: "Alasan Memilih Kami", EN: "Why Us" })}
                </span>
              </div>
              <h2 className="mb-5 max-w-2xl text-4xl leading-tight lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                {t({ ID: "Mengapa Memilih Danivisual", EN: "Why Choose Danivisual" })}
              </h2>
              <p className="mb-8 max-w-2xl text-sm leading-7 text-foreground-secondary sm:text-base">
                {t({
                  ID: "Kami memahami bahwa memilih fotografer untuk hari besar Anda adalah keputusan penting. Setiap proses dibuat rapi, transparan, dan diarahkan untuk hasil visual yang konsisten.",
                  EN: "Choosing the right photographer for your meaningful day is a significant decision. Every step is structured, transparent, and directed toward consistent visual quality.",
                })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {whyChooseUs.map((item, index) => (
                  <div
                    key={item}
                    className="group flex min-h-[92px] items-start gap-3 border border-border-line bg-white p-4 transition-all duration-300 hover:border-premium-beige/65 hover:shadow-[0_16px_45px_rgba(24,20,16,0.06)]"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-premium-beige/45 bg-background-soft text-premium-beige transition-colors duration-300 group-hover:bg-premium-beige group-hover:text-white">
                      <CheckCircle size={15} strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-premium-beige">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="text-sm leading-6 text-foreground-secondary">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 lg:px-8 bg-background-soft">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-[1px] bg-premium-beige mx-auto mb-8" />
            <h2 className="text-4xl lg:text-5xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              {t({ ID: "Cerita dari Klien Kami", EN: "What Our Couples Say" })}
            </h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              {t({
                ID: "Cerita dari pasangan yang telah mempercayai kami",
                EN: "Reflections from couples who trusted us with their story",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white border border-border-line rounded-sm overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <Quote size={32} className="text-premium-beige/20 mb-4" />
                  <p className="text-foreground-secondary leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-foreground-secondary">{testimonial.wedding}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-24 px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-[1px] bg-premium-beige mx-auto mb-8" />
          <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
            {t({ ID: "Komitmen Kami untuk Anda", EN: "Our Commitment to You" })}
          </h2>
          <p className="text-lg text-foreground-secondary leading-relaxed mb-8">
            {t({
              ID: "Ketika Anda memilih Danivisual, Anda tidak hanya mendapatkan fotografer. Anda mendapatkan partner yang memastikan setiap momen berharga terdokumentasi dengan rapi. Kami berkomitmen pada transparansi, kualitas, dan pengalaman yang berkesan dari konsultasi pertama hingga penyerahan album final.",
              EN: "When you choose Danivisual, you receive more than photographers. You gain a creative partner committed to preserving your meaningful moments with clarity, care, and consistency from the first consultation to the final album delivery.",
            })}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Camera size={24} className="text-premium-beige" />
            <p className="text-sm uppercase tracking-widest text-foreground-secondary">
              Since 2019
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-background-soft to-white border-t border-border-line">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
            {t({ ID: "Mari Ciptakan Cerita Anda", EN: "Let's Create Your Story Together" })}
          </h2>
          <p className="text-lg text-foreground-secondary mb-10 max-w-2xl mx-auto">
            {t({
              ID: "Ceritakan rencana wedding, prewedding, atau event Anda. Mari kita wujudkan visual story yang akan Anda kenang selamanya.",
              EN: "Share your wedding, prewedding, or event plans with us. Together, we will shape a visual story worth returning to for years.",
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/packages"
              className="px-8 py-4 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm tracking-wide"
            >
              {t({ ID: "Lihat Paket", EN: "View Packages" })}
            </Link>
            <Link
              to="/portfolio"
              className="px-8 py-4 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm tracking-wide"
            >
              {t({ ID: "Lihat Karya Kami", EN: "View Our Work" })}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
