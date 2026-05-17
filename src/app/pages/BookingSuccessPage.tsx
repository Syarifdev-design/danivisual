import { Link } from "react-router";
import { CheckCircle, MessageCircle } from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import { DP_AMOUNT, buildPaymentWhatsappLink, formatCurrency } from "../data/bookingData";

export default function BookingSuccessPage() {
  const booking = useBooking();
  const selectedPackage = booking.getSelectedPackage();
  const selectedServiceType = booking.getSelectedServiceType();

  return (
    <div className="min-h-screen bg-background-soft px-5 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border-line bg-white p-6 text-center lg:rounded-xl lg:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
          <CheckCircle className="text-premium-beige" size={32} />
        </div>
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-foreground-secondary">Menunggu Verifikasi DP</p>
        <h1 className="mb-4 text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
          Booking Berhasil Dikirim
        </h1>
        <p className="mx-auto mb-8 max-w-2xl leading-relaxed text-foreground-secondary">
          Terima kasih, data booking dan bukti DP Anda telah kami terima. Tim Danivisual akan melakukan pengecekan dan menghubungi Anda melalui WhatsApp.
        </p>

        <div className="mb-8 grid gap-3 rounded-2xl border border-border-line bg-background-soft p-5 text-left md:grid-cols-2 md:rounded-xl">
          <Info label="Nomor order" value={booking.orderNumber || "-"} />
          <Info label="Nama pasangan" value={booking.eventData.coupleName || "-"} />
          <Info label="Paket" value={selectedPackage?.name || "-"} />
          <Info label="Jenis layanan" value={selectedServiceType?.name || "-"} />
          <Info label="DP" value={formatCurrency(DP_AMOUNT)} />
          <Info label="Status" value="Menunggu Verifikasi DP" />
        </div>

        <div className="mb-8 rounded-2xl border border-premium-beige/40 bg-premium-beige/10 p-5 text-left md:rounded-xl">
          <p className="text-sm text-foreground-secondary">
            Akun customer akan diberikan setelah booking dan DP diverifikasi.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 md:flex-row">
          <a href={buildPaymentWhatsappLink()} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-dark-premium px-6 py-3 text-sm text-white">
            <MessageCircle size={16} /> Chat Admin
          </a>
          <Link to="/" className="flex min-h-12 items-center justify-center rounded-xl border border-border-line px-6 py-3 text-sm hover:bg-background-soft">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-[0.16em] text-foreground-secondary">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
