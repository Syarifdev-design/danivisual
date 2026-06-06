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
  Eye,
  ExternalLink,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import { useAdmin, Booking, Payment } from "../../contexts/AdminContext";
import { formatCurrency } from "../../data/bookingData";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { findBookingForPayment as findBookingForPaymentByRelation } from "../../../services/paymentService";

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
type PaymentTypeFilter = "all" | "dp" | "final_payment";

// ============================================================================
// FINANCE CALCULATION HELPERS
// ============================================================================
//
// FORMULA OVERVIEW:
// -----------------
// - totalReceived = sum of all verified payments (regardless of type)
// - totalDp = sum of verified payments where type === "dp"
// - totalFinal = sum of verified payments where type === "final_payment"
// - outstanding = sum(activeBookings.totalAmount - verifiedPaidPerBooking)
//   - activeBookings = bookings where status !== "cancelled"
//   - verifiedPaidPerBooking = sum of verified payments for that booking
//   - If outstanding < 0, clamp to 0
//
// IMPORTANT RULES:
// - Pending/rejected payments do NOT count as revenue
// - Cancelled bookings do NOT contribute to outstanding
// - Outstanding is calculated from booking total, NOT from payment amounts
// ============================================================================

function toAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Get verified payments only (status === "verified")
 */
function getVerifiedPayments(payments: Payment[]): Payment[] {
  return payments.filter((payment) => payment.status === "verified");
}

/**
 * Get active bookings only (status !== "cancelled")
 * Cancelled bookings should not contribute to outstanding calculation
 */
function getActiveBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((booking) => booking.status !== "cancelled");
}

/**
 * Get booking total amount with flexible field mapping
 * Supports: totalAmount, total_amount, totalPrice, total_price, packagePrice, amount
 * Priority: totalAmount > total_amount > totalPrice > total_price > packagePrice > amount
 */
function getBookingTotalAmount(booking: Booking): number {
  // Cast to flexible type to support both camelCase and snake_case fields
  const flex = booking as Booking & {
    totalAmount?: number;
    total_amount?: number;
    totalPrice?: number;
    total_price?: number;
    packagePrice?: number;
    amount?: number;
  };

  return (
    toAmount(flex.totalAmount) ||
    toAmount(flex.total_amount) ||
    toAmount(flex.totalPrice) ||
    toAmount(flex.total_price) ||
    toAmount(flex.packagePrice) ||
    toAmount(flex.amount)
  );
}

/**
 * Check if a payment belongs to a booking
 * Uses booking.id as primary relation and booking.orderNumber as legacy fallback
 */
function paymentMatchesBooking(payment: Payment, booking: Booking): boolean {
  if (payment.bookingId && booking.id) {
    return payment.bookingId === booking.id;
  }

  return Boolean(payment.bookingOrderNumber && booking.orderNumber && payment.bookingOrderNumber === booking.orderNumber);
}

/**
 * Calculate total verified payments for a specific booking
 * Only counts payments with status === "verified"
 */
function getVerifiedPaidForBooking(booking: Booking, payments: Payment[]): number {
  return getVerifiedPayments(payments)
    .filter((payment) => paymentMatchesBooking(payment, booking))
    .reduce((sum, payment) => sum + toAmount(payment.amount), 0);
}

/**
 * Calculate outstanding for a specific booking
 * Outstanding = booking total - verified payments
 * If negative, clamp to 0
 */
function calculateBookingOutstanding(booking: Booking, payments: Payment[]): number {
  const bookingTotal = getBookingTotalAmount(booking);
  const paid = getVerifiedPaidForBooking(booking, payments);
  return Math.max(0, bookingTotal - paid);
}

/**
 * Calculate total outstanding across all active bookings
 * Formula: sum(bookingTotal - verifiedPaidPerBooking) for each active booking
 */
function calculateTotalOutstanding(bookings: Booking[], payments: Payment[]): number {
  const activeBookings = getActiveBookings(bookings);
  const verifiedPayments = getVerifiedPayments(payments);

  return activeBookings.reduce((sum, booking) => {
    const bookingTotal = getBookingTotalAmount(booking);
    const paid = getVerifiedPaidForBooking(booking, verifiedPayments);
    return sum + Math.max(0, bookingTotal - paid);
  }, 0);
}

/**
 * Calculate outstanding for a specific booking (for display in table row)
 * Returns 0 if booking is undefined
 */
function getBookingOutstanding(booking: Booking | undefined, payments: Payment[]): number {
  if (!booking) return 0;
  const bookingTotal = getBookingTotalAmount(booking);
  const paid = getVerifiedPaidForBooking(booking, payments);
  return Math.max(0, bookingTotal - paid);
}

/**
 * Get booking for a payment
 */
function getBookingForPayment(payment: Payment, bookings: Booking[]): Booking | undefined {
  return findBookingForPaymentByRelation(payment, bookings);
}

