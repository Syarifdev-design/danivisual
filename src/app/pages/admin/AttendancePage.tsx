import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Download,
  Search,
  Calendar,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coffee,
  Camera,
  MapPin,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  useAuth,
  useEmployeeIdWarning,
  getEmployeeId,
  userNeedsEmployeeId,
} from "../../contexts/AuthContext";
import {
  canManageAttendance,
  canViewAllStaffData,
  canViewOwnAttendance,
} from "../../utils/permissions";
import {
  useEmployees,
  ROLE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  type AttendanceStatus,
} from "../../contexts/EmployeesContext";
import type { Employee, Attendance } from "../../contexts/EmployeesContext";
import {
  checkIn as checkInService,
  checkOut as checkOutService,
  updateAttendanceStatus as updateStatusService,
  getAttendanceByEmployee,
  getAttendanceRecords,
  getCurrentLocation,
  type AttendanceRecord,
} from "../../../services/attendanceService";
import {
  getAttendanceSettings,
  updateAttendanceSettings,
  type AttendanceSettings,
  type AttendanceRole,
  type WorkingDay,
} from "../../../services/attendanceSettingsService";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "-";
  return new Date(timeStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
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

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";
const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-secondary";

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle; className: string }> = {
  present: { icon: CheckCircle, className: "text-emerald-500" },
  late: { icon: AlertCircle, className: "text-amber-500" },
  absent: { icon: XCircle, className: "text-red-500" },
  leave: { icon: Coffee, className: "text-blue-500" },
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  absent: "bg-red-100 text-red-700 border-red-200",
  leave: "bg-blue-100 text-blue-700 border-blue-200",
  remote: "bg-purple-100 text-purple-700 border-purple-200",
};

