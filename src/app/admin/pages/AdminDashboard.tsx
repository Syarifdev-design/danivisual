import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Award, CalendarCheck, CheckCircle2, ClipboardCheck, CreditCard, Images, LogIn, LogOut, Timer, TrendingUp, Users } from "lucide-react";
import AdminDataTable, { type AdminDataTableColumn } from "../components/AdminDataTable";
import AdminFormSection from "../components/AdminFormSection";
import AdminImageUploader from "../components/AdminImageUploader";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPreviewCard from "../components/AdminPreviewCard";
import AdminStatCard from "../components/AdminStatCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { mediaAssets } from "../../data/mediaAssets";
import { useAuth } from "../../contexts/AuthContext";
import { canAccessStaffKpi, canViewAllStaffData, canViewOwnKpi, isOperationalStaffRole } from "../../utils/permissions";
import { useEmployees, ROLE_LABELS, type Employee } from "../../contexts/EmployeesContext";
import {
  getKpiBreakdown,
  getKpiReviews,
  KPI_LEVELS,
  type KpiBreakdown,
  type KpiReview,
} from "../../../services/kpiService";
import { checkIn, checkOut, getAttendanceByDate, getAttendanceByEmployee, type AttendanceRecord } from "../../../services/attendanceService";
import { getAttendanceSettings, type AttendanceSettings } from "../../../services/attendanceSettingsService";
import { getTasks, getTasksByEmployee, type StaffTask } from "../../../services/staffTaskService";

interface BookingRow {
  order: string;
  client: string;
  service: string;
  date: string;
  status: "Pending" | "Confirmed" | "Editing" | "Delivered";
}

const bookings: BookingRow[] = [
  { order: "#DV-260718-001", client: "Dani & Sinta", service: "Wedding Photo + Video", date: "18 Jul 2026", status: "Editing" },
  { order: "#DV-260801-002", client: "Rama & Dita", service: "Prewedding Studio", date: "01 Agu 2026", status: "Confirmed" },
  { order: "#DV-260815-003", client: "Naufal & Kirana", service: "Wedding Photo", date: "15 Agu 2026", status: "Pending" },
  { order: "#DV-260902-004", client: "Arga & Meira", service: "Event Documentation", date: "02 Sep 2026", status: "Delivered" },
];

const statusTone: Record<BookingRow["status"], "neutral" | "gold" | "success" | "warning"> = {
  Pending: "warning",
  Confirmed: "gold",
  Editing: "neutral",
  Delivered: "success",
};

const columns: AdminDataTableColumn<BookingRow>[] = [
  {
    key: "order",
    header: "Order",
    render: (row) => <span className="font-medium">{row.order}</span>,
  },
  {
    key: "client",
    header: "Client",
    render: (row) => row.client,
  },
  {
    key: "service",
    header: "Service",
    render: (row) => <span className="text-foreground-secondary">{row.service}</span>,
  },
  {
    key: "date",
    header: "Event Date",
    render: (row) => row.date,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <AdminStatusBadge tone={statusTone[row.status]}>{row.status}</AdminStatusBadge>,
  },
];

interface KpiPerformanceRow {
  review: KpiReview;
  breakdown: KpiBreakdown;
}

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
  const userId = String(user.id || "").toLowerCase();
  const userEmail = String(user.email || "").toLowerCase();

  return employees.find((employee) => {
    const employeeUserId = String(employee.userId || employee.user_id || "").toLowerCase();
    const employeeId = String(employee.id || "").toLowerCase();
    const employeeEmail = String(employee.email || "").toLowerCase();

    return Boolean(
      (userId && (employeeUserId === userId || employeeId === userId)) ||
      (userEmail && employeeEmail === userEmail)
    );
  }) || null;
}

