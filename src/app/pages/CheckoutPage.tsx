import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Check, Copy, MessageCircle, AlertCircle } from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  DP_AMOUNT,
  PACKING_FEE,
  buildPaymentWhatsappLink,
  formatCurrency,
  formatShortPrice,
} from "../data/bookingData";
import { defaultPaymentAccounts } from "../data/paymentAccounts";
import { getDefaultPaymentAccount } from "../../services/paymentAccountService";
import type { PaymentAccount } from "../../services/paymentAccountService";

const inputClass = "min-h-12 w-full rounded-xl border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige md:rounded-lg";
const labelClass = "mb-2 block text-sm font-medium text-foreground";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const booking = useBooking();
  const { t } = useLanguage();
  const selectedPackage = booking.getSelectedPackage();
  const selectedServiceType = booking.getSelectedServiceType();
  const selectedAddonDetails = booking.getSelectedAddonDetails();
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(
    defaultPaymentAccounts.find(acc => acc.isDefault) || defaultPaymentAccounts[0] || null
  );

  // Get active payment account from service
  useEffect(() => {
    const loadPaymentAccount = async () => {
      // First try from localStorage cache
      const storedAccounts = localStorage.getItem("danivisual_payment_accounts");
      if (storedAccounts) {
        try {
          const accounts: PaymentAccount[] = JSON.parse(storedAccounts);
          const activeAccount = accounts.find((acc) => acc.isActive && acc.isDefault)
            || accounts.find((acc) => acc.isActive && (acc.paymentType === "all" || acc.paymentType === "dp"))
            || accounts.find((acc) => acc.isActive)
            || accounts[0];
          if (activeAccount) {
            setPaymentAccount(activeAccount);
            return;
          }
        } catch {
          // Fall through to default
        }
      }

      // Fallback to default
      const defaultAcc = defaultPaymentAccounts.find((acc) => acc.isDefault && acc.isActive)
        || defaultPaymentAccounts.find((acc) => acc.isActive)
        || defaultPaymentAccounts[0];
      if (defaultAcc) {
        setPaymentAccount(defaultAcc);
      }
    };

    loadPaymentAccount();
  }, []);

  if (!selectedPackage || !selectedServiceType) {
    return (
      <div className="min-h-screen bg-background-soft px-6 py-20">
        <div className="mx-auto max-w-xl border border-border-line bg-white p-8 text-center">
          <h1 className="mb-3 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            {t({ ID: "Paket belum dipilih", EN: "No package selected" })}
          </h1>
          <p className="mb-6 text-sm text-foreground-secondary">
            {t({ ID: "Pilih paket Wedding dan jenis layanan terlebih dahulu.", EN: "Please choose a wedding package and service format first." })}
          </p>
          <Link to="/packages" className="inline-flex min-h-12 items-center rounded-xl bg-dark-premium px-6 text-sm text-white">
            {t({ ID: "Pilih Paket", EN: "Choose Package" })}
          </Link>
        </div>
      </div>
    );
  }

  const isPreweddingBooking = selectedPackage.categoryId === "prewedding-outdoor" || selectedPackage.categoryId === "prewedding-studio";

  const updateEvent = (key: keyof typeof booking.eventData, value: string | boolean) => {
    booking.setEventData({ ...booking.eventData, [key]: value });
  };

  const handleProof = (event: ChangeEvent<HTMLInputElement>) => {
    booking.setPaymentData({ proofName: event.target.files?.[0]?.name || "" });
  };

  const copyAccount = async () => {
    if (paymentAccount) {
      await navigator.clipboard?.writeText(paymentAccount.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleCheckoutAttempt();
  };

  const getMissingFields = () => {
    const missing: string[] = [];

    if (!selectedPackage) missing.push(t({ ID: "Paket wedding", EN: "Wedding package" }));
    if (!selectedServiceType) missing.push(t({ ID: "Jenis layanan", EN: "Service format" }));
    if (!booking.eventData.coupleName.trim()) missing.push(t({ ID: "Nama pasangan", EN: "Couple name" }));
    if (!booking.eventData.activeWhatsapp.trim()) missing.push(t({ ID: "Nomor WA aktif", EN: "Active WhatsApp number" }));
    if (isPreweddingBooking && !booking.eventData.fullAddress.trim()) missing.push(t({ ID: "Alamat", EN: "Address" }));
    if (isPreweddingBooking && !booking.eventData.instagramUsername.trim()) missing.push("Username Instagram");
    if (!booking.eventData.eventDate) missing.push(isPreweddingBooking ? t({ ID: "Tanggal sesi prewedding", EN: "Prewedding session date" }) : t({ ID: "Tanggal acara", EN: "Event date" }));
    if (!isPreweddingBooking && !booking.eventData.eventLocationAddress.trim()) missing.push(t({ ID: "Alamat lokasi acara", EN: "Event venue address" }));
    if (isPreweddingBooking ? !booking.eventData.eventTime : (!booking.eventData.eventTimePending && !booking.eventData.eventTime)) {
      missing.push(isPreweddingBooking ? t({ ID: "Jam janjian photoshoot", EN: "Photoshoot appointment time" }) : t({ ID: "Jam acara atau centang Menyusul", EN: "Event time or mark as pending" }));
    }
    if (!booking.deliveryMethod) missing.push(t({ ID: "Metode pengiriman hasil", EN: "Delivery method" }));
    if (!booking.paymentData.proofName) missing.push(t({ ID: "Bukti transfer DP", EN: "Deposit transfer proof" }));
    if (!booking.termsAccepted) missing.push(t({ ID: "Persetujuan ketentuan", EN: "Terms agreement" }));

    return missing;
  };

  const handleCheckoutAttempt = () => {
    const missing = getMissingFields();

    if (missing.length === 0) {
      setMissingFields([]);
      navigate("/booking-review");
      return;
    }

    setMissingFields(missing);
    window.setTimeout(() => {
      document.getElementById("checkout-missing-alert")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-background-soft pb-28 lg:pb-0">
      <section className="border-b border-border-line bg-white px-5 py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs tracking-[0.24em] text-premium-beige">
            {t({ ID: "Detail Booking", EN: "Booking Details" })}
          </p>
          <h1 className="text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
            {t({ ID: "Lengkapi Booking", EN: "Complete Your Booking" })}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground-secondary">
            {t({
              ID: "Isi data utama saja. Detail tambahan akan difollow up admin melalui WhatsApp.",
              EN: "Complete only the essential details. Additional notes will be followed up by our admin via WhatsApp.",
            })}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-10">
        <main className="space-y-6">
          <section className="rounded-2xl border border-border-line bg-white p-5 md:rounded-xl md:p-6">
            <SectionTitle step={t({ ID: "Step 04", EN: "Step 04" })} title={t({ ID: "Data customer dan acara", EN: "Client & Event Details" })} />
            <div className="grid gap-5 md:grid-cols-2">
              <Field required label={t({ ID: "Nama pasangan", EN: "Couple name" })} placeholder={t({ ID: "Contoh: Dani & Sinta", EN: "Example: Dani & Sinta" })} value={booking.eventData.coupleName} onChange={(v) => updateEvent("coupleName", v)} />
              {!isPreweddingBooking && (
                <Field label={t({ ID: "Rencana dekorasi", EN: "Decoration plan" })} placeholder={t({ ID: "Nama vendor dekorasi / konsep dekorasi / jika belum ada tulis menyusul", EN: "Decoration vendor / concept / write pending if not confirmed" })} value={booking.eventData.decorationPlan} onChange={(v) => updateEvent("decorationPlan", v)} />
              )}
              <Field required={isPreweddingBooking} label={isPreweddingBooking ? t({ ID: "Alamat", EN: "Address" }) : t({ ID: "Alamat lengkap", EN: "Full address" })} placeholder={t({ ID: "Alamat lengkap yang bisa dihubungi", EN: "Your reachable address" })} value={booking.eventData.fullAddress} onChange={(v) => updateEvent("fullAddress", v)} />
              <Field required={isPreweddingBooking} label="Username Instagram" placeholder="@username" value={booking.eventData.instagramUsername} onChange={(v) => updateEvent("instagramUsername", v)} />
              <Field required label={t({ ID: "Nomor WA aktif", EN: "Active WhatsApp number" })} placeholder="08xxxxxxxxxx" value={booking.eventData.activeWhatsapp} onChange={(v) => updateEvent("activeWhatsapp", v)} />
              <Field required type="date" label={isPreweddingBooking ? t({ ID: "Tanggal sesi prewedding", EN: "Prewedding session date" }) : t({ ID: "Tanggal acara", EN: "Event date" })} value={booking.eventData.eventDate} onChange={(v) => updateEvent("eventDate", v)} />
              <div>
                <label className={labelClass}>
                  {isPreweddingBooking ? t({ ID: "Jam janjian photoshoot", EN: "Photoshoot appointment time" }) : t({ ID: "Jam acara", EN: "Event time" })} {(!booking.eventData.eventTimePending || isPreweddingBooking) && "*"}
                </label>
                <input
                  type="time"
                  disabled={!isPreweddingBooking && booking.eventData.eventTimePending}
                  value={booking.eventData.eventTime}
                  onChange={(e) => updateEvent("eventTime", e.target.value)}
                  className={inputClass}
                />
                {!isPreweddingBooking && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-foreground-secondary">
                    <input
                      type="checkbox"
                      checked={booking.eventData.eventTimePending}
                      onChange={(e) => updateEvent("eventTimePending", e.target.checked)}
                      className="accent-black"
                    />
                    {t({ ID: "Menyusul", EN: "To be confirmed" })}
                  </label>
                )}
              </div>
              {!isPreweddingBooking && (
                <>
                  <Field required label={t({ ID: "Alamat lokasi acara", EN: "Event venue address" })} placeholder={t({ ID: "Alamat lokasi acara", EN: "Event venue address" })} value={booking.eventData.eventLocationAddress} onChange={(v) => updateEvent("eventLocationAddress", v)} />
                  <Field label="Link Google Maps" placeholder="https://maps.google.com/..." value={booking.eventData.googleMapsLink} onChange={(v) => updateEvent("googleMapsLink", v)} />
                </>
              )}
            </div>
            {!isPreweddingBooking && (
              <div className="mt-5">
                <label className={labelClass}>{t({ ID: "Catatan untuk admin", EN: "Notes for admin" })}</label>
                <textarea
                  value={booking.eventData.adminNotes}
                  onChange={(e) => updateEvent("adminNotes", e.target.value)}
                  rows={5}
                  placeholder={t({
                    ID: "Tuliskan catatan tambahan seperti rundown, request angle, keluarga inti, dresscode, atau kebutuhan khusus lainnya.",
                    EN: "Add notes such as rundown, preferred angles, key family members, dress code, or special requests.",
                  })}
                  className={inputClass}
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border-line bg-white p-5 md:rounded-xl md:p-6">
            <SectionTitle
              step="Step 05"
              title={t({ ID: "Pengiriman hasil", EN: "Final Delivery" })}
              subtitle={t({ ID: "Alamat detail akan difollow up admin setelah hari H.", EN: "Detailed delivery address will be followed up after the event." })}
            />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["expedition", t({ ID: "Ekspedisi", EN: "Courier" }), t({ ID: "Detail alamat akan difollow up admin setelah hari H.", EN: "Address details will be followed up after the event." }), t({ ID: "Packing fee Rp 35.000 jika album fisik dikirim melalui ekspedisi.", EN: "IDR 35,000 packing fee applies for physical album courier delivery." })],
                ["cod-agent", "COD", t({ ID: "Jadwal dan alamat pengantaran akan dikonfirmasi admin setelah hari H.", EN: "Delivery schedule and address will be confirmed after the event." }), t({ ID: "Biaya COD dikonfirmasi admin.", EN: "COD fee will be confirmed by admin." })],
                ["pickup-office", t({ ID: "Ambil ke kantor", EN: "Office pickup" }), t({ ID: "Jadwal pengambilan akan dikonfirmasi admin.", EN: "Pickup schedule will be confirmed by admin." }), t({ ID: "Tanpa biaya pengiriman.", EN: "No delivery fee." })],
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
            <SectionTitle step="Step 06" title={t({ ID: "Pembayaran DP", EN: "Deposit Payment" })} />
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr]">
              <div className="rounded-2xl border border-border-line bg-background-soft p-5 md:rounded-xl">
                <p className="text-sm text-foreground-secondary">DP</p>
                <p className="mb-5 text-3xl font-medium">{formatCurrency(DP_AMOUNT)}</p>

                {paymentAccount ? (
                  <>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{paymentAccount.bankName}</p>
                      <p>{paymentAccount.accountNumber}</p>
                      <p>{paymentAccount.accountHolderName}</p>
                      {paymentAccount.branch && (
                        <p className="text-xs text-foreground-secondary">Cabang: {paymentAccount.branch}</p>
                      )}
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={copyAccount} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-line bg-white px-4 text-sm">
                        <Copy size={15} /> {t({ ID: "Salin Rekening", EN: "Copy Account" })}
                      </button>
                      <a href={buildPaymentWhatsappLink()} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-line bg-white px-4 text-sm">
                        <MessageCircle size={15} /> {t({ ID: "Chat Admin", EN: "Chat Admin" })}
                      </a>
                    </div>
                    {copied && <p className="mt-3 text-xs text-premium-beige">{t({ ID: "Nomor rekening berhasil disalin", EN: "Account number copied" })}</p>}
                  </>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{t({ ID: "Rekening pembayaran belum tersedia. Silakan hubungi admin.", EN: "Payment account not available. Please contact admin." })}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="flex min-h-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-premium-beige bg-white p-8 text-center md:rounded-xl">
                  <input type="file" accept="image/*,.pdf" onChange={handleProof} className="sr-only" />
                  <span className="mb-2 text-sm font-medium">{t({ ID: "Upload bukti transfer DP", EN: "Upload deposit transfer proof" })}</span>
                  <span className="text-xs text-foreground-secondary">{t({ ID: "Klik untuk pilih file gambar atau PDF", EN: "Click to choose an image or PDF file" })}</span>
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
              <span>{t({ ID: "Saya setuju dengan ketentuan", EN: "I agree to the booking terms" })}</span>
            </label>
            <button type="button" onClick={() => setShowTerms((value) => !value)} className="mt-4 text-sm text-premium-beige">
              {t({ ID: "Lihat ketentuan booking", EN: "View booking terms" })}
            </button>
            {showTerms && (
              <ul className="mt-4 space-y-2 border-t border-border-line pt-4 text-sm text-foreground-secondary">
                <li>{t({ ID: "DP Rp 500.000 untuk mengamankan jadwal.", EN: "A IDR 500,000 deposit secures your schedule." })}</li>
                <li>{t({ ID: "Jadwal dikonfirmasi setelah DP diverifikasi.", EN: "The schedule is confirmed after deposit verification." })}</li>
                <li>{t({ ID: "Perubahan paket atau add-on dilakukan melalui admin.", EN: "Package or add-on changes are handled through admin." })}</li>
                <li>{t({ ID: "Pelunasan dilakukan sesuai arahan admin.", EN: "Final settlement follows admin guidance." })}</li>
                <li>{t({ ID: "Pengiriman hasil akan difollow up setelah hari H.", EN: "Final delivery will be followed up after the event." })}</li>
              </ul>
            )}
          </section>

          {missingFields.length > 0 && (
            <div id="checkout-missing-alert" role="alert" className="rounded-2xl border border-premium-beige bg-background-soft p-5 text-sm md:rounded-xl">
              <p className="mb-3 font-medium text-foreground">
                {t({ ID: "Lengkapi bagian berikut sebelum lanjut checkout:", EN: "Complete the following before continuing:" })}
              </p>
              <ul className="grid gap-2 text-foreground-secondary sm:grid-cols-2">
                {missingFields.map((field) => (
                  <li key={field} className="flex gap-2">
                    <span className="text-premium-beige">•</span>
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            aria-disabled={!booking.isCheckoutReady}
            onClick={handleCheckoutAttempt}
            className={`hidden min-h-14 w-full rounded-2xl px-8 text-sm font-medium tracking-wide md:block md:rounded-xl ${
              booking.isCheckoutReady ? "bg-dark-premium text-white" : "cursor-pointer bg-muted text-foreground-secondary"
            }`}
          >
            {t({ ID: "Lanjut checkout", EN: "Continue checkout" })}
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
            <p className="text-xs tracking-[0.18em] text-foreground-secondary">{t({ ID: "Total sementara", EN: "Estimated total" })}</p>
            <p className="text-lg font-medium">{formatShortPrice(booking.calculateSubtotal())}</p>
          </div>
          <button
            type="button"
            aria-disabled={!booking.isCheckoutReady}
            onClick={handleCheckoutAttempt}
            className={`min-h-12 rounded-xl px-5 text-sm ${booking.isCheckoutReady ? "bg-dark-premium text-white" : "bg-muted text-foreground-secondary"}`}
          >
            {t({ ID: "Lanjut checkout", EN: "Continue checkout" })}
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
  const { t } = useLanguage();

  return (
    <aside className="hidden h-fit border border-border-line bg-white p-6 lg:sticky lg:top-28 lg:block">
      <p className="mb-2 text-xs tracking-[0.22em] text-foreground-secondary">{t({ ID: "Ringkasan Pesanan", EN: "Order Summary" })}</p>
      <h2 className="mb-6 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>{t({ ID: "Ringkasan Booking", EN: "Booking Summary" })}</h2>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <span>{packageName} — {serviceName}</span>
          <strong>{formatShortPrice(servicePrice)}</strong>
        </div>
        {selectedAddons.length === 0 ? (
          <p className="text-foreground-secondary">{t({ ID: "Tidak ada add-on tambahan.", EN: "No additional add-ons selected." })}</p>
        ) : (
          selectedAddons.map(({ addon, quantity, total }) => (
            <div key={addon.id} className="flex justify-between gap-4 text-foreground-secondary">
              <span>{addon.name}{addon.hasQuantity ? ` x${quantity}` : ""}</span>
              <span>{formatShortPrice(total)}</span>
            </div>
          ))
        )}
        {deliveryMethod === "expedition" && (
          <div className="flex justify-between gap-4 text-foreground-secondary">
            <span>{t({ ID: "Packing ekspedisi", EN: "Courier packing" })}</span>
            <span>{formatShortPrice(PACKING_FEE)}</span>
          </div>
        )}
        {deliveryMethod === "cod-agent" && (
          <div className="flex justify-between gap-4 text-foreground-secondary">
            <span>COD</span>
            <span>{t({ ID: "Dikonfirmasi admin", EN: "Confirmed by admin" })}</span>
          </div>
        )}
        {deliveryMethod === "pickup-office" && (
          <div className="flex justify-between gap-4 text-foreground-secondary">
            <span>{t({ ID: "Ambil ke kantor", EN: "Office pickup" })}</span>
            <span>0</span>
          </div>
        )}
        <div className="border-t border-border-line pt-4">
          <div className="flex justify-between gap-4 font-medium">
            <span>{t({ ID: "Total sementara", EN: "Estimated total" })}</span>
            <span>{formatShortPrice(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-foreground-secondary">
            <span>DP</span>
            <span>{formatShortPrice(DP_AMOUNT)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-lg font-medium">
            <span>{t({ ID: "Sisa pembayaran", EN: "Remaining balance" })}</span>
            <span>{formatShortPrice(remaining)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
