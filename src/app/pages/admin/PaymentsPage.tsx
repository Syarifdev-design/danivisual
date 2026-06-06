import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Check,
  X,
  Clock,
  CreditCard,
  Image,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Calendar,
  Package,
  AlertTriangle,
  MapPin,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Building2,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useAdmin, Payment, PaymentStatus, Booking } from "../../contexts/AdminContext";
import {
  getPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  setDefaultPaymentAccount,
  togglePaymentAccountActive,
  type PaymentAccount,
  type PaymentType,
} from "../../../services/paymentAccountService";
import { bankOptions, paymentTypeOptions } from "../../data/paymentAccounts";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Status configurations
const statusConfig: Record<PaymentStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  pending: {
    label: "Menunggu",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <Clock size={14} />,
  },
  verified: {
    label: "Diterima",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckCircle2 size={14} />,
  },
  rejected: {
    label: "Ditolak",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: <XCircle size={14} />,
  },
};

// Type configurations
const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
  dp: { label: "DP", bg: "bg-blue-50", text: "text-blue-700" },
  final_payment: { label: "Pelunasan", bg: "bg-purple-50", text: "text-purple-700" },
};

type FilterType = "all" | "dp" | "final_payment" | "pending" | "verified" | "rejected";

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-secondary";

type TabType = "payments" | "accounts";