const formatTime = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const safeEmployees = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);
  const [kpiRows, setKpiRows] = useState<KpiPerformanceRow[]>([]);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState({ present: 0, total: 0 });
  const [staffDashboardLoading, setStaffDashboardLoading] = useState(false);
  const [staffActionLoading, setStaffActionLoading] = useState(false);
  const [staffAttendanceToday, setStaffAttendanceToday] = useState<AttendanceRecord | null>(null);
  const [staffTasks, setStaffTasks] = useState<StaffTask[]>([]);
  const [staffKpi, setStaffKpi] = useState<KpiReview | null>(null);
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const today = now.toISOString().split("T")[0];
  const canSeeAllKpi = user ? canViewAllStaffData(user.role) : false;
  const canSeeOwnKpi = user ? canViewOwnKpi(user.role) : false;
  const isStaffDashboard = user ? isOperationalStaffRole(user.role) : false;
  const showKpiSection = user ? canAccessStaffKpi(user.role) && !isStaffDashboard : false;

  const staffEmployee = useMemo(() => {
    return getLinkedEmployeeForUser(safeEmployees, user);
  }, [safeEmployees, user]);

  const employeeById = useMemo(() => {
    return new Map(safeEmployees.map((employee) => [employee.id, employee]));
  }, [safeEmployees]);

  useEffect(() => {
    if (!showKpiSection) return;

    const loadKpiDashboard = async () => {
      setKpiLoading(true);
      try {
        const employeeId = canSeeOwnKpi ? staffEmployee?.id : undefined;
        if (canSeeOwnKpi && !employeeId) {
          setKpiRows([]);
          setOverdueTasks(0);
          setAttendanceToday({ present: 0, total: 0 });
          return;
        }

        const reviews = employeeId
          ? await getKpiReviews({ employeeId, month: currentMonth, year: currentYear })
          : await getKpiReviews({ month: currentMonth, year: currentYear });

        const safeReviews = Array.isArray(reviews) ? reviews : [];
        const rows = await Promise.all(
          safeReviews.map(async (review) => ({
            review,
            breakdown: toSafeBreakdown(await getKpiBreakdown(review.employeeId, review.month, review.year).catch(() => emptyBreakdown)),
          }))
        );
        setKpiRows(Array.isArray(rows) ? rows : []);

        const [loadedTasks, loadedAttendance] = await Promise.all([
          getTasks().catch(() => [] as StaffTask[]),
          getAttendanceByDate(today).catch(() => []),
        ]);
        const tasks = Array.isArray(loadedTasks) ? loadedTasks : [];
        const attendance = Array.isArray(loadedAttendance) ? loadedAttendance : [];

        const visibleTasks = employeeId
          ? tasks.filter((task) => task.assignedToId === employeeId)
          : tasks;
        const nowTime = Date.now();
        setOverdueTasks(
          visibleTasks.filter((task) => {
            if (task.status === "completed" || task.status === "cancelled" || !task.deadline) return false;
            return new Date(task.deadline).getTime() < nowTime;
          }).length
        );

        const visibleAttendance = employeeId
          ? attendance.filter((record) => record.employeeId === employeeId)
          : attendance;
        setAttendanceToday({
          present: visibleAttendance.filter((record) => record.status === "present" || record.status === "late").length,
          total: visibleAttendance.length,
        });
      } catch (err) {
        console.error("[AdminDashboard] Failed to load KPI summary:", err);
        setKpiRows([]);
        setOverdueTasks(0);
        setAttendanceToday({ present: 0, total: 0 });
      } finally {
        setKpiLoading(false);
      }
    };

    loadKpiDashboard();
  }, [showKpiSection, canSeeOwnKpi, staffEmployee?.id, currentMonth, currentYear, today]);

  const loadStaffDashboard = useCallback(async () => {
    if (!isStaffDashboard) return;
    if (!staffEmployee?.id) {
      setStaffAttendanceToday(null);
      setStaffTasks([]);
      setStaffKpi(null);
      return;
    }

    setStaffDashboardLoading(true);
    try {
      const [attendanceRecords, tasks, reviews] = await Promise.all([
        getAttendanceByEmployee(staffEmployee.id).catch(() => [] as AttendanceRecord[]),
        getTasksByEmployee(staffEmployee.id).catch(() => [] as StaffTask[]),
        getKpiReviews({ employeeId: staffEmployee.id, month: currentMonth, year: currentYear }).catch(() => [] as KpiReview[]),
      ]);

      const safeAttendance = Array.isArray(attendanceRecords) ? attendanceRecords : [];
      const safeTasks = Array.isArray(tasks) ? tasks : [];
      const safeReviews = Array.isArray(reviews) ? reviews : [];

      setStaffAttendanceToday(safeAttendance.find((record) => record.date === today) || null);
      setStaffTasks(safeTasks);
      setStaffKpi(safeReviews[0] || null);
    } catch (err) {
      console.error("[AdminDashboard] Failed to load staff dashboard:", err);
      setStaffAttendanceToday(null);
      setStaffTasks([]);
      setStaffKpi(null);
    } finally {
      setStaffDashboardLoading(false);
    }
  }, [currentMonth, currentYear, isStaffDashboard, staffEmployee?.id, today]);

  useEffect(() => {
    loadStaffDashboard();
  }, [loadStaffDashboard]);

  useEffect(() => {
    getAttendanceSettings()
      .then(setAttendanceSettings)
      .catch((err) => console.warn("[AdminDashboard] Failed to load attendance settings:", err));
  }, []);

  const kpiStats = useMemo(() => {
    const total = kpiRows.length;
    const average = total > 0
      ? Math.round(kpiRows.reduce((sum, row) => sum + (Number(row.review.finalScore) || 0), 0) / total)
      : 0;

    return {
      average,
      excellent: kpiRows.filter((row) => row.review.level === "excellent").length,
      needsImprove: kpiRows.filter((row) => row.review.level === "needs_improve").length,
    };
  }, [kpiRows]);

  const getStaffName = (review: KpiReview) => {
    return employeeById.get(review.employeeId)?.name || review.employeeName || "Staff";
  };

  const getStaffRole = (review: KpiReview) => {
    const employee = employeeById.get(review.employeeId);
    return employee ? ROLE_LABELS[employee.role] : "-";
  };

  const activeStaffTasks = useMemo(() => {
    return staffTasks.filter((task) => task.status !== "completed" && task.status !== "cancelled");
  }, [staffTasks]);

  const completedStaffTasks = useMemo(() => {
    return staffTasks.filter((task) => task.status === "completed");
  }, [staffTasks]);

  const overdueStaffTasks = useMemo(() => {
    const nowTime = Date.now();
    return staffTasks.filter((task) => {
      if (task.status === "completed" || task.status === "cancelled" || !task.deadline) return false;
      const deadlineTime = new Date(task.deadline).getTime();
      return Number.isFinite(deadlineTime) && deadlineTime < nowTime;
    });
  }, [staffTasks]);

  const nearestDeadline = useMemo(() => {
    return activeStaffTasks
      .filter((task) => Boolean(task.deadline))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0] || null;
  }, [activeStaffTasks]);

  const staffKpiLevel = staffKpi ? KPI_LEVELS[staffKpi.level] || KPI_LEVELS.poor : null;
  const quickAttendanceAllowed = attendanceSettings
    ? !attendanceSettings.requireSelfie && !attendanceSettings.requireGps
    : false;

  const handleStaffCheckIn = async () => {
    if (!staffEmployee || staffAttendanceToday || staffActionLoading || !quickAttendanceAllowed) return;
    setStaffActionLoading(true);
    try {
      await checkIn({
        employeeId: staffEmployee.id,
        employeeName: staffEmployee.name,
        employeeRole: ROLE_LABELS[staffEmployee.role] || staffEmployee.role,
        date: today,
      }, {
        verifiedEmployeeId: staffEmployee.id,
        userRole: user?.role,
      });
      await loadStaffDashboard();
    } catch (err) {
      console.error("[AdminDashboard] Staff check-in failed:", err);
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleStaffCheckOut = async () => {
    if (!staffAttendanceToday?.id || staffAttendanceToday.checkOutTime || staffActionLoading || !quickAttendanceAllowed) return;
    setStaffActionLoading(true);
    try {
      await checkOut(staffAttendanceToday.id, undefined, {
        verifiedEmployeeId: staffEmployee?.id,
        userRole: user?.role,
      });
      await loadStaffDashboard();
    } catch (err) {
      console.error("[AdminDashboard] Staff check-out failed:", err);
    } finally {
      setStaffActionLoading(false);
    }
  };

  if (isStaffDashboard) {
    const staffName = staffEmployee?.name || user?.name || "Staff";
    const attendanceStatus = staffAttendanceToday?.checkOutTime
      ? "Selesai hari ini"
      : staffAttendanceToday?.checkInTime
        ? "Sedang bekerja"
        : "Belum check-in";
    const attendanceHelper = staffAttendanceToday?.checkInTime
      ? `Check-in ${formatTime(staffAttendanceToday.checkInTime)}${staffAttendanceToday.checkOutTime ? `, check-out ${formatTime(staffAttendanceToday.checkOutTime)}` : ""}`
      : "Mulai absensi hari ini dari dashboard.";

    return (
      <div>
        <AdminPageHeader
          eyebrow="Staff Workspace"
          title={`Halo, ${staffName}`}
          description="Ringkasan absensi, tugas, KPI, dan deadline pribadi untuk hari ini."
        />

        {!staffEmployee ? (
          <div className="border border-border-line bg-white p-8 text-center">
            <p className="text-lg font-medium text-foreground">Profil staff belum terhubung. Hubungi admin.</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              Akun login perlu ditautkan ke data employee sebelum attendance dan KPI pribadi bisa ditampilkan.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label="Status Absensi Hari Ini"
                value={attendanceStatus}
                helper={staffDashboardLoading ? "Memuat absensi" : attendanceHelper}
                icon={<CalendarCheck size={18} />}
              />
              <AdminStatCard
                label="My Tasks"
                value={String(activeStaffTasks.length)}
                helper={`${completedStaffTasks.length} selesai dari ${staffTasks.length} task`}
                icon={<ClipboardCheck size={18} />}
              />
              <AdminStatCard
                label="My KPI Bulan Ini"
                value={staffKpi ? String(Math.round(Number(staffKpi.finalScore) || 0)) : "-"}
                helper={staffKpiLevel ? staffKpiLevel.label : "KPI bulan ini belum tersedia"}
                icon={<TrendingUp size={18} />}
              />
              <AdminStatCard
                label="Deadline Terdekat"
                value={nearestDeadline ? formatDate(nearestDeadline.deadline) : "-"}
                helper={nearestDeadline?.title || "Tidak ada deadline aktif"}
                icon={<Timer size={18} />}
              />
            </section>

            <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="border border-border-line bg-white p-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-premium-beige">Attendance</p>
                    <h2 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>Absensi Hari Ini</h2>
                    <p className="mt-2 text-sm text-foreground-secondary">{today}</p>
                  </div>
                  <div className="flex gap-3">
                    {!quickAttendanceAllowed ? (
                      <a
                        href="/admin/attendance"
                        className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                      >
                        <CalendarCheck size={16} />
                        Open Attendance
                      </a>
                    ) : !staffAttendanceToday?.checkInTime ? (
                      <button
                        type="button"
                        onClick={handleStaffCheckIn}
                        disabled={staffActionLoading || staffDashboardLoading}
                        className="inline-flex min-h-11 items-center gap-2 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LogIn size={16} />
                        Check In
                      </button>
                    ) : staffAttendanceToday?.checkInTime && !staffAttendanceToday.checkOutTime ? (
                      <button
                        type="button"
                        onClick={handleStaffCheckOut}
                        disabled={staffActionLoading || staffDashboardLoading}
                        className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LogOut size={16} />
                        Check Out
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="border border-border-line bg-premium-beige/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-foreground-secondary">Status</p>
                    <p className="mt-2 text-lg font-medium">{attendanceStatus}</p>
                  </div>
                  <div className="border border-border-line bg-premium-beige/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-foreground-secondary">Check In</p>
                    <p className="mt-2 text-lg font-medium">{formatTime(staffAttendanceToday?.checkInTime)}</p>
                  </div>
                  <div className="border border-border-line bg-premium-beige/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-foreground-secondary">Check Out</p>
                    <p className="mt-2 text-lg font-medium">{formatTime(staffAttendanceToday?.checkOutTime)}</p>
                  </div>
                </div>
              </div>

              <div className="border border-border-line bg-white p-6">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-premium-beige">My KPI</p>
                <h2 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>KPI Bulan Ini</h2>
                {staffKpi ? (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border-line pb-4">
                      <span className="text-sm text-foreground-secondary">Final Score</span>
                      <span className="text-3xl font-semibold">{Math.round(Number(staffKpi.finalScore) || 0)}</span>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${staffKpiLevel?.bg || ""} ${staffKpiLevel?.color || ""}`}>
                      {staffKpiLevel?.label || "Poor"}
                    </span>
                    <div className="grid gap-3 text-sm text-foreground-secondary">
                      <div className="flex justify-between"><span>Attendance</span><strong className="text-foreground">{Math.round(Number(staffKpi.attendanceScore) || 0)}</strong></div>
                      <div className="flex justify-between"><span>Task Completion</span><strong className="text-foreground">{Math.round(Number(staffKpi.taskCompletionScore) || 0)}</strong></div>
                      <div className="flex justify-between"><span>Deadline</span><strong className="text-foreground">{Math.round(Number(staffKpi.deadlineScore) || 0)}</strong></div>
                      <div className="flex justify-between"><span>Quality</span><strong className="text-foreground">{Math.round(Number(staffKpi.qualityScore) || 0)}</strong></div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-foreground-secondary">KPI bulan ini belum tersedia</p>
                )}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-hidden border border-border-line bg-white">
                <div className="border-b border-border-line p-6">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-premium-beige">Tasks</p>
                  <h2 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>Ringkasan My Tasks</h2>
                </div>
                <div className="grid gap-0 sm:grid-cols-4">
                  <div className="border-b border-border-line p-5 sm:border-r"><p className="text-2xl font-semibold">{staffTasks.length}</p><p className="text-sm text-foreground-secondary">Total</p></div>
                  <div className="border-b border-border-line p-5 sm:border-r"><p className="text-2xl font-semibold">{activeStaffTasks.length}</p><p className="text-sm text-foreground-secondary">Active</p></div>
                  <div className="border-b border-border-line p-5 sm:border-r"><p className="text-2xl font-semibold">{completedStaffTasks.length}</p><p className="text-sm text-foreground-secondary">Completed</p></div>
                  <div className="border-b border-border-line p-5"><p className="text-2xl font-semibold">{overdueStaffTasks.length}</p><p className="text-sm text-foreground-secondary">Overdue</p></div>
                </div>
                {activeStaffTasks.length === 0 ? (
                  <p className="p-6 text-sm text-foreground-secondary">Belum ada task aktif.</p>
                ) : (
                  <div className="divide-y divide-border-line">
                    {activeStaffTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-foreground-secondary">Deadline {formatDate(task.deadline)}</p>
                        </div>
                        <AdminStatusBadge tone={task.status === "revision" || task.status === "overdue" ? "warning" : "neutral"}>
                          {task.status.replace(/_/g, " ")}
                        </AdminStatusBadge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-border-line bg-white p-6">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-premium-beige">Next Deadline</p>
                <h2 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>Deadline Terdekat</h2>
                {nearestDeadline ? (
                  <div className="mt-5 space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center bg-premium-beige/10 text-premium-beige">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-medium">{nearestDeadline.title}</p>
                      <p className="mt-1 text-sm text-foreground-secondary">{formatDate(nearestDeadline.deadline)}</p>
                    </div>
                    <AdminStatusBadge tone={nearestDeadline.status === "revision" || nearestDeadline.status === "overdue" ? "warning" : "neutral"}>
                      {nearestDeadline.status.replace(/_/g, " ")}
                    </AdminStatusBadge>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-foreground-secondary">Tidak ada deadline aktif.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Premium Editorial Admin"
        title="Dashboard"
        description="A calm operational view for Danivisual content, reservations, production, and business activity."
        actions={
          <>
            <button className="min-h-11 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
              Export Report
            </button>
            <button className="min-h-11 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
              New Reservation
            </button>
          </>
        }
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Monthly Bookings" value="24" helper="+6 from last month" icon={<CalendarCheck size={18} />} />
        <AdminStatCard label="Pending Payments" value="8" helper="Need admin verification" icon={<CreditCard size={18} />} />
        <AdminStatCard label="Active Clients" value="132" helper="Across wedding and studio" icon={<Users size={18} />} />
        <AdminStatCard label="Published Albums" value="46" helper="Portfolio stories live" icon={<Images size={18} />} />
      </section>

      {showKpiSection && (
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-premium-beige">Staff KPI</p>
              <h2 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Staff Performance This Month</h2>
            </div>
            <p className="text-sm text-foreground-secondary">
              {currentMonth}/{currentYear}
            </p>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Average KPI This Month" value={String(kpiStats.average)} helper={kpiLoading ? "Loading KPI" : "Monthly staff average"} icon={<TrendingUp size={18} />} />
            <AdminStatCard label="Excellent Staff" value={String(kpiStats.excellent)} helper="Score 90-100" icon={<Award size={18} />} />
            <AdminStatCard label="Needs Improve" value={String(kpiStats.needsImprove)} helper="Score 60-74" icon={<AlertTriangle size={18} />} />
            <AdminStatCard label="Overdue Tasks" value={String(overdueTasks)} helper="Open tasks past deadline" icon={<ClipboardCheck size={18} />} />
            <AdminStatCard label="Staff Attendance Today" value={`${attendanceToday.present}/${attendanceToday.total}`} helper="Present or late check-ins" icon={<CalendarCheck size={18} />} />
          </div>

          <div className="overflow-hidden border border-border-line bg-white">
            <table className="w-full min-w-[760px]">
              <thead className="bg-premium-beige/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">KPI Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Tasks Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-line">
                {kpiLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-foreground-secondary">
                      Loading staff KPI...
                    </td>
                  </tr>
                ) : kpiRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-foreground-secondary">
                      Belum ada data KPI staff untuk bulan ini
                    </td>
                  </tr>
                ) : (
                  kpiRows.slice(0, 6).map(({ review, breakdown }) => {
                    const level = KPI_LEVELS[review.level] || KPI_LEVELS.poor;
                    const attendanceSummary = toSafeBreakdown(breakdown).attendanceSummary;
                    const taskSummary = toSafeBreakdown(breakdown).taskSummary;
                    const attendanceTotal =
                      attendanceSummary.present +
                      attendanceSummary.late +
                      attendanceSummary.absent +
                      attendanceSummary.leave;
                    return (
                      <tr key={`${review.employeeId}-${review.year}-${review.month}`} className="hover:bg-premium-beige/5">
                        <td className="px-4 py-3 text-sm font-medium">{getStaffName(review)}</td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">{getStaffRole(review)}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{review.finalScore}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${level.bg} ${level.color}`}>
                            {level.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {taskSummary.completed}/{taskSummary.total}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">
                          {attendanceSummary.present + attendanceSummary.late}/{attendanceTotal}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-8 overflow-hidden">
          <AdminFormSection
            eyebrow="Editorial Control"
            title="Homepage Hero Preview"
            description="Dummy content only. Later this area will connect to getField/getImage content records."
          >
            <AdminImageUploader
              label="Hero image"
              helper="Large preview area keeps visual editing close to the public website feel."
              imageUrl={mediaAssets.hero.akad}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="min-h-12 border border-border-line bg-white px-4 text-sm outline-none focus:border-premium-beige" defaultValue="SIDE BY SIDE" />
              <input className="min-h-12 border border-border-line bg-white px-4 text-sm outline-none focus:border-premium-beige" defaultValue="DANIVISUAL WEDDING & PREWEDDING STORY" />
            </div>
          </AdminFormSection>

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-premium-beige">Reservation</p>
                <h2 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Recent Bookings</h2>
              </div>
              <button className="min-h-10 border border-border-line bg-white px-4 text-sm text-foreground-secondary hover:border-premium-beige hover:text-foreground">
                View All
              </button>
            </div>
            <AdminDataTable columns={columns} rows={bookings} />
          </div>
        </div>

        <aside className="grid min-w-0 gap-5">
          <AdminPreviewCard
            eyebrow="Website Content"
            title="Portfolio Story"
            imageUrl={mediaAssets.wedding.couplePortrait}
          >
            <p>Dani & Sinta at Four Seasons Jakarta. Preview cards keep admin content review visual and editorial.</p>
          </AdminPreviewCard>
          <AdminPreviewCard eyebrow="Production" title="Current Editing Queue">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border-line pb-3">
                <span>Dani & Sinta</span>
                <AdminStatusBadge tone="neutral">Editing</AdminStatusBadge>
              </div>
              <div className="flex items-center justify-between border-b border-border-line pb-3">
                <span>Rama & Dita</span>
                <AdminStatusBadge tone="gold">Sorting</AdminStatusBadge>
              </div>
              <div className="flex items-center justify-between">
                <span>Naufal & Kirana</span>
                <AdminStatusBadge tone="warning">Waiting</AdminStatusBadge>
              </div>
            </div>
          </AdminPreviewCard>
        </aside>
      </section>
    </div>
  );
}
