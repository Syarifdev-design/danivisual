import { Check, Clock, Copy, Lock, MessageCircle, Upload } from "lucide-react";
import { useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { useBooking } from "../../contexts/BookingContext";
import { ADMIN_WHATSAPP, formatCurrency } from "../../data/bookingData";

export default function Progress() {
  const booking = useBooking();
  const isFullyPaid = booking.isFullyPaid;
  const [toast, setToast] = useState("");

  const copyRekening = () => {
    navigator.clipboard?.writeText("645201020316531");
    setToast("Nomor rekening berhasil disalin.");
    window.setTimeout(() => setToast(""), 2200);
  };

  const steps = [
    {
      title: "Photo Sorting",
      description: "Tim Danivisual sedang melakukan seleksi dan penyusunan file foto terbaik dari hasil dokumentasi.",
      status: "Completed",
    },
    {
      title: "Editing",
      description: "Foto terpilih masuk ke proses editing, color grading, retouching, dan penyesuaian visual sesuai style Danivisual.",
      status: "In Progress",
    },
    {
      title: "Preview",
      description: "Customer dapat melihat preview / file sementara setelah proses editing awal tersedia.",
      status: isFullyPaid ? "Available" : "Locked",
      preview: true,
    },
    {
      title: "Pelunasan",
      description: "Customer melakukan pelunasan sebelum membuka file sementara dan sebelum proses delivery album.",
      status: isFullyPaid ? "Completed" : "Waiting",
      payment: true,
    },
    {
      title: "Delivery",
      description: "Album fisik dan file final diproses untuk dikirim sesuai metode pengiriman yang dipilih.",
      status: "Waiting",
      delivery: true,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {toast && (
        <div className="fixed left-5 right-5 top-24 z-50 rounded-2xl border border-border-line bg-white px-4 py-3 text-center text-sm shadow-[0_16px_45px_rgba(0,0,0,0.12)] lg:left-auto lg:right-8 lg:w-80">
          {toast}
        </div>
      )}
      <div className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.24em] text-foreground-secondary">Project Progress</p>
        <h1 className="text-4xl" style={{ fontFamily: "var(--font-heading)" }}>Production Timeline</h1>
        <p className="mt-3 max-w-2xl text-foreground-secondary">
          Timeline sederhana dari sorting sampai delivery. Preview file sementara hanya dapat dibuka setelah pelunasan selesai.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Summary label="Current Step" value="Editing" />
        <Summary label="Status Preview" value={isFullyPaid ? "Available" : "Locked"} />
        <Summary label="Sisa Pembayaran" value={formatCurrency(booking.calculateRemaining() || 7500000)} />
      </div>

      <section className="rounded-[22px] border border-border-line bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.04)] lg:rounded-none lg:p-8 lg:shadow-none">
        <div className="space-y-10">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {index < steps.length - 1 && <div className="absolute left-[19px] top-11 h-[calc(100%+40px)] w-px bg-border-line" />}
              <div className="flex gap-5">
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-premium-beige bg-white">
                  {step.status === "Completed" ? <Check size={18} className="text-premium-beige" /> : step.status === "In Progress" ? <Clock size={18} className="text-premium-beige" /> : <Lock size={18} className="text-foreground-secondary" />}
                </div>
                <div className="flex-1 border-b border-border-line pb-8 last:border-b-0">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>{step.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{step.description}</p>
                    </div>
                    <ProgressBadge status={step.status} />
                  </div>

                  {step.preview && (
                    <div className={`mt-5 rounded-[18px] border p-5 ${isFullyPaid ? "border-premium-beige bg-success-soft" : "border-border-line bg-warning-soft"} lg:rounded-none`}>
                      {isFullyPaid ? (
                        <>
                          <StatusBadge variant="success">Preview Available</StatusBadge>
                          <p className="mt-3 text-sm text-foreground-secondary">File sementara sudah tersedia dan dapat dibuka.</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <a href="#" className="bg-dark-premium px-4 py-2 text-sm text-white">Lihat Preview</a>
                            <ChatButton />
                          </div>
                        </>
                      ) : (
                        <>
                          <StatusBadge variant="locked">Preview Locked</StatusBadge>
                          <p className="mt-3 text-sm text-foreground-secondary">Silakan melakukan pelunasan terlebih dahulu untuk membuka file sementara.</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <a href="#pelunasan" className="inline-flex min-h-11 items-center rounded-xl bg-dark-premium px-4 py-2 text-sm text-white lg:rounded-none">Lakukan Pelunasan</a>
                            <ChatButton />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {step.payment && (
                    <div id="pelunasan" className="mt-5 rounded-[18px] border border-border-line bg-background-soft p-5 lg:rounded-none">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Info label="Sisa pembayaran" value={formatCurrency(booking.calculateRemaining() || 7500000)} />
                        <Info label="Rekening" value="BRI 645201020316531 - DANI INDRA FIRMANSYAH" />
                        <Info label="Status verifikasi" value={isFullyPaid ? "Lunas" : "Menunggu Pelunasan"} />
                        <Info label="Nota pembayaran" value={isFullyPaid ? "Tersedia" : "Belum tersedia"} />
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {isFullyPaid ? (
                          <>
                            <a href="#" className="bg-dark-premium px-4 py-2 text-sm text-white">Download Nota</a>
                            <a href="#" className="border border-border-line bg-white px-4 py-2 text-sm">Lihat File Sementara</a>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={copyRekening} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-line bg-white px-4 py-2 text-sm lg:rounded-none">
                              <Copy size={16} /> Copy Rekening
                            </button>
                            <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-dark-premium px-4 py-2 text-sm text-white lg:rounded-none">
                              <Upload size={16} /> Upload Bukti Pelunasan
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {step.delivery && (
                    <div className="mt-5 grid gap-4 rounded-[18px] border border-border-line bg-background-soft p-5 md:grid-cols-2 lg:rounded-none">
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
                      <Info label="Estimasi pengiriman" value="7-14 hari kerja setelah finalisasi" />
                      <Info label="Nomor resi" value="Belum tersedia" />
                      <Info label="Status delivery" value="Waiting" />
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button className="min-h-11 rounded-xl border border-border-line bg-white px-4 py-2 text-sm lg:rounded-none">Lihat Detail Delivery</button>
                        <ChatButton />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressBadge({ status }: { status: string }) {
  if (status === "Completed") return <StatusBadge variant="success">Completed</StatusBadge>;
  if (status === "In Progress") return <StatusBadge variant="finishing">In Progress</StatusBadge>;
  if (status === "Available") return <StatusBadge variant="success">Available</StatusBadge>;
  if (status === "Locked") return <StatusBadge variant="locked">Locked</StatusBadge>;
  return <StatusBadge variant="waiting">Waiting</StatusBadge>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-border-line bg-white p-5 shadow-[0_12px_34px_rgba(0,0,0,0.035)] lg:rounded-none lg:shadow-none">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-foreground-secondary">{label}</p>
      <p className="text-lg font-medium">{value}</p>
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

function ChatButton() {
  return (
    <a href={`https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-line bg-white px-4 py-2 text-sm lg:rounded-none">
      <MessageCircle size={16} /> Chat Admin
    </a>
  );
}
