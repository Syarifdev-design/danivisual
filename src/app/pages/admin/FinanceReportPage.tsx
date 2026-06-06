import { useState, useMemo } from "react";
import {
  Download,
  TrendingUp,
  Wallet,
  Calendar,
  Filter,
  ChevronDown,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Search,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { useAdmin, Payment } from "../../contexts/AdminContext";
import { formatCurrency } from "../../data/bookingData";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

// Status configurations
const statusConfig = {
  pending: {
    label: "Menunggu",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
  verified: {
    label: "Diterima",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Ditolak",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
  },
};

type StatusFilter = "all" | "pending" | "verified" | "rejected";

export default function FinanceReportPage() {
  const { payments, bookings, paymentsLoading, paymentsError } = useAdmin();

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("custom");

  // Get current month range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  // Quick date presets
  const datePresets = [
    { label: "Bulan Ini", getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
    }},
    { label: "Bulan Lalu", getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
    }},
    { label: "3 Bulan", getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start: start.toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
    }},
    { label: "Custom", getRange: () => ({ start: "", end: "" }) },
  ];

  // Apply date preset
  const handleDatePreset = (preset: typeof datePresets[0]) => {
    if (preset.label === "Custom") {
      setSelectedMonth("custom");
      return;
    }
    setSelectedMonth(preset.label);
    const range = preset.getRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  // Safe array checks
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  // Filter payments
  const filteredPayments = useMemo(() => {
    return safePayments.filter((payment) => {
      // Date filter
      const paymentDate = new Date(payment.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && paymentDate < start) return false;
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59);
        if (paymentDate > endOfDay) return false;
      }

      // Status filter
      if (statusFilter !== "all" && payment.status !== statusFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchCustomer = payment.customerName.toLowerCase().includes(query);
        const matchOrder = payment.bookingOrderNumber.toLowerCase().includes(query);
        if (!matchCustomer && !matchOrder) return false;
      }

      return true;
    });
  }, [safePayments, startDate, endDate, statusFilter, searchQuery]);

  // Calculate summaries
  const summaries = useMemo(() => {
    // Filter verified and pending from filtered payments
    const verifiedPayments = filteredPayments.filter((p) => p.status === "verified");
    const pendingPayments = filteredPayments.filter((p) => p.status === "pending");

    // Total revenue = sum of all verified payment amounts
    const totalVerified = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Total pending = sum of all pending payment amounts
    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // DP verified = sum of payment type "dp" and status "verified"
    const dpPayments = verifiedPayments.filter((p) => p.type === "dp");
    const totalDP = dpPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Pelunasan verified = sum of payment type "final_payment" and status "verified"
    const pelunasanPayments = verifiedPayments.filter((p) => p.type === "final_payment");
    const totalPelunasan = pelunasanPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Outstanding = sum of remainingAmount from all bookings
    const totalRemaining = safeBookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

    // Count transactions
    const countVerified = verifiedPayments.length;
    const countPending = pendingPayments.length;

    return {
      totalVerified,
      totalPending,
      totalDP,
      totalPelunasan,
      totalRemaining,
      countVerified,
      countPending,
    };
  }, [filteredPayments, safeBookings]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Tanggal", "Customer", "Order Number", "Tipe", "Metode", "Jumlah", "Status"];
    const rows = filteredPayments.map((p) => [
      formatDate(p.createdAt),
      p.customerName,
      p.bookingOrderNumber,
      p.type === "dp" ? "DP" : "Pelunasan",
      p.method,
      p.amount.toString(),
      p.status === "verified" ? "Diterima" : p.status === "pending" ? "Menunggu" : "Ditolak",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Finance</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Finance Report</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Ringkasan pendapatan dan transaksi keuangan.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {paymentsLoading && (
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-8 text-center shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-premium-beige/20 border-t-premium-beige"></div>
          <p className="mt-4 text-sm text-foreground-secondary">Memuat data keuangan...</p>
        </div>
      )}

      {paymentsError && !paymentsLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle size={16} />
            {paymentsError} - Menampilkan data dari cache lokal.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Verified */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <TrendingUp className="text-emerald-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-emerald-600">Total Diterima</p>
              <p className="mt-0.5 text-xl font-bold text-emerald-700">
                {formatCurrency(summaries.totalVerified)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-emerald-600">{summaries.countVerified} transaksi</p>
        </div>

        {/* Total DP */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <CreditCard className="text-blue-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-blue-600">Total DP</p>
              <p className="mt-0.5 text-xl font-bold text-blue-700">
                {formatCurrency(summaries.totalDP)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-600">
            {filteredPayments.filter((p) => p.type === "dp" && p.status === "verified").length} transaksi
          </p>
        </div>

        {/* Total Pelunasan */}
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5">
              <Wallet className="text-purple-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-purple-600">Total Pelunasan</p>
              <p className="mt-0.5 text-xl font-bold text-purple-700">
                {formatCurrency(summaries.totalPelunasan)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-purple-600">
            {filteredPayments.filter((p) => p.type === "final_payment" && p.status === "verified").length} transaksi
          </p>
        </div>

        {/* Remaining */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <DollarSign className="text-amber-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-amber-600">Sisa Pembayaran</p>
              <p className="mt-0.5 text-xl font-bold text-amber-700">
                {formatCurrency(summaries.totalRemaining)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-amber-600">Outstanding</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Cari customer atau order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border-line bg-white px-4 py-2.5 pl-10 text-sm outline-none transition focus:border-premium-beige"
            />
          </div>

          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            {datePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleDatePreset(preset)}
                className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                  selectedMonth === preset.label
                    ? "border-premium-beige/45 bg-premium-beige/10 text-foreground"
                    : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-foreground-secondary" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedMonth("custom");
              }}
              className="rounded-lg border border-border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-premium-beige"
            />
            <span className="text-foreground-secondary">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedMonth("custom");
              }}
              className="rounded-lg border border-border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-premium-beige"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-premium-beige"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="verified">Diterima</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-premium-beige/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Tipe</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Jumlah</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText size={48} className="mx-auto text-border-line" />
                    <p className="mt-4 text-sm text-foreground-secondary">Tidak ada transaksi</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const config = statusConfig[payment.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <tr key={payment.id} className="hover:bg-premium-beige/5">
                      <td className="px-4 py-3 text-sm">{formatShortDate(payment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{payment.customerName}</p>
                          {payment.senderName && (
                            <p className="text-xs text-foreground-secondary">via {payment.senderName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{payment.bookingOrderNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          payment.type === "dp"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                        }`}>
                          {payment.type === "dp" ? "DP" : "Pelunasan"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
                          <Icon size={12} />
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredPayments.length > 0 && (
          <div className="flex items-center justify-between border-t border-border-line bg-premium-beige/5 px-4 py-3">
            <p className="text-xs text-foreground-secondary">
              {filteredPayments.length} transaksi
            </p>
            <p className="text-xs text-foreground-secondary">
              Total: <span className="font-semibold text-foreground">{formatCurrency(summaries.totalVerified)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}