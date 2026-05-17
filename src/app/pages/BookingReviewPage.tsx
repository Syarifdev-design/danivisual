import { Link, useNavigate } from "react-router";
import { MessageCircle } from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import { ADMIN_WHATSAPP, DP_AMOUNT, PACKING_FEE, buildPaymentWhatsappLink, formatCurrency } from "../data/bookingData";

export default function BookingReviewPage() {
  const navigate = useNavigate();
  const booking = useBooking();
  const selectedPackage = booking.getSelectedPackage();
  const selectedServiceType = booking.getSelectedServiceType();
  const addons = booking.getSelectedAddonDetails();

  if (!selectedPackage || !selectedServiceType || !booking.isCheckoutReady) {
    return (
      <div className="min-h-screen bg-background-soft px-6 py-20">
        <div className="mx-auto max-w-xl border border-border-line bg-white p-8 text-center">
          <h1 className="mb-3 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Review belum siap</h1>
          <p className="mb-6 text-sm text-foreground-secondary">Lengkapi data booking dan upload bukti DP terlebih dahulu.</p>
          <Link to="/checkout" className="inline-flex min-h-12 items-center rounded-xl bg-dark-premium px-6 text-sm text-white">Kembali</Link>
        </div>
      </div>
    );
  }

  const submit = () => {
    booking.setReviewAccepted(true);
    booking.submitBooking();
    navigate("/booking-success");
  };

  return (
    <div className="min-h-screen bg-background-soft">
      <section className="border-b border-border-line bg-white px-5 py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-premium-beige">Review booking</p>
          <h1 className="text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>Review Sebelum Submit</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground-secondary">
            Pastikan detail booking sudah sesuai. Format ini dibuat seperti invoice ringkas agar mudah dibaca.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        <section className="border border-border-line bg-white p-5 md:p-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-border-line pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-foreground-secondary">Premium wedding invoice</p>
              <h2 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{booking.eventData.coupleName}</h2>
              <p className="mt-2 text-sm text-foreground-secondary">Status: Menunggu Verifikasi DP</p>
            </div>
            <div className="text-sm text-foreground-secondary md:text-right">
              <p>Order akan dibuat setelah submit</p>
              <p>DP: {formatCurrency(DP_AMOUNT)}</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-6">
              <ReviewBlock title="Data pasangan dan acara">
                <Item label="Nama pasangan" value={booking.eventData.coupleName} />
                <Item label="WhatsApp" value={booking.eventData.activeWhatsapp} />
                <Item label="Instagram" value={booking.eventData.instagramUsername || "-"} />
                <Item label="Tanggal acara" value={booking.eventData.eventDate} />
                <Item label="Jam acara" value={booking.eventData.eventTimePending ? "Menyusul" : booking.eventData.eventTime} />
                <Item label="Alamat lokasi acara" value={booking.eventData.eventLocationAddress} />
                <Item label="Rencana dekorasi" value={booking.eventData.decorationPlan || "-"} />
                <Item label="Alamat lengkap" value={booking.eventData.fullAddress || "-"} />
                <Item label="Google Maps" value={booking.eventData.googleMapsLink || "-"} />
                <Item label="Catatan admin" value={booking.eventData.adminNotes || "-"} />
              </ReviewBlock>

              <ReviewBlock title="Pengiriman hasil">
                <Item label="Metode" value={deliveryLabel(booking.deliveryMethod)} />
                <Item
                  label="Catatan"
                  value={
                    booking.deliveryMethod === "expedition"
                      ? "Detail alamat difollow up admin setelah hari H."
                      : booking.deliveryMethod === "cod-agent"
                      ? "Jadwal dan alamat pengantaran dikonfirmasi admin."
                      : "Jadwal pengambilan dikonfirmasi admin."
                  }
                />
              </ReviewBlock>

              <ReviewBlock title="Pembayaran DP">
                <Item label="Bukti DP" value={booking.paymentData.proofName} />
                <Item label="DP" value={formatCurrency(DP_AMOUNT)} />
                <Item label="Persetujuan" value={booking.termsAccepted ? "Saya setuju dengan ketentuan" : "-"} />
              </ReviewBlock>
            </div>

            <aside className="h-fit border border-border-line bg-background-soft p-5 md:p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-foreground-secondary">Ringkasan biaya</p>
              <h3 className="mb-5 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>{selectedPackage.name}</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span>{selectedServiceType.name}</span>
                  <strong>{formatCurrency(selectedServiceType.price)}</strong>
                </div>
                {addons.length === 0 ? (
                  <p className="text-foreground-secondary">Tidak ada add-on tambahan.</p>
                ) : (
                  addons.map(({ addon, quantity, total }) => (
                    <div key={addon.id} className="flex justify-between gap-4 text-foreground-secondary">
                      <span>{addon.name}{addon.hasQuantity ? ` x${quantity}` : ""}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  ))
                )}
                {booking.deliveryMethod === "expedition" && (
                  <div className="flex justify-between gap-4 text-foreground-secondary">
                    <span>Packing ekspedisi</span>
                    <span>{formatCurrency(PACKING_FEE)}</span>
                  </div>
                )}
                <div className="border-t border-border-line pt-4">
                  <div className="flex justify-between gap-4 font-medium">
                    <span>Total sementara</span>
                    <span>{formatCurrency(booking.calculateSubtotal())}</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-4 text-foreground-secondary">
                    <span>DP</span>
                    <span>{formatCurrency(DP_AMOUNT)}</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-4 text-lg font-medium">
                    <span>Sisa pembayaran</span>
                    <span>{formatCurrency(booking.calculateRemaining())}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border-line pt-6 md:flex-row">
            <Link to="/checkout" className="flex min-h-12 items-center justify-center rounded-xl border border-border-line px-6 py-3 text-sm hover:bg-background-soft">
              Kembali
            </Link>
            <button onClick={submit} className="min-h-12 rounded-xl bg-dark-premium px-8 py-3 text-sm text-white">
              Submit Booking
            </button>
            <a href={buildPaymentWhatsappLink() || `https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-line px-6 py-3 text-sm hover:bg-background-soft">
              <MessageCircle size={16} /> Chat Admin
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function deliveryLabel(value: string) {
  if (value === "expedition") return "Ekspedisi";
  if (value === "cod-agent") return "COD";
  if (value === "pickup-office") return "Ambil ke kantor";
  return "-";
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 text-xl" style={{ fontFamily: "var(--font-heading)" }}>{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border-line pb-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-foreground-secondary">{label}</span>
      <span className="max-w-[58%] text-right font-medium">{value || "-"}</span>
    </div>
  );
}
