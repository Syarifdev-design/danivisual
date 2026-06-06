import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  X,
  Save,
  ExternalLink,
  MessageCircle,
  Image,
  AlertCircle,
  Plus,
  ListTodo,
  Trash2,
  Edit2,
  User,
  Link as LinkIcon,
  Loader2,
  Shield,
} from "lucide-react";
import { useAdmin } from "../../contexts/AdminContext";
import { useEmployees } from "../../contexts/EmployeesContext";
import {
  useAuth,
  useIsSuperAdmin,
  canViewAllTasks,
  canManageAllTasks,
  canApproveTasks,
  canUpdateOwnTasks,
  canViewTasks,
  isOperationalStaffRole,
  useEmployeeIdWarning,
} from "../../contexts/AuthContext";
import AdminStatusBadge from "../../admin/components/AdminStatusBadge";
import type { PhotoSelection } from "../../contexts/CustomerContext";
import {
  customerChatToAdmin,
  sendProductionUpdate,
  sendPhotoSelectionReminder,
  sendGoogleDriveLink,
} from "../../data/bookingData";
import {
  getProductionRecords,
  getProductionRecord,
  createProductionRecordFromBooking,
  updateProductionStep as updateProductionStepService,
  updateProductionLinks as updateProductionLinksService,
  type ProductionRecord,
  type ProductionStepStatus,
} from "../../../services/productionService";
import {
  getTasks as getTasksService,
  getTasksByEmployee as getTasksByEmployeeService,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  startTask as startTaskService,
  submitTask as submitTaskService,
  requestRevision as requestRevisionService,
  completeTask as completeTaskService,
  getTasksByBooking as getTasksByBookingService,
  STATUS_CONFIG as TASK_STATUS_CONFIG,
  PRIORITY_CONFIG,
  type StaffTask,
  type TaskStatus,
  type TaskPriority,
  type CreateTaskData,
} from "../../../services/staffTaskService";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Production step types - imported from productionService
// Re-export for backward compatibility
export type { ProductionStepStatus } from "../../../services/productionService";

// Default production record - imported from service
const defaultProductionRecord: Omit<ProductionRecord, "bookingId" | "orderNumber" | "customerName" | "customerPhone" | "packageName" | "eventDate" | "eventLocation"> = {
  steps: {
    pelunasan: { id: "pelunasan", name: "Pelunasan & Sneak Peek", status: "waiting" as ProductionStepStatus, note: "", estimatedDate: null, completedAt: null },
    photoSorting: { id: "photoSorting", name: "Photo Sorting", status: "waiting" as ProductionStepStatus, note: "", estimatedDate: null, completedAt: null },
    editing: { id: "editing", name: "Editing", status: "waiting" as ProductionStepStatus, note: "", estimatedDate: null, completedAt: null },
    printing: { id: "printing", name: "Cetak", status: "waiting" as ProductionStepStatus, note: "", estimatedDate: null, completedAt: null },
    finishing: { id: "finishing", name: "Finishing", status: "waiting" as ProductionStepStatus, note: "", estimatedDate: null, completedAt: null },
    delivery: { id: "delivery", name: "Delivery", status: "waiting" as ProductionStepStatus, note: "", estimatedDate: null, completedAt: null },
  }
};
const productionStatusFilters = [
  { value: "all", label: "Semua" },
  { value: "waiting", label: "Waiting" },
  { value: "photo_sorting", label: "Photo Sorting" },
  { value: "editing", label: "Editing" },
  { value: "printing", label: "Printing" },
  { value: "finishing", label: "Finishing" },
  { value: "delivery", label: "Delivery" },
  { value: "completed", label: "Completed" },
];

