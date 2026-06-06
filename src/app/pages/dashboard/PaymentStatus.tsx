import { Upload, Copy, Check, FileText, AlertCircle, Loader2 } from "lucide-react";
import { FormEvent, useState, useRef, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router";
import { useCustomer } from "../../contexts/CustomerContext";
import { formatCurrency, DP_AMOUNT } from "../../data/bookingData";
import { defaultPaymentAccounts } from "../../data/paymentAccounts";
import type { PaymentAccount } from "../../services/paymentAccountService";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran file maksimal 5MB";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Format file harus JPG, PNG, WebP, atau PDF";
  }
  return null;
}

export default function PaymentStatus() {
  const { currentBooking, payments, isLoading, isSubmitting, uploadFinalPayment, refreshBookings } = useCustomer();

  // Payment account state
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(
    defaultPaymentAccounts.find(acc => acc.isDefault) || defaultPaymentAccounts[0] || null
  );

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAmount, setUploadAmount] = useState("");
  const [uploadSenderName, setUploadSenderName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active payment account for final payment from localStorage or default
  useEffect(() => {
    const storedAccounts = localStorage.getItem("danivisual_payment_accounts");
    if (storedAccounts) {
      try {
        const accounts: PaymentAccount[] = JSON.parse(storedAccounts);
        // Prioritize: final_payment type + default, then final_payment + active, then all + default, then all + active
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

  // Find DP payment
  const dpPayment = payments.find((p) => p.type === "dp" && p.status === "verified");
  const finalPayments = payments.filter((p) => p.type === "final_payment");
  const totalPaid = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingFinalPayments = finalPayments.filter((p) => p.status === "pending");
  const remainingAmount = currentBooking ? currentBooking.totalAmount - totalPaid : 0;
  const isFullyPaid = remainingAmount <= 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        setUploadFile(null);
      } else {
        setUploadError("");
        setUploadFile(file);
      }
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(false);

    if (!uploadFile) {
      setUploadError("Pilih file bukti transfer");
      return;
    }

    if (!uploadAmount.trim()) {
      setUploadError("Masukkan nominal transfer");
      return;
    }

    const amount = parseInt(uploadAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
      setUploadError("Nominal tidak valid");
      return;
    }

    setIsUploading(true);
    const result = await uploadFinalPayment(uploadFile, amount, uploadSenderName);
    setIsUploading(false);

    if (result.success) {
      setUploadSuccess(true);
      setUploadFile(null);
      setUploadAmount("");
      setUploadSenderName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await refreshBookings();
    } else {
      setUploadError(result.error || "Upload gagal. Silakan coba lagi.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-foreground-secondary">Memuat...</p>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-foreground-secondary">Booking tidak ditemukan.</p>
        <Link to="/dashboard/login" className="mt-4 inline-block text-premium-beige underline">
          Login ulang
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Payment Status
        </h1>
        <p className="text-foreground-secondary">
          Kelola pembayaran DP awal dan pelunasan booking Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Payment Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* DP Payment */}
          <div className="rounded-sm border border-border-line bg-white p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-xl" style={{ fontFamily: "var(--font-heading)" }}>
                  DP Awal
                </h2>
                <p className="text-sm text-foreground-secondary">
                  Pembayaran awal untuk mengamankan tanggal acara
                </p>
              </div>
              <StatusBadge variant={dpPayment?.status === "verified" ? "success" : "waiting"}>
                {dpPayment?.status === "verified" ? "Diterima" : dpPayment ? "Menunggu Verifikasi" : "Belum Bayar"}
              </StatusBadge>
            </div>

            <div className="mb-4 rounded-sm bg-background-soft p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Jumlah DP Wajib</span>
                <span className="text-lg font-medium">{formatCurrency(DP_AMOUNT)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Status</span>
                <span className={`text-sm font-medium ${dpPayment?.status === "verified" ? "text-green-600" : "text-orange-500"}`}>
                  {dpPayment?.status === "verified" ? "Diterima" : "Menunggu verifikasi"}
                </span>
              </div>
            </div>

            {dpPayment && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Tanggal Upload</span>
                  <span>{new Date(dpPayment.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
                {dpPayment.verifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Tanggal Verifikasi</span>
                    <span>{new Date(dpPayment.verifiedAt).toLocaleDateString("id-ID")}</span>
                  </div>
                )}
                {dpPayment.verifiedBy && (
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Diverifikasi oleh</span>
                    <span>{dpPayment.verifiedBy}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Final Payments (Pelunasan) */}
          {finalPayments.length > 0 && (
            finalPayments.map((payment) => (
              <div key={payment.id} className="rounded-sm border border-border-line bg-white p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-xl" style={{ fontFamily: "var(--font-heading)" }}>
                      Pelunasan
                    </h2>
                    <p className="text-sm text-foreground-secondary">
                      Pembayaran sisa booking
                    </p>
                  </div>
                  <StatusBadge variant={payment.status === "verified" ? "success" : payment.status === "pending" ? "waiting" : "finishing"}>
                    {payment.status === "verified" ? "Diterima" : payment.status === "pending" ? "Menunggu Verifikasi" : "Ditolak"}
                  </StatusBadge>
                </div>

                <div className="mb-4 rounded-sm bg-background-soft p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">Jumlah</span>
                    <span className="text-lg font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">Status</span>
                    <span className={`text-sm font-medium ${payment.status === "verified" ? "text-green-600" : "text-orange-500"}`}>
                      {payment.status === "verified" ? "Lunas" : "Menunggu verifikasi"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Tanggal Upload</span>
                    <span>{new Date(payment.createdAt).toLocaleDateString("id-ID")}</span>
                  </div>
                  {payment.verifiedAt && (
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Tanggal Verifikasi</span>
                      <span>{new Date(payment.verifiedAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Pending Final Payments - Waiting Verification */}
          {pendingFinalPayments.length > 0 && !isFullyPaid && (
            <div className="rounded-sm border border-orange-200 bg-orange-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-orange-500 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-orange-800">Menunggu Verifikasi</h3>
                  <p className="mt-1 text-sm text-orange-700">
                    {pendingFinalPayments.length} bukti pelunasan sedang menunggu verifikasi admin.
                    Mohon tunggu konfirmasi dari tim Danivisual.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Pelunasan Form */}
          {!isFullyPaid && (
            <div className="rounded-sm border border-border-line bg-white p-6">
              <h3 className="mb-4 text-lg font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                Upload Bukti Pelunasan
              </h3>
              <p className="mb-4 text-sm text-foreground-secondary">
                Sisa pembayaran: <span className="font-medium text-premium-beige">{formatCurrency(remainingAmount)}</span>
              </p>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm">Upload Bukti Transfer *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleFileChange}
                    className="w-full rounded-sm border border-border-line px-4 py-3 focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                  <p className="mt-1.5 text-xs text-foreground-secondary">
                    Format: JPG, PNG, WebP, atau PDF. Maksimal 5MB.
                  </p>
                  {uploadFile && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <FileText size={12} /> {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm">Nama Pengirim</label>
                    <input
                      type="text"
                      value={uploadSenderName}
                      onChange={(e) => setUploadSenderName(e.target.value)}
                      placeholder="Nama sesuai rekening"
                      className="w-full rounded-sm border border-border-line px-4 py-3 focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm">Nominal Transfer *</label>
                    <input
                      type="text"
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(e.target.value)}
                      placeholder="Rp 5.000.000"
                      className="w-full rounded-sm border border-border-line px-4 py-3 focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                  </div>
                </div>

                {(uploadError || uploadSuccess) && (
                  <div className={`rounded-sm p-4 text-sm flex items-center gap-2 ${uploadSuccess ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {uploadSuccess ? (
                      <>
                        <Check size={16} />
                        Bukti pelunasan berhasil diupload! Mohon tunggu verifikasi dari admin.
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        {uploadError}
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex w-full items-center justify-center gap-2 px-6 py-3 text-sm text-white transition-all rounded-sm bg-dark-premium hover:bg-dark-premium/90 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Bukti Pelunasan
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Fully Paid Message */}
          {isFullyPaid && (
            <div className="rounded-sm border border-green-200 bg-green-50 p-6 text-center">
              <Check className="mx-auto mb-3 h-12 w-12 text-green-600" />
              <h3 className="mb-2 text-xl font-medium text-green-800" style={{ fontFamily: "var(--font-heading)" }}>
                Booking Lunas!
              </h3>
              <p className="text-sm text-green-700">
                Semua pembayaran sudah diterima. Terima kasih!
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Payment Info */}
        <div className="space-y-6">
          {/* Bank Info */}
          <div className="rounded-sm border border-premium-beige/50 bg-white p-6">
            <h3 className="mb-4 text-lg font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              Rekening Pembayaran
            </h3>
            {paymentAccount ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs text-foreground-secondary">Bank</p>
                  <p className="font-medium">{paymentAccount.bankName}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-foreground-secondary">Nomor Rekening</p>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{paymentAccount.accountNumber}</p>
                    <button onClick={() => navigator.clipboard?.writeText(paymentAccount.accountNumber)} className="rounded-sm p-2 transition hover:bg-background-soft">
                      <Copy size={16} className="text-premium-beige" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-foreground-secondary">Atas Nama</p>
                  <p className="font-medium">{paymentAccount.accountHolderName}</p>
                </div>
                {paymentAccount.branch && (
                  <div>
                    <p className="mb-1 text-xs text-foreground-secondary">Cabang</p>
                    <p className="text-sm">{paymentAccount.branch}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>Rekening pembayaran belum tersedia. Silakan hubungi admin.</span>
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="rounded-sm border border-border-line bg-white p-6">
            <h3 className="mb-4 text-lg font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              Payment Breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Harga Paket</span>
                <span>{formatCurrency(currentBooking.packagePrice)}</span>
              </div>
              {currentBooking.addonTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Add-ons</span>
                  <span>{formatCurrency(currentBooking.addonTotal)}</span>
                </div>
              )}
              {currentBooking.packingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Biaya Packing</span>
                  <span>{formatCurrency(currentBooking.packingFee)}</span>
                </div>
              )}
              <div className="h-[1px] w-full bg-border-line" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(currentBooking.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-premium-beige">
                <span>Total Dibayar</span>
                <span>{formatCurrency(totalPaid)}</span>
              </div>
              <div className={`flex justify-between font-medium ${remainingAmount > 0 ? "text-orange-500" : "text-green-600"}`}>
                <span>Sisa Dibayar</span>
                <span>{formatCurrency(Math.max(0, remainingAmount))}</span>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="rounded-sm border border-border-line bg-background-soft p-6">
            <h3 className="mb-3 text-sm font-medium">Butuh Bantuan?</h3>
            <p className="mb-4 text-sm text-foreground-secondary">
              Hubungi admin untuk bantuan pembayaran atau verifikasi
            </p>
            <Link
              to="/dashboard/help"
              className="block w-full rounded-sm border border-border-line px-4 py-2 text-center text-sm text-foreground transition-all hover:bg-white"
            >
              Chat Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}