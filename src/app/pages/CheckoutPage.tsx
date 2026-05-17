import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import {
  BANK_ACCOUNT_NAME,
  BANK_ACCOUNT_NUMBER,
  BANK_NAME,
  DP_AMOUNT,
  PACKING_FEE,
  buildPaymentWhatsappLink,
  formatCurrency,
} from "../data/bookingData";

const inputClass = "min-h-12 w-full rounded-xl border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige md:rounded-lg";
const labelClass = "mb-2 block text-sm font-medium text-foreground";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const booking = useBooking();
  const selectedPackage = booking.getSelectedPackage();
  const selectedServiceType = booking.getSelectedServiceType();
  const selectedAddonDetails = booking.getSelectedAddonDetails();
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  if (!selectedPackage || !selectedServiceType) {
    return (
      <div className="min-h-screen bg-background-soft px-6 py-20">
        <div className="mx-auto max-w-xl border border-border-line bg-white p-8 text-center">
          <h1 className="mb-3 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Paket belum dipilih</h1>
          <p className="mb-6 text-sm text-foreground-secondary">Pilih paket Wedding dan jenis layanan terlebih dahulu.</p>
          <Link to="/packages" className="inline-flex min-h-12 items-center rounded-xl bg-dark-premium px-6 text-sm text-white">
            Pilih Paket
          </Link>
        </div>
      </div>
    );
  }

  const updateEvent = (key: keyof typeof booking.eventData, value: string | boolean) => {
    booking.setEventData({ ...booking.eventData, [key]: value });
  };

  const handleProof = (event: ChangeEvent<HTMLInputElement>) => {
    booking.setPaymentData({ proofName: event.target.files?.[0]?.name || "" });
  };

  const copyAccount = async () => {
    await navigator.clipboard?.writeText(BANK_ACCOUNT_NUMBER);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (booking.isCheckoutReady) navigate("/booking-review");
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-background-soft pb-28 lg:pb-0">
      <section className="border-b border-border-line bg-white px-5 py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-premium-beige">Booking details</p>
          <h1 className="text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
            Lengkapi Booking
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground-secondary">
            Isi data utama saja. Detail tambahan akan difollow up admin melalui WhatsApp.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-10">
        <main className="space-y-6">
          <section className="rounded-2xl border border-border-line bg-white p-5 md:rounded-xl md:p-6">
            <SectionTitle step="Step 04" title="Data customer dan acara" />
            <div className="grid gap-5 md:grid-cols-2">
              <Field required label="Nama pasangan" placeholder="Contoh: Dani & Sinta" value={booking.eventData.coupleName} onChange={(v) => updateEvent("coupleName", v)} />
              <Field label="Rencana dekorasi" placeholder="Nama vendor dekorasi / konsep dekorasi / jika belum ada tulis menyusul" value={booking.eventData.decorationPlan} onChange={(v) => updateEvent("decorationPlan", v)} />
              <Field label="Alamat lengkap" placeholder="Alamat lengkap yang bisa dihubungi" value={booking.eventData.fullAddress} onChange={(v) => updateEvent("fullAddress", v)} />
              <Field label="Username Instagram" placeholder="@username" value={booking.eventData.instagramUsername} onChange={(v) => updateEvent("instagramUsername", v)} />
              <Field required label="Nomor WA aktif" placeholder="08xxxxxxxxxx" value={booking.eventData.activeWhatsapp} onChange={(v) => updateEvent("activeWhatsapp", v)} />
              <Field required type="date" label="Tanggal acara" value={booking.eventData.eventDate} onChange={(v) => updateEvent("eventDate", v)} />
              <div>
                <label className={labelClass}>Jam acara {!booking.eventData.eventTimePending && "*"}</label>
                <input
                  type="time"
                  disabled={booking.eventData.eventTimePending}
                  value={booking.eventData.eventTime}
                  onChange={(e) => updateEvent("eventTime", e.target.value)}
                  className={inputClass}
                />
                <label className="mt-3 flex items-center gap-2 text-sm text-foreground-secondary">
                  <input
                    type="checkbox"
                    checked={booking.eventData.eventTimePending}
                    onChange={(e) => updateEvent("eventTimePending", e.target.checked)}
                    className="accent-black"
                  />
                  Menyusul
                </label>
              </div>
              <Field required label="Alamat lokasi acara" placeholder="Alamat lokasi acara" value={booking.eventData.eventLocationAddress} onChange={(v) => updateEvent("eventLocationAddress", v)} />
              <Field label="Link Google Maps" placeholder="https://maps.google.com/..." value={booking.eventData.googleMapsLink} onChange={(v) => updateEvent("googleMapsLink", v)} />
            </div>
            <div className="mt-5">
              <label className={labelClass}>Catatan untuk admin</label>
              <textarea
                value={booking.eventData.adminNotes}
                onChange={(e) => updateEvent("adminNotes", e.target.value)}
                rows={5}
                placeholder="Tuliskan catatan tambahan seperti rundown, request angle, keluarga inti, dresscode, atau kebutuhan khusus lainnya."
                className={inputClass}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border-line bg-white p-5 md:rounded-xl md:p-6">
            <SectionTitle step="Step 05" title="Pengiriman hasil" subtitle="Alamat detail akan difollow up admin setelah hari H." />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["expedition", "Ekspedisi", "Detail alamat akan difollow up admin setelah hari H.", "Packing fee Rp 35.000 jika album fisik dikirim melalui ekspedisi."],
                ["cod-agent", "COD", "Jadwal dan alamat pengantaran akan dikonfirmasi admin setelah hari H.", "Biaya COD dikonfirmasi admin."],
                ["pickup-office", "Ambil ke kantor", "Jadwal pengambilan akan dikonfirmasi admin.", "Tanpa biaya pengiriman."],
              ].map(([id, label, desc, note]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => booking.setDeliveryMethod(id as any)}
                  className={`min-h-32 rounded-xl border p-4 text-left transition ${
                    booking.deliveryMethod === id ? "border-premium-beige bg-background-soft" : "border-border-line bg-white hover:border-premium-beige"
                  }`}
                >
                  <span className="mb-2 block text-sm font-medium">{label}</span>
                  <span className="block text-xs leading-relaxed text-foreground-secondary">{desc}</span>
                  <span className="mt-3 block text-xs leading-relaxed text-premium-beige">{note}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border-line bg-white p-5 md:rounded-xl md:p-6">
            <SectionTitle step="Step 06" title="Pembayaran DP" />
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr]">
              <div className="rounded-2xl border border-border-line bg-background-soft p-5 md:rounded-xl">
                <p className="text-sm text-foreground-secondary">DP</p>
                <p className="mb-5 text-3xl font-medium">{formatCurrency(DP_AMOUNT)}</p>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{BANK_NAME}</p>
                  <p>{BANK_ACCOUNT_NUMBER}</p>
                  <p>{BANK_ACCOUNT_NAME}</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={copyAccount} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-line bg-white px-4 text-sm">
                    <Copy size={15} /> Copy Rekening
                  </button>
                  <a href={buildPaymentWhatsappLink()} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-line bg-white px-4 text-sm">
                    <MessageCircle size={15} /> Chat Admin
                  </a>
                </div>
                {copied && <p className="mt-3 text-xs text-premium-beige">Nomor rekening berhasil disalin</p>}
              </div>
              <div>
                <label className="flex min-h-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-premium-beige bg-white p-8 text-center md:rounded-xl">
                  <input type="file" accept="image/*,.pdf" onChange={handleProof} className="sr-only" />
                  <span className="mb-2 text-sm font-medium">Upload bukti transfer DP</span>
                  <span className="text-xs text-foreground-secondary">Klik untuk pilih file gambar atau PDF</span>
                  {booking.paymentData.proofName && (
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-background-soft px-4 py-2 text-xs text-foreground">
                      <Check size={14} className="text-premium-beige" />
                      {booking.paymentData.proofName}
                    </span>
                  )}
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border-line bg-white p-5 md:rounded-xl md:p-6">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={booking.termsAccepted} onChange={(e) => booking.setTermsAccepted(e.target.checked)} className="mt-1 accent-black" />
              <span>Saya setuju dengan ketentuan</span>
            </label>
            <button type="button" onClick={() => setShowTerms((value) => !value)} className="mt-4 text-sm text-premium-beige">
              Lihat ketentuan booking
            </button>
            {showTerms && (
              <ul className="mt-4 space-y-2 border-t border-border-line pt-4 text-sm text-foreground-secondary">
                <li>DP Rp 500.000 untuk mengamankan jadwal.</li>
                <li>Jadwal dikonfirmasi setelah DP diverifikasi.</li>
                <li>Perubahan paket atau add-on dilakukan melalui admin.</li>
                <li>Pelunasan dilakukan sesuai arahan admin.</li>
                <li>Pengiriman hasil akan difollow up setelah hari H.</li>
              </ul>
            )}
          </section>

          <button
            disabled={!booking.isCheckoutReady}
            className={`hidden min-h-14 w-full rounded-2xl px-8 text-sm font-medium tracking-wide md:block md:rounded-xl ${
              booking.isCheckoutReady ? "bg-dark-premium text-white" : "cursor-not-allowed bg-muted text-foreground-secondary"
            }`}
          >
            LANJUT CHECKOUT
          </button>
        </main>

        <OrderSummary
          packageName={selectedPackage.name}
          serviceName={selectedServiceType.name}
          servicePrice={selectedServiceType.price}
          addons={selectedAddonDetails}
          deliveryMethod={booking.deliveryMethod}
          subtotal={booking.calculateSubtotal()}
          remaining={booking.calculateRemaining()}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-line bg-white/95 px-4 py-3 shadow-[0_-14px_40px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-foreground-secondary">Total sementara</p>
            <p className="text-lg font-medium">{formatCurrency(booking.calculateSubtotal())}</p>
          </div>
          <button
            disabled={!booking.isCheckoutReady}
            className={`min-h-12 rounded-xl px-5 text-sm ${booking.isCheckoutReady ? "bg-dark-premium text-white" : "bg-muted text-foreground-secondary"}`}
          >
            LANJUT
          </button>
        </div>
      </div>
    </form>
  );
}