const ATTENDANCE_ROLE_OPTIONS: Array<{ value: AttendanceRole; label: string }> = [
  { value: "staff", label: "Staff" },
  { value: "editor", label: "Editor" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance" },
];

const WORKING_DAY_OPTIONS: Array<{ value: WorkingDay; label: string }> = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

// ============================================================================
// Selfie Capture Component
// ============================================================================

function SelfieCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCaptured(dataUrl);
    }
  };

  const handleConfirm = () => {
    if (captured) {
      onCapture(captured);
    }
  };

  // Start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          Ambil Foto Selfie
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-900">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : captured ? (
            <img
              src={captured}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Camera size={48} className="text-gray-400" />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <p className="mt-2 text-xs text-center text-foreground-secondary">
          {stream ? "Posisikan wajah Anda di dalam frame" : captured ? "Selfie berhasil diambil" : "Memuat kamera..."}
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border-line py-3 text-sm"
          >
            Batal
          </button>
          {stream ? (
            <button
              onClick={takePhoto}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-dark-premium py-3 text-sm text-white"
            >
              <Camera size={16} />
              Ambil Foto
            </button>
          ) : captured ? (
            <>
              <button
                onClick={() => setCaptured(null)}
                className="flex-1 rounded-lg border border-border-line py-3 text-sm"
              >
                Ambil Ulang
              </button>
              <button
                onClick={handleConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm text-white"
              >
                <Check size={16} />
                Konfirmasi
              </button>
            </>
          ) : (
            <button
              onClick={startCamera}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-dark-premium py-3 text-sm text-white"
            >
              <Loader2 size={16} className="animate-spin" />
              Memuat...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceSettingsPanel({
  settings,
  onSave,
  saving,
}: {
  settings: AttendanceSettings;
  onSave: (settings: AttendanceSettings) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<AttendanceSettings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const toggleArrayValue = <T extends string,>(key: "workingDays" | "requiredAttendanceRoles", value: T) => {
    setForm((prev) => {
      const list = prev[key] as string[];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const updateBoolean = (key: keyof AttendanceSettings, value: boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateField = (key: keyof AttendanceSettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(form);
      }}
      className="space-y-6 rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Attendance Rules</p>
        <h3 className="mt-2 text-xl font-semibold">Settings</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["workStartTime", "Work Start"],
          ["workEndTime", "Work End"],
          ["earliestCheckInTime", "Earliest Check In"],
          ["latestCheckInTime", "Latest Check In"],
          ["earliestCheckOutTime", "Earliest Check Out"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className={labelClass}>{label}</label>
            <input
              type="time"
              value={String(form[key as keyof AttendanceSettings])}
              onChange={(event) => updateField(key as keyof AttendanceSettings, event.target.value)}
              className={inputClassName}
            />
          </div>
        ))}
        <div>
          <label className={labelClass}>Late Tolerance Minutes</label>
          <input
            type="number"
            min={0}
            value={form.lateToleranceMinutes}
            onChange={(event) => updateField("lateToleranceMinutes", Number(event.target.value))}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["requireSelfie", "Require Selfie"],
          ["requireGps", "Require GPS"],
          ["allowCheckoutWithoutCheckin", "Allow Checkout Without Check In"],
          ["allowMultipleCheckinPerDay", "Allow Multiple Check In Per Day"],
          ["autoMarkLate", "Auto Mark Late"],
          ["autoMarkAbsent", "Auto Mark Absent"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-lg border border-border-line px-4 py-3 text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={Boolean(form[key as keyof AttendanceSettings])}
              onChange={(event) => updateBoolean(key as keyof AttendanceSettings, event.target.checked)}
              className="h-4 w-4"
            />
          </label>
        ))}
      </div>

      <div>
        <label className={labelClass}>Working Days</label>
        <div className="flex flex-wrap gap-2">
          {WORKING_DAY_OPTIONS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleArrayValue("workingDays", day.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                form.workingDays.includes(day.value)
                  ? "border-premium-beige bg-premium-beige/10 text-foreground"
                  : "border-border-line bg-white text-foreground-secondary"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Required Attendance Roles</label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ATTENDANCE_ROLE_OPTIONS.map((role) => (
            <label key={role.value} className="flex items-center gap-2 rounded-lg border border-border-line px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.requiredAttendanceRoles.includes(role.value)}
                onChange={() => toggleArrayValue("requiredAttendanceRoles", role.value)}
                className="h-4 w-4"
              />
              <span>{role.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-dark-premium px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Main Attendance Page
// ============================================================================

export default function AttendancePage() {
  const { user } = useAuth();
  const { employees, addAttendance, updateAttendance } = useEmployees();
  const safeEmployees = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);
  const canViewAll = user ? canViewAllStaffData(user.role) : false;
  const canViewOwn = user ? canViewOwnAttendance(user.role) : false;
  const canManage = user ? canManageAttendance(user.role) : false;

  // SECURITY: Use employeeId from AuthContext, not from form/UI selection
  const staffEmployeeId = user?.employeeId;
  const hasEmployeeId = Boolean(staffEmployeeId);

  const staffEmployee = useMemo(() => {
    return getLinkedEmployeeForUser(safeEmployees, user);
  }, [safeEmployees, user]);

  // Attendance records from service
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"records" | "settings">("records");
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Selfie modal state
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [selfieTargetEmployee, setSelfieTargetEmployee] = useState<Employee | null>(null);
  const [selfieType, setSelfieType] = useState<"check-in" | "check-out">("check-in");
  const [submitting, setSubmitting] = useState(false);

  // Current month navigation
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AttendanceStatus>("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Load attendance records
  // SECURITY: Staff can only load their own records using AuthContext employeeId
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      // Staff (non-admin): must use employeeId from AuthContext
      if (canViewOwn && !canViewAll) {
        // Must have valid employeeId from AuthContext
        if (!staffEmployeeId) {
          console.warn("[AttendancePage] No employeeId in AuthContext - cannot load own attendance");
          setAttendanceRecords([]);
          return;
        }
        const records = await getAttendanceByEmployee(staffEmployeeId);
        setAttendanceRecords(Array.isArray(records) ? records : []);
        return;
      }

      // Admin: can view all records
      const records = await getAttendanceRecords();
      setAttendanceRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error("[AttendancePage] Failed to load attendance:", err);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [canViewAll, canViewOwn, staffEmployeeId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    getAttendanceSettings()
      .then(setAttendanceSettings)
      .catch((err) => console.warn("[AttendancePage] Failed to load attendance settings:", err));
  }, []);

  const activeEmployees = useMemo(() => {
    // SECURITY: Admin sees all employees, staff sees only themselves
    const active = safeEmployees.filter((e) => e.isActive);
    if (canViewAll) return active;
    // Staff: only show the employee matching their AuthContext employeeId
    if (canViewOwn && staffEmployeeId) return active.filter((employee) => employee.id === staffEmployeeId);
    return [];
  }, [safeEmployees, canViewAll, canViewOwn, staffEmployeeId]);

  // Map service records to context format for compatibility
  const attendance = useMemo(() => {
    return attendanceRecords.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      employeeRole: r.employeeRole,
      date: r.date,
      checkIn: r.checkInTime,
      checkOut: r.checkOutTime,
      status: r.status as AttendanceStatus,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }, [attendanceRecords]);

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  // Get attendance for current month
  const monthAttendance = useMemo(() => {
    return attendance.filter((att) => {
      const d = new Date(att.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [attendance, currentYear, currentMonth]);

  // Filter attendance - staff only sees their own, admin sees all
  const filteredAttendance = useMemo(() => {
    let filtered = monthAttendance;

    // SECURITY: Staff only sees their own attendance using AuthContext employeeId
    if (!canViewAll && staffEmployeeId) {
      filtered = filtered.filter(
        (att) => att.employeeId === staffEmployeeId
      );
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (att) =>
          att.employeeName.toLowerCase().includes(q) ||
          ROLE_LABELS[att.employeeRole as keyof typeof ROLE_LABELS]?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((att) => att.status === statusFilter);
    }

    return filtered;
  }, [monthAttendance, canViewAll, staffEmployeeId, searchQuery, statusFilter]);

  // Daily attendance map
  const getAttendanceMap = () => {
    const map: Record<string, typeof filteredAttendance> = {};
    filteredAttendance.forEach((att) => {
      if (!map[att.date]) map[att.date] = [];
      map[att.date].push(att);
    });
    return map;
  };
  const attendanceMap = getAttendanceMap();

  // Stats for selected date
  const selectedDateAttendance = attendanceMap[selectedDate] || [];
  const stats = {
    present: selectedDateAttendance.filter((a) => a.status === "present" || a.status === "late").length,
    late: selectedDateAttendance.filter((a) => a.status === "late").length,
    absent: selectedDateAttendance.filter((a) => a.status === "absent").length,
    leave: selectedDateAttendance.filter((a) => a.status === "leave").length,
  };

  // Get days in month
  const getDaysInMonth = () => {
    const days = [];
    const date = new Date(currentYear, currentMonth, 1);
    while (date.getMonth() === currentMonth) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };
  const days = getDaysInMonth();
  const quickAttendanceAllowed = attendanceSettings
    ? !attendanceSettings.requireSelfie && !attendanceSettings.requireGps
    : false;

  const saveAttendanceSettings = async (settings: AttendanceSettings) => {
    setSettingsSaving(true);
    try {
      const saved = await updateAttendanceSettings(settings);
      setAttendanceSettings(saved);
      alert("Attendance settings saved.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save attendance settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Open selfie capture for check-in
  const openCheckIn = (emp: Employee) => {
    if (!canViewAll && emp.id !== staffEmployee?.id) return;
    setSelfieTargetEmployee(emp);
    setSelfieType("check-in");
    setShowSelfieModal(true);
  };

  // Open selfie capture for check-out
  const openCheckOut = (emp: Employee, attId: string) => {
    if (!canViewAll && emp.id !== staffEmployee?.id) return;
    setSelfieTargetEmployee(emp);
    setSelfieType("check-out");
    setShowSelfieModal(true);
  };

  // Handle selfie captured
  // SECURITY: Use employeeId from AuthContext, verify ownership before submit
  const handleSelfieCaptured = async (dataUrl: string) => {
    if (!selfieTargetEmployee) return;

    // SECURITY: Block if no employeeId in AuthContext
    if (!staffEmployeeId) {
      alert("Profil staff belum terhubung. Hubungi admin untuk menghubungkan akun Anda dengan profil employee.");
      setShowSelfieModal(false);
      setSelfieTargetEmployee(null);
      return;
    }

    // SECURITY: Verify the target employee matches the AuthContext employeeId
    if (selfieTargetEmployee.id !== staffEmployeeId && !canViewAll) {
      alert("Anda tidak有权检查其他员工的出勤记录。");
      setShowSelfieModal(false);
      setSelfieTargetEmployee(null);
      return;
    }

    setSubmitting(true);

    try {
      const location = await getCurrentLocation();

      if (selfieType === "check-in") {
        // SECURITY: Pass verified employeeId from AuthContext
        const result = await checkInService({
          employeeId: selfieTargetEmployee.id,
          employeeName: selfieTargetEmployee.name,
          employeeRole: selfieTargetEmployee.role,
          date: selectedDate,
          selfieDataUrl: dataUrl,
          latitude: location?.latitude,
          longitude: location?.longitude,
        }, {
          verifiedEmployeeId: staffEmployeeId,
          userRole: user?.role,
        });

        if (result.success && result.record) {
          await loadAttendance();
        } else if (result.error) {
          alert(result.error);
        }
      } else {
        // Check-out
        const existing = selectedDateAttendance.find(
          (a) => a.employeeId === selfieTargetEmployee.id
        );
        if (existing) {
          // SECURITY: Pass verified employeeId from AuthContext
          const result = await checkOutService(existing.id, {
            selfieDataUrl: dataUrl,
            latitude: location?.latitude,
            longitude: location?.longitude,
          }, {
            verifiedEmployeeId: staffEmployeeId,
            userRole: user?.role,
          });

          if (result.success) {
            await loadAttendance();
          } else if (result.error) {
            alert(result.error);
          }
        }
      }
    } catch (err) {
      console.error("Attendance error:", err);
    } finally {
      setSubmitting(false);
      setShowSelfieModal(false);
      setSelfieTargetEmployee(null);
    }
  };

  // Quick check-in without selfie (fallback)
  // SECURITY: Staff can only check in their own record
  const handleQuickCheckIn = async (emp: Employee) => {
    // SECURITY: Only allow check-in for self
    if (!canViewAll && emp.id !== staffEmployeeId) return;
    if (!canViewAll && !staffEmployeeId) return; // Block if no employeeId

    const existing = selectedDateAttendance.find((a) => a.employeeId === emp.id);
    if (existing) return;

    // SECURITY: Pass verified employeeId from AuthContext
    const result = await checkInService({
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
      date: selectedDate,
    }, {
      verifiedEmployeeId: staffEmployeeId,
      userRole: user?.role,
    });

    if (result.success) {
      await loadAttendance();
    } else if (result.error) {
      alert(result.error);
    }
  };

  // Quick check-out (fallback)
  // SECURITY: Staff can only check out their own records
  const handleQuickCheckOut = async (attId: string) => {
    const existing = selectedDateAttendance.find((a) => a.id === attId);
    // SECURITY: Only allow check-out for own records
    if (!canViewAll) {
      if (!staffEmployeeId) return;
      if (existing?.employeeId !== staffEmployeeId) return;
    }

    // SECURITY: Pass verified employeeId from AuthContext
    const result = await checkOutService(attId, undefined, {
      verifiedEmployeeId: staffEmployeeId,
      userRole: user?.role,
    });

    if (result.success) {
      await loadAttendance();
    } else if (result.error) {
      alert(result.error);
    }
  };

  // Set status (admin only)
  const handleSetStatus = (attId: string, status: AttendanceStatus) => {
    if (!canManage) return;
    updateAttendance(attId, { status });
    updateStatusService(attId, status);
  };

  // Mark all absent (admin only)
  const handleMarkAllAbsent = () => {
    if (!canManage) return;
    if (!confirm("Mark all unchecked employees as absent?")) return;
    activeEmployees.forEach((emp) => {
      const existing = selectedDateAttendance.find((a) => a.employeeId === emp.id);
      if (!existing) {
        addAttendance({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeRole: emp.role,
          date: selectedDate,
          checkIn: null,
          checkOut: null,
          status: "absent",
          notes: "",
        });
      }
    });
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Tanggal", "Nama", "Role", "Check In", "Check Out", "Status", "Catatan"];
    const rows = filteredAttendance.map((att) => [
      att.date,
      att.employeeName,
      ROLE_LABELS[att.employeeRole as keyof typeof ROLE_LABELS] || att.employeeRole,
      att.checkIn ? formatTime(att.checkIn) : "-",
      att.checkOut ? formatTime(att.checkOut) : "-",
      ATTENDANCE_STATUS_LABELS[att.status],
      att.notes || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${currentYear}-${currentMonth + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Selfie Capture Modal */}
      {showSelfieModal && (
        <SelfieCapture
          onCapture={handleSelfieCaptured}
          onCancel={() => {
            setShowSelfieModal(false);
            setSelfieTargetEmployee(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-premium-beige/25 bg-white p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Attendance</p>
          <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Attendance</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground-secondary">
            {canViewAll
              ? "Rekap kehadiran tim perbulan dengan foto selfie."
              : "Catat kehadiran harian Anda dengan foto selfie."}
          </p>
        </div>
        {/* Employee ID Missing Warning */}
        {useEmployeeIdWarning() && (
          <div className="mt-3 w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            ⚠️ Profil staff belum terhubung dengan data karyawan. Hubungi admin untuk menghubungkan akun Anda dengan profil employee.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={handleMarkAllAbsent}
                className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
              >
                Mark Absent
              </button>
            </>
          )}
          <button
            onClick={goToToday}
            className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-medium text-white transition hover:bg-dark-premium/90"
          >
            Today
          </button>
        </div>
      </div>

      {canManage && (
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("records")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
              activeTab === "records" ? "bg-dark-premium text-white" : "border border-border-line bg-white text-foreground-secondary"
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
              activeTab === "settings" ? "bg-dark-premium text-white" : "border border-border-line bg-white text-foreground-secondary"
            }`}
          >
            Settings
          </button>
        </div>
      )}

      {activeTab === "settings" && canManage ? (
        attendanceSettings ? (
          <AttendanceSettingsPanel
            settings={attendanceSettings}
            onSave={saveAttendanceSettings}
            saving={settingsSaving}
          />
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-border-line bg-white py-12">
            <Loader2 size={22} className="animate-spin text-foreground-secondary" />
          </div>
        )
      ) : (
        <>
      {/* Month Nav */}
      <div className="flex items-center justify-between rounded-xl border border-border-line bg-white p-4">
        <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-premium-beige/10">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          {formatMonthYear(currentDate)}
        </h3>
        <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-premium-beige/10">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((day) => {
          const dateStr = day.toISOString().split("T")[0];
          const dayAtts = attendanceMap[dateStr] || [];
          const checkedIn = dayAtts.filter((a) => a.status === "present" || a.status === "late").length;
          const isTodayDate = isToday(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`rounded-xl border p-4 text-left transition ${
                dateStr === selectedDate
                  ? "border-premium-beige bg-premium-beige/5"
                  : isTodayDate
                  ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
                  : "border-border-line bg-white hover:border-premium-beige/45"
              } ${isWeekend ? "opacity-70" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isTodayDate ? "font-bold text-emerald-600" : ""}`}>
                  {day.getDate()}
                </span>
                {isTodayDate && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                    Today
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-foreground-secondary">
                {dayAtts.length > 0
                  ? `${checkedIn}/${dayAtts.length} hadir`
                  : "No data"}
              </p>
              {dayAtts.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {dayAtts.slice(0, 3).map((att) => (
                    <span
                      key={att.id}
                      className={`h-2 w-2 rounded-full ${
                        att.status === "present"
                          ? "bg-emerald-400"
                          : att.status === "late"
                          ? "bg-amber-400"
                          : att.status === "absent"
                          ? "bg-red-400"
                          : "bg-blue-400"
                      }`}
                      title={att.employeeName}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Detail */}
      <div className="overflow-hidden rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
        <div className="border-b border-border-line px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <h3 className="font-semibold">{formatDate(selectedDate)}</h3>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle size={14} /> Hadir: {stats.present}
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle size={14} /> Late: {stats.late}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle size={14} /> Absent: {stats.absent}
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <Coffee size={14} /> Leave: {stats.leave}
              </span>
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-foreground-secondary" />
            </div>
          ) : activeEmployees.length === 0 ? (
            <p className="p-8 text-center text-sm text-foreground-secondary">
              {canViewOwn ? "Profil staff belum terhubung. Hubungi admin." : "Tidak ada karyawan aktif"}
            </p>
          ) : (
            activeEmployees.map((emp) => {
              const att = selectedDateAttendance.find((a) => a.employeeId === emp.id);
              return (
                <div
                  key={emp.id}
                  className="flex flex-wrap items-center gap-4 border-b border-border-line px-5 py-4 last:border-b-0 sm:flex-nowrap"
                >
                  {/* Employee Info */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-premium-beige/10 text-sm font-medium">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{emp.name}</p>
                      <p className="text-xs text-foreground-secondary">
                        {ROLE_LABELS[emp.role as keyof typeof ROLE_LABELS] || emp.role}
                      </p>
                    </div>
                  </div>

                  {/* Times */}
                  <div className="flex flex-wrap items-center gap-2">
                    {att?.checkIn && (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        <MapPin size={12} />
                        In: {formatTime(att.checkIn)}
                      </span>
                    )}
                    {att?.checkOut && (
                      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                        Out: {formatTime(att.checkOut)}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  {att ? (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${STATUS_COLORS[att.status]}`}>
                        {ATTENDANCE_STATUS_LABELS[att.status]}
                      </span>
                      {canManage && (
                        <select
                          value={att.status}
                          onChange={(e) => handleSetStatus(att.id, e.target.value as AttendanceStatus)}
                          className="rounded-lg border border-border-line bg-white px-2 py-1 text-xs"
                        >
                          <option value="present">Hadir</option>
                          <option value="late">Terlambat</option>
                          <option value="absent">Absent</option>
                          <option value="leave">Cuti</option>
                          <option value="remote">Remote</option>
                        </select>
                      )}
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {att ? (
                      !att.checkOut && (
                        <>
                          <button
                            onClick={() => openCheckOut(emp, att.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-xs text-white transition hover:bg-blue-600"
                          >
                            <Camera size={14} />
                            Out
                          </button>
                          {!canViewAll && quickAttendanceAllowed && (
                            <button
                              onClick={() => handleQuickCheckOut(att.id)}
                              className="rounded-lg bg-blue-100 px-3 py-2 text-xs text-blue-700 transition hover:bg-blue-200"
                            >
                              Quick Out
                            </button>
                          )}
                        </>
                      )
                    ) : (
                      <>
                        <button
                          onClick={() => openCheckIn(emp)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs text-white transition hover:bg-emerald-600"
                        >
                          <Camera size={14} />
                          In
                        </button>
                        {!canViewAll && quickAttendanceAllowed && (
                          <button
                            onClick={() => handleQuickCheckIn(emp)}
                            className="rounded-lg bg-emerald-100 px-3 py-2 text-xs text-emerald-700 transition hover:bg-emerald-200"
                          >
                            Quick In
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
