import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Check,
  Phone,
  UserCheck,
  Archive,
  Trash2,
  Eye,
  Mail,
  Clock,
  Filter,
  ChevronDown,
} from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminDataTable, { type AdminDataTableColumn } from "../components/AdminDataTable";
import AdminStatusBadge from "../components/AdminStatusBadge";
import {
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
  convertInquiryToCustomer,
  type Inquiry,
  type InquiryStatus,
} from "../../../services/inquiryService";

const statusConfig: Record<InquiryStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  new: {
    label: "Baru",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: <MessageSquare size={14} />,
  },
  contacted: {
    label: "Dihubungi",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: <Phone size={14} />,
  },
  converted: {
    label: "Konversi",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: <UserCheck size={14} />,
  },
  archived: {
    label: "Arsip",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: <Archive size={14} />,
  },
};

const inputClass = "min-h-11 w-full border border-border-line bg-white px-3 text-sm outline-none transition focus:border-premium-beige";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary";

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Load inquiries
  const loadInquiries = useCallback(async () => {
    setLoading(true);
    const data = await getInquiries();
    setInquiries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.whatsapp?.includes(searchQuery) ||
      inquiry.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats
  const stats = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    contacted: inquiries.filter((i) => i.status === "contacted").length,
    converted: inquiries.filter((i) => i.status === "converted").length,
    archived: inquiries.filter((i) => i.status === "archived").length,
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: InquiryStatus) => {
    await updateInquiryStatus(id, status);
    await loadInquiries();
  };

  const handleConvertToCustomer = async (inquiry: Inquiry) => {
    setConvertingId(inquiry.id);
    const result = await convertInquiryToCustomer(inquiry.id);
    setConvertingId(null);

    if (!result.success) {
      alert(result.error || "Gagal convert inquiry menjadi customer.");
      return;
    }

    await loadInquiries();

    if (result.duplicate && result.customer) {
      const openCustomer = confirm(
        `Customer dengan kontak ini sudah ada: ${result.customer.name}.\n\nBuka halaman Customers?`
      );
      if (openCustomer) window.location.href = "/admin/customers";
      return;
    }

    alert("Inquiry berhasil dikonversi menjadi customer.");
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus inquiry ini?")) {
      await deleteInquiry(id);
      setSelectedInquiry(null);
      await loadInquiries();
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status Badge component
  const StatusBadge = ({ status }: { status: InquiryStatus }) => {
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.bg} ${config.text} ${config.bg.replace("50", "200")}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Table columns
  const columns: AdminDataTableColumn<Inquiry>[] = [
    {
      key: "name",
      header: "Nama",
      render: (inquiry) => (
        <div>
          <p className="font-medium">{inquiry.name}</p>
          {inquiry.email && (
            <p className="mt-0.5 text-xs text-foreground-secondary">{inquiry.email}</p>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Kontak",
      render: (inquiry) => (
        <div className="space-y-1">
          {inquiry.whatsapp && (
            <p className="text-sm">{inquiry.whatsapp}</p>
          )}
          {inquiry.serviceType && (
            <span className="inline-block rounded bg-premium-beige/10 px-2 py-0.5 text-[10px] font-medium text-premium-beige">
              {inquiry.serviceType}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "message",
      header: "Pesan",
      render: (inquiry) => (
        <p className="line-clamp-2 max-w-xs text-sm text-foreground-secondary">
          {inquiry.message || "-"}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (inquiry) => <StatusBadge status={inquiry.status} />,
    },
    {
      key: "created",
      header: "Tanggal",
      render: (inquiry) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
          <Clock size={12} />
          {formatDate(inquiry.createdAt)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (inquiry) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedInquiry(inquiry)}
            className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
          >
            <Eye size={13} /> Detail
          </button>
          {inquiry.status !== "converted" && (
            <button
              type="button"
              onClick={() => handleConvertToCustomer(inquiry)}
              disabled={convertingId === inquiry.id}
              className="inline-flex min-h-9 items-center gap-2 border border-emerald-200 bg-white px-3 text-xs text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
            >
              <UserCheck size={13} />
              {convertingId === inquiry.id ? "Converting..." : "Convert to Customer"}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(inquiry.id)}
            className="inline-flex min-h-9 items-center gap-2 border border-destructive/20 bg-white px-3 text-xs text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Website Content"
        title="Inquiries"
        description="Kelola inquiry dari form kontak. Inquiry baru akan muncul di sini dan bisa ditandai statusnya."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <MessageSquare className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-blue-600">Total</p>
              <p className="text-xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <MessageSquare className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-blue-600">Baru</p>
              <p className="text-xl font-bold text-blue-700">{stats.new}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Phone className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-amber-600">Dihubungi</p>
              <p className="text-xl font-bold text-amber-700">{stats.contacted}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <UserCheck className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-emerald-600">Konversi</p>
              <p className="text-xl font-bold text-emerald-700">{stats.converted}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Archive className="text-gray-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Arsip</p>
              <p className="text-xl font-bold text-gray-700">{stats.archived}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-foreground-secondary" />
          <span className="text-sm text-foreground-secondary">Filter:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-11 rounded-lg border border-border-line bg-white px-4 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="new">Baru</option>
          <option value="contacted">Dihubungi</option>
          <option value="converted">Konversi</option>
          <option value="archived">Arsip</option>
        </select>
        <input
          type="text"
          placeholder="Cari nama, email, WhatsApp..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-11 flex-1 rounded-lg border border-border-line bg-white px-4 text-sm lg:max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border-line bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-foreground-secondary">
            Memuat...
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            rows={filteredInquiries}
            emptyMessage="Belum ada inquiry"
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-border-line bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Detail Inquiry</p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                    {selectedInquiry.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <StatusBadge status={selectedInquiry.status} />
                  <span className="text-xs text-foreground-secondary">
                    {formatDate(selectedInquiry.createdAt)}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="mb-4 space-y-3 rounded-lg bg-background-soft p-4">
                  {selectedInquiry.email && (
                    <div className="flex items-start gap-3">
                      <Mail size={16} className="mt-0.5 text-foreground-secondary" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Email</p>
                        <p className="text-sm font-medium">{selectedInquiry.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedInquiry.whatsapp && (
                    <div className="flex items-start gap-3">
                      <MessageSquare size={16} className="mt-0.5 text-foreground-secondary" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">WhatsApp</p>
                        <p className="text-sm font-medium">{selectedInquiry.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  {selectedInquiry.serviceType && (
                    <div className="flex items-start gap-3">
                      <Check size={16} className="mt-0.5 text-foreground-secondary" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Service Type</p>
                        <p className="text-sm font-medium">{selectedInquiry.serviceType}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message */}
                {selectedInquiry.message && (
                  <div>
                    <p className={labelClass}>Pesan</p>
                    <div className="rounded-lg border border-border-line bg-white p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedInquiry.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="space-y-3">
                <p className={labelClass}>Ubah Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["new", "contacted", "converted", "archived"] as InquiryStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedInquiry.id, status)}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition ${
                        selectedInquiry.status === status
                          ? `${statusConfig[status].bg} ${statusConfig[status].text}`
                          : "border border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                      }`}
                    >
                      {statusConfig[status].icon}
                      {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedInquiry.status !== "converted" && (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Convert to Customer</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                    Buat customer lead dari inquiry ini dengan source Inquiry dan status Lead.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleConvertToCustomer(selectedInquiry)}
                    disabled={convertingId === selectedInquiry.id}
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <UserCheck size={16} />
                    {convertingId === selectedInquiry.id ? "Converting..." : "Convert to Customer"}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border-line px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="flex-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-border-line bg-white px-4 text-sm font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleDelete(selectedInquiry.id)}
                  className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-white px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
