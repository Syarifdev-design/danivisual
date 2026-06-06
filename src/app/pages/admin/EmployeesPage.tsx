import { useEffect, useState, useMemo, Fragment } from "react";
import { useLocation } from "react-router";
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
  Check,
  RotateCcw,
  XCircle,
  Target,
  Clock,
  Star,
  ChevronDown,
} from "lucide-react";
import { useEmployees, ROLE_LABELS, Employee, EmployeeRole } from "../../contexts/EmployeesContext";
import { useAuth, useEmployeeIdWarning } from "../../contexts/AuthContext";
import {
  canAccessStaffKpi,
  canManageKpi,
  canViewAllStaffData,
  canViewOwnKpi,
  isSuperAdmin,
  canCreateKpiJob,
  canViewAllKpiJobs,
  canReviewKpiJob,
  canSubmitKpiJob,
  canAccessKpiJobs,
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
import {
  createKpiJob,
  getKpiJobs,
  getKpiJobAssignments,
  reviewKpiJobAssignment,
  startKpiJobAssignment,
  submitKpiJobAssignment,
  getMyKpiJobAssignments,
  type KpiJob,
  type KpiJobAssignment,
  type CreateKpiJobInput,
  type KpiJobAssignmentStatus,
  type KpiJobPriority,
  type KpiAssignmentMode,
} from "../../../services/kpiJobService";

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

// KPI Jobs constants
const KPI_CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "attendance", label: "Attendance" },
  { value: "production", label: "Production" },
  { value: "quality", label: "Quality" },
  { value: "responsibility", label: "Responsibility" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin" },
];

const KPI_ASSIGNMENT_MODE_OPTIONS = [
  { value: "all_employees", label: "All Employees" },
  { value: "specific_role", label: "Specific Role" },
  { value: "multiple_roles", label: "Multiple Roles" },
  { value: "specific_employee", label: "Specific Employee" },
  { value: "multiple_employees", label: "Multiple Employees" },
];

const KPI_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "editor", label: "Editor" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "staff", label: "Staff" },
];

const KPI_PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-slate-600", bg: "bg-slate-50" },
  { value: "medium", label: "Medium", color: "text-blue-600", bg: "bg-blue-50" },
  { value: "high", label: "High", color: "text-amber-600", bg: "bg-amber-50" },
  { value: "urgent", label: "Urgent", color: "text-red-600", bg: "bg-red-50" },
];

const KPI_STATUS_OPTIONS: Record<KpiJobAssignmentStatus, { label: string; color: string; bg: string }> = {
  todo: { label: "To Do", color: "text-slate-600", bg: "bg-slate-100" },
  in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50" },
  submitted: { label: "Submitted", color: "text-purple-600", bg: "bg-purple-50" },
  revision: { label: "Revision", color: "text-amber-600", bg: "bg-amber-50" },
  approved: { label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50" },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-100" },
  overdue: { label: "Overdue", color: "text-red-600", bg: "bg-red-100" },
  cancelled: { label: "Cancelled", color: "text-slate-500", bg: "bg-slate-100" },
};

const KPI_JOB_STATUS_OPTIONS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100" },
  active: { label: "Active", color: "text-emerald-600", bg: "bg-emerald-50" },
  completed: { label: "Completed", color: "text-blue-600", bg: "bg-blue-50" },
  cancelled: { label: "Cancelled", color: "text-slate-500", bg: "bg-slate-100" },
};

interface KpiJobFormData {
  title: string;
  description: string;
  category: string;
  assignmentMode: KpiAssignmentMode;
  targetRoles: string[];
  targetEmployeeIds: string[];
  priority: KpiJobPriority;
  weight: number;
  deadline: string;
  periodMonth: number | null;
  periodYear: number | null;
}

interface KpiJobSubmissionFormData {
  submissionNote: string;
  submissionUrl: string;
}

function getInitialKpiJobFormData(): KpiJobFormData {
  const now = new Date();
  return {
    title: "",
    description: "",
    category: "general",
    assignmentMode: "specific_role",
    targetRoles: [],
    targetEmployeeIds: [],
    priority: "medium",
    weight: 1,
    deadline: "",
    periodMonth: now.getMonth() + 1,
    periodYear: now.getFullYear(),
  };
}

