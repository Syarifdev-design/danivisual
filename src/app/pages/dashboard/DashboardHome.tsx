import { Link } from "react-router";
import { useState } from "react";
import { Package, CreditCard, Image, TrendingUp, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";

export default function DashboardHome() {
  // Simulasi status booking: "no-package" | "package-selected" | "checked-out"
  const [bookingStatus] = useState<"no-package" | "package-selected" | "checked-out">("checked-out");

  const summaryCards = [
    {
      icon: Calendar,
      title: "Booking Status",
      value: "Confirmed",
      badge: "success" as const,
      link: "/dashboard/my-booking",
    },
    {
      icon: Package,
      title: "Selected Package",
      value: "Wedding Premium",
      link: "/dashboard/choose-package",
    },
    {
      icon: CreditCard,
      title: "Payment Status",
      value: "DP Received",
      badge: "finishing" as const,
      link: "/dashboard/payment-status",
    },
    {
      icon: Image,
      title: "Album Status",
      value: "In Editing",
      badge: "finishing" as const,
      link: "/dashboard/my-albums",
    },
    {
      icon: TrendingUp,
      title: "Current Progress",
      value: "Editing Process",
      link: "/dashboard/progress",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Dashboard Overview
        </h1>
        <p className="text-foreground-secondary">
          Ringkasan status booking, pembayaran, dan progress album Anda.
        </p>
      </div>

      {/* CTA Based on Booking Status */}
      {bookingStatus === "no-package" && (
        <div className="bg-gradient-to-r from-background-soft to-white border border-border-line rounded-sm p-8 mb-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Mulai Booking Anda
            </h2>
            <p className="text-foreground-secondary mb-6">
              Pilih paket dokumentasi sesuai kebutuhan acara Anda. Tersedia paket Wedding,
              Prewed Studio, Prewed Outdoor, dan Event dengan berbagai pilihan harga.
            </p>
            <Link
              to="/dashboard/choose-package"
              className="inline-flex items-center gap-2 px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
            >
              Pilih Paket
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      {bookingStatus === "package-selected" && (
        <div className="bg-gradient-to-r from-warning-soft to-white border border-premium-beige/50 rounded-sm p-8 mb-8">
          <div className="max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-premium-beige/20 rounded-sm shrink-0">
                <Package size={24} className="text-premium-beige" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                  Lanjutkan Checkout
                </h2>
                <p className="text-foreground-secondary mb-6">
                  Anda sudah memilih paket Wedding Premium. Lengkapi data acara dan pembayaran
                  awal untuk mengamankan tanggal.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/dashboard/checkout"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
                  >
                    Lanjut ke Checkout
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/dashboard/choose-package"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm"
                  >
                    Ubah Paket
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {bookingStatus === "checked-out" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {summaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={index}
                  to={card.link}
                  className="bg-white border border-border-line rounded-sm p-6 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-background-soft rounded-sm">
                      <Icon size={24} className="text-premium-beige" />
                    </div>
                    {card.badge && <StatusBadge variant={card.badge}>{card.value}</StatusBadge>}
                  </div>
                  <h3 className="text-sm uppercase tracking-widest text-foreground-secondary mb-2">
                    {card.title}
                  </h3>
                  <p className="text-lg font-medium mb-2">{card.value}</p>
                  <div className="flex items-center text-sm text-premium-beige group-hover:gap-2 transition-all">
                    View Details <ArrowRight size={16} className="ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Progress Summary */}
          <div className="bg-white border border-border-line rounded-sm p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Progress Summary
                </h2>
                <p className="text-sm text-foreground-secondary">
                  Pantau tahap proses dokumentasi Anda
                </p>
              </div>
              <Link
                to="/dashboard/progress"
                className="px-4 py-2 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm"
              >
                Lihat Progress
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-premium-beige rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">Current Stage</p>
                  <p className="text-sm text-foreground-secondary">Editing Process</p>
                </div>
                <StatusBadge variant="finishing">In Progress</StatusBadge>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground-secondary">Overall Progress</span>
                    <span className="font-medium">60% (6/10)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-premium-beige" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-foreground-secondary mb-1">Next Action</p>
                  <p className="font-medium">Wait for Editing Completion</p>
                </div>
                <p className="text-sm text-foreground-secondary">Deadline: 5 Feb 2026</p>
              </div>
            </div>
          </div>

          {/* Next Actions */}
          <div className="bg-white border border-border-line rounded-sm p-6">
            <h2 className="text-xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Recommended Actions
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-background-soft rounded-sm">
                <div>
                  <p className="font-medium mb-1">Cek Progress Album</p>
                  <p className="text-sm text-foreground-secondary">
                    Lihat status terkini proses editing dan timeline
                  </p>
                </div>
                <Link
                  to="/dashboard/progress"
                  className="px-4 py-2 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm shrink-0"
                >
                  View Progress
                </Link>
              </div>

              <div className="flex items-center justify-between p-4 bg-background-soft rounded-sm">
                <div>
                  <p className="font-medium mb-1">Hubungi Admin</p>
                  <p className="text-sm text-foreground-secondary">
                    Ada pertanyaan? Chat admin untuk bantuan
                  </p>
                </div>
                <Link
                  to="/dashboard/help"
                  className="px-4 py-2 border border-border-line text-foreground hover:bg-white transition-all rounded-sm text-sm shrink-0"
                >
                  Chat Admin
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