function SectionTitle({ step, title, subtitle }: { step: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs uppercase tracking-[0.22em] text-premium-beige">{step}</p>
      <h2 className="text-2xl lg:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-foreground-secondary">{subtitle}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}{required ? " *" : ""}</label>
      <input type={type} required={required} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}

function OrderSummary({
  packageName,
  serviceName,
  servicePrice,
  addons: selectedAddons,
  deliveryMethod,
  subtotal,
  remaining,
}: {
  packageName: string;
  serviceName: string;
  servicePrice: number;
  addons: Array<{ addon: { id: string; name: string; hasQuantity?: boolean }; quantity: number; total: number }>;
  deliveryMethod: string;
  subtotal: number;
  remaining: number;
}) {
  return (
    <aside className="hidden h-fit border border-border-line bg-white p-6 lg:sticky lg:top-28 lg:block">
      <p className="mb-2 text-xs uppercase tracking-[0.22em] text-foreground-secondary">Order summary</p>
      <h2 className="mb-6 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>Ringkasan Booking</h2>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <span>{packageName} — {serviceName}</span>
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
        {deliveryMethod === "expedition" && (
          <div className="flex justify-between gap-4 text-foreground-secondary">
            <span>Packing ekspedisi</span>
            <span>{formatCurrency(PACKING_FEE)}</span>
          </div>
        )}
        {deliveryMethod === "cod-agent" && (
          <div className="flex justify-between gap-4 text-foreground-secondary">
            <span>COD</span>
            <span>Dikonfirmasi admin</span>
          </div>
        )}
        {deliveryMethod === "pickup-office" && (
          <div className="flex justify-between gap-4 text-foreground-secondary">
            <span>Ambil ke kantor</span>
            <span>Rp 0</span>
          </div>
        )}
        <div className="border-t border-border-line pt-4">
          <div className="flex justify-between gap-4 font-medium">
            <span>Total sementara</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-foreground-secondary">
            <span>DP</span>
            <span>{formatCurrency(DP_AMOUNT)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-lg font-medium">
            <span>Sisa pembayaran</span>
            <span>{formatCurrency(remaining)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