function getInitialSubmissionFormData(): KpiJobSubmissionFormData {
  return {
    submissionNote: "",
    submissionUrl: "",
  };
}

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
  const location = useLocation();

  // =========================================================================
  // Route Detection - Determine page mode based on URL
  // =========================================================================
  const isMyKpiRoute = location.pathname.includes("/my-kpi");
  const isKpiJobsRoute = location.pathname.includes("/kpi-jobs");
  const isEmployeesRoute = location.pathname.includes("/employees");

  const pageMode = isMyKpiRoute
    ? "my-kpi"
    : isKpiJobsRoute
      ? "kpi-jobs"
      : "employees";

  // =========================================================================
  // Existing State
  // =========================================================================
  const { employees, addEmployee, updateEmployee, deactivateEmployee, reactivateEmployee } = useEmployees();
  const safeEmployees = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);

  const now = new Date();
  const canAccessKpi = user ? canAccessStaffKpi(user.role) : false;
  const canManageKpiAccess = user ? canManageKpi(user.role) : false;
  const canViewAllKpi = user ? canViewAllStaffData(user.role) : false;
  const canViewOwnOnlyKpi = user ? canViewOwnKpi(user.role) : false;
  const isSuperAdminUser = user ? isSuperAdmin(user.role) : false;

  // KPI Jobs permissions - check if user can access KPI Jobs section
  const hasKpiJobsAccess = user ? canAccessKpiJobs(user.role) : false;
  const canCreateKpiJobAccess = user ? canCreateKpiJob(user.role) : false;
  const canViewAllKpiJobsAccess = user ? canViewAllKpiJobs(user.role) : false;
  const canReviewKpiJobAccess = user ? canReviewKpiJob(user.role) : false;
  const canSubmitKpiJobAccess = user ? canSubmitKpiJob(user.role) : false;

  // Tab type
  type TabType = "staff" | "kpi" | "kpi-jobs";

  // Determine default tab based on pageMode
  const getDefaultTab = (): TabType => {
    if (pageMode === "my-kpi") return "kpi";
    if (pageMode === "kpi-jobs") return "kpi-jobs";
    return "staff";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab);
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

  // KPI Jobs state
  const [kpiJobs, setKpiJobs] = useState<KpiJob[]>([]);
  const [kpiJobAssignments, setKpiJobAssignments] = useState<KpiJobAssignment[]>([]);
  const [kpiJobsLoading, setKpiJobsLoading] = useState(false);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [kpiJobFormData, setKpiJobFormData] = useState<KpiJobFormData>(getInitialKpiJobFormData());
  const [createJobLoading, setCreateJobLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<KpiJobAssignment | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "revision" | "reject" | null>(null);
  const [reviewQualityScore, setReviewQualityScore] = useState<number>(0);
  const [reviewNoteText, setReviewNoteText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedJobDetail, setSelectedJobDetail] = useState<KpiJob | null>(null);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);

  // My KPI Jobs state (for staff viewing their own assignments)
  const [myKpiJobAssignments, setMyKpiJobAssignments] = useState<KpiJobAssignment[]>([]);
  const [myKpiJobAssignmentsLoading, setMyKpiJobAssignmentsLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitAssignment, setSubmitAssignment] = useState<KpiJobAssignment | null>(null);
  const [submissionFormData, setSubmissionFormData] = useState<KpiJobSubmissionFormData>(getInitialSubmissionFormData());
  const [submitLoading, setSubmitLoading] = useState(false);

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

  // =========================================================================
  // KPI Jobs Stats - Route-Aware
  // =========================================================================
  const myKpiJobsStats = useMemo(() => {
    const total = myKpiJobAssignments.length;
    const active = myKpiJobAssignments.filter(a => ["todo", "in_progress"].includes(a.status)).length;
    const submitted = myKpiJobAssignments.filter(a => a.status === "submitted").length;
    const revision = myKpiJobAssignments.filter(a => a.status === "revision").length;
    const overdue = myKpiJobAssignments.filter(a => a.status === "overdue").length;
    const approved = myKpiJobAssignments.filter(a => a.status === "approved" || a.status === "completed").length;

    return { total, active, submitted, revision, overdue, approved };
  }, [myKpiJobAssignments]);

  const adminKpiJobsStats = useMemo(() => {
    const total = kpiJobs.length;
    const active = kpiJobs.filter(j => j.status === "active").length;
    const needReview = kpiJobAssignments.filter(a => ["submitted", "in_progress"].includes(a.status)).length;
    const overdue = kpiJobs.filter(j => j.status === "overdue" || kpiJobAssignments.some(a => a.kpiJobId === j.id && a.status === "overdue")).length;
    const completed = kpiJobs.filter(j => j.status === "completed").length;

    return { total, active, needReview, overdue, completed };
  }, [kpiJobs, kpiJobAssignments]);

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

  // Load my KPI job assignments when staff views their own KPI tab
  useEffect(() => {
    if (canViewOwnOnlyKpi && staffEmployee) {
      loadMyKpiJobAssignments();
    }
  }, [canViewOwnOnlyKpi, staffEmployee?.id]);

  useEffect(() => {
    // Load KPI jobs data for job lookup when viewing my KPI jobs
    if (canViewOwnOnlyKpi || hasKpiJobsAccess) {
      loadKpiJobs();
    }
  }, [canViewOwnOnlyKpi, hasKpiJobsAccess]);

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

  // Load My KPI Jobs assignments (for staff view)
  const loadMyKpiJobAssignments = async () => {
    if (!staffEmployee) return;
    setMyKpiJobAssignmentsLoading(true);
    try {
      const assignments = await getMyKpiJobAssignments(staffEmployee.id);
      setMyKpiJobAssignments(Array.isArray(assignments) ? assignments : []);
    } catch (err) {
      console.error("[EmployeesPage] Failed to load my KPI Job assignments:", err);
    } finally {
      setMyKpiJobAssignmentsLoading(false);
    }
  };

  const handleStartJob = async (assignmentId: string) => {
    if (!canSubmitKpiJobAccess) return;
    setKpiJobsLoading(true);
    try {
      await startKpiJobAssignment(assignmentId);
      await loadMyKpiJobAssignments();
    } catch (err) {
      console.error("[EmployeesPage] Failed to start job:", err);
      alert("Gagal memulai job. Silakan coba lagi.");
    } finally {
      setKpiJobsLoading(false);
    }
  };

  const openSubmitModal = (assignment: KpiJobAssignment) => {
    if (!canSubmitKpiJobAccess) return;
    setSubmitAssignment(assignment);
    setSubmissionFormData(getInitialSubmissionFormData());
    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    setSubmitAssignment(null);
    setSubmissionFormData(getInitialSubmissionFormData());
    setShowSubmitModal(false);
  };

  const handleSubmitJob = async () => {
    if (!submitAssignment) return;
    setSubmitLoading(true);
    try {
      await submitKpiJobAssignment(submitAssignment.id, {
        submissionNote: submissionFormData.submissionNote,
        submissionUrl: submissionFormData.submissionUrl,
      });
      await loadMyKpiJobAssignments();
      closeSubmitModal();
    } catch (err) {
      console.error("[EmployeesPage] Failed to submit job:", err);
      alert("Gagal submit job. Silakan coba lagi.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Load KPI Jobs data
  const loadKpiJobs = async () => {
    if (!hasKpiJobsAccess) return;
    setKpiJobsLoading(true);
    try {
      const [jobs, assignments] = await Promise.all([
        getKpiJobs(),
        getKpiJobAssignments(),
      ]);
      setKpiJobs(Array.isArray(jobs) ? jobs : []);
      setKpiJobAssignments(Array.isArray(assignments) ? assignments : []);
    } catch (err) {
      console.error("[EmployeesPage] Failed to load KPI Jobs:", err);
    } finally {
      setKpiJobsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "kpi-jobs" && hasKpiJobsAccess) {
      loadKpiJobs();
    }
  }, [activeTab, hasKpiJobsAccess]);

  const openCreateJobModal = () => {
    if (!canCreateKpiJobAccess) return;
    setKpiJobFormData(getInitialKpiJobFormData());
    setShowCreateJobModal(true);
    setCreateSuccess(null);
  };

  const closeCreateJobModal = () => {
    setShowCreateJobModal(false);
    setKpiJobFormData(getInitialKpiJobFormData());
    setCreateSuccess(null);
  };

  const handleCreateKpiJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateKpiJobAccess) return;

    setCreateJobLoading(true);
    setCreateSuccess(null);
    try {
      const input: CreateKpiJobInput = {
        title: kpiJobFormData.title,
        description: kpiJobFormData.description,
        category: kpiJobFormData.category,
        assignmentMode: kpiJobFormData.assignmentMode,
        targetRoles: kpiJobFormData.targetRoles,
        targetEmployeeIds: kpiJobFormData.targetEmployeeIds,
        priority: kpiJobFormData.priority,
        weight: kpiJobFormData.weight,
        deadline: kpiJobFormData.deadline || null,
        periodMonth: kpiJobFormData.periodMonth,
        periodYear: kpiJobFormData.periodYear,
        status: "active",
        createdBy: user?.id || null,
      };

      const result = await createKpiJob(input);
      setCreateSuccess(`KPI Job berhasil dibuat dan dikirim ke ${result.assignments.length} staff terkait.`);
      await loadKpiJobs();
      setTimeout(() => {
        closeCreateJobModal();
      }, 2000);
    } catch (err) {
      console.error("[EmployeesPage] Failed to create KPI Job:", err);
      alert("Gagal membuat KPI Job. Silakan coba lagi.");
    } finally {
      setCreateJobLoading(false);
    }
  };

  const openReviewModal = (assignment: KpiJobAssignment, action: "approve" | "revision" | "reject") => {
    if (!canReviewKpiJobAccess) return;
    setSelectedAssignment(assignment);
    setReviewAction(action);
    setReviewQualityScore(assignment.qualityScore || 0);
    setReviewNoteText("");
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setSelectedAssignment(null);
    setReviewAction(null);
    setReviewQualityScore(0);
    setReviewNoteText("");
    setShowReviewModal(false);
  };

  const handleReviewSubmit = async () => {
    if (!selectedAssignment || !reviewAction || !canReviewKpiJobAccess) return;

    setReviewLoading(true);
    try {
      await reviewKpiJobAssignment(selectedAssignment.id, {
        action: reviewAction,
        qualityScore: reviewQualityScore,
        reviewNote: reviewNoteText,
      });
      await loadKpiJobs();
      closeReviewModal();
    } catch (err) {
      console.error("[EmployeesPage] Failed to review assignment:", err);
      alert("Gagal mereview assignment. Silakan coba lagi.");
    } finally {
      setReviewLoading(false);
    }
  };

  const viewJobDetail = (job: KpiJob) => {
    setSelectedJobDetail(job);
    setShowJobDetailModal(true);
  };

  const closeJobDetailModal = () => {
    setSelectedJobDetail(null);
    setShowJobDetailModal(false);
  };

  const getEmployeeName = (employeeId: string): string => {
    const emp = safeEmployees.find(e => e.id === employeeId);
    return emp?.name || "Unknown";
  };

  const getJobForAssignment = (kpiJobId: string): KpiJob | undefined => {
    return kpiJobs.find(j => j.id === kpiJobId);
  };

  const getAssignmentCountForJob = (jobId: string): number => {
    return kpiJobAssignments.filter(a => a.kpiJobId === jobId).length;
  };

  const formatDeadline = (deadline: string | null): string => {
    if (!deadline) return "-";
    return new Date(deadline).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleLabel = (role: string | null): string => {
    if (!role) return "-";
    return ROLE_LABELS[role as EmployeeRole] || role;
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
      {/* Header - Route-Aware */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">
              {pageMode === "my-kpi" ? "My KPI" : pageMode === "kpi-jobs" ? "KPI Jobs" : "Employees"}
            </p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              {pageMode === "my-kpi" ? "My KPI" : pageMode === "kpi-jobs" ? "KPI Jobs" : "Employees"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              {pageMode === "my-kpi"
                ? "Lihat performa KPI, tugas kerja, dan progress Anda."
                : pageMode === "kpi-jobs"
                  ? "Kelola assignment KPI, review submission, dan score karyawan."
                  : "Kelola data karyawan dan tim produksi."}
            </p>
          </div>
          {/* Button Tambah Karyawan - hanya di employees mode untuk admin */}
          {pageMode === "employees" && canViewAllKpi && activeTab === "staff" && (
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

      {/* Tabs - Route-Based */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-premium-beige/25 bg-white/86 p-2 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        {/* Staff List Tab - Hanya di employees mode dan untuk admin */}
        {pageMode === "employees" && canViewAllKpi && (
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
        {/* KPI Tab - Visible di employees mode (admin) atau my-kpi mode (staff) */}
        {canAccessKpi && (pageMode === "employees" || pageMode === "my-kpi") && (
          <button
            onClick={() => setActiveTab("kpi")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "kpi"
                ? "bg-dark-premium text-white"
                : "text-foreground-secondary hover:bg-premium-beige/10 hover:text-foreground"
            }`}
          >
            {pageMode === "my-kpi" ? "My KPI" : "KPI Staff"}
          </button>
        )}
        {/* KPI Jobs Tab - Visible di semua mode jika ada akses */}
        {hasKpiJobsAccess && (
          <button
            onClick={() => setActiveTab("kpi-jobs")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "kpi-jobs"
                ? "bg-dark-premium text-white"
                : "text-foreground-secondary hover:bg-premium-beige/10 hover:text-foreground"
            }`}
          >
            {pageMode === "my-kpi" ? "KPI Jobs Saya" : "KPI Jobs"}
          </button>
        )}
      </div>

      {/* Employee ID Missing Warning */}
      {useEmployeeIdWarning() && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          ⚠️ Profil staff belum terhubung. Hubungi admin untuk menghubungkan akun Anda dengan profil employee agar bisa mengakses fitur Attendance dan KPI.
        </div>
      )}

      {canViewAllKpi && activeTab === "staff" && pageMode === "employees" ? (
        <>
          {/* Stats - Employees Mode */}
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

          {/* My KPI Jobs Stats - Hanya untuk my-kpi mode */}
          {pageMode === "my-kpi" && hasKpiJobsAccess && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-border-line bg-white p-4">
                <p className="text-xs text-foreground-secondary">KPI Jobs Aktif</p>
                <p className="mt-1 text-2xl font-bold">{myKpiJobsStats.active}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs text-blue-600">Submitted</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">{myKpiJobsStats.submitted}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Revision</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{myKpiJobsStats.revision}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Approved</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{myKpiJobsStats.approved}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs text-red-600">Overdue</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{myKpiJobsStats.overdue}</p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-premium-beige/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Staff Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Role / Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Job Completion</th>
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

          {/* KPI Jobs Saya Section - for staff viewing their own KPI Jobs */}
          {canViewOwnOnlyKpi && staffEmployee && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-premium-beige">My KPI Jobs</p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>KPI Jobs Saya</h3>
                  <p className="mt-1 text-sm text-foreground-secondary">Tugas dan job KPI yang ditugaskan kepada Anda.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border-line bg-white p-3">
                    <p className="text-xs text-foreground-secondary">Total Job</p>
                    <p className="mt-1 text-xl font-bold">{myKpiJobAssignments.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-600">To Do</p>
                    <p className="mt-1 text-xl font-bold text-slate-700">{myKpiJobAssignments.filter(a => a.status === "todo").length}</p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs text-blue-600">In Progress</p>
                    <p className="mt-1 text-xl font-bold text-blue-700">{myKpiJobAssignments.filter(a => a.status === "in_progress").length}</p>
                  </div>
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                    <p className="text-xs text-purple-600">Submitted</p>
                    <p className="mt-1 text-xl font-bold text-purple-700">{myKpiJobAssignments.filter(a => a.status === "submitted").length}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-600">Revision</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">{myKpiJobAssignments.filter(a => a.status === "revision").length}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-600">Completed</p>
                    <p className="mt-1 text-xl font-bold text-emerald-700">{myKpiJobAssignments.filter(a => a.status === "completed" || a.status === "approved").length}</p>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-red-600">Overdue</p>
                    <p className="mt-1 text-xl font-bold text-red-700">{myKpiJobAssignments.filter(a => a.status === "overdue").length}</p>
                  </div>
                  <div className="rounced-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-600">Avg Quality Score</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">
                      {(() => {
                        const scored = myKpiJobAssignments.filter(a => a.qualityScore > 0);
                        return scored.length > 0
                          ? Math.round(scored.reduce((sum, a) => sum + a.qualityScore, 0) / scored.length)
                          : 0;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI Jobs Table */}
              <div className="overflow-hidden rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-premium-beige/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Deadline</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Score</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-line">
                    {myKpiJobAssignmentsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Loader2 size={26} className="mx-auto animate-spin text-premium-beige" />
                          <p className="mt-3 text-sm text-foreground-secondary">Memuat KPI Jobs...</p>
                        </td>
                      </tr>
                    ) : myKpiJobAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Target size={32} className="mx-auto text-foreground-secondary/30" />
                          <p className="mt-3 text-sm font-medium text-foreground">Belum ada KPI Job untuk Anda</p>
                          <p className="mt-1 text-xs text-foreground-secondary">KPI Job akan muncul setelah dibuat oleh admin</p>
                        </td>
                      </tr>
                    ) : (
                      myKpiJobAssignments.map((assignment) => {
                        const job = kpiJobs.find(j => j.id === assignment.kpiJobId);
                        const statusInfo = KPI_STATUS_OPTIONS[assignment.status] || KPI_STATUS_OPTIONS.todo;
                        const priorityInfo = KPI_PRIORITY_OPTIONS.find(p => p.value === job?.priority) || KPI_PRIORITY_OPTIONS[1];

                        return (
                          <tr key={assignment.id} className="hover:bg-premium-beige/5">
                            <td className="px-4 py-3">
                              <p className="font-medium">{job?.title || "Unknown Job"}</p>
                              {job?.description && (
                                <p className="mt-0.5 text-xs text-foreground-secondary line-clamp-1">{job.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-medium capitalize text-premium-beige">
                                {job?.category || "general"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                                {priorityInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground-secondary">
                              {formatDeadline(assignment.deadline)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {assignment.qualityScore > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Star size={14} className="text-amber-500 fill-amber-500" />
                                  <span className="text-sm font-medium">{assignment.qualityScore}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-foreground-secondary">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setSelectedJobDetail(job || null);
                                    setShowJobDetailModal(true);
                                  }}
                                  className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                {canSubmitKpiJobAccess && assignment.status === "todo" && (
                                  <button
                                    onClick={() => handleStartJob(assignment.id)}
                                    disabled={kpiJobsLoading}
                                    className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Start Job"
                                  >
                                    <Clock size={16} />
                                  </button>
                                )}
                                {canSubmitKpiJobAccess && ["in_progress", "revision"].includes(assignment.status) && (
                                  <button
                                    onClick={() => openSubmitModal(assignment)}
                                    className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                                    title="Submit Job"
                                  >
                                    <Check size={16} />
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
            </div>
          )}
        </div>
      )}

      {/* KPI Jobs Tab Content */}
      {hasKpiJobsAccess && activeTab === "kpi-jobs" && (
        <div className="space-y-6">
          {/* KPI Jobs Stats - Context-Aware */}
          {pageMode === "my-kpi" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border-line bg-white p-4">
                <p className="text-xs text-foreground-secondary">Total KPI Jobs</p>
                <p className="mt-1 text-2xl font-bold">{myKpiJobsStats.total}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs text-blue-600">Submitted</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">{myKpiJobsStats.submitted}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Revision</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{myKpiJobsStats.revision}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs text-red-600">Overdue</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{myKpiJobsStats.overdue}</p>
              </div>
            </div>
          )}

          {pageMode !== "my-kpi" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border-line bg-white p-4">
                <p className="text-xs text-foreground-secondary">Total KPI Jobs</p>
                <p className="mt-1 text-2xl font-bold">{adminKpiJobsStats.total}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Active</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{adminKpiJobsStats.active}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Need Review</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{adminKpiJobsStats.needReview}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs text-red-600">Overdue</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{adminKpiJobsStats.overdue}</p>
              </div>
            </div>
          )}

          {/* Header Actions */}
          <div className="flex flex-col gap-4 rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-premium-beige">
                {pageMode === "my-kpi" ? "Tugas KPI Saya" : "KPI Management"}
              </p>
              <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {pageMode === "my-kpi" ? "Tugas KPI Saya" : "KPI Jobs"}
              </h3>
            </div>
            {/* Create KPI Job - Hanya untuk admin di employees/kpi-jobs mode */}
            {pageMode !== "my-kpi" && canCreateKpiJobAccess && (
              <button
                onClick={openCreateJobModal}
                className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-5 py-2.5 text-sm font-medium text-white transition hover:bg-dark-premium/90"
              >
                <Plus size={16} />
                Create KPI Job
              </button>
            )}
          </div>

          {/* KPI Jobs Table */}
          <div className="overflow-hidden rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="border-b border-border-line px-4 py-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
                {pageMode === "my-kpi" ? "Tugas KPI Saya" : "KPI Jobs"}
              </h4>
            </div>
            <table className="w-full min-w-[900px]">
              <thead className="bg-premium-beige/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Assignments</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Priority</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-line">
                {(() => {
                  if (kpiJobsLoading) {
                    return (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <Loader2 size={26} className="mx-auto animate-spin text-premium-beige" />
                          <p className="mt-3 text-sm text-foreground-secondary">Memuat data KPI Jobs...</p>
                        </td>
                      </tr>
                    );
                  }
                  if (pageMode === "my-kpi") {
                    if (myKpiJobAssignments.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center">
                            <Target size={32} className="mx-auto text-foreground-secondary/30" />
                            <p className="mt-3 text-sm font-medium text-foreground">Belum ada KPI Job untuk Anda</p>
                            <p className="mt-1 text-xs text-foreground-secondary">KPI Job akan muncul setelah admin membuat assignment</p>
                          </td>
                        </tr>
                      );
                    }
                    return myKpiJobAssignments.map((assignment) => {
                      const job = kpiJobs.find(j => j.id === assignment.kpiJobId);
                      const statusInfo = KPI_STATUS_OPTIONS[assignment.status] || KPI_STATUS_OPTIONS.todo;
                      const priorityInfo = KPI_PRIORITY_OPTIONS.find(p => p.value === job?.priority) || KPI_PRIORITY_OPTIONS[1];
                      return (
                        <tr key={assignment.id} className="hover:bg-premium-beige/5">
                          <td className="px-4 py-3">
                            <p className="font-medium">{job?.title || "Unknown Job"}</p>
                            {job?.description && (
                              <p className="mt-0.5 text-xs text-foreground-secondary line-clamp-1">{job.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-medium capitalize text-premium-beige">
                              {job?.category || "general"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground-secondary">
                            {formatDeadline(assignment.deadline)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {assignment.qualityScore > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star size={14} className="text-amber-500 fill-amber-500" />
                                <span className="text-sm font-medium">{assignment.qualityScore}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-foreground-secondary">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setSelectedJobDetail(job || null);
                                  setShowJobDetailModal(true);
                                }}
                                className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {canSubmitKpiJobAccess && assignment.status === "todo" && (
                                <button
                                  onClick={() => handleStartJob(assignment.id)}
                                  disabled={kpiJobsLoading}
                                  className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Start Job"
                                >
                                  <Clock size={16} />
                                </button>
                              )}
                              {canSubmitKpiJobAccess && ["in_progress", "revision"].includes(assignment.status) && (
                                <button
                                  onClick={() => openSubmitModal(assignment)}
                                  className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                                  title="Submit Job"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  }
                  // Admin mode
                  if (kpiJobs.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <Target size={32} className="mx-auto text-foreground-secondary/30" />
                          <p className="mt-3 text-sm font-medium text-foreground">Belum ada KPI Job</p>
                          <p className="mt-1 text-xs text-foreground-secondary">Klik "Create KPI Job" untuk membuat yang pertama</p>
                        </td>
                      </tr>
                    );
                  }
                  return kpiJobs.map((job) => {
                    const statusInfo = KPI_JOB_STATUS_OPTIONS[job.status] || KPI_JOB_STATUS_OPTIONS.draft;
                    const priorityInfo = KPI_PRIORITY_OPTIONS.find(p => p.value === job.priority) || KPI_PRIORITY_OPTIONS[1];
                    const assignmentCount = getAssignmentCountForJob(job.id);
                    const targetLabel = job.assignmentMode === "all_employees"
                      ? "All Employees"
                      : job.targetRoles.length > 0
                        ? job.targetRoles.map(r => KPI_ROLE_OPTIONS.find(opt => opt.value === r)?.label || r).join(", ")
                        : "Specific Employees";

                    return (
                      <tr key={job.id} className="hover:bg-premium-beige/5">
                        <td className="px-4 py-3">
                          <p className="font-medium">{job.title}</p>
                          {job.description && (
                            <p className="mt-0.5 text-xs text-foreground-secondary line-clamp-1">{job.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-medium capitalize text-premium-beige">
                            {job.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {targetLabel}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {formatDeadline(job.deadline)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                            <Target size={12} />
                            {assignmentCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => viewJobDetail(job)}
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* Assignment Review Table */}
          <div className="overflow-hidden rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="border-b border-border-line px-4 py-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Assignment Review</h4>
            </div>
            <table className="w-full min-w-[1100px]">
              <thead className="bg-premium-beige/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Quality</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-line">
                {kpiJobsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Loader2 size={26} className="mx-auto animate-spin text-premium-beige" />
                      <p className="mt-3 text-sm text-foreground-secondary">Memuat data assignments...</p>
                    </td>
                  </tr>
                ) : kpiJobAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <ClipboardEdit size={32} className="mx-auto text-foreground-secondary/30" />
                      <p className="mt-3 text-sm font-medium text-foreground">Belum ada assignment</p>
                      <p className="mt-1 text-xs text-foreground-secondary">Assignments akan muncul setelah KPI Job dibuat</p>
                    </td>
                  </tr>
                ) : (
                  kpiJobAssignments.map((assignment) => {
                    const statusInfo = KPI_STATUS_OPTIONS[assignment.status] || KPI_STATUS_OPTIONS.todo;
                    const job = getJobForAssignment(assignment.kpiJobId);
                    const submittedAt = assignment.submittedAt
                      ? new Date(assignment.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : "-";

                    return (
                      <tr key={assignment.id} className="hover:bg-premium-beige/5">
                        <td className="px-4 py-3">
                          <p className="font-medium">{getEmployeeName(assignment.employeeId)}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {getRoleLabel(assignment.role)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium line-clamp-1">{job?.title || "Unknown Job"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {formatDeadline(assignment.deadline)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {submittedAt}
                        </td>
                        <td className="px-4 py-3">
                          {assignment.qualityScore > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-amber-500 fill-amber-500" />
                              <span className="text-sm font-medium">{assignment.qualityScore}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-secondary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => viewJobDetail(job!)}
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10 hover:text-premium-beige"
                              title="View Job"
                            >
                              <Eye size={16} />
                            </button>
                            {canReviewKpiJobAccess && assignment.status === "submitted" && (
                              <>
                                <button
                                  onClick={() => openReviewModal(assignment, "approve")}
                                  className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => openReviewModal(assignment, "revision")}
                                  className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                                  title="Request Revision"
                                >
                                  <RotateCcw size={16} />
                                </button>
                                <button
                                  onClick={() => openReviewModal(assignment, "reject")}
                                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            {canReviewKpiJobAccess && (assignment.status === "approved" || assignment.status === "completed") && (
                              <button
                                onClick={() => openReviewModal(assignment, "revision")}
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                title="Edit Score"
                              >
                                <Star size={16} />
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
        </div>
      )}

      {/* Create KPI Job Modal */}
      {showCreateJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                Create KPI Job
              </h3>
              <button onClick={closeCreateJobModal} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>

            {createSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-emerald-50 p-4">
                  <Check size={32} className="text-emerald-600" />
                </div>
                <p className="mt-4 text-lg font-medium text-emerald-700">{createSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateKpiJob} className="space-y-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input
                    type="text"
                    value={kpiJobFormData.title}
                    onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, title: e.target.value })}
                    className={inputClassName}
                    placeholder="Contoh: Monthly Attendance Report"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={kpiJobFormData.description}
                    onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, description: e.target.value })}
                    className={`${inputClassName} min-h-[80px] resize-none`}
                    placeholder="Deskripsi tugas KPI..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Category</label>
                    <select
                      value={kpiJobFormData.category}
                      onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, category: e.target.value })}
                      className={inputClassName}
                    >
                      {KPI_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Assignment Mode</label>
                    <select
                      value={kpiJobFormData.assignmentMode}
                      onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, assignmentMode: e.target.value as KpiAssignmentMode, targetRoles: [], targetEmployeeIds: [] })}
                      className={inputClassName}
                    >
                      {KPI_ASSIGNMENT_MODE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(kpiJobFormData.assignmentMode === "specific_role" || kpiJobFormData.assignmentMode === "multiple_roles") && (
                  <div>
                    <label className={labelClass}>Target Roles</label>
                    <div className="flex flex-wrap gap-2 rounded-lg border border-border-line bg-white p-3">
                      {KPI_ROLE_OPTIONS.map((role) => (
                        <label key={role.value} className="inline-flex items-center gap-2 rounded-lg bg-premium-beige/5 px-3 py-2 cursor-pointer hover:bg-premium-beige/10 transition">
                          <input
                            type="checkbox"
                            checked={kpiJobFormData.targetRoles.includes(role.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setKpiJobFormData({ ...kpiJobFormData, targetRoles: [...kpiJobFormData.targetRoles, role.value] });
                              } else {
                                setKpiJobFormData({ ...kpiJobFormData, targetRoles: kpiJobFormData.targetRoles.filter(r => r !== role.value) });
                              }
                            }}
                            className="rounded border-border-line text-premium-beige focus:ring-premium-beige"
                          />
                          <span className="text-sm">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {(kpiJobFormData.assignmentMode === "specific_employee" || kpiJobFormData.assignmentMode === "multiple_employees") && (
                  <div>
                    <label className={labelClass}>Target Employees</label>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-border-line bg-white p-3">
                      {safeEmployees.filter(e => e.isActive).map((employee) => (
                        <label key={employee.id} className="inline-flex items-center gap-2 py-1.5 pr-3 cursor-pointer hover:bg-premium-beige/5 w-full">
                          <input
                            type="checkbox"
                            checked={kpiJobFormData.targetEmployeeIds.includes(employee.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setKpiJobFormData({ ...kpiJobFormData, targetEmployeeIds: [...kpiJobFormData.targetEmployeeIds, employee.id] });
                              } else {
                                setKpiJobFormData({ ...kpiJobFormData, targetEmployeeIds: kpiJobFormData.targetEmployeeIds.filter(id => id !== employee.id) });
                              }
                            }}
                            className="rounded border-border-line text-premium-beige focus:ring-premium-beige"
                          />
                          <span className="text-sm">{employee.name}</span>
                          <span className="text-xs text-foreground-secondary">({ROLE_LABELS[employee.role]})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Priority</label>
                    <select
                      value={kpiJobFormData.priority}
                      onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, priority: e.target.value as KpiJobPriority })}
                      className={inputClassName}
                    >
                      {KPI_PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Weight</label>
                    <input
                      type="number"
                      value={kpiJobFormData.weight}
                      onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, weight: Number(e.target.value) })}
                      className={inputClassName}
                      min={1}
                      max={10}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>Deadline</label>
                    <input
                      type="date"
                      value={kpiJobFormData.deadline}
                      onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, deadline: e.target.value })}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Period Month</label>
                    <select
                      value={kpiJobFormData.periodMonth || ""}
                      onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, periodMonth: e.target.value ? Number(e.target.value) : null })}
                      className={inputClassName}
                    >
                      <option value="">-</option>
                      {MONTH_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Period Year</label>
                    <select
                      value={kpiJobFormData.periodYear || ""}
                      onChange={(e) => setKpiJobFormData({ ...kpiJobFormData, periodYear: e.target.value ? Number(e.target.value) : null })}
                      className={inputClassName}
                    >
                      <option value="">-</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCreateJobModal}
                    className="flex-1 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createJobLoading || !kpiJobFormData.title}
                    className="flex-1 rounded-lg bg-dark-premium px-4 py-2.5 text-sm font-medium text-white hover:bg-dark-premium/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createJobLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Create KPI Job"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Review Assignment Modal */}
      {showReviewModal && selectedAssignment && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {reviewAction === "approve" ? "Approve Assignment" : reviewAction === "revision" ? "Request Revision" : "Reject Assignment"}
              </h3>
              <button onClick={closeReviewModal} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border-line bg-background-soft p-3">
                <p className="text-sm text-foreground-secondary">Staff</p>
                <p className="font-medium">{getEmployeeName(selectedAssignment.employeeId)}</p>
                <p className="mt-1 text-sm text-foreground-secondary">Job</p>
                <p className="font-medium">{getJobForAssignment(selectedAssignment.kpiJobId)?.title || "Unknown"}</p>
              </div>

              <div>
                <label className={labelClass}>Quality Score (0-100)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={reviewQualityScore}
                    onChange={(e) => setReviewQualityScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className={inputClassName}
                    min={0}
                    max={100}
                  />
                  <Star size={20} className="text-amber-500 fill-amber-500" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Review Note</label>
                <textarea
                  value={reviewNoteText}
                  onChange={(e) => setReviewNoteText(e.target.value)}
                  className={`${inputClassName} min-h-[100px] resize-none`}
                  placeholder={reviewAction === "approve" ? "Catatan persetujuan..." : reviewAction === "revision" ? "Catatan revisi yang diperlukan..." : "Alasan penolakan..."}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="flex-1 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={reviewLoading}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    reviewAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" :
                    reviewAction === "revision" ? "bg-amber-600 hover:bg-amber-700" :
                    "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {reviewLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> :
                    reviewAction === "approve" ? "Approve" :
                    reviewAction === "revision" ? "Request Revision" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {showJobDetailModal && selectedJobDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-premium-beige">KPI Job Detail</p>
                <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedJobDetail.title}
                </h3>
              </div>
              <button onClick={closeJobDetailModal} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Category</p>
                  <p className="mt-1 font-medium capitalize">{selectedJobDetail.category}</p>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Assignment Mode</p>
                  <p className="mt-1 font-medium">
                    {KPI_ASSIGNMENT_MODE_OPTIONS.find(o => o.value === selectedJobDetail.assignmentMode)?.label || selectedJobDetail.assignmentMode}
                  </p>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Priority</p>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    KPI_PRIORITY_OPTIONS.find(p => p.value === selectedJobDetail.priority)?.bg || "bg-slate-50"
                  } ${KPI_PRIORITY_OPTIONS.find(p => p.value === selectedJobDetail.priority)?.color || "text-slate-600"}`}>
                    {KPI_PRIORITY_OPTIONS.find(p => p.value === selectedJobDetail.priority)?.label || selectedJobDetail.priority}
                  </span>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Weight</p>
                  <p className="mt-1 text-xl font-bold">{selectedJobDetail.weight}</p>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Deadline</p>
                  <p className="mt-1 font-medium">{formatDeadline(selectedJobDetail.deadline)}</p>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Status</p>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    KPI_JOB_STATUS_OPTIONS[selectedJobDetail.status]?.bg || "bg-slate-50"
                  } ${KPI_JOB_STATUS_OPTIONS[selectedJobDetail.status]?.color || "text-slate-600"}`}>
                    {KPI_JOB_STATUS_OPTIONS[selectedJobDetail.status]?.label || selectedJobDetail.status}
                  </span>
                </div>
              </div>

              {selectedJobDetail.description && (
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Description</p>
                  <p className="mt-1 text-sm leading-relaxed">{selectedJobDetail.description}</p>
                </div>
              )}

              {selectedJobDetail.targetRoles.length > 0 && (
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Target Roles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedJobDetail.targetRoles.map((role) => (
                      <span key={role} className="inline-flex rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-medium text-premium-beige">
                        {KPI_ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Period</p>
                <p className="mt-1 font-medium">
                  {selectedJobDetail.periodMonth && selectedJobDetail.periodYear
                    ? `${MONTH_OPTIONS.find(m => m.value === selectedJobDetail.periodMonth)?.label || selectedJobDetail.periodMonth} ${selectedJobDetail.periodYear}`
                    : selectedJobDetail.periodMonth
                      ? MONTH_OPTIONS.find(m => m.value === selectedJobDetail.periodMonth)?.label || selectedJobDetail.periodMonth
                      : selectedJobDetail.periodYear
                        ? selectedJobDetail.periodYear.toString()
                        : "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Total Assignments</p>
                <p className="mt-1 text-xl font-bold">{getAssignmentCountForJob(selectedJobDetail.id)}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeJobDetailModal}
                className="rounded-lg border border-border-line bg-white px-6 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
              >
                Close
              </button>
            </div>
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
                  ["Job Completion", "35%", selectedKpi.taskCompletionScore],
                  ["Deadline Score", "25%", selectedKpi.deadlineScore],
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
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Job Summary</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-foreground-secondary">Total Jobs</p><p className="font-bold">{selectedBreakdown.jobSummary?.total || 0}</p></div>
                      <div><p className="text-foreground-secondary">Completed</p><p className="font-bold">{selectedBreakdown.jobSummary?.completed || 0}</p></div>
                      <div><p className="text-foreground-secondary">In Progress</p><p className="font-bold">{selectedBreakdown.jobSummary?.inProgress || 0}</p></div>
                      <div><p className="text-foreground-secondary">Overdue</p><p className="font-bold">{selectedBreakdown.jobSummary?.overdue || 0}</p></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border-line p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Quality Summary</p>
                    <p className="mt-3 text-sm text-foreground-secondary">KPI Jobs Avg Score</p>
                    <p className="mt-1 text-2xl font-bold">{selectedBreakdown.jobSummary?.averageQualityScore || 0}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Staff Tasks Summary</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-foreground-secondary">Total Tasks</p><p className="font-bold">{selectedBreakdown.taskSummary.total}</p></div>
                    <div><p className="text-foreground-secondary">Completed</p><p className="font-bold">{selectedBreakdown.taskSummary.completed}</p></div>
                    <div><p className="text-foreground-secondary">Overdue</p><p className="font-bold">{selectedBreakdown.taskSummary.overdue}</p></div>
                    <div><p className="text-foreground-secondary">Revision</p><p className="font-bold">{selectedBreakdown.taskSummary.revision}</p></div>
                  </div>
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

      {/* Submit Job Modal */}
      {showSubmitModal && submitAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                Submit Job
              </h3>
              <button onClick={closeSubmitModal} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border-line bg-background-soft p-3">
                <p className="text-sm text-foreground-secondary">Job</p>
                <p className="font-medium">{kpiJobs.find(j => j.id === submitAssignment.kpiJobId)?.title || "Unknown Job"}</p>
                <p className="mt-2 text-sm text-foreground-secondary">Deadline</p>
                <p className="font-medium">{formatDeadline(submitAssignment.deadline)}</p>
                {submitAssignment.reviewNote && (
                  <>
                    <p className="mt-2 text-sm text-foreground-secondary">Review Note dari Admin</p>
                    <p className="mt-1 text-sm text-amber-600">{submitAssignment.reviewNote}</p>
                  </>
                )}
              </div>

              <div>
                <label className={labelClass}>Submission Note</label>
                <textarea
                  value={submissionFormData.submissionNote}
                  onChange={(e) => setSubmissionFormData({ ...submissionFormData, submissionNote: e.target.value })}
                  className={`${inputClassName} min-h-[100px] resize-none`}
                  placeholder="Jelaskan hasil pekerjaan Anda..."
                />
              </div>

              <div>
                <label className={labelClass}>Submission URL (Optional)</label>
                <input
                  type="url"
                  value={submissionFormData.submissionUrl}
                  onChange={(e) => setSubmissionFormData({ ...submissionFormData, submissionUrl: e.target.value })}
                  className={inputClassName}
                  placeholder="https://drive.google.com/... atau link portfolio"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeSubmitModal}
                  className="flex-1 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitJob}
                  disabled={submitLoading}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Submit Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal - enhanced with assignment details for staff */}
      {showJobDetailModal && selectedJobDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-premium-beige">KPI Job Detail</p>
                <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedJobDetail.title}
                </h3>
              </div>
              <button onClick={closeJobDetailModal} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Show assignment-specific details if viewing from staff perspective */}
              {selectedAssignment && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-purple-600">Status Saya</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-foreground-secondary">Status</p>
                      <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        KPI_STATUS_OPTIONS[selectedAssignment.status]?.bg || "bg-slate-100"
                      } ${KPI_STATUS_OPTIONS[selectedAssignment.status]?.color || "text-slate-600"}`}>
                        {KPI_STATUS_OPTIONS[selectedAssignment.status]?.label || selectedAssignment.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-secondary">Deadline</p>
                      <p className="mt-1 font-medium">{formatDeadline(selectedAssignment.deadline)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-secondary">Quality Score</p>
                      {selectedAssignment.qualityScore > 0 ? (
                        <div className="mt-1 flex items-center gap-1">
                          <Star size={16} className="text-amber-500 fill-amber-500" />
                          <span className="font-bold">{selectedAssignment.qualityScore}</span>
                        </div>
                      ) : (
                        <p className="mt-1 font-medium text-foreground-secondary">Belum di-review</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-foreground-secondary">Submitted At</p>
                      <p className="mt-1 font-medium">
                        {selectedAssignment.submittedAt
                          ? new Date(selectedAssignment.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {selectedAssignment.submissionNote && (
                    <div className="mt-4">
                      <p className="text-xs text-foreground-secondary">Submission Note</p>
                      <p className="mt-1 text-sm leading-relaxed">{selectedAssignment.submissionNote}</p>
                    </div>
                  )}

                  {selectedAssignment.submissionUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-foreground-secondary">Submission URL</p>
                      <a href={selectedAssignment.submissionUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-blue-600 hover:text-blue-700 hover:underline">
                        {selectedAssignment.submissionUrl}
                      </a>
                    </div>
                  )}

                  {selectedAssignment.reviewNote && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-600">Review Note</p>
                      <p className="mt-1 text-sm text-amber-700">{selectedAssignment.reviewNote}</p>
                    </div>
                  )}

                  {/* Score breakdown */}
                  {selectedAssignment.finalScore > 0 && (
                    <div className="mt-4 rounded-lg border border-border-line bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-secondary">Score Breakdown</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <div className="text-center">
                          <p className="text-xs text-foreground-secondary">Completion</p>
                          <p className="mt-1 text-lg font-bold">{selectedAssignment.completionScore}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-foreground-secondary">Deadline</p>
                          <p className="mt-1 text-lg font-bold">{selectedAssignment.deadlineScore}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-foreground-secondary">Quality</p>
                          <p className="mt-1 text-lg font-bold">{selectedAssignment.qualityScore}</p>
                        </div>
                        <div className="text-center rounded-lg bg-premium-beige/10 p-2">
                          <p className="text-xs text-foreground-secondary">Final</p>
                          <p className="mt-1 text-lg font-bold text-premium-beige">{selectedAssignment.finalScore}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Category</p>
                  <p className="mt-1 font-medium capitalize">{selectedJobDetail.category}</p>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Assignment Mode</p>
                  <p className="mt-1 font-medium">
                    {KPI_ASSIGNMENT_MODE_OPTIONS.find(o => o.value === selectedJobDetail.assignmentMode)?.label || selectedJobDetail.assignmentMode}
                  </p>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Priority</p>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    KPI_PRIORITY_OPTIONS.find(p => p.value === selectedJobDetail.priority)?.bg || "bg-slate-50"
                  } ${KPI_PRIORITY_OPTIONS.find(p => p.value === selectedJobDetail.priority)?.color || "text-slate-600"}`}>
                    {KPI_PRIORITY_OPTIONS.find(p => p.value === selectedJobDetail.priority)?.label || selectedJobDetail.priority}
                  </span>
                </div>
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Weight</p>
                  <p className="mt-1 text-xl font-bold">{selectedJobDetail.weight}</p>
                </div>
              </div>

              {selectedJobDetail.description && (
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Description</p>
                  <p className="mt-1 text-sm leading-relaxed">{selectedJobDetail.description}</p>
                </div>
              )}

              {selectedJobDetail.targetRoles.length > 0 && (
                <div className="rounded-xl border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Target Roles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedJobDetail.targetRoles.map((role) => (
                      <span key={role} className="inline-flex rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-medium text-premium-beige">
                        {KPI_ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeJobDetailModal}
                className="rounded-lg border border-border-line bg-white px-6 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
              >
                Close
              </button>
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
