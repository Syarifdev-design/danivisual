import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  UserX,
  UserCheck,
  X,
  Phone,
  Mail,
  Eye,
  RefreshCw,
  ClipboardEdit,
  Loader2,
} from "lucide-react";
import { useEmployees, ROLE_LABELS, Employee, EmployeeRole } from "../../contexts/EmployeesContext";
import { useAuth, useEmployeeIdWarning } from "../../contexts/AuthContext";
import {
  canAccessStaffKpi,
  canManageKpi,
  canViewAllStaffData,
  canViewOwnKpi,
} from "../../utils/permissions";
import {
  calculateAllEmployeesKpi,
  calculateEmployeeKpi,
  getKpiBreakdown,
  getKpiReviews,
  KPI_LEVELS,
  type KpiBreakdown,
  type KpiReview,
  upsertKpiReview,
} from "../../../services/kpiService";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-secondary";
const actionButtonClass = "inline-flex items-center gap-1.5 rounded-lg border border-border-line bg-white px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";
const emptyBreakdown: KpiBreakdown = {
  attendanceSummary: { present: 0, late: 0, absent: 0, leave: 0 },
  taskSummary: { total: 0, completed: 0, overdue: 0, revision: 0 },
  qualitySummary: { averageQualityScore: 0 },
};

function toSafeBreakdown(value: KpiBreakdown | null | undefined): KpiBreakdown {
  return {
    attendanceSummary: {
      present: Number(value?.attendanceSummary?.present) || 0,
      late: Number(value?.attendanceSummary?.late) || 0,
      absent: Number(value?.attendanceSummary?.absent) || 0,
      leave: Number(value?.attendanceSummary?.leave) || 0,
    },
    taskSummary: {
      total: Number(value?.taskSummary?.total) || 0,
      completed: Number(value?.taskSummary?.completed) || 0,
      overdue: Number(value?.taskSummary?.overdue) || 0,
      revision: Number(value?.taskSummary?.revision) || 0,
    },
    qualitySummary: {
      averageQualityScore: Number(value?.qualitySummary?.averageQualityScore) || 0,
    },
  };
}

function getLinkedEmployeeForUser(employees: Employee[], user: ReturnType<typeof useAuth>["user"]): Employee | null {
  if (!user) return null;

  // Priority 1: Use employeeId from AuthContext (resolved during login from profiles.employee_id or employees table)
  if (user.employeeId) {
    const byEmployeeId = employees.find((e) => e.id === user.employeeId);
    if (byEmployeeId) return byEmployeeId;
  }

  // Priority 2: Match by user.id with employee.userId/user_id
  const userEmail = (user.email || "").toLowerCase();
  const byUserId = employees.find((employee) => {
    const linkedUserId = employee.userId || employee.user_id;
    return linkedUserId === user.id || employee.id === user.id;
  });
  if (byUserId) return byUserId;

  // Priority 3: Match by email (fallback)
  return employees.find((employee) =>
    Boolean(userEmail && (employee.email || "").toLowerCase() === userEmail)
  ) || null;
}

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  joinDate: string;
  notes: string;
}

