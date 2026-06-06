import { FormEvent, useState, useMemo } from "react";
import {
  Search, Plus, Eye, Archive, ChevronDown,
  ChevronUp, Calendar, X,
  Download, FileText, CreditCard, Package, Camera, Users,
  MessageSquare, Edit2, Trash2, ExternalLink, CheckCircle2,
  Clock, DollarSign, User, MapPin, Package2, CalendarDays,
  FileCheck, Activity as ActivityIcon, ArrowRight
} from "lucide-react";
import { useAdmin, Booking, BookingStatus, Payment } from "../../contexts/AdminContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  canViewBooking,
  canCreateBooking,
  canEditBooking,
  canDeleteBooking,
  canUpdateBookingStatus,
  canArchiveBooking,
  canExportBookings,
} from "../../utils/permissions";

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
  });
}

const statusConfig: Record<BookingStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  confirmed: { label: "Confirmed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  in_progress: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  completed: { label: "Completed", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

type PaymentStatusFilter = "all" | "unpaid" | "dp_paid" | "partial" | "paid";
type PaymentBadgeStatus = Exclude<PaymentStatusFilter, "all">;
type ProductionBadgeStatus = "not_started" | "queued" | "in_progress" | "completed" | "cancelled";

const paymentStatusConfig: Record<PaymentBadgeStatus, { label: string; bg: string; text: string }> = {
  unpaid: { label: "Unpaid", bg: "bg-red-50", text: "text-red-700" },
  dp_paid: { label: "DP Paid", bg: "bg-amber-50", text: "text-amber-700" },
  partial: { label: "Partial", bg: "bg-blue-50", text: "text-blue-700" },
  paid: { label: "Paid", bg: "bg-emerald-50", text: "text-emerald-700" },
};

const productionStatusConfig: Record<ProductionBadgeStatus, { label: string; bg: string; text: string }> = {
  not_started: { label: "Not Started", bg: "bg-gray-50", text: "text-gray-600" },
  queued: { label: "Queued", bg: "bg-amber-50", text: "text-amber-700" },
  in_progress: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700" },
  completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700" },
};

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

type AddBookingForm = {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  packageName: string;
  eventDate: string;
  eventLocation: string;
  totalAmount: string;
  dpAmount: string;
  notes: string;
};

const initialAddBookingForm: AddBookingForm = {
  customerId: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  packageName: "",
  eventDate: "",
  eventLocation: "",
  totalAmount: "",
  dpAmount: "500000",
  notes: "",
};

function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/[^\d]/g, "");
  return normalized ? Number(normalized) : 0;
}

