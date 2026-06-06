import { useState, useMemo } from "react";
import {
  Search, Filter, Plus, Eye, Edit2, Trash2, ChevronDown,
  ChevronUp, Calendar, MapPin, User, Phone, Mail, X, Check,
  Download, MoreHorizontal, FileText, Clock
} from "lucide-react";
import { useAdmin, Booking, BookingStatus } from "../../contexts/AdminContext";

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

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

export default function BookingsPage() {
  const { bookings, updateBooking, deleteBooking } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerPhone.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesDate = !dateFilter || booking.eventDate.includes(dateFilter);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchQuery, statusFilter, dateFilter]);

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    updateBooking(bookingId, { status: newStatus });
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus booking ini?")) {
      deleteBooking(id);
      setSelectedBooking(null);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Booking Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Bookings</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola semua booking, update status, dan lihat detail pelanggan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
            >
              <Plus size={14} />
              Add Booking
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
              <Download size={14} />
              Export
            </button>
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Package</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Event Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText size={48} className="mx-auto text-border-line" />
                    <p className="mt-4 text-sm text-foreground-secondary">Belum ada booking yang cocok</p>
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
                          <p className="truncate text-xs text-foreground-secondary">{booking.customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{booking.packageName}</span>
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
                        <StatusBadge status={booking.status} />
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
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === booking.id && (
                      <tr>
                        <td colSpan={7} className="bg-premium-beige/5 px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs text-foreground-secondary">Location</p>
                              <p className="mt-1 text-sm font-medium">{booking.eventLocation}</p>
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
                          {booking.notes && (
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

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Booking Detail</p>
                <h3 className="mt-1 text-xl font-semibold">{selectedBooking.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground-secondary">Customer</p>
                  <p className="mt-1 text-sm font-semibold">{selectedBooking.customerName}</p>
                  <p className="text-xs text-foreground-secondary">{selectedBooking.customerEmail}</p>
                  <p className="text-xs text-foreground-secondary">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Package</p>
                  <p className="mt-1 text-sm font-semibold">{selectedBooking.packageName}</p>
                  <p className="text-xs text-foreground-secondary">{selectedBooking.serviceType}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground-secondary">Event Date</p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(selectedBooking.eventDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Event Location</p>
                  <p className="mt-1 text-sm font-semibold">{selectedBooking.eventLocation}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-foreground-secondary">Total Amount</p>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Paid</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(selectedBooking.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Remaining</p>
                  <p className="mt-1 text-lg font-bold text-amber-600">{formatCurrency(selectedBooking.remainingAmount)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["pending", "confirmed", "in_progress", "completed", "cancelled"] as BookingStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(selectedBooking.id, status);
                        setSelectedBooking({ ...selectedBooking, status });
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        selectedBooking.status === status
                          ? statusConfig[status].bg + " " + statusConfig[status].text
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              </div>
              {selectedBooking.notes && (
                <div>
                  <p className="text-xs text-foreground-secondary">Notes</p>
                  <p className="mt-1 text-sm">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedBooking.id);
                }}
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}