function getInitialFormData(): EmployeeFormData {
  return {
    name: "",
    email: "",
    phone: "",
    role: "staff",
    joinDate: new Date().toISOString().split("T")[0],
    notes: "",
  };
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const { employees, addEmployee, updateEmployee, deactivateEmployee, reactivateEmployee } = useEmployees();
  const safeEmployees = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);

  const now = new Date();
  const canAccessKpi = user ? canAccessStaffKpi(user.role) : false;
  const canManageKpiAccess = user ? canManageKpi(user.role) : false;
  const canViewAllKpi = user ? canViewAllStaffData(user.role) : false;
  const canViewOwnOnlyKpi = user ? canViewOwnKpi(user.role) : false;

  const [activeTab, setActiveTab] = useState<"staff" | "kpi">("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(getInitialFormData());
  const [kpiMonth, setKpiMonth] = useState(now.getMonth() + 1);
  const [kpiYear, setKpiYear] = useState(now.getFullYear());
  const [kpiReviews, setKpiReviews] = useState<KpiReview[]>([]);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiActionLoading, setKpiActionLoading] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<KpiReview | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<KpiBreakdown>(emptyBreakdown);
  const [myKpiBreakdown, setMyKpiBreakdown] = useState<KpiBreakdown>(emptyBreakdown);
  const [myKpiBreakdownLoading, setMyKpiBreakdownLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteTarget, setNoteTarget] = useState<KpiReview | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const staffEmployee = useMemo(() => {
    return getLinkedEmployeeForUser(safeEmployees, user);
  }, [safeEmployees, user]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return safeEmployees.filter((emp) => {
      // Search
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (emp.name || "").toLowerCase().includes(query) ||
        (emp.email || "").toLowerCase().includes(query) ||
        (emp.phone || "").includes(searchQuery);
      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter !== "all" && emp.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === "active" && !emp.isActive) return false;
      if (statusFilter === "inactive" && emp.isActive) return false;

      return true;
    });
  }, [safeEmployees, searchQuery, roleFilter, statusFilter]);

  const activeCount = safeEmployees.filter((e) => e.isActive).length;
  const inactiveCount = safeEmployees.filter((e) => !e.isActive).length;

  const employeeById = useMemo(() => {
    return new Map(safeEmployees.map((employee) => [employee.id, employee]));
  }, [safeEmployees]);

  const visibleKpiReviews = useMemo(() => {
    if (!canViewOwnOnlyKpi) return kpiReviews;
    if (!staffEmployee) return [];
    return kpiReviews.filter((review) => review.employeeId === staffEmployee.id);
  }, [canViewOwnOnlyKpi, kpiReviews, staffEmployee]);

  const kpiStats = useMemo(() => {
    const total = visibleKpiReviews.length;
    const average = total > 0
      ? Math.round(visibleKpiReviews.reduce((sum, review) => sum + (Number(review.finalScore) || 0), 0) / total)
      : 0;

    return {
      average,
      excellent: visibleKpiReviews.filter((review) => review.level === "excellent").length,
      needsImprove: visibleKpiReviews.filter((review) => review.level === "needs_improve").length,
      total,
    };
  }, [visibleKpiReviews]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
  }, []);

  const loadKpiReviews = async () => {
    if (!canAccessKpi) return;

    setKpiLoading(true);
    try {
      if (canViewOwnOnlyKpi && !staffEmployee) {
        setKpiReviews([]);
        return;
      }

      const reviews = await getKpiReviews({
        month: kpiMonth,
        year: kpiYear,
        employeeId: canViewOwnOnlyKpi ? staffEmployee?.id : undefined,
      });
      setKpiReviews(Array.isArray(reviews) ? reviews : []);
    } catch (err) {
      console.error("[EmployeesPage] Failed to load KPI:", err);
      setKpiReviews([]);
    } finally {
      setKpiLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewAllKpi && canAccessKpi && activeTab === "staff") {
      setActiveTab("kpi");
      return;
    }

    if (activeTab === "kpi") {
      loadKpiReviews();
    }
  }, [activeTab, kpiMonth, kpiYear, canAccessKpi, canViewAllKpi, canViewOwnOnlyKpi, staffEmployee?.id]);

  useEffect(() => {
    const ownReview = canViewOwnOnlyKpi ? visibleKpiReviews[0] : null;
    if (!ownReview) {
      setMyKpiBreakdown(emptyBreakdown);
      setMyKpiBreakdownLoading(false);
      return;
    }

    let isCurrent = true;
    setMyKpiBreakdownLoading(true);
    getKpiBreakdown(ownReview.employeeId, ownReview.month, ownReview.year)
      .then((breakdown) => {
        if (isCurrent) setMyKpiBreakdown(toSafeBreakdown(breakdown));
      })
      .catch((err) => {
        console.error("[EmployeesPage] Failed to load My KPI breakdown:", err);
        if (isCurrent) setMyKpiBreakdown(emptyBreakdown);
      })
      .finally(() => {
        if (isCurrent) setMyKpiBreakdownLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [canViewOwnOnlyKpi, visibleKpiReviews]);

  // Open modal for new employee
  const openNewModal = () => {
    setEditingEmployee(null);
    setFormData(getInitialFormData());
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      joinDate: employee.joinDate,
      notes: employee.notes,
    });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData(getInitialFormData());
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData);
    } else {
      addEmployee({ ...formData, isActive: true });
    }
    closeModal();
  };

  // Toggle active status
  const handleToggleActive = (employee: Employee) => {
    if (employee.isActive) {
      deactivateEmployee(employee.id);
    } else {
      reactivateEmployee(employee.id);
    }
  };

  const getEmployeeForReview = (review: KpiReview) => {
    return employeeById.get(review.employeeId) ||
      safeEmployees.find((employee) => (employee.name || "").toLowerCase() === (review.employeeName || "").toLowerCase()) ||
      null;
  };

  const getReviewName = (review: KpiReview) => {
    return getEmployeeForReview(review)?.name || review.employeeName || "Staff";
  };

  const openKpiDetail = async (review: KpiReview) => {
    if (canViewOwnOnlyKpi && review.employeeId !== staffEmployee?.id) {
      setSelectedKpi(null);
      setSelectedBreakdown(emptyBreakdown);
      return;
    }

    setSelectedKpi(review);
    setSelectedBreakdown(emptyBreakdown);
    setDetailLoading(true);
    try {
      const breakdown = await getKpiBreakdown(review.employeeId, review.month, review.year);
      setSelectedBreakdown(toSafeBreakdown(breakdown));
    } catch (err) {
      console.error("[EmployeesPage] Failed to load KPI breakdown:", err);
      setSelectedBreakdown(emptyBreakdown);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeKpiDetail = () => {
    setSelectedKpi(null);
    setSelectedBreakdown(emptyBreakdown);
    setDetailLoading(false);
  };

  const handleCalculateAll = async () => {
    if (!canManageKpiAccess) return;

    setKpiActionLoading("all");
    try {
      const calculated = await calculateAllEmployeesKpi(kpiMonth, kpiYear);
      const safeCalculated = Array.isArray(calculated) ? calculated : [];
      const saved = await Promise.all(safeCalculated.map((review) => upsertKpiReview(review)));
      setKpiReviews(Array.isArray(saved) ? saved : []);
    } catch (err) {
      console.error("[EmployeesPage] Failed to calculate KPI:", err);
    } finally {
      setKpiActionLoading(null);
    }
  };

  const handleRecalculate = async (review: KpiReview) => {
    if (!canManageKpiAccess) return;

    setKpiActionLoading(review.employeeId);
    try {
      const calculated = await calculateEmployeeKpi(review.employeeId, kpiMonth, kpiYear);
      const saved = await upsertKpiReview({
        ...calculated,
        notes: review.notes,
        reviewedBy: review.reviewedBy,
      });
      setKpiReviews((prev) =>
        prev.map((item) =>
          item.employeeId === saved.employeeId && item.month === saved.month && item.year === saved.year
            ? saved
            : item
        )
      );
      if (selectedKpi?.employeeId === saved.employeeId) {
        setSelectedKpi(saved);
        const breakdown = await getKpiBreakdown(saved.employeeId, saved.month, saved.year);
        setSelectedBreakdown(toSafeBreakdown(breakdown));
      }
    } catch (err) {
      console.error("[EmployeesPage] Failed to recalculate KPI:", err);
    } finally {
      setKpiActionLoading(null);
    }
  };

  const openNoteModal = (review: KpiReview) => {
    if (!canManageKpiAccess) return;
    setNoteTarget(review);
    setReviewNote(review.notes);
  };

  const closeNoteModal = () => {
    setNoteTarget(null);
    setReviewNote("");
  };

  const handleSaveNote = async () => {
    if (!noteTarget || !canManageKpiAccess) return;

    setKpiActionLoading(`note-${noteTarget.employeeId}`);
    try {
      const saved = await upsertKpiReview({
        ...noteTarget,
        notes: reviewNote,
        reviewedBy: user?.id || noteTarget.reviewedBy,
      });
      setKpiReviews((prev) =>
        prev.map((item) =>
          item.employeeId === saved.employeeId && item.month === saved.month && item.year === saved.year
            ? saved
            : item
        )
      );
      if (selectedKpi?.employeeId === saved.employeeId) {
        setSelectedKpi(saved);
      }
      closeNoteModal();
    } catch (err) {
      console.error("[EmployeesPage] Failed to save KPI note:", err);
    } finally {
      setKpiActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Employees</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              Employees
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola data karyawan dan tim produksi.
            </p>
          </div>
          {canViewAllKpi && activeTab === "staff" && (
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-5 py-2.5 text-sm font-medium text-white transition hover:bg-dark-premium/90"
            >
              <Plus size={16} />
              Tambah Karyawan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-premium-beige/25 bg-white/86 p-2 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        {canViewAllKpi && (
          <button
            onClick={() => setActiveTab("staff")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "staff"
                ? "bg-dark-premium text-white"
                : "text-foreground-secondary hover:bg-premium-beige/10 hover:text-foreground"
            }`}
          >
            Staff List
          </button>
        )}
        {canAccessKpi && (
          <button
            onClick={() => setActiveTab("kpi")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "kpi"
                ? "bg-dark-premium text-white"
                : "text-foreground-secondary hover:bg-premium-beige/10 hover:text-foreground"
            }`}
          >
            {canViewOwnOnlyKpi ? "My KPI" : "KPI Staff"}
          </button>
        )}
      </div>

      {/* Employee ID Missing Warning */}
      {useEmployeeIdWarning() && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          ⚠️ Profil staff belum terhubung. Hubungi admin untuk menghubungkan akun Anda dengan profil employee agar bisa mengakses fitur Attendance dan KPI.
        </div>
      )}

      {canViewAllKpi && activeTab === "staff" ? (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border-line bg-white p-4">
              <p className="text-xs text-foreground-secondary">Total Karyawan</p>
              <p className="mt-1 text-2xl font-bold">{safeEmployees.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-600">Aktif</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-600">Nonaktif</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{inactiveCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
              <input
                type="text"
                placeholder="Cari nama, email, atau telepon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClassName} pl-10`}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as EmployeeRole | "all")}
              className={inputClassName}
            >
              <option value="all">Semua Role</option>
              <option value="photographer">Photographer</option>
              <option value="videographer">Videographer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="finance">Finance</option>
              <option value="staff">Staff</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className={inputClassName}
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <table className="w-full min-w-[800px]">
              <thead className="bg-premium-beige/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Kontak</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Bergabung</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-line">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm text-foreground-secondary">Tidak ada karyawan ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className={`hover:bg-premium-beige/5 ${!employee.isActive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{employee.name}</p>
                        {employee.notes && (
                          <p className="mt-0.5 text-xs text-foreground-secondary">{employee.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-1.5 text-foreground-secondary">
                            <Mail size={14} />
                            {employee.email}
                          </p>
                          <p className="flex items-center gap-1.5 text-foreground-secondary">
                            <Phone size={14} />
                            {employee.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-medium capitalize text-premium-beige">
                          {ROLE_LABELS[employee.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground-secondary">
                        {formatDate(employee.joinDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          employee.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {employee.isActive ? (
                            <>
                              <UserCheck size={14} />
                              Aktif
                            </>
                          ) : (
                            <>
                              <UserX size={14} />
                              Nonaktif
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(employee)}
                            className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(employee)}
                            className={`rounded-lg p-2 ${
                              employee.isActive
                                ? "text-red-500 hover:bg-red-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={employee.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {employee.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-lg">
              <div>
                <label className={labelClass}>Bulan</label>
                <select
                  value={kpiMonth}
                  onChange={(e) => setKpiMonth(Number(e.target.value))}
                  className={inputClassName}
                >
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tahun</label>
                <select
                  value={kpiYear}
                  onChange={(e) => setKpiYear(Number(e.target.value))}
                  className={inputClassName}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            {canManageKpiAccess && (
              <button
                onClick={handleCalculateAll}
                disabled={kpiActionLoading === "all"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-dark-premium px-5 py-2.5 text-sm font-medium text-white transition hover:bg-dark-premium/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {kpiActionLoading === "all" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Calculate KPI This Month
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border-line bg-white p-4">
              <p className="text-xs text-foreground-secondary">{canViewOwnOnlyKpi ? "My KPI" : "Average KPI"}</p>
              <p className="mt-1 text-2xl font-bold">{kpiStats.average}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-600">{canViewOwnOnlyKpi ? "Excellent Status" : "Excellent Staff"}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{kpiStats.excellent}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Needs Improve</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{kpiStats.needsImprove}</p>
            </div>
            <div className="rounded-xl border border-premium-beige/35 bg-white p-4">
              <p className="text-xs text-foreground-secondary">{canViewOwnOnlyKpi ? "Reviewed Period" : "Total Staff Reviewed"}</p>
              <p className="mt-1 text-2xl font-bold">{kpiStats.total}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-premium-beige/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Staff Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Role / Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Task Completion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Quality</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Final</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Level</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-line">
                {kpiLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Loader2 size={26} className="mx-auto animate-spin text-premium-beige" />
                      <p className="mt-3 text-sm text-foreground-secondary">Memuat data KPI...</p>
                    </td>
                  </tr>
                ) : visibleKpiReviews.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-foreground">
                        {canViewOwnOnlyKpi ? "KPI bulan ini belum tersedia" : "Belum ada data KPI untuk periode ini"}
                      </p>
                      {canManageKpiAccess && (
                        <button
                          onClick={handleCalculateAll}
                          disabled={kpiActionLoading === "all"}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-dark-premium px-5 py-2.5 text-sm font-medium text-white transition hover:bg-dark-premium/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {kpiActionLoading === "all" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                          Calculate KPI This Month
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  visibleKpiReviews.map((review) => {
                    const employee = getEmployeeForReview(review);
                    const level = KPI_LEVELS[review.level] || KPI_LEVELS.poor;
                    return (
                      <tr key={`${review.employeeId}-${review.year}-${review.month}`} className="hover:bg-premium-beige/5">
                        <td className="px-4 py-3">
                          <p className="font-medium">{getReviewName(review)}</p>
                          {review.notes && <p className="mt-0.5 text-xs text-foreground-secondary">{review.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {employee ? ROLE_LABELS[employee.role] : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{review.attendanceScore}</td>
                        <td className="px-4 py-3 text-sm font-medium">{review.taskCompletionScore}</td>
                        <td className="px-4 py-3 text-sm font-medium">{review.deadlineScore}</td>
                        <td className="px-4 py-3 text-sm font-medium">{review.qualityScore}</td>
                        <td className="px-4 py-3 text-sm font-bold">{review.finalScore}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${level.bg} ${level.color}`}>
                            {level.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openKpiDetail(review)} className={actionButtonClass}>
                              <Eye size={14} />
                              View
                            </button>
                            {canManageKpiAccess && (
                              <>
                                <button
                                  onClick={() => handleRecalculate(review)}
                                  disabled={kpiActionLoading === review.employeeId}
                                  className={actionButtonClass}
                                >
                                  {kpiActionLoading === review.employeeId ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                  Recalculate
                                </button>
                                <button onClick={() => openNoteModal(review)} className={actionButtonClass}>
                                  <ClipboardEdit size={14} />
                                  Note
                                </button>
                              </>
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

          {canViewOwnOnlyKpi && visibleKpiReviews[0] && (
            <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-premium-beige">My KPI Breakdown</p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                    {getReviewName(visibleKpiReviews[0])}
                  </h3>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${KPI_LEVELS[visibleKpiReviews[0].level]?.bg || KPI_LEVELS.poor.bg} ${KPI_LEVELS[visibleKpiReviews[0].level]?.color || KPI_LEVELS.poor.color}`}>
                  {KPI_LEVELS[visibleKpiReviews[0].level]?.label || "Poor"}
                </span>
              </div>

              {myKpiBreakdownLoading ? (
                <div className="rounded-xl border border-border-line p-6 text-center">
                  <Loader2 size={22} className="mx-auto animate-spin text-premium-beige" />
                  <p className="mt-3 text-sm text-foreground-secondary">Memuat breakdown KPI...</p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-border-line p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Attendance Summary</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-foreground-secondary">Present</p><p className="font-bold">{myKpiBreakdown.attendanceSummary.present}</p></div>
                      <div><p className="text-foreground-secondary">Late</p><p className="font-bold">{myKpiBreakdown.attendanceSummary.late}</p></div>
                      <div><p className="text-foreground-secondary">Absent</p><p className="font-bold">{myKpiBreakdown.attendanceSummary.absent}</p></div>
                      <div><p className="text-foreground-secondary">Leave</p><p className="font-bold">{myKpiBreakdown.attendanceSummary.leave}</p></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border-line p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Task Summary</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-foreground-secondary">Total Tasks</p><p className="font-bold">{myKpiBreakdown.taskSummary.total}</p></div>
                      <div><p className="text-foreground-secondary">Completed</p><p className="font-bold">{myKpiBreakdown.taskSummary.completed}</p></div>
                      <div><p className="text-foreground-secondary">Overdue</p><p className="font-bold">{myKpiBreakdown.taskSummary.overdue}</p></div>
                      <div><p className="text-foreground-secondary">Revision</p><p className="font-bold">{myKpiBreakdown.taskSummary.revision}</p></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border-line p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Quality Summary</p>
                    <p className="mt-3 text-sm text-foreground-secondary">Average Quality Score</p>
                    <p className="mt-1 text-3xl font-bold">{myKpiBreakdown.qualitySummary.averageQualityScore}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {editingEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
              </h3>
              <button onClick={closeModal} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClassName}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClassName}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>No. Telepon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClassName}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                    className={inputClassName}
                  >
                    <option value="photographer">Photographer</option>
                    <option value="videographer">Videographer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="finance">Finance</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tanggal Bergabung</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className={inputClassName}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`${inputClassName} min-h-[80px] resize-none`}
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-dark-premium px-4 py-2.5 text-sm font-medium text-white hover:bg-dark-premium/90"
                >
                  {editingEmployee ? "Simpan Perubahan" : "Tambah Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-premium-beige">KPI Detail</p>
                <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  {getReviewName(selectedKpi)}
                </h3>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {(() => {
                    const employee = getEmployeeForReview(selectedKpi);
                    return `${employee ? ROLE_LABELS[employee.role] : "-"} • ${MONTH_OPTIONS.find((month) => month.value === selectedKpi.month)?.label || selectedKpi.month} ${selectedKpi.year}`;
                  })()}
                </p>
              </div>
              <button onClick={closeKpiDetail} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-xl border border-premium-beige/30 bg-premium-beige/5 p-4">
                <p className="text-xs text-foreground-secondary">Final Score</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-4xl font-bold">{selectedKpi.finalScore}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${KPI_LEVELS[selectedKpi.level]?.bg || KPI_LEVELS.poor.bg} ${KPI_LEVELS[selectedKpi.level]?.color || KPI_LEVELS.poor.color}`}>
                    {KPI_LEVELS[selectedKpi.level]?.label || "Poor"}
                  </span>
                </div>
                {canManageKpiAccess && (
                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      onClick={() => handleRecalculate(selectedKpi)}
                      disabled={kpiActionLoading === selectedKpi.employeeId}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-dark-premium px-4 py-2.5 text-sm font-medium text-white hover:bg-dark-premium/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {kpiActionLoading === selectedKpi.employeeId ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Recalculate KPI
                    </button>
                    <button
                      onClick={() => openNoteModal(selectedKpi)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                    >
                      <ClipboardEdit size={16} />
                      Edit Notes
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Attendance Score", "25%", selectedKpi.attendanceScore],
                  ["Task Completion", "35%", selectedKpi.taskCompletionScore],
                  ["Deadline Accuracy", "25%", selectedKpi.deadlineScore],
                  ["Quality Score", "15%", selectedKpi.qualityScore],
                ].map(([label, weight, value]) => (
                  <div key={label} className="rounded-xl border border-border-line bg-background-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-foreground-secondary">{label}</p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-premium-beige">{weight}</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {detailLoading ? (
              <div className="mt-5 rounded-xl border border-border-line p-8 text-center">
                <Loader2 size={24} className="mx-auto animate-spin text-premium-beige" />
                <p className="mt-3 text-sm text-foreground-secondary">Memuat breakdown KPI...</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Attendance Summary</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-foreground-secondary">Present</p><p className="font-bold">{selectedBreakdown.attendanceSummary.present}</p></div>
                    <div><p className="text-foreground-secondary">Late</p><p className="font-bold">{selectedBreakdown.attendanceSummary.late}</p></div>
                    <div><p className="text-foreground-secondary">Absent</p><p className="font-bold">{selectedBreakdown.attendanceSummary.absent}</p></div>
                    <div><p className="text-foreground-secondary">Leave</p><p className="font-bold">{selectedBreakdown.attendanceSummary.leave}</p></div>
                  </div>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Task Summary</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-foreground-secondary">Total Tasks</p><p className="font-bold">{selectedBreakdown.taskSummary.total}</p></div>
                    <div><p className="text-foreground-secondary">Completed</p><p className="font-bold">{selectedBreakdown.taskSummary.completed}</p></div>
                    <div><p className="text-foreground-secondary">Overdue</p><p className="font-bold">{selectedBreakdown.taskSummary.overdue}</p></div>
                    <div><p className="text-foreground-secondary">Revision</p><p className="font-bold">{selectedBreakdown.taskSummary.revision}</p></div>
                  </div>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Quality Summary</p>
                  <p className="mt-3 text-sm text-foreground-secondary">Average Quality Score</p>
                  <p className="mt-1 text-3xl font-bold">{selectedBreakdown.qualitySummary.averageQualityScore}</p>
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Notes / Review</p>
                {!canManageKpiAccess && <span className="text-xs text-foreground-secondary">Read-only</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {selectedKpi.notes || "Belum ada catatan review untuk periode ini."}
              </p>
            </div>
          </div>
        </div>
      )}

      {noteTarget && canManageKpiAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                Add Review Note
              </h3>
              <button onClick={closeNoteModal} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>
            <label className={labelClass}>Catatan KPI</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className={`${inputClassName} min-h-[140px] resize-none`}
              placeholder="Tambahkan catatan evaluasi..."
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeNoteModal}
                className="flex-1 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={kpiActionLoading === `note-${noteTarget.employeeId}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-dark-premium px-4 py-2.5 text-sm font-medium text-white hover:bg-dark-premium/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {kpiActionLoading === `note-${noteTarget.employeeId}` && <Loader2 size={16} className="animate-spin" />}
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
