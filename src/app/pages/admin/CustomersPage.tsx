import { useState, useMemo } from "react";
import {
  Search, Plus, Eye, Edit2, Phone, Mail, MapPin,
  X, MessageSquare, Users, Instagram, Archive, AlertCircle, CheckCircle2, XCircle,
  CalendarDays, CreditCard, Clock, ExternalLink, UserPlus
} from "lucide-react";
import { useAdmin, Customer, CustomerStatus, CustomerSource } from "../../contexts/AdminContext";
import { useAuth } from "../../contexts/AuthContext";
import { canViewCustomer, canCreateCustomer, canEditCustomer, canDeleteCustomer } from "../../utils/permissions";

const CUSTOMER_STATUSES: CustomerStatus[] = ["lead", "active", "booked", "completed", "inactive", "archived"];
const CUSTOMER_SOURCES: CustomerSource[] = ["booking", "inquiry", "manual", "portal"];

const STATUS_LABELS: Record<CustomerStatus, string> = {
  lead: "Lead",
  active: "Active",
  booked: "Booked",
  completed: "Completed",
  inactive: "Inactive",
  archived: "Archived",
};

const SOURCE_LABELS: Record<CustomerSource, string> = {
  booking: "Booking",
  inquiry: "Inquiry",
  manual: "Manual",
  portal: "Portal",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const inputClassName = "w-full rounded-lg border border-premium-beige/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";
type CustomerFilterStatus = "all" | CustomerStatus;
type CustomerFilterSource = "all" | CustomerSource;
type CustomerSort = "newest" | "oldest" | "name";
type CustomerDetailTab = "overview" | "bookings" | "payments" | "activity";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function getStatusBadgeClass(status: CustomerStatus): string {
  if (status === "active" || status === "booked") return "bg-emerald-100 text-emerald-700";
  if (status === "lead") return "bg-amber-100 text-amber-700";
  if (status === "completed") return "bg-blue-100 text-blue-700";
  if (status === "archived") return "bg-zinc-200 text-zinc-600";
  return "bg-gray-100 text-gray-600";
}

function getSourceBadgeClass(source: CustomerSource): string {
  if (source === "booking") return "bg-blue-50 text-blue-700";
  if (source === "inquiry") return "bg-amber-50 text-amber-700";
  if (source === "portal") return "bg-emerald-50 text-emerald-700";
  return "bg-gray-100 text-gray-600";
}

function getWhatsAppHref(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  const international = normalized.startsWith("0") ? `62${normalized.slice(1)}` : normalized;
  return `https://wa.me/${international}`;
}

export default function CustomersPage() {
  const { customers, bookings, payments, admins, customersLoading, customersError, addCustomer, updateCustomer, archiveCustomer, checkDuplicateCustomer } = useAdmin();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerFilterStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<CustomerFilterSource>("all");
  const [sortBy, setSortBy] = useState<CustomerSort>("newest");
  const [detailTab, setDetailTab] = useState<CustomerDetailTab>("overview");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission checks
  const userRole = user?.role || "staff";
  const isFinance = userRole === "finance";
  const canView = canViewCustomer(userRole);
  const canCreate = canCreateCustomer(userRole);
  const canEdit = canEditCustomer(userRole);
  const canDelete = canDeleteCustomer(userRole);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    instagram: "",
    notes: "",
    status: "lead" as CustomerStatus,
    source: "manual" as CustomerSource,
  });

  const getCustomerBookings = (customerId: string) => {
    return bookings.filter((b) => b.customerId === customerId);
  };

  const getCustomerRevenue = (customerId: string) => {
    return getCustomerBookings(customerId).reduce((total, booking) => {
      return total + (Number(booking.totalAmount) || Number(booking.paidAmount) || 0);
    }, 0);
  };

  const getCustomerPayments = (customer: Customer) => {
    const customerBookings = getCustomerBookings(customer.id);
    const bookingIds = new Set(customerBookings.map((booking) => booking.id));
    const orderNumbers = new Set(customerBookings.map((booking) => booking.orderNumber));
    return payments.filter((payment) =>
      bookingIds.has(payment.bookingId) ||
      orderNumbers.has(payment.bookingOrderNumber) ||
      payment.customerName === customer.name
    );
  };

  const getOutstandingPayment = (customerId: string) => {
    return getCustomerBookings(customerId).reduce((total, booking) => total + (Number(booking.remainingAmount) || 0), 0);
  };

  const getLastBooking = (customerId: string) => {
    return [...getCustomerBookings(customerId)].sort((a, b) => {
      return new Date(b.createdAt || b.eventDate).getTime() - new Date(a.createdAt || a.eventDate).getTime();
    })[0];
  };

  const isPortalLinked = (customer: Customer) => {
    return customer.source === "portal" || admins.some((admin) => admin.customerId === customer.id);
  };

  const openCustomerDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailTab("overview");
  };

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        (!isFinance && customer.email.toLowerCase().includes(query)) ||
        (!isFinance && customer.phone.includes(query));
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      const matchesSource = sourceFilter === "all" || customer.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }, [customers, searchQuery, sortBy, sourceFilter, statusFilter, isFinance]);

  const summary = useMemo(() => {
    const activeCustomers = customers.filter((customer) => customer.isActive !== false && customer.status !== "archived");
    const bookedOngoingIds = new Set(
      bookings
        .filter((booking) => ["pending", "confirmed", "in_progress"].includes(booking.status))
        .map((booking) => booking.customerId)
    );

    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      newLeads: customers.filter((customer) => customer.status === "lead").length,
      bookedOngoing: customers.filter((customer) => customer.status === "booked" || bookedOngoingIds.has(customer.id)).length,
      totalRevenue: bookings.reduce((total, booking) => total + (Number(booking.totalAmount) || Number(booking.paidAmount) || 0), 0),
    };
  }, [bookings, customers]);

  const handlePhoneBlur = async () => {
    if (formData.phone.length >= 8) {
      const duplicate = await checkDuplicateCustomer(formData.phone, formData.email || undefined);
      if (duplicate && duplicate.id !== editingCustomer?.id) {
        setDuplicateWarning(duplicate);
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingCustomer) {
      const success = await updateCustomer(editingCustomer.id, formData);
      if (!success) {
        alert("Gagal menyimpan perubahan customer.");
        setIsSubmitting(false);
        return;
      }
      setEditingCustomer(null);
    } else {
      const result = await addCustomer(formData);
      if (!result.success && result.error) {
        alert(result.error);
        setIsSubmitting(false);
        return;
      }
      setShowAddModal(false);
    }

    setFormData({
      name: "", email: "", phone: "", address: "", instagram: "", notes: "",
      status: "lead", source: "manual"
    });
    setDuplicateWarning(null);
    setIsSubmitting(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || "",
      instagram: customer.instagram || "",
      notes: customer.notes || "",
      status: customer.status,
      source: customer.source,
    });
    setShowAddModal(true);
  };

  const handleArchive = async (id: string) => {
    if (confirm("Yakin ingin mengarsipkan customer ini? Data akan tetap tersimpan tetapi tidak muncul di daftar.")) {
      const success = await archiveCustomer(id);
      if (!success) {
        alert("Gagal mengarsipkan customer.");
        return;
      }
      setSelectedCustomer(null);
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "", email: "", phone: "", address: "", instagram: "", notes: "",
      status: "lead", source: "manual"
    });
    setDuplicateWarning(null);
    setShowAddModal(true);
  };

  if (!canView) {
    return (
      <div className="rounded-2xl border border-border-line bg-white p-10 text-center">
        <Users size={42} className="mx-auto text-border-line" />
        <p className="mt-4 text-sm font-semibold text-foreground">Tidak ada akses Customers.</p>
        <p className="mt-2 text-sm text-foreground-secondary">Menu ini hanya tersedia untuk super admin, admin, dan finance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Customer Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Customers</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola data pelanggan, riwayat booking, dan akses client portal.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
            style={{ display: canCreate ? "inline-flex" : "none" }}
          >
            <Plus size={14} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Customers", value: summary.totalCustomers.toString() },
          { label: "Active Customers", value: summary.activeCustomers.toString() },
          { label: "New Leads", value: summary.newLeads.toString() },
          { label: "Booked Ongoing", value: summary.bookedOngoing.toString() },
          { label: "Total Revenue", value: formatCurrency(summary.totalRevenue) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-secondary">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_160px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              placeholder={isFinance ? "Cari nama customer..." : "Cari nama, email, atau telepon..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClassName} pl-10`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CustomerFilterStatus)}
            className={inputClassName}
          >
            <option value="all">All Status</option>
            {CUSTOMER_STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as CustomerFilterSource)}
            className={inputClassName}
          >
            <option value="all">All Sources</option>
            {CUSTOMER_SOURCES.map((source) => (
              <option key={source} value={source}>{SOURCE_LABELS[source]}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as CustomerSort)}
            className={inputClassName}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {customersError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {customersError}
        </div>
      )}

      {/* Loading State */}
      {customersLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-premium-beige border-t-transparent" />
          <span className="ml-3 text-sm text-foreground-secondary">Memuat data customer...</span>
        </div>
      )}

      {/* Customer Table */}
      {!customersLoading && (
      <div className="overflow-hidden rounded-2xl border border-border-line bg-white shadow-[0_10px_26px_rgba(38,28,16,0.035)]">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-border-line" />
            <p className="mt-4 text-sm font-semibold text-foreground">Belum ada customer.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground-secondary">
              Customer akan muncul dari booking, inquiry, atau bisa ditambahkan secara manual oleh admin.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {canCreate && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
                >
                  <Plus size={14} />
                  Add Customer
                </button>
              )}
              <a
                href="/admin/content/inquiries"
                className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
              >
                View Inquiries
              </a>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="border-b border-border-line bg-premium-beige/5 text-xs uppercase tracking-[0.12em] text-foreground-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                {!isFinance && <th className="px-4 py-3 font-semibold">Contact</th>}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Bookings</th>
                  <th className="px-4 py-3 font-semibold">Revenue</th>
                  <th className="px-4 py-3 font-semibold">Portal</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-line">
                {filteredCustomers.map((customer) => {
                  const customerBookings = getCustomerBookings(customer.id);
                  const revenue = getCustomerRevenue(customer.id);
                  const portalLinked = isPortalLinked(customer);

                  return (
                    <tr key={customer.id} className="align-top transition hover:bg-premium-beige/5">
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-premium-beige/10 text-premium-beige">
                            <span className="text-sm font-bold">{customer.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{customer.name}</p>
                            <p className="mt-0.5 text-xs text-foreground-secondary">Joined {formatDate(customer.createdAt)}</p>
                            {customer.instagram && (
                              <p className="mt-0.5 text-xs text-foreground-secondary">@{customer.instagram}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {!isFinance && (
                        <td className="px-4 py-4">
                          <div className="space-y-1 text-foreground-secondary">
                            <p className="flex items-center gap-2">
                              <Phone size={14} />
                              {customer.phone || "-"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail size={14} />
                              <span className="max-w-[180px] truncate">{customer.email || "-"}</span>
                            </p>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadgeClass(customer.status)}`}>
                          {STATUS_LABELS[customer.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getSourceBadgeClass(customer.source)}`}>
                          {SOURCE_LABELS[customer.source]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-foreground">{customerBookings.length}</span>
                        <span className="ml-1 text-xs text-foreground-secondary">booking</span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">{formatCurrency(revenue)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          portalLinked ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {portalLinked ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {portalLinked ? "Linked" : "Not Linked"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openCustomerDrawer(customer)}
                            className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                            title="View Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(customer)}
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {customer.phone && !isFinance && (
                            <a
                              href={getWhatsAppHref(customer.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-emerald-50 hover:text-emerald-700"
                              title="WhatsApp"
                            >
                              <MessageSquare size={16} />
                            </a>
                          )}
                          {customer.email && !isFinance && (
                            <a
                              href={`mailto:${customer.email}`}
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-blue-50 hover:text-blue-700"
                              title="Email"
                            >
                              <Mail size={16} />
                            </a>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleArchive(customer.id)}
                              className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                              title="Archive"
                            >
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (() => {
        const customerBookings = getCustomerBookings(selectedCustomer.id);
        const customerPayments = getCustomerPayments(selectedCustomer);
        const totalRevenue = getCustomerRevenue(selectedCustomer.id);
        const outstandingPayment = getOutstandingPayment(selectedCustomer.id);
        const lastBooking = getLastBooking(selectedCustomer.id);
        const totalPaid = customerPayments
          .filter((payment) => payment.status === "verified")
          .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
        const portalLinked = isPortalLinked(selectedCustomer);
        const activities = [
          {
            id: "created",
            date: selectedCustomer.createdAt,
            title: "Customer created",
            description: `${selectedCustomer.name} ditambahkan sebagai customer.`,
          },
          ...(selectedCustomer.source === "inquiry"
            ? [{
                id: "inquiry",
                date: selectedCustomer.createdAt,
                title: "Inquiry converted",
                description: "Customer berasal dari inquiry.",
              }]
            : []),
          ...customerBookings.map((booking) => ({
            id: `booking-${booking.id}`,
            date: booking.createdAt || booking.eventDate,
            title: "Booking created",
            description: `${booking.orderNumber} - ${booking.packageName}`,
          })),
          ...customerPayments
            .filter((payment) => payment.status === "verified")
            .map((payment) => ({
              id: `payment-${payment.id}`,
              date: payment.verifiedAt || payment.createdAt,
              title: "Payment verified",
              description: `${payment.type === "dp" ? "DP" : "Final payment"} ${formatCurrency(payment.amount)} untuk ${payment.bookingOrderNumber}`,
            })),
          ...customerBookings
            .filter((booking) => booking.status === "completed")
            .map((booking) => ({
              id: `production-${booking.id}`,
              date: booking.updatedAt || booking.eventDate,
              title: "Production completed",
              description: `${booking.orderNumber} selesai.`,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const tabs: { id: CustomerDetailTab; label: string }[] = [
          { id: "overview", label: "Overview" },
          { id: "bookings", label: "Bookings" },
          { id: "payments", label: "Payments" },
          { id: "activity", label: "Activity" },
        ];

        return (
          <div className="fixed inset-0 z-50 flex bg-black/40">
            <button
              type="button"
              aria-label="Close customer detail"
              className="hidden flex-1 cursor-default md:block"
              onClick={() => setSelectedCustomer(null)}
            />
            <aside className="ml-auto flex h-full w-full max-w-[720px] flex-col bg-white shadow-[0_18px_70px_rgba(20,14,8,0.24)] md:w-[600px]">
              <div className="border-b border-border-line p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-premium-beige">Customer Detail</p>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadgeClass(selectedCustomer.status)}`}>
                        {STATUS_LABELS[selectedCustomer.status]}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getSourceBadgeClass(selectedCustomer.source)}`}>
                        {SOURCE_LABELS[selectedCustomer.source]}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-2xl font-semibold">{selectedCustomer.name}</h3>
                    {!isFinance ? (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                        <span>{selectedCustomer.phone || "-"}</span>
                        <span>{selectedCustomer.email || "-"}</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs italic text-foreground-secondary">
                        Data kontak disembunyikan untuk peran Finance
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(selectedCustomer)}
                      className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-3 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  )}
                  {selectedCustomer.phone && !isFinance && (
                    <a
                      href={getWhatsAppHref(selectedCustomer.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-3 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-emerald-200 hover:text-emerald-700"
                    >
                      <MessageSquare size={14} />
                      WhatsApp
                    </a>
                  )}
                  {selectedCustomer.email && !isFinance && (
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-3 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-blue-200 hover:text-blue-700"
                    >
                      <Mail size={14} />
                      Email
                    </a>
                  )}
                </div>
              </div>

              <div className="border-b border-border-line px-5">
                <div className="flex gap-2 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
                        detailTab === tab.id
                          ? "border-premium-beige text-foreground"
                          : "border-transparent text-foreground-secondary hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {detailTab === "overview" && (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Total bookings", value: customerBookings.length.toString() },
                        { label: "Total revenue", value: formatCurrency(totalRevenue) },
                        { label: "Outstanding payment", value: formatCurrency(outstandingPayment) },
                        { label: "Last booking", value: lastBooking ? lastBooking.orderNumber : "-" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-border-line p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-foreground-secondary">{item.label}</p>
                          <p className="mt-2 text-lg font-semibold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {isFinance ? (
                      <div className="rounded-xl border border-border-line p-4">
                        <p className="text-sm font-semibold">Contact information</p>
                        <p className="mt-3 text-xs italic text-foreground-secondary">
                          Data pribadi disembunyikan untuk peran Finance
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border-line p-4">
                        <p className="text-sm font-semibold">Contact information</p>
                        <div className="mt-3 space-y-2 text-sm text-foreground-secondary">
                          <p className="flex items-center gap-2"><Phone size={14} /> {selectedCustomer.phone || "-"}</p>
                          <p className="flex items-center gap-2"><Mail size={14} /> {selectedCustomer.email || "-"}</p>
                          {selectedCustomer.instagram && (
                            <p className="flex items-center gap-2"><Instagram size={14} /> @{selectedCustomer.instagram}</p>
                          )}
                          {selectedCustomer.address && (
                            <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5" /> {selectedCustomer.address}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">Portal Account</p>
                          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            portalLinked ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {portalLinked ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {portalLinked ? "Linked" : "Not Linked"}
                          </span>
                        </div>
                        {!portalLinked && (
                          <button
                            type="button"
                            onClick={() => alert("Invite Account belum aktif. Pembuatan akun customer harus lewat Edge Function.")}
                            className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-3 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                          >
                            <UserPlus size={14} />
                            Invite Account
                          </button>
                        )}
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-foreground-secondary">
                        Relasi portal dibaca dari akun auth/admin_users yang memiliki customerId sama. Invite account masih placeholder dan tidak membuat password dari frontend.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border-line p-4">
                      <p className="text-sm font-semibold">Notes</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{selectedCustomer.notes || "Belum ada catatan."}</p>
                    </div>
                  </div>
                )}

                {detailTab === "bookings" && (
                  <div className="space-y-3">
                    {customerBookings.length === 0 ? (
                      <div className="rounded-xl border border-border-line p-8 text-center">
                        <CalendarDays size={34} className="mx-auto text-border-line" />
                        <p className="mt-3 text-sm font-semibold">Belum ada booking.</p>
                      </div>
                    ) : (
                      customerBookings.map((booking) => (
                        <div key={booking.id} className="rounded-xl border border-border-line p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{booking.orderNumber}</p>
                              <p className="mt-1 text-sm text-foreground-secondary">{booking.packageName}</p>
                              <p className="mt-1 text-xs text-foreground-secondary">{formatDate(booking.eventDate)}</p>
                            </div>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                              {booking.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-line pt-3">
                            <span className="text-xs text-foreground-secondary">
                              Payment: {booking.remainingAmount <= 0 ? "paid" : "outstanding"}
                            </span>
                            <a href="/admin/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-premium-beige">
                              View booking <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "payments" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border-line p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-foreground-secondary">Total paid</p>
                        <p className="mt-2 text-lg font-semibold">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="rounded-xl border border-border-line p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-foreground-secondary">Outstanding</p>
                        <p className="mt-2 text-lg font-semibold">{formatCurrency(outstandingPayment)}</p>
                      </div>
                    </div>
                    {customerPayments.length === 0 ? (
                      <div className="rounded-xl border border-border-line p-8 text-center">
                        <CreditCard size={34} className="mx-auto text-border-line" />
                        <p className="mt-3 text-sm font-semibold">Belum ada payment history.</p>
                      </div>
                    ) : (
                      customerPayments.map((payment) => (
                        <div key={payment.id} className="rounded-xl border border-border-line p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{payment.type === "dp" ? "DP" : "Final payment"}</p>
                              <p className="mt-1 text-xs text-foreground-secondary">{payment.bookingOrderNumber}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                              payment.status === "verified" ? "bg-emerald-100 text-emerald-700" : payment.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-border-line pt-3 text-sm">
                            <span className="text-foreground-secondary">{formatDate(payment.createdAt)}</span>
                            <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "activity" && (
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <div className="rounded-xl border border-border-line p-8 text-center">
                        <Clock size={34} className="mx-auto text-border-line" />
                        <p className="mt-3 text-sm font-semibold">Belum ada aktivitas.</p>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 rounded-xl border border-border-line p-4">
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-premium-beige/10 text-premium-beige">
                            <Clock size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{activity.title}</p>
                            <p className="mt-1 text-sm text-foreground-secondary">{activity.description}</p>
                            <p className="mt-1 text-xs text-foreground-secondary">{formatDate(activity.date)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border-line p-5">
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.phone && !isFinance && (
                    <a href={getWhatsAppHref(selectedCustomer.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">
                      <MessageSquare size={14} />
                      WhatsApp
                    </a>
                  )}
                  {selectedCustomer.email && !isFinance && (
                    <a href={`mailto:${selectedCustomer.email}`} className="inline-flex items-center gap-2 rounded-full border border-border-line px-4 py-2 text-xs font-semibold text-foreground-secondary">
                      <Mail size={14} />
                      Email
                    </a>
                  )}
                  {canCreate && (
                    <a href="/admin/bookings" className="inline-flex items-center gap-2 rounded-full border border-border-line px-4 py-2 text-xs font-semibold text-foreground-secondary">
                      <UserPlus size={14} />
                      Create Booking
                    </a>
                  )}
                  {canDelete && (
                    <button onClick={() => handleArchive(selectedCustomer.id)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700">
                      <Archive size={14} />
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        );
      })()}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  {editingCustomer ? "Edit Customer" : "New Customer"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
                  setDuplicateWarning(null);
                }}
                className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClassName}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClassName}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handlePhoneBlur}
                    className={inputClassName}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Customer sudah ada!</p>
                      <p className="text-xs text-amber-700 mt-1">
                        {duplicateWarning.name} - {duplicateWarning.phone}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Gunakan data yang sudah ada atau edit customer tersebut.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold">Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">@</span>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace("@", "") })}
                    className={`${inputClassName} pl-7`}
                    placeholder="username"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClassName}
                  rows={2}
                  placeholder="Alamat lengkap"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    className={inputClassName}
                    disabled={!!editingCustomer}
                  >
                    {CUSTOMER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as CustomerSource })}
                    className={inputClassName}
                    disabled={!!editingCustomer}
                  >
                    {CUSTOMER_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {SOURCE_LABELS[source]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={inputClassName}
                  rows={2}
                  placeholder="Catatan tambahan"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                    setDuplicateWarning(null);
                  }}
                  className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!duplicateWarning}
                  className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : (editingCustomer ? "Update" : "Add Customer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
