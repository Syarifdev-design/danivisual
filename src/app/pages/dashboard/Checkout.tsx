import { useState, useEffect } from "react";
import { Check, ChevronRight, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { defaultPaymentAccounts } from "../../data/paymentAccounts";
import type { PaymentAccount } from "../../../services/paymentAccountService";

type Step = 1 | 2 | 3 | 4 | 5;
type DeliveryMethod = "ekspedisi" | "cod" | "pickup";

export default function Checkout() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Payment account state
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(
    defaultPaymentAccounts.find(acc => acc.isDefault) || defaultPaymentAccounts[0] || null
  );

  // Get active payment account from localStorage or default
  useEffect(() => {
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
        }
      } catch {
        // Use default
      }
    }
  }, []);

  const steps = [
    { number: 1, title: "Paket & Add-ons" },
    { number: 2, title: "Data Acara" },
    { number: 3, title: "Pengiriman Album" },
    { number: 4, title: "Pembayaran" },
    { number: 5, title: "Review" },
  ];

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep((currentStep + 1) as Step);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const submitBooking = () => {
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-border-line rounded-sm p-12 text-center">
          <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-600" />
          </div>
          <h1 className="text-3xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Booking Submitted
          </h1>
          <p className="text-foreground-secondary mb-8 max-w-md mx-auto">
            Data booking Anda berhasil dikirim. Tim Danivisual akan memverifikasi pembayaran dan
            menghubungi Anda melalui WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/dashboard/my-booking"
              className="px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
            >
              View My Booking
            </Link>
            <Link
              to="/dashboard/help"
              className="px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm"
            >
              Chat Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Checkout Booking
        </h1>
        <p className="text-foreground-secondary">
          Lengkapi data booking, pilih metode pengiriman album, dan lakukan pembayaran awal untuk
          mengamankan tanggal acara.
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-white border border-border-line rounded-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    currentStep > step.number
                      ? "bg-premium-beige text-white"
                      : currentStep === step.number
                      ? "bg-dark-premium text-white"
                      : "bg-muted text-foreground-secondary"
                  }`}
                >
                  {currentStep > step.number ? <Check size={18} /> : step.number}
                </div>
                <span
                  className={`text-xs mt-2 text-center hidden md:block ${
                    currentStep >= step.number ? "text-foreground font-medium" : "text-foreground-secondary"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-2 ${
                    currentStep > step.number ? "bg-premium-beige" : "bg-border-line"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-border-line rounded-sm p-8">
        {/* Step 1: Paket & Add-ons */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              Paket & Add-ons
            </h2>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-background-soft rounded-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-foreground-secondary">Kategori Layanan</span>
                  <span className="text-sm font-medium">Wedding</span>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-foreground-secondary">Paket Dipilih</span>
                  <span className="text-sm font-medium">Wedding Premium</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-foreground-secondary">Harga Paket</span>
                  <span className="text-sm font-medium">Rp 4.400.000</span>
                </div>
              </div>

              <div className="p-4 bg-background-soft rounded-sm">
                <h3 className="text-sm font-medium mb-3">Add-ons Terpilih:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Extra day</span>
                    <span className="font-medium">Rp 1.200.000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Drone + pilot</span>
                    <span className="font-medium">Rp 400.000</span>
                  </div>
                </div>
              </div>

              <Link
                to="/dashboard/choose-package"
                className="inline-flex items-center text-sm text-premium-beige hover:text-premium-beige/80 transition"
              >
                <ArrowLeft size={16} className="mr-2" />
                Ubah Paket
              </Link>
            </div>

            <label className="flex items-start gap-3 p-4 border border-border-line rounded-sm cursor-pointer hover:bg-background-soft transition">
              <input type="checkbox" className="mt-1 rounded" />
              <span className="text-sm text-foreground-secondary">
                Saya sudah memastikan paket dan tambahan opsional yang dipilih sudah sesuai.
              </span>
            </label>
          </div>
        )}

        {/* Step 2: Data Acara */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              Data Acara
            </h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2">Nama Pasangan</label>
                  <input
                    type="text"
                    placeholder="Dani & Sinta"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Nama Pembooking</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Nomor WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+62 812 3456 7890"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Username Instagram</label>
                  <input
                    type="text"
                    placeholder="@username"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Tanggal Acara</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Jam Acara</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Lokasi Acara / Venue</label>
                  <input
                    type="text"
                    placeholder="Nama venue"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap"
                  className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2">Rencana MUA</label>
                  <input
                    type="text"
                    placeholder="Nama MUA"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Rencana Dekorasi</label>
                  <input
                    type="text"
                    placeholder="Nama dekorator"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Catatan untuk Admin</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan request angle, rundown, dresscode, momen penting, keluarga inti, detail dekorasi, atau kebutuhan khusus lainnya."
                  className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                ></textarea>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Pengiriman Album */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              Metode Penerimaan Album
            </h2>

            <div className="space-y-4 mb-6">
              {/* Ekspedisi */}
              <label
                className={`block p-6 border rounded-sm cursor-pointer transition ${
                  deliveryMethod === "ekspedisi"
                    ? "border-premium-beige bg-background-soft"
                    : "border-border-line hover:border-premium-beige"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === "ekspedisi"}
                    onChange={() => setDeliveryMethod("ekspedisi")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Dikirim melalui ekspedisi</h3>
                    <p className="text-sm text-foreground-secondary mb-2">
                      Album dikirim ke alamat Anda menggunakan jasa ekspedisi.
                    </p>
                    <p className="text-sm text-premium-beige font-medium">
                      Packing fee Rp 35.000
                    </p>
                  </div>
                </div>
                {deliveryMethod === "ekspedisi" && (
                  <div className="mt-4 pt-4 border-t border-border-line space-y-4">
                    <input
                      type="text"
                      placeholder="Nama penerima"
                      className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                    <input
                      type="text"
                      placeholder="Alamat lengkap pengiriman"
                      className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Provinsi"
                        className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                      />
                      <input
                        type="text"
                        placeholder="Kota"
                        className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                      />
                    </div>
                  </div>
                )}
              </label>

              {/* COD */}
              <label
                className={`block p-6 border rounded-sm cursor-pointer transition ${
                  deliveryMethod === "cod"
                    ? "border-premium-beige bg-background-soft"
                    : "border-border-line hover:border-premium-beige"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === "cod"}
                    onChange={() => setDeliveryMethod("cod")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">COD dengan agent</h3>
                    <p className="text-sm text-foreground-secondary mb-2">
                      Album diantar langsung oleh agent Danivisual.
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      Biaya agent menunggu konfirmasi admin.
                    </p>
                  </div>
                </div>
                {deliveryMethod === "cod" && (
                  <div className="mt-4 pt-4 border-t border-border-line space-y-4">
                    <input
                      type="text"
                      placeholder="Alamat pengantaran"
                      className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                    <input
                      type="text"
                      placeholder="Jadwal preferensi"
                      className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                  </div>
                )}
              </label>

              {/* Pickup */}
              <label
                className={`block p-6 border rounded-sm cursor-pointer transition ${
                  deliveryMethod === "pickup"
                    ? "border-premium-beige bg-background-soft"
                    : "border-border-line hover:border-premium-beige"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Diambil ke kantor</h3>
                    <p className="text-sm text-foreground-secondary mb-2">
                      Album diambil langsung ke kantor Danivisual.
                    </p>
                    <p className="text-sm text-foreground-secondary">Tanpa biaya pengiriman.</p>
                  </div>
                </div>
                {deliveryMethod === "pickup" && (
                  <div className="mt-4 pt-4 border-t border-border-line space-y-4">
                    <input
                      type="text"
                      placeholder="Nama pengambil"
                      className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                    <input
                      type="date"
                      placeholder="Tanggal rencana pengambilan"
                      className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                    />
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Pembayaran */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              Pembayaran Booking
            </h2>

            <div className="p-6 bg-background-soft border border-border-line rounded-sm mb-6">
              <h3 className="font-medium mb-4">Informasi Pembayaran</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">DP Awal Wajib</span>
                  <span className="font-medium">Rp 500.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Pelunasan</span>
                  <span className="font-medium">H+2 setelah acara</span>
                </div>
              </div>
              <div className="p-4 bg-white border border-premium-beige/30 rounded-sm">
                <p className="text-xs text-foreground-secondary mb-2">Transfer ke:</p>
                {paymentAccount ? (
                  <>
                    <p className="font-medium">{paymentAccount.bankName} - {paymentAccount.accountNumber}</p>
                    <p className="text-sm text-foreground-secondary">{paymentAccount.accountHolderName}</p>
                    {paymentAccount.branch && (
                      <p className="text-xs text-foreground-secondary mt-1">Cabang: {paymentAccount.branch}</p>
                    )}
                  </>
                ) : (
                  <p className="text-amber-600 text-sm">Rekening belum tersedia. Hubungi admin.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-2">Upload Bukti Transfer</label>
                <input
                  type="file"
                  className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Nama Pengirim</label>
                  <input
                    type="text"
                    placeholder="Nama sesuai rekening"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Nominal Transfer</label>
                  <input
                    type="text"
                    placeholder="Rp 500.000"
                    className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-background-soft rounded-sm">
              <h3 className="font-medium mb-4">Payment Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Harga Paket</span>
                  <span>Rp 4.400.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Total Add-ons</span>
                  <span>Rp 1.600.000</span>
                </div>
                {deliveryMethod === "ekspedisi" && (
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Biaya Packing</span>
                    <span>Rp 35.000</span>
                  </div>
                )}
                <div className="w-full h-[1px] bg-border-line my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total Sementara</span>
                  <span>Rp 6.035.000</span>
                </div>
                <div className="flex justify-between text-premium-beige">
                  <span>DP Wajib</span>
                  <span>Rp 500.000</span>
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Sisa Pembayaran</span>
                  <span>Rp 5.535.000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              Review & Submit
            </h2>

            <div className="space-y-6 mb-8">
              <div className="p-6 bg-background-soft rounded-sm">
                <h3 className="font-medium mb-4">Data Acara</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-secondary">Nama Pasangan:</span>
                    <p className="font-medium">Dani & Sinta</p>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">Tanggal Acara:</span>
                    <p className="font-medium">20 Januari 2026</p>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">Lokasi:</span>
                    <p className="font-medium">Four Seasons Jakarta</p>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">WhatsApp:</span>
                    <p className="font-medium">+62 812 3456 7890</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-background-soft rounded-sm">
                <h3 className="font-medium mb-4">Paket & Add-ons</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Paket:</span>
                    <span className="font-medium">Wedding Premium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Total Add-ons:</span>
                    <span className="font-medium">2 item</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <span className="text-sm text-foreground-secondary">
                    Saya menyetujui syarat dan ketentuan Danivisual.
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 rounded" />
                  <span className="text-sm text-foreground-secondary">
                    Saya memahami DP awal Rp 500.000 wajib dibayarkan untuk mengamankan tanggal
                    acara.
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 rounded" />
                  <span className="text-sm text-foreground-secondary">
                    Saya memahami pelunasan dilakukan H+2 setelah acara.
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 rounded" />
                  <span className="text-sm text-foreground-secondary">
                    Saya memahami sebelum proses delivery saya wajib mengisi kritik, saran, dan
                    penilaian.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitBooking}
                disabled={!agreedToTerms}
                className={`flex-1 px-6 py-4 rounded-sm text-sm font-medium transition ${
                  agreedToTerms
                    ? "bg-dark-premium text-white hover:bg-dark-premium/90"
                    : "bg-muted text-foreground-secondary cursor-not-allowed"
                }`}
              >
                Submit Booking
              </button>
              <button className="px-6 py-4 border border-border-line text-foreground hover:bg-background-soft transition rounded-sm text-sm">
                Save Draft
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-8 border-t border-border-line">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 transition rounded-sm text-sm ${
              currentStep === 1
                ? "text-foreground-secondary cursor-not-allowed"
                : "border border-border-line text-foreground hover:bg-background-soft"
            }`}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {currentStep < 5 && (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition rounded-sm text-sm"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
