import { Check, ChevronRight, Minus, Play, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { addons, formatCurrency, weddingPackages } from "../data/bookingData";
import { useBooking } from "../contexts/BookingContext";

export default function PackageSelectionPage() {
  const navigate = useNavigate();
  const booking = useBooking();
  const selectedPackage = booking.getSelectedPackage();
  const selectedServiceType = booking.getSelectedServiceType();
  const selectedAddonDetails = booking.getSelectedAddonDetails();

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-border-line bg-background-soft px-5 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs uppercase tracking-[0.26em] text-premium-beige">Quick booking</p>
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="mb-4 text-4xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
                Wedding Booking
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-foreground-secondary md:text-base">
                Pilih paket wedding, pilih jenis layanan, lalu lanjut isi data singkat dan upload DP.
              </p>
            </div>
            <div className="border border-border-line bg-white p-5 text-sm leading-relaxed text-foreground-secondary">
              Tidak perlu login atau register. Admin akan menghubungi via WhatsApp setelah DP diverifikasi.
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 pb-36 lg:px-8 lg:pb-14">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Step 01" title="Pilih paket wedding" />
          <div className="grid gap-4 md:grid-cols-3">
            {weddingPackages.map((item) => {
              const selected = item.id === booking.selectedPackageId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => booking.setSelectedPackageId(item.id)}
                  className={`min-h-[180px] rounded-2xl border bg-white p-6 text-left transition md:rounded-xl ${
                    selected ? "border-premium-beige bg-background-soft shadow-sm" : "border-border-line hover:border-premium-beige"
                  }`}
                >
                  <div className="mb-8 flex min-h-6 items-start justify-between gap-3">
                    {item.isMostSelected ? (
                      <span className="border border-premium-beige bg-premium-beige/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-foreground">
                        Most Selected
                      </span>
                    ) : (
                      <span />
                    )}
                    {selected && <span className="text-xs text-premium-beige">Selected</span>}
                  </div>
                  <h2 className="mb-7 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {item.name}
                  </h2>
                  <span className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm md:rounded-lg ${
                    selected ? "bg-dark-premium text-white" : "border border-border-line text-foreground"
                  }`}>
                    Pilih Paket
                  </span>
                </button>
              );
            })}
          </div>

          {selectedPackage && (
            <section className="mt-12">
              <SectionHeader eyebrow="Step 02" title="Pilih jenis layanan" subtitle="Harga langsung terlihat setelah memilih paket." />
              <div className="grid gap-3 md:grid-cols-3">
                {selectedPackage.serviceTypes.map((service) => {
                  const selected = service.id === booking.selectedServiceTypeId;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => booking.setSelectedServiceTypeId(service.id)}
                      className={`rounded-2xl border p-5 text-left transition md:rounded-xl ${
                        selected ? "border-premium-beige bg-background-soft" : "border-border-line bg-white hover:border-premium-beige"
                      }`}
                    >
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <h3 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>{service.name}</h3>
                        {selected && <span className="border border-premium-beige bg-white px-2 py-1 text-[11px] text-premium-beige">Selected</span>}
                      </div>
                      <p className="text-lg font-medium">{formatCurrency(service.price)}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {selectedServiceType && (
            <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-8">
                <div className="border border-border-line bg-white p-5 md:p-6">
                  <SectionHeader eyebrow="Detail paket" title="Included Experience" compact />
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {selectedServiceType.includes.map((item) => (
                      <li key={item} className="flex min-h-12 items-center gap-3 border border-border-line px-4 py-3 text-sm text-foreground-secondary">
                        <Check size={15} className="shrink-0 text-premium-beige" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-border-line bg-white p-5 md:p-6">
                  <SectionHeader eyebrow="Preview" title="Contoh foto dan video" compact />
                  <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
                    {selectedServiceType.sampleImages.slice(0, 6).map((image, index) => (
                      <div key={`${image}-${index}`} className="h-56 min-w-[72%] overflow-hidden bg-background-soft md:min-w-0">
                        <img src={image} alt={`Sample wedding ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex min-h-28 items-center justify-center border border-dashed border-premium-beige bg-background-soft px-5 text-center">
                    {selectedServiceType.sampleVideoUrl ? (
                      <a href={selectedServiceType.sampleVideoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium">
                        <Play size={16} /> Lihat preview video
                      </a>
                    ) : (
                      <p className="text-sm text-foreground-secondary">Preview video akan tersedia.</p>
                    )}
                  </div>
                </div>

                <div className="border border-border-line bg-white p-5 md:p-6">
                  <SectionHeader eyebrow="Step 03" title="Tambahan Opsional" subtitle="Pilih tambahan jika diperlukan." compact />
                  <div className="divide-y divide-border-line">
                    {addons.map((addon) => {
                      const selected = booking.selectedAddons.find((item) => item.id === addon.id);
                      return (
                        <div key={addon.id} className={`grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center ${selected ? "bg-background-soft px-3" : ""}`}>
                          <label className="flex cursor-pointer items-start gap-3">
                            <input type="checkbox" checked={Boolean(selected)} onChange={() => booking.toggleAddon(addon.id)} className="mt-1 accent-black" />
                            <span>
                              <span className="block text-sm font-medium">{addon.name}</span>
                              <span className="block text-xs text-foreground-secondary">{addon.description}</span>
                            </span>
                          </label>
                          <div className="flex items-center justify-between gap-4 md:justify-end">
                            <span className="text-sm text-foreground-secondary">{formatCurrency(addon.price)} {addon.unit || ""}</span>
                            {addon.hasQuantity && selected && (
                              <div className="flex items-center border border-border-line bg-white">
                                <button type="button" onClick={() => booking.setAddonQuantity(addon.id, selected.quantity - 1)} className="flex h-9 w-9 items-center justify-center">
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-sm">{selected.quantity}</span>
                                <button type="button" onClick={() => booking.setAddonQuantity(addon.id, selected.quantity + 1)} className="flex h-9 w-9 items-center justify-center">
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <aside className="hidden h-fit border border-border-line bg-background-soft p-6 lg:sticky lg:top-28 lg:block">
                <Summary
                  packageName={selectedPackage?.name || "-"}
                  serviceName={selectedServiceType.name}
                  servicePrice={selectedServiceType.price}
                  addons={selectedAddonDetails}
                />
                <button onClick={() => navigate("/checkout")} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-dark-premium px-6 text-sm text-white">
                  LANJUT PILIH DATA
                  <ChevronRight size={16} />
                </button>
              </aside>
            </section>
          )}
        </div>
      </section>

      {selectedServiceType && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-line bg-white/95 px-4 py-3 shadow-[0_-14px_40px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-foreground-secondary">Total sementara</p>
              <p className="text-lg font-medium">{formatCurrency(booking.calculateSubtotal())}</p>
            </div>
            <button onClick={() => navigate("/checkout")} className="min-h-12 rounded-xl bg-dark-premium px-5 text-sm text-white">
              LANJUT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle, compact }: { eyebrow: string; title: string; subtitle?: string; compact?: boolean }) {
  return (
    <div className={compact ? "mb-5" : "mb-6"}>
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-premium-beige">{eyebrow}</p>
      <h2 className="text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>{title}</h2>
      {subtitle && <p className="mt-2 max-w-xl text-sm text-foreground-secondary">{subtitle}</p>}
    </div>
  );
}

function Summary({
  packageName,
  serviceName,
  servicePrice,
  addons: selectedAddons,
}: {
  packageName: string;
  serviceName: string;
  servicePrice: number;
  addons: Array<{ addon: { id: string; name: string; hasQuantity?: boolean }; quantity: number; total: number }>;
}) {
  const addonTotal = selectedAddons.reduce((sum, item) => sum + item.total, 0);
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.22em] text-foreground-secondary">Ringkasan</p>
      <h3 className="mb-5 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>{packageName}</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span>{serviceName}</span>
          <strong>{formatCurrency(servicePrice)}</strong>
        </div>
        {selectedAddons.length === 0 ? (
          <p className="text-foreground-secondary">Tidak ada add-on tambahan.</p>
        ) : (
          selectedAddons.map(({ addon, quantity, total }) => (
            <div key={addon.id} className="flex justify-between gap-4 text-foreground-secondary">
              <span>{addon.name}{addon.hasQuantity ? ` x${quantity}` : ""}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          ))
        )}
        <div className="border-t border-border-line pt-3 font-medium">
          <div className="flex justify-between gap-4">
            <span>Total sementara</span>
            <span>{formatCurrency(servicePrice + addonTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
