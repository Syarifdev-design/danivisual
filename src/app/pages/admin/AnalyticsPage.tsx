import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Users, FileText, CreditCard,
  Eye, Calendar, BarChart3, PieChart as PieChartIcon, ArrowUpRight
} from "lucide-react";
import { useAdmin } from "../../contexts/AdminContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const COLORS = ["#B8915A", "#111111", "#65a30d", "#2563eb", "#9333ea", "#db2777"];

export default function AnalyticsPage() {
  const { bookings, customers, payments, stats, analytics } = useAdmin();

  // Calculate monthly data for the last 6 months
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      const monthBookings = bookings.filter(b => {
        const bDate = new Date(b.createdAt);
        return bDate.getMonth() === date.getMonth() && bDate.getFullYear() === date.getFullYear();
      });
      months.push({
        name: monthStr,
        bookings: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + b.paidAmount, 0),
        newCustomers: customers.filter(c => {
          const cDate = new Date(c.createdAt);
          return cDate.getMonth() === date.getMonth() && cDate.getFullYear() === date.getFullYear();
        }).length,
      });
    }
    return months;
  }, [bookings, customers]);

  // Booking status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      value: count,
    }));
  }, [bookings]);

  // Payment method distribution
  const paymentMethodDistribution = useMemo(() => {
    const methodCounts = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: amount,
    }));
  }, [payments]);

  // Top packages
  const topPackages = useMemo(() => {
    const packageCounts: Record<string, number> = {};
    bookings.forEach(b => {
      packageCounts[b.packageName] = (packageCounts[b.packageName] || 0) + 1;
    });
    return Object.entries(packageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [bookings]);

  // Conversion rate (bookings / views estimation)
  const conversionRate = useMemo(() => {
    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    if (totalViews === 0) return 0;
    return ((bookings.length / totalViews) * 100).toFixed(2);
  }, [analytics, bookings.length]);

  const StatCard = ({
    title, value, subtitle, icon, trend, trendValue, color = "premium-beige"
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
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
          {subtitle && <p className="mt-1 text-xs text-foreground-secondary">{subtitle}</p>}
          {trend && trendValue && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
              {trend === "up" ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
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
      {/* Demo Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <BarChart3 size={20} className="text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-amber-800">Demo / Coming Soon</h3>
            </div>
            <p className="mt-1 text-sm text-amber-700">
              Traffic analytics belum aktif. Integrasi Google Analytics atau sistem tracking akan tersedia setelah dikonfigurasi.</p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Dashboard</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Analytics</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Pantau performa website dan bisnis melalui data analytics. Fitur real-time memerlukan integrasi Google Analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          subtitle="All time"
          icon={<FileText size={24} />}
          trend="up"
          trendValue="+12% vs last month"
        />
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered clients"
          icon={<Users size={24} />}
          trend="up"
          trendValue="+8% vs last month"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="All time"
          icon={<TrendingUp size={24} />}
          trend="up"
          trendValue="+15% vs last month"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`
          }
          subtitle="Estimated from analytics"
          icon={<BarChart3 size={24} />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Bookings & Revenue */}
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <h3 className="mb-4 font-semibold">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5" }}
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatCurrency(value) : value,
                  name === "revenue" ? "Revenue" : name === "bookings" ? "Bookings" : "New Customers"
                ]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#B8915A" fill="#B8915A" fillOpacity={0.1} />
              <Area type="monotone" dataKey="bookings" stroke="#111111" fill="#111111" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Distribution */}
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <h3 className="mb-4 font-semibold">Booking Status</h3>
          {statusDistribution.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center">
              <p className="text-sm text-foreground-secondary">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by Month */}
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <h3 className="mb-4 font-semibold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5" }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" fill="#B8915A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Packages */}
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <h3 className="mb-4 font-semibold">Top Packages</h3>
          {topPackages.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center">
              <p className="text-sm text-foreground-secondary">No data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPackages.map((pkg, index) => (
                <div key={pkg.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-premium-beige/10 text-sm font-bold text-premium-beige">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{pkg.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-premium-beige">{pkg.count} bookings</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Table */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
        <div className="border-b border-border-line p-4">
          <h3 className="font-semibold">Monthly Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-premium-beige/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Month</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Bookings</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">New Customers</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {monthlyData.map((month) => (
                <tr key={month.name} className="hover:bg-premium-beige/5">
                  <td className="px-4 py-3 font-semibold">{month.name}</td>
                  <td className="px-4 py-3 text-right">{month.bookings}</td>
                  <td className="px-4 py-3 text-right">{month.newCustomers}</td>
                  <td className="px-4 py-3 text-right font-semibold text-premium-beige">{formatCurrency(month.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-dashed border-premium-beige/40 bg-white/65 p-5">
        <div className="flex items-start gap-3">
          <BarChart3 size={18} className="mt-0.5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700">Demo Data</p>
            <p className="mt-0.5 text-xs text-amber-600">
              Chart di atas adalah simulasi untuk preview. Hubungkan dengan Google Analytics atau sistem tracking untuk data real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}