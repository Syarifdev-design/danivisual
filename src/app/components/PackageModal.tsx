import { ArrowRight, Check, X } from "lucide-react";
import { Link } from "react-router";
import { addons, formatShortPrice, packageCategories } from "../data/bookingData";
import { useLanguage } from "../contexts/LanguageContext";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: "wedding" | "prewed-studio" | "prewed-outdoor" | "event";
}

const serviceColumnOrder = ["Photo", "Video", "Photo + Video"] as const;

export default function PackageModal({ isOpen, onClose }: PackageModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <div
            className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-sm bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 border-b border-[#e8ded0] bg-[#111111] px-6 py-6 text-white lg:px-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c8a96d]">
                    {t({ ID: "Danivisual - Daftar Harga 26/27", EN: "Danivisual Pricelist 26/27" })}
                  </p>
                  <h2 className="text-2xl leading-tight lg:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {t({ ID: "Pilih Paket Dokumentasi", EN: "Choose Your Documentation Package" })}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                    {t({
                      ID: "Semua kategori dari pricing guide ditampilkan dalam satu visual perbandingan.",
                      EN: "Every category from the pricing guide is arranged in one clear comparison view.",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t({ ID: "Tutup modal paket", EN: "Close package modal" })}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
              <div className="space-y-8">
                {packageCategories.map((category) => {
                  const serviceColumns = serviceColumnOrder.filter((serviceName) =>
                    category.packages.some((pkg) => pkg.serviceTypes.some((service) => service.name === serviceName))
                  );
                  const categoryAddons = addons.filter((addon) => addon.categoryIds.includes(category.id));

                  return (
                    <section key={category.id} className="overflow-hidden border border-[#e8ded0] bg-white">
                      <div className="flex flex-col gap-2 border-b border-[#e8ded0] bg-white px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b89a63]">{category.eyebrow}</p>
                          <h3 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>{category.name}</h3>
                        </div>
                        {category.note && <p className="max-w-md text-sm text-foreground-secondary">{category.note}</p>}
                      </div>

                      <div className="overflow-x-auto">
                        <div className="min-w-[760px]">
                          <div
                            className="grid border-b border-[#111111]/20"
                            style={{ gridTemplateColumns: `150px repeat(${serviceColumns.length}, minmax(180px, 1fr))` }}
                          >
                            <div className="px-5 py-4 text-sm font-semibold tracking-[0.2em] text-[#7a674b]">
                              {t({ ID: "Paket", EN: "Tier" })}
                            </div>
                            {serviceColumns.map((serviceName) => (
                              <div key={serviceName} className="border-l border-[#111111]/20 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em]">
                                {serviceName}
                              </div>
                            ))}
                          </div>

                          {category.packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="grid border-b border-[#e8ded0] last:border-b-0"
                              style={{ gridTemplateColumns: `150px repeat(${serviceColumns.length}, minmax(180px, 1fr))` }}
                            >
                              <div className="flex items-center px-5 py-6">
                                <div>
                                  <p className="text-xl uppercase" style={{ fontFamily: "var(--font-heading)" }}>
                                    {pkg.name.replace(new RegExp(`^${category.name}\\s+`, "i"), "")}
                                  </p>
                                  {pkg.isMostSelected && (
                                    <span className="mt-2 inline-flex border border-[#c8a96d]/60 bg-[#fff8ec] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b7355]">
                                      {t({ ID: "Paling dipilih", EN: "Most selected" })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {serviceColumns.map((serviceName) => {
                                const service = pkg.serviceTypes.find((item) => item.name === serviceName);
                                if (!service) return <div key={serviceName} className="border-l border-[#e8ded0] bg-white" />;

                                return (
                                  <div key={service.id} className="border-l border-[#e8ded0] px-5 py-6 text-center">
                                    <p className="text-2xl font-semibold">{formatShortPrice(service.price)}</p>
                                    <ul className="mt-4 grid gap-2 text-left">
                                      {service.includes.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-[#4f4942]">
                                          <Check size={12} className="mt-0.5 shrink-0 text-[#b89a63]" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {categoryAddons.length > 0 && (
                        <div className="border-t border-[#e8ded0] px-5 py-5">
                          <p className="mb-3 text-[10px] font-semibold tracking-[0.24em] text-[#b89a63]">
                            {t({ ID: "Add-on pilihan", EN: "Optional add-ons" })}
                          </p>
                          <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                            {categoryAddons.map((addon) => (
                              <div key={addon.id} className="flex items-center justify-between gap-4 border-b border-[#e8ded0] py-3 text-sm">
                                <span>{addon.name}</span>
                                <strong className="shrink-0 text-[#111111]">{addon.displayPrice}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              <div className="mt-8 border border-[#e8ded0] bg-[#111111] p-6 text-white md:flex md:items-center md:justify-between md:gap-6">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.24em] text-[#c8a96d]">
                    {t({ ID: "Reservasi", EN: "Reservation" })}
                  </p>
                  <h3 className="mt-3 text-2xl leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                    {t({ ID: "Siap pilih paket?", EN: "Ready to choose your package?" })}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                    {t({
                      ID: "Masuk ke halaman paket untuk memilih kategori, jenis layanan, add-on, lalu lanjut checkout.",
                      EN: "Open the package page to choose your category, service format, add-ons, then continue to checkout.",
                    })}
                  </p>
                </div>
                <Link
                  to="/packages"
                  onClick={onClose}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#f6efe3] md:mt-0"
                >
                  {t({ ID: "Lihat Paket", EN: "View Packages" })}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="shrink-0 border-t border-[#e8ded0] bg-background-soft px-6 py-4 lg:px-8">
              <p className="text-center text-xs text-foreground-secondary lg:text-sm">
                {t({
                  ID: "DP awal Rp 500.000 untuk mengamankan tanggal acara. Pelunasan H+2 setelah acara.",
                  EN: "An initial IDR 500,000 deposit secures your event date. Final settlement is due two days after the event.",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
