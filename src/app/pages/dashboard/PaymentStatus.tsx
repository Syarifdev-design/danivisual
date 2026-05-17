import { Upload, Copy, Check } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router";

export default function PaymentStatus() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Payment Status
        </h1>
        <p className="text-foreground-secondary">
          Kelola pembayaran DP awal dan pelunasan booking Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Payment Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* DP Payment */}
          <div className="bg-white border border-border-line rounded-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  DP Awal
                </h2>
                <p className="text-sm text-foreground-secondary">
                  Pembayaran awal untuk mengamankan tanggal acara
                </p>
              </div>
              <StatusBadge variant="success">Diterima</StatusBadge>
            </div>

            <div className="p-4 bg-background-soft rounded-sm mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-foreground-secondary">Jumlah DP Wajib</span>
                <span className="text-lg font-medium">Rp 500.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Status</span>
                <span className="text-sm font-medium text-green-600">Diterima</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Tanggal Upload</span>
                <span>11 Jan 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Tanggal Verifikasi</span>
                <span>11 Jan 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Nama Pengirim</span>
                <span>Dani Indra</span>
              </div>
            </div>
          </div>

          {/* Pelunasan Payment */}
          <div className="bg-white border border-border-line rounded-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Pelunasan
                </h2>
                <p className="text-sm text-foreground-secondary">
                  Pembayaran sisa booking (H+2 setelah acara)
                </p>
              </div>
              <StatusBadge variant="success">Lunas</StatusBadge>
            </div>

            <div className="p-4 bg-background-soft rounded-sm mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-foreground-secondary">Sisa Pembayaran</span>
                <span className="text-lg font-medium">Rp 10.035.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Status</span>
                <span className="text-sm font-medium text-green-600">Lunas</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Deadline</span>
                <span>22 Jan 2026 (H+2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Tanggal Pelunasan</span>
                <span>22 Jan 2026</span>
              </div>
            </div>
          </div>

          {/* Upload Payment Proof (if needed) */}
          <div className="bg-white border border-border-line rounded-sm p-6">
            <h3 className="text-lg mb-4 font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              Upload Bukti Pembayaran
            </h3>
            <div className="space-y-4">
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
              <button className="flex items-center gap-2 px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm">
                <Upload size={18} />
                Upload Bukti
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Info */}
        <div className="space-y-6">
          {/* Bank Info */}
          <div className="bg-white border border-premium-beige/50 rounded-sm p-6">
            <h3 className="text-lg mb-4 font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              Rekening Pembayaran
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-foreground-secondary mb-1">Bank</p>
                <p className="font-medium">BRI</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary mb-1">Nomor Rekening</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium">645201020316531</p>
                  <button className="p-2 hover:bg-background-soft rounded-sm transition">
                    <Copy size={16} className="text-premium-beige" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary mb-1">Atas Nama</p>
                <p className="font-medium">DANI INDRA FIRMANSYAH</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white border border-border-line rounded-sm p-6">
            <h3 className="text-lg mb-4 font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              Payment Breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Harga Paket</span>
                <span>Rp 8.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Add-ons</span>
                <span>Rp 2.500.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Biaya Packing</span>
                <span>Rp 35.000</span>
              </div>
              <div className="w-full h-[1px] bg-border-line my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>Rp 10.535.000</span>
              </div>
              <div className="flex justify-between text-premium-beige">
                <span>DP Dibayar</span>
                <span>Rp 500.000</span>
              </div>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Sisa Dibayar</span>
                <span>Rp 10.035.000</span>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-background-soft border border-border-line rounded-sm p-6">
            <h3 className="text-sm font-medium mb-3">Butuh Bantuan?</h3>
            <p className="text-sm text-foreground-secondary mb-4">
              Hubungi admin untuk bantuan pembayaran atau verifikasi
            </p>
            <Link
              to="/dashboard/help"
              className="block w-full text-center px-4 py-2 border border-border-line text-foreground hover:bg-white transition-all rounded-sm text-sm"
            >
              Chat Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