export default function BookingsPage() {
  const {
    bookings,
    customers,
    addBooking,
    updateBooking,
    archiveBooking,
    addCustomer,
    checkDuplicateCustomer,
    refreshBookings,
  } = useAdmin();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "payment" | "production" | "activity">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddBookingForm>(initialAddBookingForm);
  const [addFormError, setAddFormError] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Permission checks
  const userRole = user?.role || "staff";
  const isFinance = userRole === "finance";
  const canView = canViewBooking(userRole);
  const canCreate = canCreateBooking(userRole);
  const canEdit = canEditBooking(userRole);
  const canDelete = canDeleteBooking(userRole);
  const canUpdateStatus = canEdit && canUpdateBookingStatus(userRole);
  const canArchive = canDelete && canArchiveBooking(userRole);
  const canExport = canExportBookings(userRole);

  const getPaymentStatus = (booking: Booking): PaymentBadgeStatus => {
    if (booking.remainingAmount <= 0 || booking.paidAmount >= booking.totalAmount) return "paid";
    if (booking.paidAmount <= 0) return "unpaid";
    if (booking.paidAmount >= booking.dpAmount) return "dp_paid";
    return "partial";
  };

  const getProductionStatus = (booking: Booking): ProductionBadgeStatus => {
    if (booking.status === "cancelled") return "cancelled";
    if (booking.status === "completed") return "completed";
    if (booking.status === "in_progress") return "in_progress";
    if (booking.status === "confirmed") return "queued";
    return "not_started";
  };

  const packageOptions = useMemo(() => {
    return Array.from(new Set(bookings.map((booking) => booking.packageName).filter(Boolean))).sort();
  }, [bookings]);

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEnd = new Date(today);
    upcomingEnd.setDate(upcomingEnd.getDate() + 30);

    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
      needPayment: bookings.filter((booking) => booking.status !== "cancelled" && getPaymentStatus(booking) !== "paid").length,
      upcoming: bookings.filter((booking) => {
        if (booking.status === "cancelled") return false;
        const eventDate = new Date(booking.eventDate);
        return eventDate >= today && eventDate <= upcomingEnd;
      }).length,
    };
  }, [bookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.customerName.toLowerCase().includes(query) ||
        booking.orderNumber.toLowerCase().includes(query) ||
        (!isFinance && booking.customerPhone.includes(searchQuery)) ||
        (!isFinance && booking.customerEmail.toLowerCase().includes(query)) ||
        booking.packageName.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesDate = !dateFilter || booking.eventDate.includes(dateFilter);
      const matchesPackage = packageFilter === "all" || booking.packageName === packageFilter;
      const matchesPayment = paymentFilter === "all" || getPaymentStatus(booking) === paymentFilter;
      return matchesSearch && matchesStatus && matchesDate && matchesPackage && matchesPayment;
    });
  }, [bookings, searchQuery, statusFilter, dateFilter, packageFilter, paymentFilter, isFinance]);

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    if (!canUpdateStatus) return;
    if (newStatus === "cancelled") {
      archiveBooking(bookingId);
      return;
    }
    updateBooking(bookingId, { status: newStatus });
  };

  const handleArchive = (id: string) => {
    if (!canArchive) return;
    if (confirm("Booking akan diarsipkan, bukan dihapus permanen.")) {
      archiveBooking(id);
      setSelectedBooking(null);
    }
  };

  const resetAddBookingForm = () => {
    setAddForm(initialAddBookingForm);
    setAddFormError("");
  };

  const handleCloseAddModal = () => {
    if (isSubmittingBooking) return;
    setShowAddModal(false);
    resetAddBookingForm();
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((item) => item.id === customerId);
    setAddForm((prev) => ({
      ...prev,
      customerId,
      customerName: customer?.name || prev.customerName,
      customerPhone: customer?.phone || prev.customerPhone,
      customerEmail: customer?.email || prev.customerEmail,
    }));
  };

  const handleAddBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;

    const customerName = addForm.customerName.trim();
    const customerPhone = addForm.customerPhone.trim();
    const customerEmail = addForm.customerEmail.trim();
    const packageName = addForm.packageName.trim();
    const eventDate = addForm.eventDate.trim();
    const eventLocation = addForm.eventLocation.trim();
    const totalAmount = parseCurrencyInput(addForm.totalAmount);
    const dpAmount = parseCurrencyInput(addForm.dpAmount);

    if (!customerName) {
      setAddFormError("Customer name wajib diisi.");
      return;
    }
    if (!customerPhone) {
      setAddFormError("Customer phone wajib diisi.");
      return;
    }
    if (!packageName) {
      setAddFormError("Package name wajib diisi.");
      return;
    }
    if (!eventDate) {
      setAddFormError("Event date wajib diisi.");
      return;
    }
    if (totalAmount <= 0) {
      setAddFormError("Total amount harus lebih besar dari 0.");
      return;
    }
    if (dpAmount > totalAmount) {
      setAddFormError("DP amount tidak boleh lebih besar dari total amount.");
      return;
    }

    setIsSubmittingBooking(true);
    setAddFormError("");

    try {
      let customerId = addForm.customerId;
      const selectedCustomer = customers.find((item) => item.id === customerId);

      if (!selectedCustomer) {
        const duplicate = await checkDuplicateCustomer(customerPhone, customerEmail || undefined);
        if (duplicate) {
          customerId = duplicate.id;
        } else {
          const result = await addCustomer({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: eventLocation,
            instagram: "",
            notes: addForm.notes.trim(),
            status: "booked",
            source: "booking",
            isActive: true,
          });

          if (!result.success && !result.duplicateId) {
            setAddFormError(result.error || "Gagal membuat customer.");
            setIsSubmittingBooking(false);
            return;
          }

          customerId = result.customerId || result.duplicateId || "";
        }
      }

      if (!customerId) {
        setAddFormError("Customer tidak valid.");
        setIsSubmittingBooking(false);
        return;
      }

      await addBooking({
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        packageId: "",
        packageName,
        packagePrice: totalAmount,
        addonIds: [],
        addonTotal: 0,
        eventDate,
        eventLocation,
        eventType: "manual",
        serviceType: "Manual Booking",
        totalAmount,
        dpAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: "pending",
        isActive: true,
        archivedAt: null,
        notes: addForm.notes.trim(),
      });

      await refreshBookings();
      setShowAddModal(false);
      resetAddBookingForm();
    } catch (err) {
      console.warn("[BookingsPage] Failed to add booking:", err);
      setAddFormError("Gagal membuat booking. Silakan coba lagi.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const StatusBadge = ({ status }: { status: BookingStatus }) => {
    const config = statusConfig[status];
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const PaymentBadge = ({ booking }: { booking: Booking }) => {
    const status = getPaymentStatus(booking);
    const config = paymentStatusConfig[status];
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const ProductionBadge = ({ booking }: { booking: Booking }) => {
    const status = getProductionStatus(booking);
    const config = productionStatusConfig[status];
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!canView) {
    return (
      <div className="rounded-2xl border border-border-line bg-white p-6 text-sm text-foreground-secondary">
        Anda tidak memiliki akses untuk melihat booking.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Booking Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Bookings</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola reservasi, pembayaran, dan status produksi pelanggan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
              style={{ display: canCreate ? "inline-flex" : "none" }}
            >
              <Plus size={14} />
              Add Booking
            </button>
            {canExport && (
              <button className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
                <Download size={14} />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Bookings", value: summary.total, icon: <FileText size={18} />, tone: "text-foreground" },
          { label: "Pending", value: summary.pending, icon: <Calendar size={18} />, tone: "text-amber-700" },
          { label: "Confirmed", value: summary.confirmed, icon: <Users size={18} />, tone: "text-emerald-700" },
          { label: "Need Payment", value: summary.needPayment, icon: <CreditCard size={18} />, tone: "text-blue-700" },
          { label: "Upcoming Events", value: summary.upcoming, icon: <Camera size={18} />, tone: "text-premium-beige" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-premium-beige/25 bg-white p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">{item.label}</p>
              <span className={`${item.tone}`}>{item.icon}</span>
            </div>
            <p className={`mt-3 text-2xl font-bold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_160px_180px_180px_180px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              placeholder={isFinance ? "Cari order, customer, package..." : "Cari order, customer, phone, package..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClassName} pl-10`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
            className={`${inputClassName} lg:w-40`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className={inputClassName}
          >
            <option value="all">All Packages</option>
            {packageOptions.map((packageName) => (
              <option key={packageName} value={packageName}>{packageName}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentStatusFilter)}
            className={inputClassName}
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="dp_paid">DP Paid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-premium-beige/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Package</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Event Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Production</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <FileText size={48} className="mx-auto text-border-line" />
                    <p className="mt-4 text-sm font-semibold text-foreground">Belum ada booking.</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-foreground-secondary">
                      Booking akan muncul dari form reservasi atau bisa ditambahkan manual oleh admin.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {canCreate && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
                        >
                          <Plus size={14} />
                          Add Booking
                        </button>
                      )}
                      <a
                        href="/admin/customers"
                        className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                      >
                        View Customers
                      </a>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <>
                    <tr key={booking.id} className="hover:bg-premium-beige/5">
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold">{booking.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{booking.customerName}</p>
                          <p className="truncate text-xs text-foreground-secondary">{booking.eventType}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[150px] text-xs text-foreground-secondary">
                          {isFinance ? (
                            <p className="italic">Disembunyikan untuk Finance</p>
                          ) : (
                            <>
                              <p>{booking.customerPhone || "-"}</p>
                              <p className="truncate">{booking.customerEmail || "-"}</p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[150px] items-center gap-2">
                          <Package size={14} className="text-foreground-secondary" />
                          <span className="text-sm">{booking.packageName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={14} className="text-foreground-secondary" />
                          {formatDate(booking.eventDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold">{formatCurrency(booking.totalAmount)}</span>
                        <p className="text-xs text-foreground-secondary">
                          Paid: {formatCurrency(booking.paidAmount)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge booking={booking} />
                        {booking.remainingAmount > 0 && (
                          <p className="mt-1 text-xs text-foreground-secondary">
                            Sisa {formatCurrency(booking.remainingAmount)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3">
                        <ProductionBadge booking={booking} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpandedRow(expandedRow === booking.id ? null : booking.id)}
                            className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                          >
                            {expandedRow === booking.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                          >
                            <Eye size={16} />
                          </button>
                          {canArchive && (
                            <button
                              onClick={() => handleArchive(booking.id)}
                              title="Cancel / Archive Booking"
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === booking.id && (
                      <tr>
                        <td colSpan={10} className="bg-premium-beige/5 px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs text-foreground-secondary">Location</p>
                              <p className="mt-1 text-sm font-medium">
                                {isFinance ? "Disembunyikan untuk Finance" : booking.eventLocation}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-foreground-secondary">Event Type</p>
                              <p className="mt-1 text-sm font-medium">{booking.eventType}</p>
                            </div>
                            <div>
                              <p className="text-xs text-foreground-secondary">Service Type</p>
                              <p className="mt-1 text-sm font-medium">{booking.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-xs text-foreground-secondary">DP Amount</p>
                              <p className="mt-1 text-sm font-medium">{formatCurrency(booking.dpAmount)}</p>
                            </div>
                          </div>
                          {!isFinance && booking.notes && (
                            <div className="mt-4">
                              <p className="text-xs text-foreground-secondary">Notes</p>
                              <p className="mt-1 text-sm">{booking.notes}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Booking Drawer */}
      {showAddModal && canCreate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-[0_18px_60px_rgba(40,28,16,0.18)]">
            <div className="flex items-start justify-between border-b border-border-line p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Add Booking</p>
                <h3 className="mt-1 text-xl font-semibold">Manual Booking</h3>
                <p className="mt-1 text-sm text-foreground-secondary">
                  Buat booking admin dan hubungkan ke customer.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBookingSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {addFormError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {addFormError}
                  </div>
                )}

                {customers.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      Existing Customer
                    </label>
                    <select
                      value={addForm.customerId}
                      onChange={(event) => handleCustomerSelect(event.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Input manual</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone || customer.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={addForm.customerName}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, customerName: event.target.value }))}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={addForm.customerPhone}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
                      className={inputClassName}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={addForm.customerEmail}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                    Package Name
                  </label>
                  <input
                    type="text"
                    value={addForm.packageName}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, packageName: event.target.value }))}
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={addForm.eventDate}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      Total Amount
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={addForm.totalAmount}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, totalAmount: event.target.value }))}
                      className={inputClassName}
                      placeholder="15000000"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      DP Amount
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={addForm.dpAmount}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, dpAmount: event.target.value }))}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                      Status
                    </label>
                    <div className="flex min-h-[46px] items-center rounded-lg border border-border-line bg-background-soft px-4 text-sm font-semibold text-amber-700">
                      Pending
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                    Event Location
                  </label>
                  <input
                    type="text"
                    value={addForm.eventLocation}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, eventLocation: event.target.value }))}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                    Notes
                  </label>
                  <textarea
                    value={addForm.notes}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, notes: event.target.value }))}
                    className={`${inputClassName} min-h-24 resize-y`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border-line p-5">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                  disabled={isSubmittingBooking}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-dark-premium px-5 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90 disabled:opacity-60"
                  disabled={isSubmittingBooking}
                >
                  {isSubmittingBooking ? "Saving..." : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSelectedBooking(null)}
          />

          {/* Drawer */}
          <div className="w-full max-w-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-border-line bg-white">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Booking Detail</p>
                  <h3 className="mt-1 text-lg font-semibold">{selectedBooking.orderNumber}</h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-line">
                {(["overview", "payment", "production", "activity"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 text-xs font-semibold capitalize transition ${
                      activeTab === tab
                        ? "border-b-2 border-premium-beige text-foreground"
                        : "text-foreground-secondary hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="h-[calc(100vh-140px)] overflow-y-auto p-4">
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <User size={16} className="text-premium-beige" />
                      <h4 className="text-sm font-semibold">Customer Info</h4>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-foreground-secondary">Name</p>
                        <p className="text-sm font-medium">{selectedBooking.customerName}</p>
                      </div>
                      {isFinance ? (
                        <p className="text-xs italic text-foreground-secondary">
                          Data kontak disembunyikan untuk peran Finance.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-foreground-secondary">Email</p>
                            <p className="text-sm">{selectedBooking.customerEmail}</p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground-secondary">Phone</p>
                            <p className="text-sm">{selectedBooking.customerPhone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Quick Actions */}
                    <div className="mt-4 flex gap-2">
                      {!isFinance && (
                        <a
                          href={`https://wa.me/${selectedBooking.customerPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600"
                        >
                          <MessageSquare size={14} />
                          WhatsApp
                        </a>
                      )}
                      {canEdit && (
                        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-line px-3 py-2 text-xs font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground">
                          <Edit2 size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Package Info */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Package2 size={16} className="text-premium-beige" />
                      <h4 className="text-sm font-semibold">Package</h4>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-foreground-secondary">Package Name</p>
                        <p className="text-sm font-medium">{selectedBooking.packageName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-secondary">Service Type</p>
                        <p className="text-sm">{selectedBooking.serviceType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays size={16} className="text-premium-beige" />
                      <h4 className="text-sm font-semibold">Event Details</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-foreground-secondary">Event Date</p>
                        <p className="text-sm font-medium">{formatDate(selectedBooking.eventDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-secondary">Event Type</p>
                        <p className="text-sm">{selectedBooking.eventType}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-foreground-secondary">Location</p>
                      <div className="mt-1 flex items-start gap-2">
                        <MapPin size={14} className="mt-0.5 text-foreground-secondary" />
                        <p className="text-sm">
                          {isFinance ? "Disembunyikan untuk Finance" : selectedBooking.eventLocation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-premium-beige" />
                        <h4 className="text-sm font-semibold">Status</h4>
                      </div>
                      {canUpdateStatus && (
                        <span className="text-xs text-foreground-secondary">(Editable)</span>
                      )}
                    </div>
                    {canUpdateStatus ? (
                      <div className="flex flex-wrap gap-2">
                        {(["pending", "confirmed", "in_progress", "completed", "cancelled"] as BookingStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(selectedBooking.id, status)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              selectedBooking.status === status
                                ? statusConfig[status].bg + " " + statusConfig[status].text
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {statusConfig[status].label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusConfig[selectedBooking.status].bg} ${statusConfig[selectedBooking.status].text}`}>
                          {statusConfig[selectedBooking.status].label}
                        </span>
                        <span className="text-xs text-foreground-secondary">Read-only</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {!isFinance && selectedBooking.notes && (
                    <div className="rounded-xl border border-border-line bg-background-soft p-4">
                      <h4 className="mb-2 text-sm font-semibold">Notes</h4>
                      <p className="text-sm text-foreground-secondary">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENT TAB */}
              {activeTab === "payment" && (
                <div className="space-y-6">
                  {/* Payment Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                      <DollarSign size={20} className="mx-auto text-gray-500" />
                      <p className="mt-2 text-lg font-bold text-foreground">{formatCurrency(selectedBooking.totalAmount)}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                      <DollarSign size={20} className="mx-auto text-emerald-600" />
                      <p className="mt-2 text-lg font-bold text-emerald-700">{formatCurrency(selectedBooking.paidAmount)}</p>
                      <p className="text-xs text-emerald-600">Paid</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                      <DollarSign size={20} className="mx-auto text-amber-600" />
                      <p className="mt-2 text-lg font-bold text-amber-700">{formatCurrency(selectedBooking.remainingAmount)}</p>
                      <p className="text-xs text-amber-600">Remaining</p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-premium-beige" />
                        <h4 className="text-sm font-semibold">Payment Status</h4>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusConfig[getPaymentStatus(selectedBooking)].bg} ${paymentStatusConfig[getPaymentStatus(selectedBooking)].text}`}>
                        {paymentStatusConfig[getPaymentStatus(selectedBooking)].label}
                      </span>
                    </div>
                    {selectedBooking.dpAmount > 0 && (
                      <div className="mt-3 flex items-center justify-between border-t border-border-line pt-3">
                        <span className="text-xs text-foreground-secondary">DP Amount</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedBooking.dpAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment List */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className="text-premium-beige" />
                        <h4 className="text-sm font-semibold">Payment History</h4>
                      </div>
                      <a
                        href="/admin/payments"
                        className="flex items-center gap-1 text-xs text-premium-beige hover:underline"
                      >
                        View All
                        <ArrowRight size={12} />
                      </a>
                    </div>
                    {/* Get payments for this booking */}
                    {(() => {
                      const bookingPayments = payments.filter(
                        (p) => p.bookingId === selectedBooking.id || p.bookingOrderNumber === selectedBooking.orderNumber
                      );
                      if (bookingPayments.length === 0) {
                        return <p className="text-sm text-foreground-secondary">No payment records found.</p>;
                      }
                      return (
                        <div className="space-y-2">
                          {bookingPayments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border-line bg-white p-3">
                              <div>
                                <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                                <p className="text-xs text-foreground-secondary">
                                  {payment.type === "dp" ? "DP" : "Pelunasan"} - {formatDate(payment.createdAt)}
                                </p>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                payment.status === "verified"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : payment.status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}>
                                {payment.status === "verified" ? "Verified" : payment.status === "pending" ? "Pending" : "Rejected"}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* PRODUCTION TAB */}
              {activeTab === "production" && (
                <div className="space-y-6">
                  {/* Production Status */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera size={16} className="text-premium-beige" />
                        <h4 className="text-sm font-semibold">Production Status</h4>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${productionStatusConfig[getProductionStatus(selectedBooking)].bg} ${productionStatusConfig[getProductionStatus(selectedBooking)].text}`}>
                        {productionStatusConfig[getProductionStatus(selectedBooking)].label}
                      </span>
                    </div>
                  </div>

                  {/* Production Records Link */}
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Users size={16} className="text-premium-beige" />
                      <h4 className="text-sm font-semibold">Production Team</h4>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Production records can be managed from the Production page.
                    </p>
                    <a
                      href="/admin/production"
                      className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-premium-beige/30 bg-premium-beige/5 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-premium-beige/10"
                    >
                      <ExternalLink size={14} />
                      Open Production Page
                    </a>
                  </div>

                  {/* Create Production (Admin Only) */}
                  {(userRole === "super_admin" || userRole === "admin") && selectedBooking.status !== "completed" && selectedBooking.status !== "cancelled" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2">
                        <Plus size={16} className="text-blue-600" />
                        <h4 className="text-sm font-semibold text-blue-700">Create Production Project</h4>
                      </div>
                      <p className="mt-2 text-xs text-blue-600">
                        Create a production project to track photography/videography progress.
                      </p>
                      <button className="mt-3 w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
                        Create Production Project
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY TAB */}
              {activeTab === "activity" && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ActivityIcon size={16} className="text-premium-beige" />
                      <h4 className="text-sm font-semibold">Activity Timeline</h4>
                    </div>

                    {/* Timeline */}
                    <div className="relative space-y-4 pl-6">
                      {/* Timeline line */}
                      <div className="absolute left-2 top-2 h-full w-0.5 bg-border-line" />

                      {/* Booking Created */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-premium-beige" />
                        <div>
                          <p className="text-sm font-medium">Booking Created</p>
                          <p className="text-xs text-foreground-secondary">{formatDate(selectedBooking.createdAt)}</p>
                        </div>
                      </div>

                      {/* Status Updates - simulate based on current status */}
                      {selectedBooking.status !== "pending" && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                          <div>
                            <p className="text-sm font-medium">Confirmed</p>
                            <p className="text-xs text-foreground-secondary">Status changed to Confirmed</p>
                          </div>
                        </div>
                      )}

                      {selectedBooking.status === "in_progress" && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-500" />
                          <div>
                            <p className="text-sm font-medium">Production Started</p>
                            <p className="text-xs text-foreground-secondary">Status changed to In Progress</p>
                          </div>
                        </div>
                      )}

                      {selectedBooking.status === "completed" && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Completed</p>
                            <p className="text-xs text-foreground-secondary">Booking marked as Completed</p>
                          </div>
                        </div>
                      )}

                      {selectedBooking.status === "cancelled" && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-red-500" />
                          <div>
                            <p className="text-sm font-medium">Cancelled</p>
                            <p className="text-xs text-foreground-secondary">Booking was cancelled</p>
                          </div>
                        </div>
                      )}

                      {/* Payment Verified - if paid */}
                      {selectedBooking.paidAmount > 0 && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                          <div>
                            <p className="text-sm font-medium">Payment Verified</p>
                            <p className="text-xs text-foreground-secondary">{formatCurrency(selectedBooking.paidAmount)} received</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-border-line bg-white p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 rounded-full border border-border-line px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                >
                  Close
                </button>
                {canArchive && selectedBooking.status !== "cancelled" && (
                  <button
                    onClick={() => handleArchive(selectedBooking.id)}
                    className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                  >
                    <Archive size={14} />
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