// Get method label
function getMethodLabel(method: string | undefined): string {
  if (!method) return "-";
  const labels: Record<string, string> = {
    transfer: "Transfer",
    cash: "Tunai",
    other: "Lainnya",
  };
  return labels[method] || method;
}

// CSV Helper Functions
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Check if value needs escaping (contains comma, quote, newline, or carriage return)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    // Escape double quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return str;
}

function exportCsv(rows: (string | number | null | undefined)[][], filename: string): void {
  if (rows.length === 0) return;
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatCsvDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

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
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<PaymentTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("custom");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // View payment detail
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

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

      // Payment type filter
      if (paymentTypeFilter !== "all" && payment.type !== paymentTypeFilter) return false;

      // Finance search intentionally excludes customer phone and email.
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchCustomer = payment.customerName.toLowerCase().includes(query);
        const matchOrder = payment.bookingOrderNumber?.toLowerCase().includes(query);
        if (!matchCustomer && !matchOrder) return false;
      }

      return true;
    });
  }, [safePayments, startDate, endDate, statusFilter, paymentTypeFilter, searchQuery]);

  // Calculate summaries
  const summaries = useMemo(() => {
    // Filter verified and pending from filtered payments
    const verifiedPayments = getVerifiedPayments(filteredPayments);
    const pendingPayments = filteredPayments.filter((p) => p.status === "pending");

    // Total revenue = sum of all verified payment amounts
    const totalVerified = verifiedPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);

    // Total pending = sum of all pending payment amounts
    const totalPending = pendingPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);

    // DP verified = sum of payment type "dp" and status "verified"
    const dpPayments = verifiedPayments.filter((p) => p.type === "dp");
    const totalDP = dpPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);

    // Pelunasan verified = sum of payment type "final_payment" and status "verified"
    const pelunasanPayments = verifiedPayments.filter((p) => p.type === "final_payment");
    const totalPelunasan = pelunasanPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);

    // Outstanding = sum of (activeBooking.totalAmount - verifiedPaidForBooking)
    // Uses calculateTotalOutstanding which:
    // 1. Filters to active bookings only (status !== "cancelled")
    // 2. Calculates verified paid per booking
    // 3. Subtracts from booking total
    // 4. Clamps negative values to 0
    const totalOutstanding = calculateTotalOutstanding(safeBookings, safePayments);

    // Count transactions
    const countVerified = verifiedPayments.length;
    const countPending = pendingPayments.length;

    return {
      totalVerified,
      totalPending,
      totalDP,
      totalPelunasan,
      totalOutstanding,
      countVerified,
      countPending,
    };
  }, [filteredPayments, safeBookings, safePayments]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    // CSV Headers
    const headers = [
      "Date",
      "Customer",
      "Order Number",
      "Type",
      "Method",
      "Amount",
      "Status",
      "Verified At",
      "Booking Total",
      "Outstanding",
      "Proof URL",
    ];

    // CSV Rows
    const rows = filteredPayments.map((p) => {
      const booking = getBookingForPayment(p, safeBookings);
      const bookingTotal = booking ? getBookingTotalAmount(booking) : 0;
      const paidForBooking = booking ? getVerifiedPaidForBooking(booking, safePayments) : 0;
      const outstanding = Math.max(0, bookingTotal - paidForBooking);

      return [
        formatCsvDate(p.createdAt),
        p.customerName,
        p.bookingOrderNumber || "",
        p.type === "dp" ? "DP" : "Pelunasan",
        getMethodLabel(p.method),
        p.amount,
        p.status === "verified" ? "Diterima" : p.status === "pending" ? "Menunggu" : "Ditolak",
        formatCsvDate(p.verifiedAt),
        bookingTotal,
        outstanding,
        p.proofImage || "",
      ];
    });

    exportCsv([headers, ...rows], `finance-report-${formatCsvDate(new Date().toISOString())}.csv`);
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
              <p className="text-xs text-amber-600">Sisa Pembayaran Aktif</p>
              <p className="mt-0.5 text-xl font-bold text-amber-700">
                {formatCurrency(summaries.totalOutstanding)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-amber-600">Global (booking aktif)</p>
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
              placeholder="Cari nama customer atau order..."
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

          {/* Payment Type Filter */}
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value as PaymentTypeFilter)}
            className="rounded-lg border border-border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-premium-beige"
          >
            <option value="all">Semua Tipe</option>
            <option value="dp">DP</option>
            <option value="final_payment">Pelunasan</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-premium-beige/5">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Tanggal</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Customer</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Order</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Tipe</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Method</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Jumlah</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Verified</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Outstanding</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <FileText size={48} className="mx-auto text-border-line" />
                    <p className="mt-4 text-sm font-medium text-foreground">Tidak ada transaksi pada periode ini</p>
                    <p className="mt-1 text-xs text-foreground-secondary">Coba ubah filter atau pilih periode lain</p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                          setStatusFilter("all");
                          setPaymentTypeFilter("all");
                          setSearchQuery("");
                          setSelectedMonth("custom");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-line bg-white px-3 py-2 text-xs font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                      >
                        <RefreshCw size={14} />
                        Reset Filter
                      </button>
                      <button
                        onClick={() => window.location.href = "/admin/payments"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-premium-beige/10 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-premium-beige/20"
                      >
                        <LayoutGrid size={14} />
                        Buka Payments
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const config = statusConfig[payment.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  const booking = getBookingForPayment(payment, safeBookings);
                  const outstanding = getBookingOutstanding(booking, safePayments);
                  const hasProof = Boolean(payment.proofImage);

                  return (
                    <tr key={payment.id} className="hover:bg-premium-beige/5">
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{formatShortDate(payment.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-sm font-medium">{payment.customerName}</p>
                          {payment.senderName && (
                            <p className="text-xs text-foreground-secondary">via {payment.senderName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{payment.bookingOrderNumber || "-"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          payment.type === "dp"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                        }`}>
                          {payment.type === "dp" ? "DP" : "Pelunasan"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{getMethodLabel(payment.method)}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
                          <Icon size={11} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-foreground-secondary whitespace-nowrap">
                        {payment.verifiedAt ? formatShortDate(payment.verifiedAt) : "-"}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {outstanding > 0 ? (
                          <span className="text-sm font-medium text-amber-600">
                            {formatCurrency(outstanding)}
                          </span>
                        ) : (
                          <span className="text-sm text-foreground-secondary">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="rounded-lg p-1.5 text-foreground-secondary transition hover:bg-premium-beige/10 hover:text-foreground"
                            title="View Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {hasProof && (
                            <button
                              onClick={() => window.open(payment.proofImage, "_blank")}
                              className="rounded-lg p-1.5 text-foreground-secondary transition hover:bg-premium-beige/10 hover:text-foreground"
                              title="View Proof"
                            >
                              <ExternalLink size={16} />
                            </button>
                          )}
                        </div>
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

      {/* Payment Detail Modal */}
      {showPaymentModal && selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detail Pembayaran</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg p-1.5 text-foreground-secondary transition hover:bg-premium-beige/10"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="rounded-lg bg-premium-beige/5 p-4">
                <p className="text-xs uppercase tracking-wider text-foreground-secondary">Customer</p>
                <p className="mt-1 font-medium">{selectedPayment.customerName}</p>
                {selectedPayment.senderName && (
                  <p className="text-sm text-foreground-secondary">via {selectedPayment.senderName}</p>
                )}
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Order</p>
                  <p className="mt-1 font-medium">{selectedPayment.bookingOrderNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Tipe</p>
                  <p className="mt-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      selectedPayment.type === "dp"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-purple-50 text-purple-600"
                    }`}>
                      {selectedPayment.type === "dp" ? "DP" : "Pelunasan"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Jumlah</p>
                  <p className="mt-1 font-semibold text-foreground">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Metode</p>
                  <p className="mt-1">{getMethodLabel(selectedPayment.method)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Tanggal</p>
                  <p className="mt-1">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Status</p>
                  <p className="mt-1">
                    {(() => {
                      const config = statusConfig[selectedPayment.status as keyof typeof statusConfig];
                      const Icon = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
                          <Icon size={11} />
                          {config.label}
                        </span>
                      );
                    })()}
                  </p>
                </div>
                {selectedPayment.verifiedAt && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-foreground-secondary">Verified At</p>
                    <p className="mt-1">{formatDate(selectedPayment.verifiedAt)}</p>
                  </div>
                )}
                {selectedPayment.verifiedBy && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-foreground-secondary">Verified By</p>
                    <p className="mt-1">{selectedPayment.verifiedBy}</p>
                  </div>
                )}
              </div>

              {/* Outstanding */}
              {(() => {
                const booking = getBookingForPayment(selectedPayment, safeBookings);
                const outstanding = getBookingOutstanding(booking, safePayments);
                return outstanding > 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs uppercase tracking-wider text-amber-600">Outstanding</p>
                    <p className="mt-1 text-lg font-bold text-amber-700">{formatCurrency(outstanding)}</p>
                    <p className="text-xs text-amber-600">Sisa pembayaran untuk booking ini</p>
                  </div>
                ) : null;
              })()}

              {/* Notes */}
              {selectedPayment.notes && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Catatan</p>
                  <p className="mt-1 text-sm">{selectedPayment.notes}</p>
                </div>
              )}

              {/* Proof Image */}
              {selectedPayment.proofImage && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Bukti Transfer</p>
                  <a
                    href={selectedPayment.proofImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-2 rounded-lg border border-border-line p-3 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                  >
                    <ExternalLink size={16} />
                    Lihat Bukti Transfer
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg bg-premium-beige/10 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-premium-beige/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
