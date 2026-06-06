import { ArrowRight, Check, Clock3, GalleryHorizontal, LayoutDashboard, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router";
import PageIntro from "../components/PageIntro";
import { mediaAssets } from "../data/mediaAssets";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";

export default function ServicesPage() {
  const { t } = useLanguage();
  const { getField, getImage } = useContent();
  const [activeSlide, setActiveSlide] = useState(0);

  const updateServiceCardCursor = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % 3);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  const serviceIds = ["wedding", "prewedding", "event", "studio", "lainnya"];

  const services = serviceIds.map((serviceId, index) => ({
    id: serviceId,
    isActive: getField("services_page", serviceId, `services_${serviceId}_isActive`, "true") !== "false",
    eyebrow: getField("services_page", serviceId, `services_${serviceId}_eyebrow`,
      index === 0 ? t({ ID: "Layanan Signature", EN: "Signature Service" }) :
      index === 1 ? t({ ID: "Sesi Editorial", EN: "Editorial Session" }) :
      index === 2 ? t({ ID: "Cerita Acara", EN: "Event Storytelling" }) :
      index === 3 ? t({ ID: "Portrait Studio", EN: "Studio Portrait" }) :
      t({ ID: "Momen Personal", EN: "Personal Moments" })
    ),
    title: getField("services_page", serviceId, `services_${serviceId}_title`,
      index === 0 ? t({ ID: "Dokumentasi Pernikahan", EN: "Wedding Photography" }) :
      index === 1 ? "Prewedding" :
      index === 2 ? t({ ID: "Dokumentasi Event", EN: "Event Documentation" }) :
      index === 3 ? "Studio" :
      t({ ID: "Peristiwa Lainnya", EN: "Other Occasions" })
    ),
    description: getField("services_page", serviceId, `services_${serviceId}_desc`, ""),
    narrative: getField("services_page", serviceId, `services_${serviceId}_narrative`, ""),
    images: [
      getImage(`services_${serviceId}_image_1`,
        serviceId === "wedding" ? mediaAssets.wedding.couplePortrait :
        serviceId === "prewedding" ? mediaAssets.editorial.outdoorCouple :
        serviceId === "event" ? mediaAssets.wedding.group :
        serviceId === "studio" ? mediaAssets.wedding.ringPortrait :
        mediaAssets.wedding.family
      ),
      getImage(`services_${serviceId}_image_2`,
        serviceId === "wedding" ? mediaAssets.wedding.ceremony :
        serviceId === "prewedding" ? mediaAssets.hero.moment :
        serviceId === "event" ? mediaAssets.wedding.table :
        serviceId === "studio" ? mediaAssets.wedding.detailPortrait :
        mediaAssets.editorial.outdoorCouple
      ),
      mediaAssets.hero.ring,
    ],
    meta: [
      {
        label: t({ ID: "Durasi", EN: "Coverage" }),
        value: getField("services_page", serviceId, `services_${serviceId}_duration`,
          index === 0 ? t({ ID: "Full Day", EN: "Full Day" }) :
          index === 2 ? t({ ID: "Jam Fleksibel", EN: "Flexible Hours" }) :
          index === 3 ? t({ ID: "2 Jam", EN: "2 Hours" }) :
          t({ ID: "Fleksibel", EN: "Flexible" })
        )
      },
      {
        label: t({ ID: "Highlight", EN: "Highlight" }),
        value: getField("services_page", serviceId, `services_${serviceId}_highlight`,
          index === 0 ? t({ ID: "Cerita H+2", EN: "H+2 Story" }) :
          index === 1 ? "Moodboard" :
          index === 2 ? t({ ID: "Foto Highlight", EN: "Highlight Photos" }) :
          index === 3 ? t({ ID: "Lighting Premium", EN: "Premium Lighting" }) :
          t({ ID: "Custom Konsep", EN: "Custom Concept" })
        )
      },
      {
        label: t({ ID: "Akses", EN: "Access" }),
        value: getField("services_page", serviceId, `services_${serviceId}_access`,
          index === 0 ? t({ ID: "Portal Klien", EN: "Client Portal" }) :
          index === 1 ? t({ ID: "Romantic Editorial", EN: "Romantic Editorial" }) :
          index === 2 ? t({ ID: "Galeri Online", EN: "Online Gallery" }) :
          index === 3 ? t({ ID: "Galeri Online", EN: "Online Gallery" }) :
          t({ ID: "Digital Only", EN: "Digital Only" })
        )
      },
    ],
    includes: [
      getField("services_page", serviceId, `services_${serviceId}_include_1`, ""),
      getField("services_page", serviceId, `services_${serviceId}_include_2`, ""),
      getField("services_page", serviceId, `services_${serviceId}_include_3`, ""),
      getField("services_page", serviceId, `services_${serviceId}_include_4`, ""),
      getField("services_page", serviceId, `services_${serviceId}_include_5`, ""),
    ].filter(Boolean),
  })).filter((service) => service.isActive);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <PageIntro
        eyebrow={getField("services_page", "intro", "services_page_eyebrow", t({ ID: "Layanan Terkurasi", EN: "Curated Services" }))}
        title={getField("services_page", "intro", "services_page_title", t({ ID: "Layanan Dokumentasi", EN: "Signature Documentation" }))}
        description={getField("services_page", "intro", "services_page_desc", t({
          ID: "Pilih dokumentasi yang dirancang untuk ritme acara Anda: rapi, hangat, editorial, dan tetap terasa personal dari awal hingga akhir.",
          EN: "Choose a documentation experience shaped around your occasion: refined, warm, editorial, and intentionally personal from first brief to final delivery.",
        }))}
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
                <div className="service-photo-frame relative mx-auto">
                  <div className="service-photo-frame-inner relative w-full overflow-hidden">
                    {service.images.map((image, imageIndex) => (
                      <img
                        key={image}
                        src={image}
                        alt={`${service.title} ${imageIndex + 1}`}
                        className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-1000 ease-out ${
                          activeSlide === imageIndex ? "scale-100 opacity-100" : "scale-[1.025] opacity-0"
                        }`}
                        loading={imageIndex === 0 ? "eager" : "lazy"}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/80">{service.eyebrow}</p>
                  </div>
                  <div className="absolute right-5 top-5 flex gap-2" aria-hidden="true">
                    {service.images.map((image, imageIndex) => (
                      <span
                        key={`${image}-dot`}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          activeSlide === imageIndex ? "w-8 bg-white" : "w-1.5 bg-white/45"
                        }`}
                      />
                    ))}
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
                    <div
                      key={item.label}
                      onMouseMove={updateServiceCardCursor}
                      className="service-detail-card border px-4 py-3"
                    >
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
                      {t({ ID: "Pengalaman yang Termasuk", EN: "Included Experience" })}
                    </h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {service.includes.map((item, i) => (
                      <li
                        key={i}
                        onMouseMove={updateServiceCardCursor}
                        className="service-detail-card flex items-center gap-3 border px-4 py-3 text-sm text-foreground-secondary"
                      >
                        <Check size={15} className="shrink-0 text-premium-beige" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-3 text-sm text-foreground-secondary sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-premium-beige" />
                    <span>{t({ ID: "Timeline jelas", EN: "Clear timeline" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GalleryHorizontal size={16} className="text-premium-beige" />
                    <span>{t({ ID: "Galeri terkurasi", EN: "Curated gallery" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-premium-beige" />
                    <span>{t({ ID: "Review privat", EN: "Private review" })}</span>
                  </div>
                </div>

                <Link
                  to="/packages"
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-dark-premium px-6 py-3 text-sm text-white transition-all hover:bg-dark-premium/90"
                >
                  {t({ ID: "Reservasi Layanan Ini", EN: "Book This Service" })}
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
