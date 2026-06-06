import { ChevronDown, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { useCustomer } from "../../contexts/CustomerContext";
import { useContent } from "../../contexts/ContentContext";
import { buildWhatsappLink, formatCurrency } from "../../data/bookingData";
import StatusBadge from "../../components/StatusBadge";

export default function MyBooking() {
  const { currentBooking, bookingDetails, payments, productionProgress, isLoading, isLoggedIn, customerPhone } = useCustomer();
  const { getField } = useContent();

  const orderNumber = currentBooking?.orderNumber || "#DV-260718-001";

  const requestLinks = [
    { label: "Rubah Paket", intent: "mengubah paket" },
    { label: "Tambah Add-On", intent: "menambah add-on" },
    { label: "Request Tambahan Layanan", intent: "menambah layanan" },
  ];

  if (!isLoggedIn) {
    return (
      <div className="mx-auto w-full max-w-[1180px] text-center py-12">
        <h1 className="text-3xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Akses Ditolak
        </h1>
        <p className="text-sm text-foreground-secondary mb-6">
          Silakan login terlebih dahulu untuk melihat booking Anda.
        </p>
        <Link
          to="/dashboard/login"
          className="inline-flex min-h-12 items-center rounded-xl bg-dark-premium px-6 text-sm text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1180px] flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-foreground-secondary">Memuat...</p>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="mx-auto w-full max-w-[1180px] text-center py-12">
        <h1 className="text-3xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Booking Tidak Ditemukan
        </h1>
        <p className="text-sm text-foreground-secondary mb-6">
          Tidak ada booking yang terdaftar untuk nomor {customerPhone}.
        </p>
        <Link
          to="/packages"
          className="inline-flex min-h-12 items-center rounded-xl bg-dark-premium px-6 text-sm text-white"
        >
          Lihat Paket
        </Link>
      </div>
    );
  }

  const isFullyPaid = currentBooking.remainingAmount <= 0;

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <div className="mb-5 lg:mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.24em] text-foreground-secondary">
          {getField("dashboard", "my-booking", "eyebrow", "My Booking")}
        </p>
        <h1 className="text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
          {getField("dashboard", "my-booking", "title", "Your Visual Story")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary lg:mt-3 lg:text-base">
          {getField("dashboard", "my-booking", "description", "Semua detail booking tersimpan di sini. Perubahan paket atau add-on dilakukan melalui admin agar harga, jadwal, dan tim tetap terkonfirmasi.")}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 lg:mb-6 lg:flex lg:flex-wrap lg:gap-3">
        {requestLinks.map((item) => (
          <a
            key={item.label}
            href={buildWhatsappLink(orderNumber, item.intent)}
            target="_blank"
            rel="noreferrer"
            className="booking-action-chip flex min-h-9 items-center justify-center rounded-lg border border-border-line bg-white px-3 py-2 text-center text-xs hover:bg-background-soft lg:min-h-11 lg:rounded-none lg:px-4 lg:text-sm"
          >
            {item.label}
          </a>
        ))}
        <a
          href={buildWhatsappLink(orderNumber, "berkonsultasi dengan admin")}
          target="_blank"
          rel="noreferrer"
          className="booking-action-chip col-span-2 flex min-h-9 items-center justify-center gap-2 rounded-lg bg-dark-premium px-3 py-2 text-xs text-white lg:col-span-1 lg:min-h-11 lg:rounded-none lg:px-4 lg:text-sm"
        >
          <MessageCircle size={16} /> Chat Admin
        </a>
      </div>

      {/* Mobile Hero */}
      <section className="booking-mobile-hero mb-4 rounded-xl border border-border-line bg-white p-3 lg:hidden">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-foreground-secondary">{orderNumber}</p>
        <h2 className="text-2xl leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
          {currentBooking.packageName}
        </h2>
        <p className="mt-1 text-xs text-foreground-secondary">
          {currentBooking.serviceType} - {currentBooking.eventDate || "Tanggal belum diisi"}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusBadge variant={currentBooking.status === "confirmed" ? "success" : "waiting"}>
            {currentBooking.status === "pending" ? "Menunggu" :
             currentBooking.status === "confirmed" ? "Dikonfirmasi" :
             currentBooking.status === "in_progress" ? "Dalam Proses" :
             currentBooking.status === "completed" ? "Selesai" : "Dibatalkan"}
          </StatusBadge>
          <StatusBadge variant="finishing">
            {productionProgress?.currentStep || "Editing"}
          </StatusBadge>
        </div>
        <a
          href={buildWhatsappLink(orderNumber, "berkonsultasi dengan admin")}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex w-full min-h-9 items-center justify-center gap-2 rounded-lg bg-dark-premium px-3 py-2 text-xs text-white"
        >
          <MessageCircle size={16} /> Chat Admin
        </a>
      </section>

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-6">
        <Card title="Booking Summary">
          <Info label="Nomor order" value={orderNumber} />
          <Info
            label="Status booking"
            value={
              <StatusBadge variant={currentBooking.status === "confirmed" ? "success" : "waiting"}>
                {currentBooking.status === "pending" ? "Menunggu" :
                 currentBooking.status === "confirmed" ? "Dikonfirmasi" :
                 currentBooking.status === "in_progress" ? "Dalam Proses" :
                 currentBooking.status === "completed" ? "Selesai" : "Dibatalkan"}
              </StatusBadge>
            }
          />
          <Info label="Tanggal booking" value={new Date(currentBooking.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })} />
          <Info label="Current progress" value={productionProgress?.currentStep || "Menunggu"} />
          <Link
            to="/dashboard/progress"
            className="mt-1.5 inline-flex min-h-9 items-center rounded-lg bg-dark-premium px-3 py-2 text-xs text-white lg:mt-2 lg:rounded-none lg:px-5 lg:text-sm"
          >
            Lihat Progress
          </Link>
        </Card>

        <Card title="Event Detail">
          <Info label="Nama pasangan / acara" value={bookingDetails?.coupleName || currentBooking.customerName} />
          <Info label="Tanggal acara" value={currentBooking.eventDate || "-"} />
          <Info label="Jam acara" value={bookingDetails?.eventTimePending ? "Menunggu konfirmasi" : (currentBooking.eventTime || "-")} />
          <Info label="Lokasi acara" value={currentBooking.eventLocation || "-"} />
          <Info
            label="Link Google Maps"
            value={
              bookingDetails?.googleMapsLink ? (
                <a href={bookingDetails.googleMapsLink} target="_blank" rel="noreferrer" className="text-premium-beige underline">
                  Buka Maps
                </a>
              ) : "-"
            }
          />
          <Info label="Catatan" value={bookingDetails?.adminNotes || currentBooking.notes || "Briefing teknis akan dikonfirmasi admin."} />
        </Card>

        <Card title="Package Detail">
          <Info label="Kategori layanan" value={currentBooking.eventType} />
          <Info label="Paket" value={currentBooking.packageName} />
          <Info label="Sub layanan" value={currentBooking.serviceType} />
          <Info label="Harga paket" value={formatCurrency(currentBooking.packagePrice)} />
        </Card>

        <Card title="Add-On Detail">
          {currentBooking.addonTotal === 0 ? (
            <p className="text-sm text-foreground-secondary">Tidak ada add-on tambahan.</p>
          ) : (
            <Info label="Total Add-ons" value={formatCurrency(currentBooking.addonTotal)} />
          )}
          {bookingDetails?.muaPlan && (
            <Info label="Rencana MUA" value={bookingDetails.muaPlan} />
          )}
        </Card>

        <Card title="Payment Summary">
          <Info label="Total暂时" value={formatCurrency(currentBooking.totalAmount)} />
          <Info label="DP dibayar" value={formatCurrency(currentBooking.dpAmount)} />
          <Info label="Sisa pembayaran" value={formatCurrency(currentBooking.remainingAmount)} />
          <Info
            label="Status pelunasan"
            value={
              <StatusBadge variant={isFullyPaid ? "success" : "waiting"}>
                {isFullyPaid ? "Lunas" : "Menunggu Pelunasan"}
              </StatusBadge>
            }
          />
          {!isFullyPaid && (
            <Link
              to="/dashboard/payment-status"
              className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-dark-premium px-3 py-2 text-xs text-white lg:mt-2 lg:rounded-none lg:px-4 lg:text-sm"
            >
              Bayar Sekarang
            </Link>
          )}
        </Card>

        <Card title="Delivery Estimate">
          <Info
            label="Metode pengiriman"
            value={
              currentBooking.deliveryMethod === "expedition"
                ? "Dikirim melalui ekspedisi"
                : currentBooking.deliveryMethod === "cod-agent"
                ? "COD dengan agent"
                : currentBooking.deliveryMethod === "pickup-office"
                ? "Diambil ke kantor"
                : "Belum dipilih"
            }
          />
          <Info label="Estimasi pengiriman" value={productionProgress?.deliveryEstimate || "7-14 hari kerja setelah file final siap"} />
          <Info label="Packing fee" value={currentBooking.packingFee > 0 ? formatCurrency(currentBooking.packingFee) : "-"} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="booking-detail-card group rounded-xl border border-border-line bg-white p-3 shadow-[0_10px_26px_rgba(38,28,16,0.035)] lg:rounded-none lg:p-6 lg:shadow-none">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-xl lg:min-h-11 lg:gap-4 lg:text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
        <span>{title}</span>
        <ChevronDown size={16} className="text-premium-beige transition group-open:rotate-180 lg:size-[18px]" />
      </summary>
      <div className="mt-3 space-y-2 lg:mt-5 lg:space-y-3">{children}</div>
    </details>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-line pb-2 text-xs last:border-b-0 last:pb-0 lg:gap-5 lg:pb-3 lg:text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className="max-w-[60%] text-right font-medium lg:max-w-[58%]">{value}</span>
    </div>
  );
}