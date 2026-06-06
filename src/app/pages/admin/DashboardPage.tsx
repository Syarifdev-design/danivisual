import { useAdmin } from "../../contexts/AdminContext";
import {
  FileText, Users, CreditCard, Package, TrendingUp, Calendar,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle
} from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const { stats, bookings, payments, customers } = useAdmin();

  const recentBookings = bookings.slice(0, 5);
  const pendingPayments = payments.filter(p => p.status === "pending");

  const StatCard = ({
    title, value, icon, trend, trendValue, color = "premium-beige"
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: "up" | "down";
    trendValue?: string;
    color?: string;
  }) => (
    <div className="rounded-xl border border-border-line bg-white p-5 shadow-[0_10px_26px_rgba(38,28,16,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-foreground-secondary">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {trend && trendValue && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${
              trend === "up" ? "text-emerald-600" : "text-red-500"
            }`}>
              {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`rounded-lg bg-${color}/10 p-3`}>
          <div className={`text-${color}`}>{icon}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Overview</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              Dashboard Admin
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Ringkasan statistik dan aktivitas terbaru website Danivisual.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={<FileText size={24} />}
          trend="up"
          trendValue="+12% bulan ini"
        />
        <StatCard
          title="Total Customers"
          value={customers.length}
          icon={<Users size={24} />}
          trend="up"
          trendValue="+8% bulan ini"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<TrendingUp size={24} />}
          trend="up"
          trendValue="+15% bulan ini"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={<CreditCard size={24} />}
          color="amber"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Monthly Bookings"
          value={stats.monthlyBookings}
          icon={<Calendar size={24} />}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<TrendingUp size={24} />}
        />
        <StatCard
          title="Completed"
          value={stats.completedBookings}
          icon={<CheckCircle2 size={24} />}
          color="emerald"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Bookings */}
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Bookings</h3>
            <span className="rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-semibold text-premium-beige">
              {bookings.length} total
            </span>
          </div>
          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={48} className="text-border-line" />
              <p className="mt-4 text-sm text-foreground-secondary">Belum ada booking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border-line p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{booking.customerName}</p>
                    <p className="truncate text-xs text-foreground-secondary">{booking.packageName}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                      booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                      booking.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      booking.status === "completed" ? "bg-gray-100 text-gray-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {booking.status}
                    </span>
                    <p className="mt-1 text-xs text-foreground-secondary">{booking.orderNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Payments */}
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pending Payments</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingPayments.length} pending
            </span>
          </div>
          {pendingPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 size={48} className="text-emerald-400" />
              <p className="mt-4 text-sm text-foreground-secondary">Semua pembayaran sudah diverifikasi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border-line p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{payment.customerName}</p>
                    <p className="truncate text-xs text-foreground-secondary">{payment.bookingOrderNumber}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                    <p className="mt-1 text-xs text-foreground-secondary">
                      {payment.method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-dashed border-premium-beige/40 bg-white/65 p-5">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="#bookings"
            className="flex items-center gap-2 rounded-lg border border-border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-premium-beige hover:text-premium-beige"
          >
            <FileText size={16} />
            View Bookings
          </a>
          <a
            href="#payments"
            className="flex items-center gap-2 rounded-lg border border-border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-premium-beige hover:text-premium-beige"
          >
            <CreditCard size={16} />
            Verify Payments
          </a>
          <a
            href="#customers"
            className="flex items-center gap-2 rounded-lg border border-border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-premium-beige hover:text-premium-beige"
          >
            <Users size={16} />
            Manage Customers
          </a>
          <a
            href="#analytics"
            className="flex items-center gap-2 rounded-lg border border-border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-premium-beige hover:text-premium-beige"
          >
            <TrendingUp size={16} />
            View Analytics
          </a>
        </div>
      </div>
    </div>
  );
}