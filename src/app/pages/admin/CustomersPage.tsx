import { useState, useMemo } from "react";
import {
  Search, Plus, Eye, Edit2, Trash2, Phone, Mail, MapPin,
  FileText, X, ChevronDown, ChevronUp, MessageSquare
} from "lucide-react";
import { useAdmin, Customer } from "../../contexts/AdminContext";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

export default function CustomersPage() {
  const { customers, bookings, addCustomer, updateCustomer, deleteCustomer } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const getCustomerBookings = (customerId: string) => {
    return bookings.filter((b) => b.customerId === customerId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
      setEditingCustomer(null);
    } else {
      addCustomer(formData);
      setShowAddModal(false);
    }
    setFormData({ name: "", email: "", phone: "", address: "", notes: "" });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus customer ini?")) {
      deleteCustomer(id);
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Customer Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Customers</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola data pelanggan dan lihat riwayat booking mereka.
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true);
              setEditingCustomer(null);
              setFormData({ name: "", email: "", phone: "", address: "", notes: "" });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
          >
            <Plus size={14} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <input
            type="text"
            placeholder="Cari nama, email, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClassName} pl-10`}
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border-line bg-white p-12 text-center">
            <Users size={48} className="mx-auto text-border-line" />
            <p className="mt-4 text-sm text-foreground-secondary">Belum ada customer yang cocok</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const customerBookings = getCustomerBookings(customer.id);
            return (
              <div
                key={customer.id}
                className="rounded-2xl border border-border-line bg-white p-5 shadow-[0_10px_26px_rgba(38,28,16,0.035)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-premium-beige/10 text-premium-beige">
                      <span className="text-sm font-bold">{customer.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-foreground-secondary">
                        Joined {formatDate(customer.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <Phone size={14} />
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <Mail size={14} />
                      {customer.email}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <MapPin size={14} />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border-line pt-4">
                  <span className="rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-semibold text-premium-beige">
                    {customerBookings.length} Booking{customerBookings.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Customer Detail</p>
                <h3 className="mt-1 text-xl font-semibold">{selectedCustomer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground-secondary">Phone</p>
                  <p className="mt-1 text-sm font-semibold">{selectedCustomer.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Email</p>
                  <p className="mt-1 text-sm font-semibold">{selectedCustomer.email || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Address</p>
                <p className="mt-1 text-sm">{selectedCustomer.address || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Notes</p>
                <p className="mt-1 text-sm">{selectedCustomer.notes || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Booking History</p>
                <div className="mt-2 space-y-2">
                  {getCustomerBookings(selectedCustomer.id).length === 0 ? (
                    <p className="text-sm text-foreground-secondary">Belum ada booking</p>
                  ) : (
                    getCustomerBookings(selectedCustomer.id).map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-border-line p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{booking.orderNumber}</span>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                            booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-foreground-secondary">{booking.packageName}</p>
                        <p className="mt-1 text-xs text-foreground-secondary">{new Date(booking.eventDate).toLocaleDateString("id-ID")}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className={inputClassName}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClassName}
                  rows={3}
                  placeholder="Alamat lengkap"
                />
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
                  }}
                  className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
                >
                  {editingCustomer ? "Update" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}