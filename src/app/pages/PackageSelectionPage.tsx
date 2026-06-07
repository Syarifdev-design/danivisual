import { useEffect, useMemo, useState } from "react";
import { Camera, Check, ChevronRight, Clapperboard, Info, Minus, Play, Plus, Sparkles, Video, X } from "lucide-react";
import { useNavigate } from "react-router";
import { formatShortPrice } from "../data/bookingData";
import { findCategoryInCatalog, getAddonsFromAdmin, getPackageCategoriesFromAdmin } from "../data/adminPackageCatalog";
import { useBooking } from "../contexts/BookingContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";
import { useAdmin } from "../contexts/AdminContext";

const serviceColumnOrder = ["Photo", "Video", "Photo + Video"] as const;

const packageToneByIndex = [
  {
    row: "bg-[#fffaf2]",
    cell: "bg-[#fffdf9] hover:bg-[#fff8ec]",
    label: "border-[#e3cda6] bg-[#fff8ec] text-[#8b6f3f]",
    stripe: "bg-[#d8b875]",
  },
  {
    row: "bg-[#faf4e8]",
    cell: "bg-[#fffaf1] hover:bg-[#f7eddc]",
    label: "border-[#d4b06f] bg-[#fff4dc] text-[#7f6130]",
    stripe: "bg-[#c8a96d]",
  },
  {
    row: "bg-[#f4f6ef]",
    cell: "bg-[#fbfcf7] hover:bg-[#f0f4e9]",
    label: "border-[#c0c8a7] bg-[#f2f5e9] text-[#65704d]",
    stripe: "bg-[#aeb88e]",
  },
] as const;