export default function PaymentsPage() {
  const { payments, bookings, updatePaymentStatus } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabType>("payments");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Payment Accounts state
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    branch: "",
    paymentType: "all" as PaymentType,
    isDefault: false,
    isActive: true,
    sortOrder: 0,
    notes: "",
  });
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Load payment accounts function
  const loadPaymentAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    const accounts = await getPaymentAccounts();
    setPaymentAccounts(accounts);
    setIsLoadingAccounts(false);
  }, []);

  // Load payment accounts on mount
  useEffect(() => {
    loadPaymentAccounts();
  }, [loadPaymentAccounts]);

  // Get booking for a payment
  const getBookingForPayment = (payment: Payment): Booking | undefined => {
    return bookings.find((b) => b.id === payment.bookingId || b.orderNumber === payment.bookingOrderNumber);
  };

  // Handlers for payment accounts
  const handleSaveAccount = async () => {
    if (!accountForm.bankName || !accountForm.accountNumber || !accountForm.accountHolderName) {
      return;
    }

    const accountData = {
      bankName: accountForm.bankName,
      accountNumber: accountForm.accountNumber,
      accountHolderName: accountForm.accountHolderName,
      branch: accountForm.branch || undefined,
      paymentType: accountForm.paymentType,
      isDefault: accountForm.isDefault,
      isActive: accountForm.isActive,
      sortOrder: accountForm.sortOrder,
      notes: accountForm.notes || undefined,
    };

    if (editingAccount) {
      await updatePaymentAccount(editingAccount.id, accountData);
    } else {
      await createPaymentAccount(accountData);
    }

    await loadPaymentAccounts();
    closeAccountForm();
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm("Yakin ingin menghapus rekening ini?")) {
      await deletePaymentAccount(id);
      await loadPaymentAccounts();
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultPaymentAccount(id);
    await loadPaymentAccounts();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await togglePaymentAccountActive(id, !isActive);
    await loadPaymentAccounts();
  };

  const openEditAccount = (account: PaymentAccount) => {
    setEditingAccount(account);
    setAccountForm({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolderName: account.accountHolderName,
      branch: account.branch || "",
      paymentType: account.paymentType,
      isDefault: account.isDefault,
      isActive: account.isActive,
      sortOrder: account.sortOrder,
      notes: account.notes || "",
    });
    setShowAccountForm(true);
  };

  const closeAccountForm = () => {
    setShowAccountForm(false);
    setEditingAccount(null);
    setAccountForm({
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      branch: "",
      paymentType: "all",
      isDefault: false,
      isActive: true,
      sortOrder: 0,
      notes: "",
    });
  };

  const copyAccountNumber = (number: string) => {
    navigator.clipboard?.writeText(number);
  };

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.bookingOrderNumber.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (statusFilter === "dp") {
        matchesFilter = payment.type === "dp";
      } else if (statusFilter === "final_payment") {
        matchesFilter = payment.type === "final_payment";
      } else if (statusFilter === "pending" || statusFilter === "verified" || statusFilter === "rejected") {
        matchesFilter = payment.status === statusFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [payments, searchQuery, statusFilter]);

  // Stats
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const verifiedCount = payments.filter((p) => p.status === "verified").length;
  const rejectedCount = payments.filter((p) => p.status === "rejected").length;
  const dpCount = payments.filter((p) => p.type === "dp").length;
  const finalCount = payments.filter((p) => p.type === "final_payment").length;
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const totalVerified = payments.filter((p) => p.status === "verified").reduce((sum, p) => sum + p.amount, 0);

  // Handle approve
  const handleApprove = () => {
    if (!selectedPayment) return;
    setIsApproving(true);
    updatePaymentStatus(selectedPayment.id, "verified", "admin", verifyNotes);
    setIsApproving(false);
    setSelectedPayment(null);
    setVerifyNotes("");
  };

  // Handle reject
  const handleReject = () => {
    if (!selectedPayment || !rejectReason.trim()) return;
    setIsApproving(true);
    updatePaymentStatus(selectedPayment.id, "rejected", "admin", rejectReason);
    setIsApproving(false);
    setSelectedPayment(null);
    setRejectReason("");
    setShowRejectModal(false);
  };

  // Open reject modal
  const openRejectModal = () => {
    setShowRejectModal(true);
  };

  // Status Badge component
  const StatusBadge = ({ status }: { status: PaymentStatus }) => {
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Type Badge component
  const TypeBadge = ({ type }: { type: string }) => {
    const config = typeConfig[type] || typeConfig.dp;
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Payment Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Payments</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              {activeTab === "payments"
                ? "Verifikasi dan kelola semua pembayaran dari customer."
                : "Kelola rekening pembayaran untuk terima DP dan pelunasan."}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-1 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex-1 min-h-11 rounded-lg px-4 text-sm font-medium transition ${
              activeTab === "payments"
                ? "bg-dark-premium text-white"
                : "text-foreground-secondary hover:bg-background-soft hover:text-foreground"
            }`}
          >
            <CreditCard size={16} className="mr-2 inline-block" />
            Verifikasi Pembayaran
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 min-h-11 rounded-lg px-4 text-sm font-medium transition ${
              activeTab === "accounts"
                ? "bg-dark-premium text-white"
                : "text-foreground-secondary hover:bg-background-soft hover:text-foreground"
            }`}
          >
            <Building2 size={16} className="mr-2 inline-block" />
            Rekening Pembayaran
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "payments" && (
        <>
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-amber-600">Menunggu</p>
              <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-amber-600">{formatCurrency(totalPending)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <CheckCircle2 className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-emerald-600">Diterima</p>
              <p className="text-xl font-bold text-emerald-700">{verifiedCount}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-600">{formatCurrency(totalVerified)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-red-600">Ditolak</p>
              <p className="text-xl font-bold text-red-700">{rejectedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <CreditCard className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-blue-600">DP</p>
              <p className="text-xl font-bold text-blue-700">{dpCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-purple-600">Pelunasan</p>
              <p className="text-xl font-bold text-purple-700">{finalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Cari nama, order number, atau telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClassName} pl-10`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                statusFilter === "all"
                  ? "border-premium-beige/45 bg-premium-beige/10 text-foreground"
                  : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45 hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("dp")}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                statusFilter === "dp"
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45 hover:text-foreground"
              }`}
            >
              DP
            </button>
            <button
              onClick={() => setStatusFilter("final_payment")}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                statusFilter === "final_payment"
                  ? "border-purple-300 bg-purple-50 text-purple-700"
                  : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45 hover:text-foreground"
              }`}
            >
              Pelunasan
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                statusFilter === "pending"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45 hover:text-foreground"
              }`}
            >
              Waiting
            </button>
            <button
              onClick={() => setStatusFilter("verified")}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                statusFilter === "verified"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45 hover:text-foreground"
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                statusFilter === "rejected"
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45 hover:text-foreground"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-premium-beige/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Booking</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Nominal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <CreditCard size={48} className="mx-auto text-border-line" />
                    <p className="mt-4 text-sm text-foreground-secondary">Belum ada pembayaran</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-premium-beige/5">
                    <td className="px-4 py-3">
                      <span className="text-sm">{formatShortDate(payment.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-semibold">{payment.customerName}</span>
                        {payment.senderName && (
                          <p className="text-xs text-foreground-secondary">via {payment.senderName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{payment.bookingOrderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={payment.type} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {payment.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerifyNotes("");
                                setRejectReason("");
                              }}
                              className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                              title="Verifikasi"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowRejectModal(true);
                              }}
                              className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                              title="Tolak"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setVerifyNotes("");
                          }}
                          className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail/Verify Modal */}
      {selectedPayment && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-border-line bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Detail Pembayaran</p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                    {selectedPayment.bookingOrderNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Payment Info Cards */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border-line bg-background-soft p-4">
                  <p className={labelClass}>Customer</p>
                  <p className="text-sm font-semibold">{selectedPayment.customerName}</p>
                  {selectedPayment.senderName && (
                    <p className="text-xs text-foreground-secondary">via {selectedPayment.senderName}</p>
                  )}
                </div>
                <div className="rounded-xl border border-border-line bg-background-soft p-4">
                  <p className={labelClass}>Tipe Pembayaran</p>
                  <TypeBadge type={selectedPayment.type} />
                  <p className="mt-2 text-xs text-foreground-secondary capitalize">{selectedPayment.method}</p>
                </div>
                <div className="rounded-xl border border-border-line bg-background-soft p-4">
                  <p className={labelClass}>Nominal</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div className="rounded-xl border border-border-line bg-background-soft p-4">
                  <p className={labelClass}>Status</p>
                  <StatusBadge status={selectedPayment.status} />
                  {selectedPayment.verifiedAt && (
                    <p className="mt-2 text-xs text-foreground-secondary">
                      Diverifikasi: {formatShortDate(selectedPayment.verifiedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              {(() => {
                const booking = getBookingForPayment(selectedPayment);
                return booking ? (
                  <div className="mb-6 rounded-xl border border-premium-beige/30 bg-premium-beige/5 p-4">
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      Detail Booking
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-premium-beige" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Paket</p>
                          <p className="text-sm font-medium">{booking.packageName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-premium-beige" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Tanggal</p>
                          <p className="text-sm font-medium">{formatShortDate(booking.eventDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin size={14} className="text-premium-beige" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Lokasi</p>
                          <p className="text-sm font-medium">{booking.eventLocation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Payment Proof */}
              {selectedPayment.proofImage && (
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                    Bukti Transfer
                  </h4>
                  <div className="rounded-xl border border-border-line p-3">
                    {selectedPayment.proofImage.startsWith("data:") ? (
                      <img
                        src={selectedPayment.proofImage}
                        alt="Bukti transfer"
                        className="mx-auto max-h-80 rounded-lg object-contain"
                      />
                    ) : (
                      <img
                        src={selectedPayment.proofImage}
                        alt="Bukti transfer"
                        className="mx-auto max-h-80 rounded-lg object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                    Catatan
                  </h4>
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <p className="text-sm">{selectedPayment.notes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={labelClass}>Tanggal Upload</p>
                  <p className="text-sm">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                {selectedPayment.verifiedAt && (
                  <div>
                    <p className={labelClass}>Tanggal Verifikasi</p>
                    <p className="text-sm">{formatDate(selectedPayment.verifiedAt)}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Payments */}
              {selectedPayment.status === "pending" && (
                <div className="border-t border-border-line pt-6">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                    Aksi Verifikasi
                  </h4>
                  <div className="mb-4">
                    <label className={labelClass}>Catatan (Opsional)</label>
                    <textarea
                      value={verifyNotes}
                      onChange={(e) => setVerifyNotes(e.target.value)}
                      className={inputClassName}
                      rows={2}
                      placeholder="Tambahkan catatan verifikasi..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <Check size={18} />
                      {isApproving ? "Memproses..." : "Terima Pembayaran"}
                    </button>
                    <button
                      onClick={openRejectModal}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <X size={18} />
                      Tolak
                    </button>
                  </div>
                </div>
              )}

              {/* Already Processed */}
              {selectedPayment.status !== "pending" && (
                <div className="border-t border-border-line pt-6">
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    {selectedPayment.status === "verified" ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Pembayaran telah diverifikasi oleh {selectedPayment.verifiedBy || "admin"}</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-red-500" />
                        <span>Pembayaran ditolak: {selectedPayment.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  Tolak Pembayaran
                </h3>
                <p className="text-xs text-foreground-secondary">
                  {selectedPayment.bookingOrderNumber}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                <strong>Nominal:</strong> {formatCurrency(selectedPayment.amount)}
              </p>
              <p className="text-sm text-red-700">
                <strong>Customer:</strong> {selectedPayment.customerName}
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className={inputClassName}
                rows={3}
                placeholder="Jelaskan alasan penolakan pembayaran..."
                required
              />
              <p className="mt-1.5 text-xs text-foreground-secondary">
                Alasan ini akan ditampilkan kepada customer di Client Portal.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border-line bg-white px-4 py-3 text-sm font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isApproving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                <X size={16} />
                {isApproving ? "Memproses..." : "Tolak Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Tab: Rekening Pembayaran */}
      {activeTab === "accounts" && (
        <>
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground-secondary">
                {paymentAccounts.length} rekening
              </span>
            </div>
            <button
              onClick={() => {
                setEditingAccount(null);
                setAccountForm({
                  bankName: "",
                  accountNumber: "",
                  accountHolderName: "",
                  branch: "",
                  paymentType: "all",
                  isDefault: false,
                  isActive: true,
                  sortOrder: paymentAccounts.length + 1,
                  notes: "",
                });
                setShowAccountForm(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-dark-premium px-4 text-sm text-white transition hover:bg-dark-premium/90"
            >
              <Plus size={16} />
              Tambah Rekening
            </button>
          </div>

          {/* Accounts Grid */}
          {paymentAccounts.length === 0 ? (
            <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-12 text-center shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
              <Building2 size={48} className="mx-auto text-border-line" />
              <h3 className="mt-4 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                Belum ada rekening pembayaran
              </h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                Tambahkan rekening untuk terima pembayaran DP dan pelunasan.
              </p>
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setAccountForm({
                    bankName: "",
                    accountNumber: "",
                    accountHolderName: "",
                    branch: "",
                    paymentType: "all",
                    isDefault: false,
                    isActive: true,
                    sortOrder: 1,
                    notes: "",
                  });
                  setShowAccountForm(true);
                }}
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90"
              >
                <Plus size={16} />
                Tambah Rekening Pertama
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paymentAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`rounded-2xl border bg-white p-5 transition ${
                    account.isActive
                      ? "border-border-line shadow-sm"
                      : "border-border-line bg-background-soft opacity-60"
                  }`}
                >
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${account.isActive ? "bg-premium-beige/10" : "bg-border-line"}`}>
                        <Building2 size={20} className={account.isActive ? "text-premium-beige" : "text-foreground-secondary"} />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                          {account.bankName}
                        </h3>
                        <p className="text-xs text-foreground-secondary">
                          {account.paymentType === "all" ? "Semua tipe" : account.paymentType === "dp" ? "Hanya DP" : "Hanya Pelunasan"}
                        </p>
                      </div>
                    </div>
                    {account.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-premium-beige/10 px-2 py-0.5 text-[10px] font-semibold text-premium-beige">
                        <Star size={10} /> Default
                      </span>
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="mb-3 rounded-lg bg-background-soft p-3">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Nomor Rekening</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-semibold">{account.accountNumber}</p>
                      <button
                        onClick={() => copyAccountNumber(account.accountNumber)}
                        className="rounded p-1.5 text-foreground-secondary transition hover:bg-white hover:text-premium-beige"
                        title="Salin"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Account Holder */}
                  <div className="mb-4">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Atas Nama</p>
                    <p className="font-medium">{account.accountHolderName}</p>
                    {account.branch && (
                      <p className="mt-1 text-xs text-foreground-secondary">Cabang: {account.branch}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-border-line pt-4">
                    <button
                      onClick={() => openEditAccount(account)}
                      className="flex-1 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(account.id, account.isActive)}
                      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs transition ${
                        account.isActive
                          ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={account.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {account.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {account.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                    {!account.isDefault && (
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                        title="Jadikan Default"
                      >
                        <StarOff size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs text-red-500 transition hover:bg-red-100"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Account Form Modal */}
          {showAccountForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
                <div className="sticky top-0 z-10 border-b border-border-line bg-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Rekening Pembayaran</p>
                      <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                        {editingAccount ? "Edit Rekening" : "Tambah Rekening"}
                      </h3>
                    </div>
                    <button
                      onClick={closeAccountForm}
                      className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-4">
                    <div>
                      <label className={labelClass}>Nama Bank *</label>
                      <select
                        value={accountForm.bankName}
                        onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                        className={inputClassName}
                        required
                      >
                        <option value="">Pilih Bank</option>
                        {bankOptions.map((bank) => (
                          <option key={bank.value} value={bank.value}>{bank.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Nomor Rekening *</label>
                      <input
                        type="text"
                        value={accountForm.accountNumber}
                        onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                        placeholder="Contoh: 1234567890"
                        className={inputClassName}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Atas Nama *</label>
                      <input
                        type="text"
                        value={accountForm.accountHolderName}
                        onChange={(e) => setAccountForm({ ...accountForm, accountHolderName: e.target.value })}
                        placeholder="Nama sesuai di buku tabungan"
                        className={inputClassName}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Cabang (Opsional)</label>
                      <input
                        type="text"
                        value={accountForm.branch}
                        onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })}
                        placeholder="Contoh: Kantor Cabang Pacitan"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Tipe Pembayaran</label>
                      <select
                        value={accountForm.paymentType}
                        onChange={(e) => setAccountForm({ ...accountForm, paymentType: e.target.value as PaymentType })}
                        className={inputClassName}
                      >
                        {paymentTypeOptions.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 rounded-lg border border-border-line bg-background-soft p-3">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={accountForm.isDefault}
                          onChange={(e) => setAccountForm({ ...accountForm, isDefault: e.target.checked })}
                          className="accent-black"
                        />
                        <label htmlFor="isDefault" className="text-sm">Jadikan Default</label>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-border-line bg-background-soft p-3">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={accountForm.isActive}
                          onChange={(e) => setAccountForm({ ...accountForm, isActive: e.target.checked })}
                          className="accent-black"
                        />
                        <label htmlFor="isActive" className="text-sm">Aktif</label>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Catatan (Opsional)</label>
                      <textarea
                        value={accountForm.notes}
                        onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                        placeholder="Catatan tambahan jika ada"
                        rows={2}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={closeAccountForm}
                      className="flex-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-border-line bg-white px-4 text-sm font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveAccount}
                      disabled={!accountForm.bankName || !accountForm.accountNumber || !accountForm.accountHolderName}
                      className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-dark-premium px-4 text-sm font-medium text-white transition hover:bg-dark-premium/90 disabled:opacity-50"
                    >
                      <Check size={16} />
                      {editingAccount ? "Simpan Perubahan" : "Tambah Rekening"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}