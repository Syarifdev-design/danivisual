import { ChevronDown, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { useBooking } from "../../contexts/BookingContext";
import { DP_AMOUNT, buildWhatsappLink, findCategory, formatCurrency } from "../../data/bookingData";
import StatusBadge from "../../components/StatusBadge";

export default function MyBooking() {
  const booking = useBooking();
  const selectedPackage = booking.getSelectedPackage();
  const selectedServiceType = booking.getSelectedServiceType();
  const selectedCategory = findCategory(booking.selectedCategoryId);
  const addonDetails = booking.getSelectedAddonDetails();
  const orderNumber = booking.orderNumber || "#DV-260718-001";

  const requestLinks = [
    { label: "Rubah Paket", intent: "mengubah paket" },
    { label: "Tambah Add-On", intent: "menambah add-on" },
    { label: "Request Tambahan Layanan", intent: "menambah layanan" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.24em] text-foreground-secondary">My Booking</p>
        <h1 className="text-4xl" style={{ fontFamily: "var(--font-heading)" }}>Your Visual Story</h1>
        <p className="mt-3 max-w-2xl text-foreground-secondary">
          Semua detail booking tersimpan di sini. Perubahan paket atau add-on dilakukan melalui admin agar harga, jadwal, dan tim tetap terkonfirmasi.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:flex lg:flex-wrap">
        {requestLinks.map((item) => (
          <a
            key={item.label}
            href={buildWhatsappLink(orderNumber, item.intent)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center justify-center rounded-xl border border-border-line bg-white px-4 py-2 text-center text-sm hover:bg-background-soft lg:rounded-none"
          >
            {item.label}
          </a>
        ))}
        <a
          href={buildWhatsappLink(orderNumber, "berkonsultasi dengan admin")}
          target="_blank"
          rel="noreferrer"
          className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark-premium px-4 py-2 text-sm text-white lg:col-span-1 lg:rounded-none"
        >
          <MessageCircle size={16} /> Chat Admin
        </a>
      </div>

      <section className="mb-6 rounded-2xl border border-border-line bg-white p-5 lg:hidden">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-foreground-secondary">{orderNumber}</p>
        <h2 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{selectedPackage?.name || "Wedding Premium"}</h2>
        <p className="mt-1 text-sm text-foreground-secondary">{selectedServiceType?.name || "Photo + Video"} - {booking.eventData.eventDate}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge variant="waiting">Menunggu Pelunasan</StatusBadge>
          <StatusBadge variant="finishing">Editing</StatusBadge>
        </div>
        <a
          href={buildWhatsappLink(orderNumber, "berkonsultasi dengan admin")}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-dark-premium px-4 py-2 text-sm text-white"
        >
          <MessageCircle size={16} /> Chat Admin
        </a>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Booking Summary">
          <Info label="Nomor order" value={orderNumber} />
          <Info label="Status booking" value={<StatusBadge variant="finishing">Waiting DP Verification</StatusBadge>} />
          <Info label="Tanggal booking" value="16 Mei 2026" />
          <Info label="Current progress" value="Editing" />
          <Link to="/dashboard/progress" className="mt-2 inline-flex bg-dark-premium px-5 py-2 text-sm text-white">
            Lihat Progress
          </Link>
        </Card>

        <Card title="Event Detail">
          <Info label="Nama pasangan / acara" value={booking.eventData.eventName} />
          <Info label="Tanggal acara" value={booking.eventData.eventDate} />
          <Info label="Jam acara" value={booking.eventData.eventTime} />
          <Info label="Lokasi acara" value={booking.eventData.location} />
          <Info label="Link Google Maps" value={booking.eventData.mapsLink || "-"} />
          <Info label="Catatan admin/customer" value={booking.eventData.adminNotes || "Briefing teknis akan dikonfirmasi admin."} />
        </Card>

        <Card title="Package Detail">
          <Info label="Kategori layanan" value={selectedCategory.name} />
          <Info label="Paket" value={selectedPackage?.name || "Wedding Premium"} />
          <Info label="Sub layanan" value={selectedServiceType?.name || "Photo + Video"} />
          <Info label="Harga paket" value={formatCurrency(selectedPackage?.price || 8000000)} />
        </Card>

        <Card title="Add-On Detail">
          {addonDetails.length === 0 ? (
            <p className="text-sm text-foreground-secondary">Tidak ada add-on tambahan.</p>
          ) : (
            addonDetails.map(({ addon, quantity, total }) => (
              <Info
                key={addon.id}
                label={addon.name}
                value={`${addon.hasQuantity ? `x${quantity} - ` : ""}${total === null ? "Menunggu konfirmasi admin" : formatCurrency(total)}`}
              />
            ))
          )}
        </Card>

        <Card title="Payment Summary">
          <Info label="Total sementara" value={formatCurrency(booking.calculateSubtotal() || 8000000)} />
          <Info label="DP dibayar" value={formatCurrency(DP_AMOUNT)} />
          <Info label="Sisa pembayaran" value={formatCurrency(booking.calculateRemaining() || 7500000)} />
          <Info label="Status pelunasan" value={<StatusBadge variant="waiting">Menunggu Pelunasan</StatusBadge>} />
        </Card>

        <Card title="Delivery Estimate">
          <Info
            label="Metode pengiriman"
            value={
              booking.deliveryMethod === "expedition"
                ? "Dikirim melalui ekspedisi"
                : booking.deliveryMethod === "cod-agent"
                ? "COD dengan agent"
                : "Diambil ke kantor"
            }
          />
          <Info label="Estimasi pengiriman" value="7-14 hari kerja setelah file final siap" />
          <Info label="Packing fee" value={booking.deliveryMethod === "expedition" ? "Rp 35.000" : "-"} />
          <Info label="Ongkir / biaya agent" value={booking.deliveryMethod === "cod-agent" ? "Menunggu konfirmasi admin" : "Menunggu konfirmasi admin"} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group rounded-2xl border border-border-line bg-white p-5 shadow-[0_14px_38px_rgba(0,0,0,0.035)] lg:rounded-none lg:p-6 lg:shadow-none">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
        <span>{title}</span>
        <ChevronDown size={18} className="text-premium-beige transition group-open:rotate-180" />
      </summary>
      <div className="mt-5 space-y-3">{children}</div>
    </details>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-border-line pb-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-foreground-secondary">{label}</span>
      <span className="max-w-[58%] text-right font-medium">{value}</span>
    </div>
  );
}
