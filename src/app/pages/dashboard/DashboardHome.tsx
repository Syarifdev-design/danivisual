import { Link } from "react-router";
import { Package, CreditCard, Image, TrendingUp, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { useCustomer } from "../../contexts/CustomerContext";
import { formatCurrency } from "../../data/bookingData";

export default function DashboardHome() {
  const { currentBooking, productionProgress, isLoggedIn, isLoading, customerPhone } = useCustomer();

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="mb-8">
          <h1 className="text-3xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            Selamat Datang
          </h1>
          <p className="text-sm text-foreground-secondary">
            Masuk dengan nomor WhatsApp Anda untuk melihat status booking dan progress.
          </p>
        </div>
        <Link
          to="/dashboard/login"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-dark-premium px-6 text-sm text-white"
        >
          Masuk ke Portal
        </Link>
        <div className="mt-8 text-sm text-foreground-secondary">
          <p>Belum punya booking?</p>
          <Link to="/packages" className="text-premium-beige underline">
            Lihat paket dokumentasi
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-foreground-secondary">Memuat...</p>
      </div>
    );
  }

  // No booking found
  if (!currentBooking) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="text-3xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Booking Tidak Ditemukan
        </h1>
        <p className="text-sm text-foreground-secondary mb-6">
          Tidak ada booking yang terdaftar untuk nomor ini.
        </p>
        <Link
          to="/packages"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-dark-premium px-6 text-sm text-white"
        >
          Lihat Paket
        </Link>
      </div>
    );
  }

  const summaryCards = [
    {
      icon: Calendar,
      title: "Booking Status",
      value: currentBooking.status === "pending" ? "Menunggu" :
             currentBooking.status === "confirmed" ? "Dikonfirmasi" :
             currentBooking.status === "in_progress" ? "Dalam Proses" :
             currentBooking.status === "completed" ? "Selesai" : "Dibatalkan",
      badge: currentBooking.status === "confirmed" || currentBooking.status === "in_progress" ? "success" as const : "waiting" as const,
      link: "/dashboard/my-booking",
    },
    {
      icon: Package,
      title: "Paket",
      value: currentBooking.packageName,
      link: "/dashboard/my-booking",
    },
    {
      icon: CreditCard,
      title: "Pembayaran",
      value: currentBooking.remainingAmount > 0 ? "Belum Lunas" : "Lunas",
      badge: currentBooking.remainingAmount > 0 ? "waiting" as const : "success" as const,
      link: "/dashboard/payment-status",
    },
    {
      icon: Image,
      title: "Album",
      value: productionProgress?.currentStep || "Menunggu",
      badge: "finishing" as const,
      link: "/dashboard/my-albums",
    },
    {
      icon: TrendingUp,
      title: "Progress",
      value: productionProgress?.currentStep || "Menunggu",
      link: "/dashboard/progress",
    },
  ];

  const isFullyPaid = currentBooking.remainingAmount <= 0;
  const dpVerified = currentBooking.paidAmount >= currentBooking.dpAmount;

  return (
    <div>
      <div className="mb-5">
        <h1 className="mb-1 text-[30px] leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Dashboard
        </h1>
        <p className="text-sm text-foreground-secondary">
          {currentBooking.customerName} - {currentBooking.orderNumber}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              to={card.link}
              className="premium-card premium-card-interactive group min-h-[142px] p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="premium-icon-tile flex h-10 w-10 items-center justify-center">
                  <Icon size={19} className="text-premium-beige" />
                </div>
                {card.badge && <StatusBadge variant={card.badge}>{card.value}</StatusBadge>}
              </div>
              <h3 className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground-secondary">
                {card.title}
              </h3>
              <p className="mb-2 text-[17px] font-semibold">{card.value}</p>
              <div className="flex items-center text-xs font-medium text-premium-beige transition-all group-hover:gap-1.5">
                View Details <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="premium-card mb-5 p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="mb-1 text-xl" style={{ fontFamily: "var(--font-heading)" }}>
              Progress Summary
            </h2>
            <p className="text-sm text-foreground-secondary">
              Pantau tahap proses dokumentasi Anda
            </p>
          </div>
          <Link
            to="/dashboard/progress"
            className="premium-button-secondary px-4 py-2 text-sm"
          >
            Lihat Progress
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/12 text-[#16A34A] ring-1 ring-[#16A34A]/15">
              <CheckCircle size={19} />
            </div>
            <div className="flex-1">
              <p className="mb-1 font-medium">Tahap Saat Ini</p>
              <p className="text-sm text-foreground-secondary">
                {productionProgress?.currentStep || "Menunggu Konfirmasi"}
              </p>
            </div>
            <StatusBadge variant={dpVerified ? "success" : "waiting"}>
              {dpVerified ? "DP Verified" : "Menunggu DP"}
            </StatusBadge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-foreground-secondary">Total Pembayaran</span>
                <span className="font-medium">{formatCurrency(currentBooking.totalAmount)}</span>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-foreground-secondary">Sudah Dibayar</span>
                <span className="font-medium text-green-600">{formatCurrency(currentBooking.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Sisa</span>
                <span className="font-medium text-premium-beige">{formatCurrency(currentBooking.remainingAmount)}</span>
              </div>
            </div>
          </div>

          {isFullyPaid && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="mb-1.5 text-sm text-foreground-secondary">Sneak Peek</p>
                <p className="font-medium">
                  {productionProgress?.sneakPeekStatus === "available" ? "Sudah tersedia" : "Tersedia setelah lunas"}
                </p>
              </div>
            </div>
          )}

          {!isFullyPaid && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="mb-1.5 text-sm text-foreground-secondary">Sisa Pembayaran</p>
                <p className="text-lg font-medium text-premium-beige">
                  {formatCurrency(currentBooking.remainingAmount)}
                </p>
              </div>
              <Link
                to="/dashboard/payment-status"
                className="premium-button px-4 py-2 text-sm"
              >
                Bayar Sekarang
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-5">
        <h2 className="mb-4 text-xl" style={{ fontFamily: "var(--font-heading)" }}>
          Aksi Cepat
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            to="/dashboard/progress"
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-background-soft/72 p-4 transition hover:bg-background-soft"
          >
            <TrendingUp className="text-premium-beige" size={20} />
            <div>
              <p className="font-medium">Lihat Progress</p>
              <p className="text-xs text-foreground-secondary">Timeline produksi album</p>
            </div>
          </Link>
          <Link
            to="/dashboard/payment-status"
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-background-soft/72 p-4 transition hover:bg-background-soft"
          >
            <CreditCard className="text-premium-beige" size={20} />
            <div>
              <p className="font-medium">Status Pembayaran</p>
              <p className="text-xs text-foreground-secondary">DP dan pelunasan</p>
            </div>
          </Link>
          <Link
            to="/dashboard/my-booking"
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-background-soft/72 p-4 transition hover:bg-background-soft"
          >
            <Package className="text-premium-beige" size={20} />
            <div>
              <p className="font-medium">Detail Booking</p>
              <p className="text-xs text-foreground-secondary">Info paket dan acara</p>
            </div>
          </Link>
          <Link
            to="/dashboard/help"
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-background-soft/72 p-4 transition hover:bg-background-soft"
          >
            <CreditCard className="text-premium-beige" size={20} />
            <div>
              <p className="font-medium">Hubungi Admin</p>
              <p className="text-xs text-foreground-secondary">Butuh bantuan?</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}