const stepStatusConfig: Record<ProductionStepStatus, { label: string; tone: "neutral" | "gold" | "success" | "warning" | "danger" }> = {
  waiting: { label: "Waiting", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
};

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";
const inputClass = "flex-1 rounded-lg border border-border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-secondary";

export default function ProductionPage() {
  const { bookings, updateBooking } = useAdmin();
  const { employees } = useEmployees();
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();

  // SECURITY: Get role-based permissions
  const userRole = user?.role || "staff";
  const canViewAll = canViewAllTasks(userRole);
  const canManageAll = canManageAllTasks(userRole);
  const canApprove = canApproveTasks(userRole);
  const canUpdateOwn = canUpdateOwnTasks(userRole);
  const canViewTaskList = canViewTasks(userRole);

  // SECURITY: Use employeeId from AuthContext for filtering
  const staffEmployeeId = user?.employeeId;
  const hasEmployeeIdWarning = useEmployeeIdWarning();

  // Production records state
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task state
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [taskFilter, setTaskFilter] = useState<"all" | TaskStatus>("all");
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<CreateTaskData & { assignedToName: string }>({
    title: "",
    description: "",
    assignedToId: "",
    assignedToName: "",
    priority: "medium",
    deadline: new Date().toISOString().split("T")[0],
  });
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskAction, setTaskAction] = useState<"start" | "submit" | "revision" | "complete" | null>(null);
  const [actionNote, setActionNote] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<ProductionRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: "waiting" as ProductionStepStatus, note: "", estimatedDate: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Load production records and tasks on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const records = await getProductionRecords();

        // SECURITY: Load tasks based on role
        let taskData: StaffTask[] = [];
        if (canViewAll) {
          // Admin: load all tasks
          taskData = await getTasksService();
        } else if (canUpdateOwn && staffEmployeeId) {
          // Staff: load only their own tasks
          taskData = await getTasksByEmployeeService(staffEmployeeId);
        }

        setProductionRecords(records || []);
        setTasks(taskData || []);
      } catch (err) {
        console.error("[ProductionPage] Failed to load data:", err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [canViewAll, canUpdateOwn, staffEmployeeId]); // Reload when permissions change

  // Get linked employee for the current user
  const getLinkedEmployeeId = useCallback(() => {
    if (!user || !employees) return null;
    // Priority 1: Use employeeId from AuthContext
    if (user.employeeId) return user.employeeId;
    // Fallback: find by email or id
    const userEmail = (user.email || "").toLowerCase();
    const employee = employees.find((e: { id: string; email: string; userId?: string; user_id?: string }) =>
      e.id === user.id ||
      e.userId === user.id ||
      e.user_id === user.id ||
      (userEmail && (e.email || "").toLowerCase() === userEmail)
    );
    return employee?.id || null;
  }, [user, employees]);

  // Sync bookings to production records - create missing records via service
  useEffect(() => {
    if (bookings.length === 0 || loading) return;

    const confirmedBookings = bookings.filter(b =>
      b.status === "confirmed" || b.status === "in_progress" || b.status === "completed"
    );

    // Create missing production records
    const createMissingRecords = async () => {
      const existingBookingIds = new Set(productionRecords.map(r => r.bookingId));
      const newRecords: ProductionRecord[] = [];

      for (const booking of confirmedBookings) {
        if (!existingBookingIds.has(booking.id)) {
          // Create new record via service
          const newRecord = await createProductionRecordFromBooking({
            id: booking.id,
            orderNumber: booking.orderNumber,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            packageName: booking.packageName,
            eventDate: booking.eventDate,
            eventLocation: booking.eventLocation,
          });
          if (newRecord) {
            newRecords.push(newRecord);
          }
        }
      }

      if (newRecords.length > 0) {
        setProductionRecords(prev => [...prev, ...newRecords]);
      }
    };

    createMissingRecords();
  }, [bookings, loading]);

  // Get current production status for a record
  const getCurrentProductionStatus = (record: ProductionRecord): string => {
    const stepOrder = ["pelunasan", "photoSorting", "editing", "printing", "finishing", "delivery"];
    for (const stepId of stepOrder) {
      const step = record.steps[stepId as keyof typeof record.steps];
      if (step.status === "in_progress") return stepId;
      if (step.status === "waiting") return stepId;
    }
    return "completed";
  };

  // Filter production records
  const filteredRecords = useMemo(() => {
    return productionRecords.filter((record) => {
      // Search filter
      const matchesSearch =
        record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.customerPhone.includes(searchQuery);

      // Status filter
      const currentStatus = getCurrentProductionStatus(record);
      const matchesStatus = statusFilter === "all" || currentStatus === statusFilter ||
        (statusFilter === "completed" && record.steps.delivery.status === "completed");

      return matchesSearch && matchesStatus;
    });
  }, [productionRecords, searchQuery, statusFilter]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (taskFilter !== "all" && task.status !== taskFilter) return false;
      return true;
    });
  }, [tasks, taskFilter]);

  // Open task modal for new task
  const openNewTask = () => {
    setSelectedTask(null);
    setTaskForm({
      title: "",
      description: "",
      assignedToId: "",
      assignedToName: "",
      priority: "medium",
      deadline: new Date().toISOString().split("T")[0],
    });
    setTaskAction(null);
    setActionNote("");
    setShowTaskModal(true);
  };

  // Open task detail
  const openTaskDetail = (task: StaffTask) => {
    setSelectedTask(task);
    setTaskAction(null);
    setActionNote("");
    setShowTaskModal(true);
  };

  // Save task - with role-based permission check
  const saveTask = async () => {
    if (!taskForm.title || !taskForm.assignedToId || !taskForm.deadline) return;

    // SECURITY: Only admin can create tasks
    if (!selectedTask && !canManageAll) {
      alert("Anda tidak memiliki izin untuk membuat tugas.");
      return;
    }

    // SECURITY: Staff can only update their own tasks
    if (selectedTask && selectedTask.assignedToId !== staffEmployeeId && !canManageAll) {
      alert("Anda tidak dapat mengubah tugas orang lain.");
      return;
    }

    // SECURITY: Staff can only use "start" and "submit" actions
    if (selectedTask && taskAction && !canApprove) {
      if (taskAction === "revision" || taskAction === "complete") {
        alert("Anda tidak memiliki izin untuk menyelesaikan tugas. Hubungi admin.");
        return;
      }
    }

    setTaskSubmitting(true);
    try {
      if (selectedTask) {
        // Update existing task - handle status actions
        if (taskAction === "start") {
          await startTaskService(selectedTask.id);
        } else if (taskAction === "submit") {
          await submitTaskService(selectedTask.id, actionNote);
        } else if (taskAction === "revision") {
          await requestRevisionService(selectedTask.id, actionNote);
        } else if (taskAction === "complete") {
          await completeTaskService(selectedTask.id);
        } else {
          await updateTaskService(selectedTask.id, { title: taskForm.title, description: taskForm.description });
        }
      } else {
        // Create new task (admin only)
        await createTaskService(taskForm, user?.id || "admin", user?.name || "Admin");
      }

      // Reload tasks based on role
      const updatedTasks = canViewAll
        ? await getTasksService()
        : canUpdateOwn && staffEmployeeId
        ? await getTasksByEmployeeService(staffEmployeeId)
        : [];
      setTasks(updatedTasks);

      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (err) {
      console.error("Task operation failed:", err);
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Delete task - with permission check
  const handleDeleteTask = async (id: string) => {
    // SECURITY: Only admin can delete tasks
    if (!canManageAll) {
      alert("Anda tidak memiliki izin untuk menghapus tugas.");
      return;
    }

    if (!confirm("Hapus tugas ini?")) return;

    await deleteTaskService(id);

    // Reload tasks based on role
    const updatedTasks = canViewAll
      ? await getTasksService()
      : canUpdateOwn && staffEmployeeId
      ? await getTasksByEmployeeService(staffEmployeeId)
      : [];
    setTasks(updatedTasks);

    setShowTaskModal(false);
    setSelectedTask(null);
  };

  // Quick task actions from task list - with permission check
  const quickAction = async (task: StaffTask, action: "start" | "submit" | "complete") => {
    try {
      // SECURITY: Staff can only start/submit their own tasks
      if (task.assignedToId !== staffEmployeeId && !canManageAll) {
        alert("Anda tidak dapat mengubah tugas orang lain.");
        return;
      }

      // SECURITY: Staff cannot use "complete" action
      if (action === "complete" && !canApprove) {
        alert("Anda tidak memiliki izin untuk menyelesaikan tugas.");
        return;
      }

      if (action === "start") {
        await startTaskService(task.id);
      } else if (action === "submit") {
        setSelectedTask(task);
        setTaskAction("submit");
        setActionNote("");
        setShowTaskModal(true);
        return; // Return early, modal will handle the rest
      } else if (action === "complete") {
        await completeTaskService(task.id);
      }

      // Reload tasks based on role
      const updatedTasks = canViewAll
        ? await getTasksService()
        : canUpdateOwn && staffEmployeeId
        ? await getTasksByEmployeeService(staffEmployeeId)
        : [];
      setTasks(updatedTasks);
    } catch (err) {
      console.error("Quick action failed:", err);
    }
  };

  // Open detail modal
  const openDetail = (record: ProductionRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
    setEditingStep(null);
  };

  // Close detail modal
  const closeDetail = () => {
    setSelectedRecord(null);
    setIsDetailOpen(false);
    setEditingStep(null);
  };

  // Start editing a step
  const startEditStep = (stepId: string) => {
    if (!selectedRecord) return;
    const step = selectedRecord.steps[stepId as keyof typeof selectedRecord.steps];
    setEditingStep(stepId);
    setEditForm({
      status: step.status,
      note: step.note,
      estimatedDate: step.estimatedDate || "",
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingStep(null);
    setEditForm({ status: "waiting", note: "", estimatedDate: "" });
  };

  // Save step update via service
  const saveStep = async () => {
    if (!selectedRecord || !editingStep) return;

    setIsSaving(true);

    const stepKey = editingStep as keyof ProductionRecord["steps"];

    // Update via service
    const updated = await updateProductionStepService(selectedRecord.bookingId, stepKey, {
      status: editForm.status,
      note: editForm.note,
      estimatedDate: editForm.estimatedDate || null,
    });

    if (updated) {
      // Update local state
      setProductionRecords(prev =>
        prev.map(r => r.bookingId === selectedRecord.bookingId ? updated : r)
      );
      setSelectedRecord(updated);
    }

    setEditingStep(null);
    setIsSaving(false);
  };

  // Update Google Drive link via service
  const updateGoogleDriveLink = async (link: string) => {
    if (!selectedRecord) return;

    const updated = await updateProductionLinksService(selectedRecord.bookingId, {
      googleDriveLink: link || null,
    });

    if (updated) {
      setProductionRecords(prev =>
        prev.map(r => r.bookingId === selectedRecord.bookingId ? updated : r)
      );
      setSelectedRecord(updated);
    }
  };

  // Update customer notes via service
  const updateCustomerNotes = async (notes: string) => {
    if (!selectedRecord) return;

    const updated = await updateProductionLinksService(selectedRecord.bookingId, {
      customerNotes: notes,
    });

    if (updated) {
      setProductionRecords(prev =>
        prev.map(r => r.bookingId === selectedRecord.bookingId ? updated : r)
      );
      setSelectedRecord(updated);
    }
  };

  // Update gallery link via service
  const updateGalleryLink = async (link: string) => {
    if (!selectedRecord) return;

    const updated = await updateProductionLinksService(selectedRecord.bookingId, {
      galleryLink: link || null,
    });

    if (updated) {
      setProductionRecords(prev =>
        prev.map(r => r.bookingId === selectedRecord.bookingId ? updated : r)
      );
      setSelectedRecord(updated);
    }
  };

  // Get photo selections for a booking
  const getPhotoSelections = (bookingId: string): PhotoSelection | null => {
    try {
      const stored = localStorage.getItem("danivisual_photo_selections");
      if (stored) {
        const selections = JSON.parse(stored);
        return selections.find((s: PhotoSelection) => s.bookingId === bookingId) || null;
      }
    } catch { }
    return null;
  };

  // Approve photo selection
  const approvePhotoSelection = (bookingId: string) => {
    try {
      const stored = localStorage.getItem("danivisual_photo_selections");
      if (stored) {
        const selections = JSON.parse(stored);
        const index = selections.findIndex((s: PhotoSelection) => s.bookingId === bookingId);
        if (index >= 0) {
          selections[index] = {
            ...selections[index],
            status: "approved",
            approvedAt: new Date().toISOString(),
            approvedBy: "admin",
          };
          localStorage.setItem("danivisual_photo_selections", JSON.stringify(selections));
          // Refresh selected record
          setSelectedRecord({ ...selectedRecord });
        }
      }
    } catch { }
  };

  // Calculate progress percentage
  const getProgressPercentage = (record: ProductionRecord): number => {
    const steps = Object.values(record.steps);
    const completedCount = steps.filter(s => s.status === "completed").length;
    return Math.round((completedCount / steps.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Production Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Production</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola alur produksi dari pelunasan, sorting, editing, cetak, finishing, sampai delivery.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-3 rounded-full border border-border-line bg-white px-4 py-2">
              <span className="text-xs text-foreground-secondary">
                {filteredRecords.length} project
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-12 text-center shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-premium-beige/20 border-t-premium-beige"></div>
          <p className="mt-4 text-sm text-foreground-secondary">Memuat data production...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle size={16} />
            {error}
          </p>
        </div>
      )}

      {/* Access Denied - Customer */}
      {!canViewTaskList && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <Shield size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-red-700">Access Denied</h2>
          <p className="mt-2 text-sm text-red-600">
            Anda tidak memiliki akses ke halaman Production Tasks.
          </p>
        </div>
      )}

      {/* Employee ID Warning for Staff */}
      {hasEmployeeIdWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          ⚠️ Profil staff belum terhubung. Hubungi admin untuk menghubungkan akun Anda dengan profil employee agar bisa mengakses task.
        </div>
      )}

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
            {productionStatusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
                  statusFilter === filter.value
                    ? "border-premium-beige/45 bg-premium-beige/10 text-foreground"
                    : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige/45 hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Production List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-12 text-center shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <Package size={48} className="mx-auto text-border-line" />
            <p className="mt-4 text-sm text-foreground-secondary">Belum ada project production</p>
            <p className="mt-1 text-xs text-foreground-secondary">
              Project akan muncul setelah booking dikonfirmasi
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const currentStatus = getCurrentProductionStatus(record);
            const progress = getProgressPercentage(record);
            const isCompleted = record.steps.delivery.status === "completed";

            return (
              <div
                key={record.bookingId}
                className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] hover:border-premium-beige/45 transition cursor-pointer"
                onClick={() => openDetail(record)}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{record.orderNumber}</span>
                      <span className="text-xs text-foreground-secondary">•</span>
                      <span className="text-sm">{record.customerName}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-secondary">
                      <span className="flex items-center gap-1">
                        <Package size={12} /> {record.packageName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(record.eventDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {record.eventLocation}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-secondary">Status</p>
                      <AdminStatusBadge tone={isCompleted ? "success" : currentStatus === "editing" || currentStatus === "printing" ? "warning" : "neutral"}>
                        {isCompleted ? "Completed" : currentStatus === "pelunasan" ? "Pelunasan" : currentStatus === "photo_sorting" ? "Photo Sorting" : currentStatus === "editing" ? "Editing" : currentStatus === "printing" ? "Printing" : currentStatus === "finishing" ? "Finishing" : currentStatus === "delivery" ? "Delivery" : "Waiting"}
                      </AdminStatusBadge>
                    </div>

                    {/* Progress */}
                    <div className="hidden sm:block">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-secondary">Progress</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-border-line">
                          <div
                            className="h-full bg-premium-beige transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{progress}%</span>
                      </div>
                    </div>

                    <Eye size={18} className="text-foreground-secondary" />
                  </div>
                </div>

                {/* Step Progress Bar */}
                <div className="mt-4 flex items-center gap-1">
                  {Object.entries(record.steps).map(([key, step], index) => (
                    <div key={key} className="flex flex-1 items-center">
                      <div className={`h-6 flex-1 rounded-sm transition-all ${
                        step.status === "completed"
                          ? "bg-premium-beige"
                          : step.status === "in_progress"
                          ? "bg-premium-beige/50 animate-pulse"
                          : "bg-border-line"
                      }`} />
                      {index < 5 && <div className="h-px w-2 bg-border-line" />}
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[9px] text-foreground-secondary">
                  <span>P</span>
                  <span>S</span>
                  <span>E</span>
                  <span>C</span>
                  <span>F</span>
                  <span>D</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-border-line bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Production Detail</p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                    {selectedRecord.orderNumber}
                  </h3>
                  <p className="text-sm text-foreground-secondary">{selectedRecord.customerName} • {selectedRecord.packageName}</p>
                </div>
                <button
                  onClick={closeDetail}
                  className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Info Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-border-line bg-background-soft p-4 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-secondary">Customer</p>
                  <p className="mt-1 text-sm font-semibold">{selectedRecord.customerName}</p>
                  <p className="text-xs text-foreground-secondary">{selectedRecord.customerPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-secondary">Event</p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(selectedRecord.eventDate)}</p>
                  <p className="text-xs text-foreground-secondary">{selectedRecord.eventLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-secondary">Package</p>
                  <p className="mt-1 text-sm font-semibold">{selectedRecord.packageName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-secondary">Progress</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border-line">
                      <div
                        className="h-full bg-premium-beige transition-all"
                        style={{ width: `${getProgressPercentage(selectedRecord)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{getProgressPercentage(selectedRecord)}%</span>
                  </div>
                </div>
              </div>

              {/* Production Steps */}
              <div className="mb-6">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-secondary">
                  Production Steps
                </h4>
                <div className="space-y-3">
                  {Object.entries(selectedRecord.steps).map(([key, step]) => {
                    const stepConfig = stepStatusConfig[step.status];
                    const isEditing = editingStep === key;

                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-4 transition ${
                          step.status === "completed"
                            ? "border-[#c9dfcf] bg-success-soft/30"
                            : step.status === "in_progress"
                            ? "border-premium-beige/45 bg-premium-beige/5"
                            : "border-border-line bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold">{step.name}</h5>
                              <AdminStatusBadge tone={stepConfig.tone}>{stepConfig.label}</AdminStatusBadge>
                            </div>

                            {isEditing ? (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className={labelClass}>Status</label>
                                  <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className={inputClass}
                                  >
                                    <option value="waiting">Waiting</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={labelClass}>Estimated Date</label>
                                  <input
                                    type="date"
                                    value={editForm.estimatedDate}
                                    onChange={(e) => setEditForm({ ...editForm, estimatedDate: e.target.value })}
                                    className={inputClass}
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className={labelClass}>Note</label>
                                  <textarea
                                    value={editForm.note}
                                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                    className={`${inputClass} min-h-[80px] resize-none`}
                                    placeholder="Tambahkan catatan..."
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 space-y-1.5 text-xs text-foreground-secondary">
                                {step.estimatedDate && (
                                  <p className="flex items-center gap-1">
                                    <Clock size={12} /> Estimasi: {formatDate(step.estimatedDate)}
                                  </p>
                                )}
                                {step.completedAt && (
                                  <p className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 size={12} /> Selesai: {formatDate(step.completedAt)}
                                  </p>
                                )}
                                {step.note && <p className="mt-1 text-sm text-foreground">{step.note}</p>}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={cancelEdit}
                                  className="rounded-lg border border-border-line bg-white px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveStep}
                                  disabled={isSaving}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-dark-premium px-3 py-1.5 text-xs font-medium text-white hover:bg-dark-premium/90 disabled:opacity-50"
                                >
                                  <Save size={14} /> {isSaving ? "Saving..." : "Save"}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditStep(key)}
                                className="rounded-lg border border-border-line bg-white px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google Drive Link */}
              <div className="mb-6">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-secondary">
                  Link Google Drive
                </h4>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={selectedRecord.googleDriveLink || ""}
                    onChange={(e) => updateGoogleDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className={inputClassName}
                  />
                  {selectedRecord.googleDriveLink && (
                    <a
                      href={selectedRecord.googleDriveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                    >
                      <ExternalLink size={16} /> Open
                    </a>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-foreground-secondary">
                  Link ini akan terlihat di Client Portal pada halaman Progress.
                </p>
              </div>

              {/* Photo Selection Section */}
              <div className="mb-6">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-secondary">
                  Photo Selection
                </h4>
                <div className="space-y-4">
                  {/* Gallery Link */}
                  <div className="rounded-xl border border-border-line bg-white p-4">
                    <label className={labelClass}>Link Galeri Preview</label>
                    <input
                      type="url"
                      value={selectedRecord.galleryLink || ""}
                      onChange={(e) => updateGalleryLink(e.target.value)}
                      placeholder="https://drive.google.com/... atau link galeri"
                      className={inputClassName}
                    />
                    <p className="mt-1.5 text-xs text-foreground-secondary">
                      Link galeri ini akan ditampilkan ke customer untuk memilih foto.
                    </p>
                  </div>

                  {/* Customer Selections */}
                  {(() => {
                    const photoSelections = getPhotoSelections(selectedRecord.bookingId);
                    if (!photoSelections) return null;

                    return (
                      <div className="rounded-xl border border-premium-beige/30 bg-premium-beige/5 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h5 className="text-sm font-semibold">Pilihan Customer</h5>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              photoSelections.status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : photoSelections.status === "submitted"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-50 text-gray-700"
                            }`}>
                              {photoSelections.status === "approved" ? "Approved" :
                               photoSelections.status === "submitted" ? "Submitted" : "Pending"}
                            </span>
                            {photoSelections.status === "submitted" && (
                              <button
                                onClick={() => approvePhotoSelection(selectedRecord.bookingId)}
                                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary mb-1">Foto untuk Diedit</p>
                            <p className="text-sm font-medium">{photoSelections.editingSelections || "-"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary mb-1">Foto untuk Dicetak</p>
                            <p className="text-sm font-medium">{photoSelections.printingSelections || "-"}</p>
                          </div>
                        </div>

                        {photoSelections.additionalNotes && (
                          <div className="mt-3">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary mb-1">Catatan Tambahan</p>
                            <p className="text-sm">{photoSelections.additionalNotes}</p>
                          </div>
                        )}

                        {photoSelections.submittedAt && (
                          <p className="mt-3 text-xs text-foreground-secondary">
                            Dikirim: {new Date(photoSelections.submittedAt).toLocaleDateString("id-ID", {
                              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Customer Notes */}
              <div>
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-secondary">
                  Catatan untuk Customer
                </h4>
                <textarea
                  value={selectedRecord.customerNotes}
                  onChange={(e) => updateCustomerNotes(e.target.value)}
                  placeholder="Tambahkan catatan yang akan dilihat customer..."
                  className={`${inputClassName} min-h-[100px] resize-none`}
                />
                <p className="mt-1.5 text-xs text-foreground-secondary">
                  Catatan ini akan terlihat di Client Portal pada halaman My Booking.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 border-t border-border-line pt-6">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-secondary">
                  Aksi Cepat
                </h4>
                <div className="flex flex-wrap gap-3">
                  {/* General Chat */}
                  <a
                    href={customerChatToAdmin(
                      selectedRecord.customerName,
                      selectedRecord.orderNumber,
                      "Saya ingin mengetahui update booking saya."
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    <MessageCircle size={16} /> Chat Customer
                  </a>

                  {/* Production Update */}
                  <a
                    href={sendProductionUpdate(
                      selectedRecord.customerPhone.replace(/\D/g, ""),
                      selectedRecord.customerName,
                      selectedRecord.orderNumber,
                      getCurrentProductionStatus(selectedRecord)
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <Package size={16} /> Update Progress
                  </a>

                  {/* Photo Selection Reminder */}
                  <a
                    href={sendPhotoSelectionReminder(
                      selectedRecord.customerPhone.replace(/\D/g, ""),
                      selectedRecord.customerName,
                      selectedRecord.orderNumber
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100"
                  >
                    <Image size={16} /> Reminder Pilih Foto
                  </a>

                  {/* Send Google Drive Link */}
                  <a
                    href={sendGoogleDriveLink(
                      selectedRecord.customerPhone.replace(/\D/g, ""),
                      selectedRecord.customerName,
                      selectedRecord.orderNumber,
                      selectedRecord.googleDriveLink || "Link belum tersedia"
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <ExternalLink size={16} /> Kirim Link Drive
                  </a>

                  {/* Copy Portal Link */}
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/dashboard/my-booking?order=${selectedRecord.orderNumber}`;
                      navigator.clipboard?.writeText(link);
                      alert("Link client portal berhasil disalin!");
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                  >
                    <ExternalLink size={16} /> Copy Portal Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}