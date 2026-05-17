import { Heart, Eye, Users, Camera, Sparkles, CheckCircle, Quote } from "lucide-react";
import { Link } from "react-router";
import PageIntro from "../components/PageIntro";
import { mediaAssets } from "../data/mediaAssets";

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Cerita yang Jujur",
      description:
        "Kami tidak hanya mengambil foto. Kami merekam emosi, senyum tulus, air mata bahagia, dan momen-momen tak terduga yang membuat pernikahan Anda unik.",
    },
    {
      icon: Eye,
      title: "Detail yang Bermakna",
      description:
        "Dari cincin yang berkilau hingga sentuhan tangan yang lembut, setiap detail kecil memiliki cerita besar. Kami memastikan tidak ada yang terlewat.",
    },
    {
      icon: Sparkles,
      title: "Estetika yang Abadi",
      description:
        "Kami tidak mengikuti tren sesaat. Gaya visual kami dirancang untuk tetap indah dan relevan bahkan puluhan tahun ke depan.",
    },
    {
      icon: Users,
      title: "Pendekatan Personal",
      description:
        "Setiap pasangan memiliki cerita yang berbeda. Kami mendengarkan, memahami, dan menyesuaikan pendekatan kami dengan kepribadian dan visi Anda.",
    },
  ];

  const whyChooseUs = [
    "Tim fotografer profesional dengan pengalaman 7+ tahun di industri wedding photography",
    "Gaya editorial modern yang elegan dan timeless",
    "Full control atas proses editing untuk hasil yang konsisten dan premium",
    "Client portal sederhana untuk My Booking dan Progress",
    "File high resolution tanpa watermark",
    "Album cetak premium dengan finishing berkualitas tinggi",
    "Komunikasi responsif via WhatsApp dan dashboard",
    "Komitmen pada timeline yang jelas dan transparan",
  ];

  const testimonials = [
    {
      name: "Dani & Sinta",
      wedding: "Wedding at Four Seasons",
      text: "Danivisual tidak hanya memotret pernikahan kami, mereka merekam setiap rasa yang kami alami hari itu. Ketika melihat album, kami bisa merasakan kembali kebahagiaan, haru, dan kehangatan yang sama.",
      image: mediaAssets.wedding.couplePortrait,
    },
    {
      name: "Rama & Dita",
      wedding: "Prewedding Studio Session",
      text: "Tim Danivisual sangat profesional dan membuat kami merasa nyaman. Foto-foto yang dihasilkan sangat natural dan indah. Exactly what we wanted!",
      image: mediaAssets.wedding.ringPortrait,
    },
    {
      name: "Andi & Maya",
      wedding: "Prewedding at Bromo",
      text: "Perjalanan jauh ke Bromo sangat worth it! Danivisual tahu cara memanfaatkan cahaya dan landscape dengan sempurna. Hasilnya beyond our expectations.",
      image: mediaAssets.editorial.outdoorCouple,
    },
  ];

  const stats = [
    { number: "500+", label: "Couples Documented" },
    { number: "7+", label: "Years Experience" },
    { number: "50K+", label: "Photos Captured" },
    { number: "100%", label: "Client Satisfaction" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageIntro
        eyebrow="About Studio"
        title="Every Frame Has a Feeling"
        description="Danivisual adalah lebih dari sekadar fotografi. Kami adalah storyteller yang mengabadikan emosi, momen, dan kenangan yang akan Anda hargai selamanya."
      />

      {/* Our Story */}
      <section className="py-24 px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-12 h-[1px] bg-premium-beige mb-8" />
              <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                Our Story
              </h2>
              <div className="space-y-6 text-foreground-secondary leading-relaxed">
                <p>
                  Danivisual lahir dari keyakinan sederhana: bahwa setiap momen istimewa dalam
                  hidup layak untuk diingat dengan cara yang indah dan jujur.
                </p>
                <p>
                  Dimulai pada tahun 2019, kami telah mendokumentasikan ratusan cerita cinta—dari
                  pernikahan intimate di backyard hingga celebration megah di venue mewah. Setiap
                  pasangan mengajarkan kami sesuatu yang baru tentang cinta, keluarga, dan apa arti
                  sebenarnya dari commitment.
                </p>
                <p>
                  Kami bukan hanya pengamat. Kami adalah bagian dari hari besar Anda, merekam
                  setiap tawa, air mata, dan momen tak terduga yang membuat cerita Anda unik.
                </p>
                <p className="font-medium text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  "Kami percaya bahwa fotografi terbaik terjadi ketika Anda melupakan kamera dan
                  hanya merasakan momen."
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-sm overflow-hidden">
                <img
                  src={mediaAssets.wedding.couplePortrait}
                  alt="Our Story"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-premium-beige rounded-sm -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="py-24 px-6 lg:px-8 bg-background-soft">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-[1px] bg-premium-beige mx-auto mb-8" />
            <h2 className="text-4xl lg:text-5xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Our Philosophy
            </h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              Prinsip yang memandu setiap frame yang kami ciptakan
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
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/72">Premium Detail</p>
                  <p className="mt-1 text-sm">Consistent Visual Quality</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-5 flex items-center gap-4">
                <span className="h-px w-12 bg-premium-beige" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-premium-beige">Why Us</span>
              </div>
              <h2 className="mb-5 max-w-2xl text-4xl leading-tight lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                Why Choose Danivisual
              </h2>
              <p className="mb-8 max-w-2xl text-sm leading-7 text-foreground-secondary sm:text-base">
                Kami memahami bahwa memilih fotografer untuk hari besar Anda adalah keputusan
                penting. Setiap proses dibuat rapi, transparan, dan diarahkan untuk hasil visual
                yang konsisten.
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
              What Our Couples Say
            </h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              Cerita dari pasangan yang telah mempercayai kami
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
            Our Commitment to You
          </h2>
          <p className="text-lg text-foreground-secondary leading-relaxed mb-8">
            Ketika Anda memilih Danivisual, Anda tidak hanya mendapatkan fotografer. Anda
            mendapatkan partner yang akan memastikan setiap momen berharga terabadikan dengan
            sempurna. Kami berkomitmen untuk transparansi, kualitas, dan pengalaman yang tak
            terlupakan—dari konsultasi pertama hingga penyerahan album final.
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
            Let's Create Your Story Together
          </h2>
          <p className="text-lg text-foreground-secondary mb-10 max-w-2xl mx-auto">
            Ceritakan rencana wedding, prewedding, atau event Anda. Mari kita wujudkan visual story
            yang akan Anda kenang selamanya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/packages"
              className="px-8 py-4 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm tracking-wide"
            >
              View Packages
            </Link>
            <Link
              to="/portfolio"
              className="px-8 py-4 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm tracking-wide"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
