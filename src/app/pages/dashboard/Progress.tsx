import { Check, ChevronDown, Clock, Copy, ExternalLink, Link as LinkIcon, Lock, MessageCircle, Image, ArrowRight, AlertCircle } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { Link } from "react-router";
import StatusBadge from "../../components/StatusBadge";
import { useCustomer } from "../../contexts/CustomerContext";
import { useContent } from "../../contexts/ContentContext";
import { ADMIN_WHATSAPP, formatCurrency } from "../../data/bookingData";
import { defaultPaymentAccounts } from "../../data/paymentAccounts";
import type { PaymentAccount } from "../../../services/paymentAccountService";

export default function Progress() {
  const { currentBooking, productionProgress, isLoading, uploadPelunasanProof } = useCustomer();
  const { getField } = useContent();
  const [toast, setToast] = useState("");
  const [openSteps, setOpenSteps] = useState<string[]>(["Pelunasan & Sneak Peek"]);

  // Payment account state
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(
    defaultPaymentAccounts.find(acc => acc.isDefault) || defaultPaymentAccounts[0] || null
  );

  // Upload form state
  const [uploadAmount, setUploadAmount] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Get active payment account from localStorage or default (prioritize final_payment)
  useEffect(() => {
    const storedAccounts = localStorage.getItem("danivisual_payment_accounts");
    if (storedAccounts) {
      try {
        const accounts: PaymentAccount[] = JSON.parse(storedAccounts);
        const activeAccount = accounts.find((acc) => acc.isActive && acc.isDefault && (acc.paymentType === "final_payment" || acc.paymentType === "all"))
          || accounts.find((acc) => acc.isActive && (acc.paymentType === "final_payment" || acc.paymentType === "all"))
          || accounts.find((acc) => acc.isActive && acc.isDefault)
          || accounts.find((acc) => acc.isActive)
          || accounts[0];
        if (activeAccount) {
          setPaymentAccount(activeAccount);
        }
      } catch {
        // Use default
      }
    }
  }, []);

  const isFullyPaid = currentBooking ? currentBooking.remainingAmount <= 0 : false;
  const isPhotoSortingActive = productionProgress?.photoSortingStatus === "in_progress";
  const hasGalleryLink = Boolean(productionProgress?.galleryLink);

  const copyRekening = () => {
    if (paymentAccount) {
      navigator.clipboard?.writeText(paymentAccount.accountNumber);
      setToast("Nomor rekening berhasil disalin.");
    } else {
      setToast("Rekening belum tersedia.");
    }
    window.setTimeout(() => setToast(""), 2200);
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadAmount) return;

    const amount = parseInt(uploadAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount)) return;

    const result = await uploadPelunasanProof(uploadFile, amount, "");
    if (result.success) {
      setToast("Bukti pelunasan berhasil diupload!");
      setUploadFile(null);
      setUploadAmount("");
    } else {
      setToast(result.error || "Upload gagal. Coba lagi.");
    }
    window.setTimeout(() => setToast(""), 3000);
  };

  const steps = [
    {
      title: "Pelunasan & Sneak Peek",
      description: "Selesaikan pelunasan untuk membuka sneak peek foto. Setelah lunas, project lanjut ke proses produksi.",
      status: isFullyPaid ? "Completed" : (currentBooking?.paidAmount ? "In Progress" : "Waiting"),
      payment: true,
    },
    {
      title: "Photo Sorting",
      description: "Pilih foto favorit Anda dari galeri preview untuk proses editing dan cetak album.",
      status: isPhotoSortingActive ? "In Progress" : "Locked",
      photoSorting: true,
    },
    {
      title: "Editing",
      description: "Foto yang dipilih akan diedit dengan warna, tone, dan detail khas Danivisual.",
      status: isPhotoSortingActive ? "In Progress" : "Locked",
      editingChoice: true,
    },
    {
      title: "Cetak",
      description: "Setelah editing siap, foto akan masuk proses pilih cetak untuk album, frame, atau print sesuai paket.",
      status: "Waiting",
      printChoice: true,
    },
    {
      title: "Finishing",
      description: "Tim kami melakukan pengecekan akhir, merapikan album atau file final, lalu menyiapkan hasil untuk dikirim.",
      status: "Waiting",
    },
    {
      title: "Delivery",
      description: "File final dibagikan melalui Google Drive. Album fisik dikirim sesuai metode delivery yang dipilih.",
      status: "Waiting",
      delivery: true,
    },
  ];

  const toggleStep = (title: string) => {
    setOpenSteps((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-foreground-secondary">Memuat progress...</p>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-foreground-secondary">Booking tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      {toast && (
        <div className="fixed left-5 right-5 top-24 z-50 rounded-2xl border border-border-line bg-white px-4 py-3 text-center text-sm shadow-[0_16px_45px_rgba(0,0,0,0.12)] lg:left-auto lg:right-8 lg:w-80">
          {toast}
        </div>
      )}
      <div className="mb-5 lg:mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.24em] text-foreground-secondary">
          {getField("dashboard", "progress", "eyebrow", "Project Progress")}
        </p>
        <h1 className="text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
          {getField("dashboard", "progress", "title", "Alur Produksi Foto")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary lg:mt-3 lg:text-base">
          {getField("dashboard", "progress", "description", "Alur sederhana dari pelunasan, sneak peek, pemilihan foto, editing, cetak, finishing, sampai file final dikirim.")}
        </p>
      </div>

      <div className="mb-5 grid gap-2 md:grid-cols-3 lg:mb-8 lg:gap-4">
        <Summary label="Tahap saat ini" value={productionProgress?.currentStep || "Menunggu"} />
        <Summary label="Progress" value={`${productionProgress?.progressPercent || 0}%`} />
        <Summary label="Sneak Peek" value={
          productionProgress?.sneakPeekStatus === "available" ? "Bisa dilihat" :
          productionProgress?.sneakPeekStatus === "viewed" ? "Sudah dilihat" : "Tersedia setelah lunas"
        } />
        <Summary label="Sisa Pembayaran" value={formatCurrency(currentBooking.remainingAmount)} />
        <Summary label="Estimasi" value={productionProgress?.estimatedDate || productionProgress?.deliveryEstimate || "Belum tersedia"} />
        <Summary label="Step selesai" value={productionProgress?.completedStep || "Belum ada"} />
      </div>

      {(productionProgress?.galleryLink || productionProgress?.customerNotes) && (
        <div className="mb-5 grid gap-2 md:grid-cols-2 lg:mb-8 lg:gap-4">
          {productionProgress.galleryLink && (
            <div className="rounded-xl border border-border-line bg-white p-3 shadow-[0_10px_26px_rgba(38,28,16,0.035)] lg:rounded-none lg:p-5 lg:shadow-none">
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-foreground-secondary lg:mb-2 lg:text-xs lg:tracking-[0.18em]">Gallery Link</p>
              <a href={productionProgress.galleryLink} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 truncate text-sm font-medium underline-offset-4 hover:underline">
                <ExternalLink size={14} /> {productionProgress.galleryLink}
              </a>
            </div>
          )}
          {productionProgress.customerNotes && (
            <div className="rounded-xl border border-border-line bg-white p-3 shadow-[0_10px_26px_rgba(38,28,16,0.035)] lg:rounded-none lg:p-5 lg:shadow-none">
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-foreground-secondary lg:mb-2 lg:text-xs lg:tracking-[0.18em]">Catatan Admin</p>
              <p className="text-sm leading-relaxed text-foreground-secondary">{productionProgress.customerNotes}</p>
            </div>
          )}
        </div>
      )}

      <section className="rounded-xl border border-border-line bg-white p-3 shadow-[0_14px_36px_rgba(38,28,16,0.045)] lg:rounded-none lg:p-8 lg:shadow-none">
        <div className="space-y-6 lg:grid lg:grid-cols-6 lg:gap-5 lg:space-y-0">
          {steps.map((step, index) => {
            const isOpen = openSteps.includes(step.title);

            return (
              <div key={step.title} className="relative">
                {index < steps.length - 1 && (
                  <>
                    <div className="progress-step-connector progress-step-connector-vertical absolute left-[15px] top-9 h-[calc(100%+24px)] w-px lg:hidden" />
                    <div className="progress-step-connector absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-5 hidden h-px lg:block" />
                  </>
                )}
                <div className="flex gap-3 lg:block">
                  <button
                    type="button"
                    aria-label={`${isOpen ? "Tutup" : "Buka"} ${step.title}`}
                    aria-expanded={isOpen}
                    onClick={() => toggleStep(step.title)}
                    className={`progress-step-marker relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-beige lg:mx-auto lg:h-10 lg:w-10 ${getMarkerClass(step.status)}`}
                  >
                    <span className="progress-step-marker-glow" />
                    <span className="progress-step-marker-core">
                      {step.status === "Completed" ? <Check size={15} /> : step.status === "In Progress" ? <Clock size={15} /> : <Lock size={15} />}
                    </span>
                  </button>
                  <div className="flex-1 border-b border-border-line pb-5 last:border-b-0 lg:mt-5 lg:border-b-0 lg:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 lg:flex-col lg:items-center lg:gap-3 lg:text-center">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => toggleStep(step.title)}
                        className="group flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-beige lg:min-h-[68px] lg:items-start lg:justify-center lg:gap-3 lg:text-center"
                      >
                        <h2 className="text-xl leading-tight lg:text-xl" style={{ fontFamily: "var(--font-heading)" }}>{step.title}</h2>
                        <ChevronDown
                          size={16}
                          className={`mt-1 text-foreground-secondary transition-transform duration-300 group-hover:text-premium-beige ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <ProgressBadge status={step.status} />
                    </div>

                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="mt-2 text-xs leading-relaxed text-foreground-secondary lg:mt-3 lg:text-center lg:text-sm">{step.description}</p>

                        {step.payment && (
                          <div id="pelunasan" className="mt-3 rounded-xl border border-border-line bg-background-soft p-3 lg:mt-5 lg:rounded-none lg:p-5 lg:text-left">
                            {paymentAccount ? (
                              <>
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-1 lg:gap-4">
                                  <Info label="Sisa pembayaran" value={formatCurrency(currentBooking.remainingAmount)} />
                                  <Info label="Rekening" value={`${paymentAccount.bankName} ${paymentAccount.accountNumber} - ${paymentAccount.accountHolderName}`} />
                                  <Info label="Status" value={isFullyPaid ? "Lunas" : "Menunggu pelunasan"} />
                                  <Info label="Sneak peek foto" value={isFullyPaid ? "Sudah bisa dilihat" : "Terbuka setelah lunas"} />
                                </div>
                                {paymentAccount.branch && (
                                  <p className="mt-2 text-xs text-foreground-secondary lg:mt-3">Cabang: {paymentAccount.branch}</p>
                                )}
                              </>
                            ) : (
                              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>Rekening pembayaran belum tersedia. Silakan hubungi admin.</span>
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2 lg:mt-5 lg:gap-3">
                              {isFullyPaid ? (
                                <>
                                  <a href="#" className="bg-dark-premium px-3 py-2 text-xs text-white lg:px-4 lg:text-sm">Download Nota</a>
                                  {productionProgress?.googleDriveLink ? (
                                    <a href={productionProgress.googleDriveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-border-line bg-white px-3 py-2 text-xs lg:px-4 lg:text-sm">
                                      <ExternalLink size={15} /> Lihat Sneak Peek
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-2 border border-border-line bg-white px-3 py-2 text-xs text-foreground-secondary lg:px-4 lg:text-sm">
                                      Sneak peek belum tersedia
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={copyRekening} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border-line bg-white px-3 py-2 text-xs lg:min-h-11 lg:rounded-none lg:px-4 lg:text-sm">
                                    <Copy size={16} /> Copy Rekening
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {step.editingChoice && (
                          <ChoicePanel
                            title="Pilihan foto untuk diedit"
                            description="Kamu bisa memilih sendiri foto yang ingin diedit, atau mempercayakan pilihan terbaik kepada tim Danivisual."
                            first="Saya pilih sendiri"
                            second="Percayakan ke tim"
                          />
                        )}

                        {step.photoSorting && isPhotoSortingActive && (
                          <div className="mt-3 rounded-xl border border-premium-beige/30 bg-premium-beige/5 p-3 lg:mt-5 lg:rounded-none lg:p-5 lg:text-left">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="rounded-lg bg-premium-beige/20 p-2">
                                <Image size={18} className="text-premium-beige" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">Waktu Memilih Foto!</p>
                                <p className="text-xs text-foreground-secondary">
                                  Pilih foto favorit Anda dari galeri untuk diedit dan dicetak.
                                </p>
                              </div>
                            </div>
                            {hasGalleryLink ? (
                              <div className="space-y-3">
                                <a
                                  href={productionProgress?.galleryLink || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-lg bg-dark-premium px-4 py-2.5 text-xs text-white hover:bg-dark-premium/90"
                                >
                                  <ExternalLink size={14} />
                                  Buka Galeri Preview
                                </a>
                                <Link
                                  to="/dashboard/photo-selection"
                                  className="ml-2 inline-flex items-center gap-2 rounded-lg border border-premium-beige/45 bg-white px-4 py-2.5 text-xs font-medium text-foreground hover:bg-premium-beige/5"
                                >
                                  Pilih Foto Sekarang
                                  <ArrowRight size={14} />
                                </Link>
                              </div>
                            ) : (
                              <p className="text-xs text-foreground-secondary">
                                Link galeri belum tersedia. Mohon hubungi admin untuk informasi lebih lanjut.
                              </p>
                            )}
                          </div>
                        )}

                        {step.printChoice && (
                          <ChoicePanel
                            title="Pilihan foto untuk dicetak"
                            description="Pilih foto yang mau dicetak untuk album atau frame. Kalau ingin praktis, tim kami bisa bantu pilihkan foto terbaik."
                            first="Saya pilih foto cetak"
                            second="Tim Danivisual pilihkan"
                          />
                        )}

                        {step.delivery && (
                          <div className="mt-3 grid gap-2 rounded-xl border border-border-line bg-background-soft p-3 md:grid-cols-2 lg:mt-5 lg:grid-cols-1 lg:gap-4 lg:rounded-none lg:p-5 lg:text-left">
                            <Info
                              label="Metode pengiriman"
                              value={
                                currentBooking.deliveryMethod === "expedition"
                                  ? "Dikirim melalui ekspedisi"
                                  : currentBooking.deliveryMethod === "cod-agent"
                                  ? "COD dengan agent"
                                  : "Diambil ke kantor"
                              }
                            />
                            <Info label="Estimasi pengiriman" value={productionProgress?.deliveryEstimate || "7-14 hari kerja setelah finalisasi"} />
                            <Info label="Nomor resi" value={productionProgress?.trackingNumber || "Belum tersedia"} />
                            <Info label="Status delivery" value={currentBooking.status === "completed" ? "Selesai" : "Menunggu"} />
                            <div className="md:col-span-2 lg:col-span-1">
                              <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground-secondary lg:mb-2 lg:text-xs lg:tracking-[0.16em]">Link Google Drive</p>
                              <div className="flex min-h-9 items-center gap-2 border border-border-line bg-white px-2.5 text-xs lg:min-h-11 lg:px-3 lg:text-sm">
                                <LinkIcon size={15} className="shrink-0 text-premium-beige" />
                                {productionProgress?.googleDriveLink ? (
                                  <a href={productionProgress.googleDriveLink} target="_blank" rel="noreferrer" className="truncate underline-offset-4 hover:underline">
                                    {productionProgress.googleDriveLink}
                                  </a>
                                ) : (
                                  <span className="truncate text-foreground-secondary">Belum tersedia</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-1 lg:gap-3">
                              {productionProgress?.googleDriveLink && (
                                <a href={productionProgress.googleDriveLink} target="_blank" rel="noreferrer" className="min-h-9 rounded-lg border border-border-line bg-white px-3 py-2 text-xs lg:min-h-11 lg:rounded-none lg:px-4 lg:text-sm">
                                  Lihat File
                                </a>
                              )}
                              <ChatButton />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ProgressBadge({ status }: { status: string }) {
  if (status === "Completed") return <StatusBadge variant="success">Completed</StatusBadge>;
  if (status === "In Progress") return <StatusBadge variant="finishing">In Progress</StatusBadge>;
  if (status === "Locked") return <StatusBadge variant="locked">Locked</StatusBadge>;
  return <StatusBadge variant="waiting">Waiting</StatusBadge>;
}

function getMarkerClass(status: string) {
  if (status === "Completed") return "is-completed";
  if (status === "In Progress") return "is-active";
  if (status === "Locked") return "is-locked";
  return "is-waiting";
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-line bg-white p-3 shadow-[0_10px_26px_rgba(38,28,16,0.035)] lg:rounded-none lg:p-5 lg:shadow-none">
      <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-foreground-secondary lg:mb-2 lg:text-xs lg:tracking-[0.18em]">{label}</p>
      <p className="text-sm font-medium lg:text-lg">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] uppercase tracking-[0.14em] text-foreground-secondary lg:mb-1 lg:text-xs lg:tracking-[0.16em]">{label}</p>
      <p className="text-xs font-medium lg:text-sm">{value}</p>
    </div>
  );
}

function ChoicePanel({
  title,
  description,
  first,
  second,
}: {
  title: string;
  description: string;
  first: string;
  second: string;
}) {
  return (
    <div className="mt-3 rounded-xl border border-border-line bg-background-soft p-3 lg:mt-5 lg:rounded-none lg:p-5 lg:text-left">
      <p className="text-xs font-medium lg:text-sm">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-foreground-secondary lg:mt-2 lg:text-sm">{description}</p>
      <div className="mt-3 grid gap-2 lg:mt-4 lg:gap-3">
        <button type="button" className="min-h-9 rounded-lg bg-dark-premium px-3 py-2 text-xs text-white lg:min-h-11 lg:rounded-none lg:px-4 lg:text-sm">
          {first}
        </button>
        <button type="button" className="min-h-9 rounded-lg border border-border-line bg-white px-3 py-2 text-xs lg:min-h-11 lg:rounded-none lg:px-4 lg:text-sm">
          {second}
        </button>
      </div>
    </div>
  );
}

function ChatButton() {
  return (
    <a href={`https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border-line bg-white px-3 py-2 text-xs lg:min-h-11 lg:rounded-none lg:px-4 lg:text-sm">
      <MessageCircle size={16} /> Chat Admin
    </a>
  );
}