export default function PackageSelectionPage() {
  const navigate = useNavigate();
  const booking = useBooking();
  const { categories: adminCategories, packages: adminPackages, addons: adminAddons } = useAdmin();
  const { t } = useLanguage();
  const { getField } = useContent();
  const packageCategories = useMemo(
    () => getPackageCategoriesFromAdmin(adminCategories, adminPackages),
    [adminCategories, adminPackages],
  );
  const addons = useMemo(() => getAddonsFromAdmin(adminAddons), [adminAddons]);
  const [previewServiceId, setPreviewServiceId] = useState<string | null>(null);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const selectedPackage = booking.getSelectedPackage();
  const selectedServiceType = booking.getSelectedServiceType();
  const selectedAddonDetails = booking.getSelectedAddonDetails();
  const selectedCategory = findCategoryInCatalog(packageCategories, booking.selectedCategoryId);
  const categoryAddons = addons.filter((addon) => addon.categoryIds.includes(selectedCategory.id));
  const serviceColumns = serviceColumnOrder.filter((serviceName) =>
    selectedCategory.packages.some((pkg) => pkg.serviceTypes.some((service) => service.name === serviceName))
  );
  const previewService = selectedPackage?.serviceTypes.find((service) => service.id === previewServiceId);
  const selectedCellLabel = selectedPackage && selectedServiceType
    ? `${selectedPackage.name.replace(new RegExp(`^${selectedCategory.name}\\s+`, "i"), "")} ${selectedServiceType.name}`
    : t({ ID: "Belum dipilih", EN: "Not selected yet" });

  useEffect(() => {
    if (!packageCategories.some((category) => category.id === booking.selectedCategoryId)) {
      booking.setSelectedCategoryId(packageCategories[0].id);
    }
  }, [booking, packageCategories]);

  useEffect(() => {
    if (!previewService) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewServiceId(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewService]);

  useEffect(() => {
    if (!pendingServiceId || !selectedPackage?.serviceTypes.some((service) => service.id === pendingServiceId)) return;

    booking.setSelectedServiceTypeId(pendingServiceId);
    setPendingServiceId(null);
  }, [booking, pendingServiceId, selectedPackage]);

  const chooseService = (packageId: string, serviceId: string) => {
    booking.setSelectedPackageId(packageId);
    setPendingServiceId(serviceId);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <section className="px-4 py-7 pb-32 sm:px-5 lg:px-8 lg:py-10 lg:pb-14">
        <div className="mx-auto w-full max-w-7xl min-w-0">
          <SectionHeader
            eyebrow={getField("packages", "intro", "eyebrow", t({ ID: "Daftar Harga Interaktif", EN: "Interactive Pricelist" }))}
            title={getField("packages", "intro", "title", t({ ID: "Rancang Paket Dokumentasi Anda", EN: "Design Your Documentation Plan" }))}
            subtitle={getField("packages", "intro", "description", t({
              ID: "Pilih tier, jenis layanan, dan add-on dalam satu alur yang transparan. Setiap rincian harga langsung tampil agar keputusan terasa mudah dan terarah.",
              EN: "Select your tier, service format, and add-ons in one transparent flow. Every price detail appears instantly, helping you make a confident and refined decision.",
            }))}
          />

          <div className="mb-5 flex max-w-[calc(100vw-2rem)] gap-2 overflow-x-auto pb-2 sm:mb-8 sm:max-w-[calc(100vw-2.5rem)] sm:gap-3 lg:max-w-none">
            {packageCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => booking.setSelectedCategoryId(category.id)}
                className={`shrink-0 border px-3 py-2.5 text-left transition sm:px-4 sm:py-3 ${
                  category.id === selectedCategory.id
                    ? "border-[#111111] bg-[#111111] text-white shadow-[0_18px_38px_rgba(17,17,17,0.16)]"
                    : "border-[#e8ded0] bg-white text-[#4f4942] hover:border-[#c8a96d]"
                }`}
              >
                <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] opacity-70">
                  {category.eyebrow}
                </span>
                <span className="mt-1 block text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>

          <div className="grid min-w-0 gap-4 sm:gap-7 xl:grid-cols-[1fr_370px]">
            <div className="min-w-0 overflow-hidden border border-[#ded2c0] bg-white shadow-[0_26px_80px_rgba(38,28,16,0.08)]">
              <div className="grid gap-3 border-b border-[#e8ded0] bg-[#111111] px-4 py-5 text-white md:grid-cols-[1fr_0.9fr] md:items-center md:gap-5 lg:px-7 lg:py-6">
                <div>
                  <p className="mb-2 text-[9px] font-semibold tracking-[0.24em] text-[#c8a96d] sm:text-[10px] sm:tracking-[0.3em]">
                    {t({
                      ID: `${selectedCategory.eyebrow} - Daftar Harga 26/27`,
                      EN: `${selectedCategory.eyebrow} - Pricelist 26/27`,
                    })}
                  </p>
                  <h2 className="text-2xl leading-tight sm:text-3xl md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {selectedCategory.name}
                  </h2>
                </div>
                <div className="border border-white/14 bg-white/[0.04] p-3 sm:p-4">
                  <div className="mb-2 flex items-start gap-2.5 sm:mb-3 sm:gap-3">
                    <Info size={16} className="mt-0.5 shrink-0 text-[#c8a96d] sm:size-[18px]" />
                    <p className="text-xs leading-relaxed text-white/72 sm:text-sm">
                      {selectedCategory.note || "Durasi dan detail sesi mengikuti ketentuan paket yang dipilih."}
                    </p>
                  </div>
                  <div className="grid gap-2 text-[11px] text-white/64 sm:grid-cols-2 sm:gap-3 sm:text-xs">
                    <span className="border-t border-white/12 pt-2 sm:pt-3">
                      {t({ ID: "Pilihan aktif", EN: "Active selection" })}
                    </span>
                    <strong className="border-t border-white/12 pt-2 text-white sm:pt-3 sm:text-right">{selectedCellLabel}</strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 bg-white p-3 md:hidden">
                {selectedCategory.packages.map((pkg, rowIndex) => {
                  const tone = packageToneByIndex[rowIndex % packageToneByIndex.length];
                  const packageLabel = pkg.name.replace(new RegExp(`^${selectedCategory.name}\\s+`, "i"), "");

                  return (
                    <article
                      key={`${pkg.id}-mobile`}
                      className={`mobile-package-card overflow-hidden border border-[#ded2c0] shadow-[0_14px_34px_rgba(38,28,16,0.055)] ${tone.row}`}
                      style={{ animationDelay: `${100 + rowIndex * 90}ms` }}
                    >
                      <div className="relative px-3 py-2.5">
                        <span className={`absolute inset-y-2.5 left-0 w-1 ${tone.stripe}`} />
                        <div className="flex items-start justify-between gap-2 pl-3">
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#8b7355]">
                              {t({ ID: `Paket ${rowIndex + 1}`, EN: `Tier ${rowIndex + 1}` })}
                            </p>
                            <h3 className="mt-0.5 text-xl leading-tight text-[#111111]" style={{ fontFamily: "var(--font-heading)" }}>
                              {packageLabel}
                            </h3>
                          </div>
                          {pkg.isMostSelected && (
                            <span className={`shrink-0 border px-2 py-1 text-[9px] font-semibold tracking-[0.12em] ${tone.label}`}>
                              {t({ ID: "Favorit", EN: "Favorite" })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-1.5 border-t border-[#e8ded0] bg-white/62 p-2">
                        {pkg.serviceTypes.map((service, serviceIndex) => {
                          const selected = pkg.id === booking.selectedPackageId && service.id === booking.selectedServiceTypeId;
                          const hiddenBenefits = Math.max(service.includes.length - 4, 0);

                          return (
                            <button
                              key={`${service.id}-mobile`}
                              type="button"
                              onClick={() => chooseService(pkg.id, service.id)}
                              className={`mobile-service-option group relative overflow-hidden border p-2.5 text-left transition-all duration-300 ${
                                selected
                                  ? "border-[#c8a96d] bg-[#111111] text-white shadow-[0_18px_38px_rgba(17,17,17,0.16)]"
                                  : `border-[#e8ded0] ${tone.cell}`
                              }`}
                              style={{ animationDelay: `${160 + rowIndex * 90 + serviceIndex * 60}ms` }}
                            >
                              <span className={`absolute inset-x-4 top-3 h-px origin-left transition-transform duration-500 ${
                                selected ? "scale-x-100 bg-[#c8a96d]" : "scale-x-0 bg-[#c8a96d]/70 group-hover:scale-x-100"
                              }`} />
                              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
                                <ServiceTypeIcon serviceName={service.name} />
                                <div className="min-w-0">
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <p className={`text-sm font-semibold ${selected ? "text-white" : "text-[#111111]"}`}>
                                        {service.name}
                                      </p>
                                      <strong className={`whitespace-nowrap text-base leading-none tabular-nums ${selected ? "text-white" : "text-[#111111]"}`}>
                                        {formatShortPrice(service.price)}
                                      </strong>
                                    </div>
                                    {hiddenBenefits > 0 && (
                                      <span className={`mt-1 block text-[10px] font-semibold ${selected ? "text-[#f2d9a6]" : "text-[#9d7b3f]"}`}>
                                        + {hiddenBenefits} {t({ ID: "benefit", EN: "benefits" })}
                                      </span>
                                    )}
                                  </div>
                                  <PackageInclusionList includes={service.includes.slice(0, 3)} selected={selected} compact />
                                </div>
                              </div>
                              <span className={`mt-2.5 inline-flex min-h-8 items-center justify-center border px-3 text-[10px] font-semibold tracking-[0.12em] ${
                                selected
                                  ? "border-white/22 bg-white text-[#111111]"
                                  : "border-[#d8c7a3] bg-white/72 text-[#111111]"
                              }`}>
                                {selected ? t({ ID: "Paket dipilih", EN: "Selected" }) : t({ ID: "Pilih paket", EN: "Choose package" })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-visible md:block">
                <div className="w-full">
                  <div
                    className="grid border-b border-[#111111]/15 bg-white"
                    style={{ gridTemplateColumns: `150px repeat(${serviceColumns.length}, minmax(0, 1fr))` }}
                  >
                    <div className="flex min-h-[108px] items-start px-5 py-5 text-sm font-semibold tracking-[0.2em] text-[#7a674b]">
                      {t({ ID: "Paket", EN: "Tier" })}
                    </div>
                    {serviceColumns.map((serviceName) => (
                      <div key={serviceName} className="flex min-h-[108px] flex-col items-center justify-center border-l border-[#111111]/15 px-5 py-4 text-center">
                        <div className="mb-1.5 flex justify-center">
                          <ServiceTypeIcon serviceName={serviceName} />
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#111111]">{serviceName}</p>
                      </div>
                    ))}
                  </div>

                  {selectedCategory.packages.map((pkg, rowIndex) => {
                    const tone = packageToneByIndex[rowIndex % packageToneByIndex.length];

                    return (
                    <div
                      key={pkg.id}
                      className="grid border-b border-[#e8ded0] last:border-b-0"
                      style={{ gridTemplateColumns: `150px repeat(${serviceColumns.length}, minmax(0, 1fr))` }}
                    >
                      <div className={`relative flex min-h-[230px] items-center px-5 py-6 ${tone.row}`}>
                        <span className={`absolute inset-y-8 left-0 w-1 ${tone.stripe}`} />
                        <div>
                          <p className="text-xl uppercase tracking-[0.02em]" style={{ fontFamily: "var(--font-heading)" }}>
                            {pkg.name.replace(new RegExp(`^${selectedCategory.name}\\s+`, "i"), "")}
                          </p>
                          {pkg.isMostSelected && (
                            <span className={`mt-3 inline-flex border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${tone.label}`}>
                              Most Selected
                            </span>
                          )}
                          <span className={`mt-4 inline-flex border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${tone.label}`}>
                            Tier {rowIndex + 1}
                          </span>
                        </div>
                      </div>

                      {serviceColumns.map((serviceName, columnIndex) => {
                        const service = pkg.serviceTypes.find((item) => item.name === serviceName);
                        if (!service) return <div key={serviceName} className="border-l border-[#e8ded0] bg-[#f5f0e8]" />;

                        const selected = pkg.id === booking.selectedPackageId && service.id === booking.selectedServiceTypeId;
                        const hiddenBenefits = Math.max(service.includes.length - 4, 0);

                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => chooseService(pkg.id, service.id)}
                            className={`package-pricelist-cell group relative flex min-h-[230px] flex-col items-center justify-start overflow-hidden border-l border-[#e8ded0] px-5 py-6 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96d] ${
                              selected
                                ? "bg-[#111111] text-white shadow-[inset_0_0_0_1px_rgba(200,169,109,0.7)]"
                                : tone.cell
                            }`}
                            style={{ animationDelay: `${120 + rowIndex * 80 + columnIndex * 40}ms` }}
                          >
                            <span className={`absolute inset-x-5 top-3 h-px origin-left transition-transform duration-500 ${
                              selected ? "scale-x-100 bg-[#c8a96d]" : "scale-x-0 bg-[#c8a96d]/70 group-hover:scale-x-100"
                            }`} />
                            {selected && (
                              <span className="absolute right-4 top-4 inline-flex items-center gap-1 border border-[#c8a96d]/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#f2d9a6]">
                              <Check size={11} /> {t({ ID: "Dipilih", EN: "Selected" })}
                              </span>
                            )}
                            <span className="flex w-full flex-col items-center">
                              <span className={`block text-3xl font-semibold leading-none ${selected ? "text-white" : "text-[#111111]"}`}>
                                {formatShortPrice(service.price)}
                              </span>
                              <PackageInclusionList includes={service.includes.slice(0, 4)} selected={selected} />
                              <span className={`mt-2 block min-h-4 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                                hiddenBenefits > 0 ? "" : "opacity-0"
                              } ${
                                  selected ? "text-[#f2d9a6]" : "text-[#9d7b3f]"
                                }`}>
                                + {Math.max(hiddenBenefits, 1)} {t({ ID: "benefit", EN: "benefit" })}
                              </span>
                            </span>
                            <span className={`mt-auto inline-flex min-h-9 items-center justify-center border px-4 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                              selected
                                ? "border-white/22 bg-white text-[#111111]"
                                : "border-[#d8c7a3] bg-white/60 text-[#111111] group-hover:border-[#111111]"
                            }`}>
                              {selected ? t({ ID: "Paket dipilih", EN: "Selected" }) : t({ ID: "Pilih paket", EN: "Choose package" })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                  })}
                </div>
              </div>

              {categoryAddons.length > 0 && (
                <div className="border-t border-[#e8ded0] bg-white px-3 py-4 sm:px-5 sm:py-5 lg:px-7">
                  <div className="mb-3 flex flex-col gap-1.5 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold tracking-[0.24em] text-[#b89a63]">
                        {t({ ID: "Add-on Pilihan", EN: "Optional Add-ons" })}
                      </p>
                      <h3 className="text-lg sm:text-xl" style={{ fontFamily: "var(--font-heading)" }}>
                        {t({ ID: `Tambahan ${selectedCategory.name}`, EN: `${selectedCategory.name} Enhancements` })}
                      </h3>
                    </div>
                    <p className="max-w-sm text-xs leading-relaxed text-foreground-secondary">
                      {t({
                        ID: "Centang add-on untuk menambahkannya ke rincian checkout.",
                        EN: "Select add-ons to include them in your checkout summary.",
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {categoryAddons.map((addon, addonIndex) => {
                      const selected = booking.selectedAddons.find((item) => item.id === addon.id);

                      return (
                        <div
                          key={addon.id}
                          onClick={() => booking.toggleAddon(addon.id)}
                          className={[
                            "group relative flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-200",
                            selected
                              ? "border-[#b8934f] bg-[#fff8ec] shadow-[0_4px_14px_rgba(38,28,16,0.04)]"
                              : "border-[#e6dac8] bg-white hover:border-[#c8a96a] hover:bg-[#fffaf3]",
                          ].join(" ")}
                          style={{ animationDelay: `${addonIndex * 45}ms` }}
                        >
                          {/* Checkbox */}
                          <span className={[
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200",
                            selected
                              ? "border-[#b8934f] bg-[#b8934f]"
                              : "border-[#d4c4a8] bg-white group-hover:border-[#c8a96a]",
                          ].join(" ")}>
                            {selected && <Check size={11} strokeWidth={2.6} className="text-white" />}
                          </span>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-[15px] font-semibold leading-snug text-[#111111]">{addon.name}</span>
                              <span className="shrink-0 text-[15px] font-bold text-[#111111]">{addon.displayPrice}</span>
                            </div>
                            <p className="mt-1 text-[12px] leading-snug text-foreground-secondary">
                              {addon.unit
                                ? t({ ID: `Per ${addon.unit}`, EN: `Per ${addon.unit === "hari" ? "day" : "hour"}` })
                                : t({ ID: "Sekali tambah", EN: "One-time addition" })}
                            </p>
                          </div>

                          {/* Quantity controls */}
                          {addon.hasQuantity && selected && (
                            <div
                              className="absolute -top-3 right-3 flex items-center rounded-lg border border-[#d8c7a3] bg-white shadow-[0_4px_12px_rgba(38,28,16,0.06)]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => booking.setAddonQuantity(addon.id, selected.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center text-neutral-600 transition hover:text-neutral-900"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-[#111111]">{selected.quantity}</span>
                              <button
                                type="button"
                                onClick={() => booking.setAddonQuantity(addon.id, selected.quantity + 1)}
                                className="flex h-7 w-7 items-center justify-center text-neutral-600 transition hover:text-neutral-900"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <aside className="package-summary-panel h-fit border border-[#ded2c0] bg-white p-6 shadow-[0_24px_70px_rgba(38,28,16,0.08)] xl:sticky xl:top-28 xl:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-[#e8ded0] pb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#111111] text-[#c8a96d]">
                  <Sparkles size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.24em] text-[#b89a63]">
                    {t({ ID: "Detail Checkout", EN: "Checkout Detail" })}
                  </p>
                  <h3 className="text-2xl leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                    {t({ ID: "Rincian Pilihan", EN: "Your Selection" })}
                  </h3>
                </div>
              </div>

              {selectedPackage && selectedServiceType ? (
                <>
                  <Summary
                    packageName={selectedPackage.name}
                    serviceName={selectedServiceType.name}
                    servicePrice={selectedServiceType.price}
                    includes={selectedServiceType.includes}
                    addons={selectedAddonDetails}
                  />
                  <div className="mt-6 grid gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewServiceId(selectedServiceType.id)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#d8c7a3] bg-white px-6 text-sm font-medium text-[#111111] transition hover:border-[#111111]"
                    >
                      <Play size={15} /> {t({ ID: "Preview hasil", EN: "Preview results" })}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/checkout")}
                      className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#111111] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#25211c]"
                    >
                      {t({ ID: "Lanjut checkout", EN: "Continue to checkout" })}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-[#d8c7a3] bg-[#fff8ec] p-5 text-sm leading-relaxed text-foreground-secondary">
                  {t({
                    ID: "Pilih satu opsi pada daftar harga untuk membuka rincian checkout, benefit paket, dan estimasi pembayaran.",
                    EN: "Choose one option from the pricelist to reveal checkout details, package inclusions, and payment estimate.",
                  })}
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {previewService && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close preview overlay"
            className="absolute inset-0 cursor-default"
            onClick={() => setPreviewServiceId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-preview-title"
            className="relative z-10 max-h-[88vh] w-full max-w-6xl overflow-y-auto border border-[#e8ded0] bg-white p-6 shadow-[0_28px_80px_rgba(17,17,17,0.22)] md:p-8"
          >
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setPreviewServiceId(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#e8ded0] bg-white/90 text-[#111111] transition hover:border-[#c8a96d]"
            >
              <X size={18} />
            </button>

            <div className="pr-12">
              <p className="mb-3 text-xs font-semibold tracking-[0.24em] text-[#b89a63]">
                {t({ ID: "Preview", EN: "Preview" })}
              </p>
              <h2 id="service-preview-title" className="text-4xl leading-tight md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                {t({ ID: "Contoh Foto / Preview Hasil", EN: "Sample Photos / Preview Results" })}
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {previewService.sampleImages.slice(0, 6).map((image, index) => (
                <div key={`${previewService.id}-${image}-${index}`} className="aspect-[4/3] overflow-hidden bg-background-soft">
                  <img src={image} alt={`${previewService.name} sample ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>

            <div className="mt-8 flex min-h-28 items-center justify-center border border-dashed border-[#c8a96d]/60 bg-white/42 px-5 text-center">
              {previewService.sampleVideoUrl ? (
                <a href={previewService.sampleVideoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-[#111111]">
                  <Play size={16} /> {t({ ID: "Lihat preview video", EN: "View video preview" })}
                </a>
              ) : (
                <p className={`text-sm text-foreground-secondary ${previewService.name !== "Photo" ? "font-medium" : ""}`}>
                  {t({ ID: "Preview video akan tersedia.", EN: "A video preview will be available." })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-7 max-w-[calc(100vw-2.5rem)] lg:max-w-4xl">
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-premium-beige">{eyebrow}</p>
      <h1 className="max-w-[320px] text-4xl leading-tight sm:max-w-none lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>{title}</h1>
      {subtitle && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground-secondary">{subtitle}</p>}
    </div>
  );
}

function ServiceTypeIcon({ serviceName }: { serviceName: "Photo" | "Video" | "Photo + Video" }) {
  const iconClass = "text-[#9d7b3f]";

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#d8c7a3]/70 bg-[#fff8ec] shadow-[0_8px_18px_rgba(38,28,16,0.04)] sm:h-9 sm:w-9">
      {serviceName === "Photo" && <Camera size={17} strokeWidth={1.6} className={iconClass} />}
      {serviceName === "Video" && <Clapperboard size={17} strokeWidth={1.6} className={iconClass} />}
      {serviceName === "Photo + Video" && (
        <span className="relative flex h-5 w-6 items-center justify-center">
          <Camera size={16} strokeWidth={1.55} className={iconClass} />
          <Video size={11} strokeWidth={1.7} className="absolute -bottom-1 -right-1 text-[#9d7b3f]" />
        </span>
      )}
    </span>
  );
}

function PackageInclusionList({ includes, selected, compact = false }: { includes: string[]; selected: boolean; compact?: boolean }) {
  return (
    <span
      role="list"
      className={`mx-auto grid max-w-[280px] content-start text-left font-medium ${
        compact ? "mt-2 gap-1 text-[11px] leading-4" : "mt-3 gap-1.5 text-xs leading-5"
      } ${
        compact ? "min-h-0" : ""
      } ${selected ? "text-white/76" : "text-[#5c5348]"}`}
    >
      {includes.map((item) => (
        <span key={item} role="listitem" className="flex items-start gap-2">
          <Check
            size={12}
            strokeWidth={2.2}
            className={`mt-0.5 shrink-0 ${selected ? "text-[#f2d9a6]" : "text-[#b89a63]"}`}
          />
          <span>{item}</span>
        </span>
      ))}
    </span>
  );
}

function Summary({
  packageName,
  serviceName,
  servicePrice,
  includes,
  addons: selectedAddons,
}: {
  packageName: string;
  serviceName: string;
  servicePrice: number;
  includes: string[];
  addons: Array<{ addon: { id: string; name: string; hasQuantity?: boolean }; quantity: number; total: number }>;
}) {
  const { t } = useLanguage();
  const addonTotal = selectedAddons.reduce((sum, item) => sum + item.total, 0);
  const subtotal = servicePrice + addonTotal;
  const downPayment = 500000;
  const remainingPayment = Math.max(subtotal - downPayment, 0);

  return (
    <div>
      <div className="space-y-4 text-sm">
        <div className="border border-[#e8ded0] bg-white p-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#b89a63]">
            {t({ ID: "Paket dipilih", EN: "Selected package" })}
          </p>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 text-foreground">
            <span className="min-w-0 leading-relaxed">{packageName} - {serviceName}</span>
            <strong className="whitespace-nowrap text-right tabular-nums">{formatShortPrice(servicePrice)}</strong>
          </div>
        </div>

        <div>
          <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#8b7355]">
            {t({ ID: "Termasuk", EN: "Included" })}
          </p>
          <ul className="grid gap-2">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-foreground-secondary">
                <Check size={13} className="mt-0.5 shrink-0 text-[#b89a63]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[#e8ded0] pt-4">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#8b7355]">
            {t({ ID: "Add-on", EN: "Add-ons" })}
          </p>
          {selectedAddons.length === 0 ? (
            <p className="text-foreground-secondary">
              {t({ ID: "Tidak ada add-on tambahan.", EN: "No additional add-ons selected." })}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedAddons.map(({ addon, quantity, total }) => (
                <div key={addon.id} className="flex justify-between gap-4 text-foreground-secondary">
                  <span>{addon.name}{addon.hasQuantity ? ` x${quantity}` : ""}</span>
                  <span>{formatShortPrice(total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#111111] pt-5">
          <div className="flex justify-between gap-4">
            <span>{t({ ID: "Total sementara", EN: "Estimated total" })}</span>
            <strong>{formatShortPrice(subtotal)}</strong>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-foreground-secondary">
            <span>{t({ ID: "DP", EN: "Deposit" })}</span>
            <span>{formatShortPrice(downPayment)}</span>
          </div>
          <div className="mt-4 flex justify-between gap-4 text-xl font-semibold text-foreground">
            <span>{t({ ID: "Sisa pembayaran", EN: "Remaining balance" })}</span>
            <span>{formatShortPrice(remainingPayment)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
