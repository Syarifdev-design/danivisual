/**
 * KPI Staff Service
 *
 * Menghitung KPI staff berdasarkan attendance_records dan staff_tasks.
 * Supabase menjadi sumber utama, dengan localStorage fallback/cache mengikuti
 * pola service lain di project.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export type KpiLevel = "excellent" | "good" | "needs_improve" | "poor";

export interface KpiReview {
  id?: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  attendanceScore: number;
  taskCompletionScore: number;
  deadlineScore: number;
  qualityScore: number;
  finalScore: number;
  level: KpiLevel;
  notes: string;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type KpiRecord = KpiReview;

export interface KpiReviewParams {
  employeeId?: string;
  month?: number;
  year?: number;
  level?: KpiLevel;
}

export interface UpsertKpiReviewData {
  id?: string;
  employeeId: string;
  employeeName?: string;
  month: number;
  year: number;
  attendanceScore?: number;
  taskCompletionScore?: number;
  deadlineScore?: number;
  qualityScore?: number;
  finalScore?: number;
  level?: KpiLevel;
  notes?: string;
  reviewedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface KpiBreakdown {
  attendanceSummary: {
    present: number;
    late: number;
    absent: number;
    leave: number;
  };
  taskSummary: {
    total: number;
    completed: number;
    overdue: number;
    revision: number;
  };
  qualitySummary: {
    averageQualityScore: number;
  };
}

interface EmployeeRow {
  id: string;
  name: string;
  isActive: boolean;
}

interface AttendanceRow {
  employeeId: string;
  date: string;
  status: string;
  lateMinutes: number;
}

interface TaskRow {
  assignedTo: string;
  status: string;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string | null;
  qualityScore: number | null;
}

// ============================================================================
// Constants
// ============================================================================

const KPI_STORAGE_KEY = "danivisual_kpi_records";
const EMPLOYEES_STORAGE_KEY = "danivisual_employees";
const ATTENDANCE_STORAGE_KEY = "danivisual_attendance_records";
const LEGACY_ATTENDANCE_STORAGE_KEY = "danivisual_attendance";
const TASKS_STORAGE_KEY = "danivisual_staff_tasks";
const WORKDAY_MINUTES = 8 * 60;

export const KPI_WEIGHTS = {
  attendance: 0.25,
  taskCompletion: 0.35,
  deadline: 0.25,
  quality: 0.15,
};

export const KPI_LEVELS: Record<KpiLevel, { label: string; color: string; bg: string }> = {
  excellent: { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50" },
  good: { label: "Good", color: "text-blue-600", bg: "bg-blue-50" },
  needs_improve: { label: "Needs Improve", color: "text-amber-600", bg: "bg-amber-50" },
  poor: { label: "Poor", color: "text-red-600", bg: "bg-red-50" },
};

// ============================================================================
// Safe Helpers
// ============================================================================

function getLocalData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getLocalArray<T>(key: string): T[] {
  const value = getLocalData<unknown>(key, []);
  return Array.isArray(value) ? (value as T[]) : [];
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage quota or browser restrictions should not crash the app.
  }
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeMonth(month: number): number {
  const parsed = Math.trunc(toNumber(month, new Date().getMonth() + 1));
  return parsed >= 1 && parsed <= 12 ? parsed : new Date().getMonth() + 1;
}

function normalizeYear(year: number): number {
  const parsed = Math.trunc(toNumber(year, new Date().getFullYear()));
  return parsed > 1900 && parsed < 3000 ? parsed : new Date().getFullYear();
}

function isInMonth(dateValue: string | null | undefined, month: number, year: number): boolean {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  return date.getFullYear() === normalizeYear(year) && date.getMonth() + 1 === normalizeMonth(month);
}

function getMonthDateRange(month: number, year: number): { start: string; end: string } {
  const safeMonth = normalizeMonth(month);
  const safeYear = normalizeYear(year);
  const start = new Date(safeYear, safeMonth - 1, 1);
  const end = new Date(safeYear, safeMonth, 0);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function countWorkingDays(month: number, year: number): number {
  let days = 0;
  const safeMonth = normalizeMonth(month);
  const safeYear = normalizeYear(year);
  const date = new Date(safeYear, safeMonth - 1, 1);

  while (date.getMonth() + 1 === safeMonth) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) days += 1;
    date.setDate(date.getDate() + 1);
  }

  return days;
}

function cacheKpiReviews(records: KpiReview[]): void {
  const stored = getLocalArray<KpiReview>(KPI_STORAGE_KEY);
  const safeRecords = safeArray<KpiReview>(records);
  const byKey = new Map<string, KpiReview>();

  stored.forEach((record) => {
    if (!record?.employeeId) return;
    byKey.set(`${record.employeeId}-${record.year}-${record.month}`, record);
  });
  safeRecords.forEach((record) => {
    if (!record?.employeeId) return;
    byKey.set(`${record.employeeId}-${record.year}-${record.month}`, record);
  });

  setLocalData(KPI_STORAGE_KEY, Array.from(byKey.values()));
}

// ============================================================================
// Mappers
// ============================================================================

function mapKpiRow(rawRow: Record<string, unknown>): KpiReview {
  const row = safeRecord(rawRow);
  const finalScore = clampScore(toNumber(row.final_score));
  const level = row.level === "excellent" || row.level === "good" || row.level === "needs_improve" || row.level === "poor"
    ? row.level
    : getKpiLevel(finalScore);

  return {
    id: (row.id as string) || undefined,
    employeeId: (row.employee_id as string) || "",
    employeeName: (row.employee_name as string) || "",
    month: toNumber(row.period_month),
    year: toNumber(row.period_year),
    attendanceScore: clampScore(toNumber(row.attendance_score)),
    taskCompletionScore: clampScore(
      toNumber(row.task_completion_score ?? row.task_score)
    ),
    deadlineScore: clampScore(toNumber(row.deadline_score)),
    qualityScore: clampScore(toNumber(row.quality_score)),
    finalScore,
    level,
    notes: (row.notes as string) || "",
    reviewedBy: (row.reviewed_by as string) || null,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || (row.created_at as string) || new Date().toISOString(),
  };
}

function mapKpiToDbRow(data: KpiReview): Record<string, unknown> {
  return {
    employee_id: data.employeeId,
    period_month: data.month,
    period_year: data.year,
    attendance_score: data.attendanceScore,
    task_completion_score: data.taskCompletionScore,
    deadline_score: data.deadlineScore,
    quality_score: data.qualityScore,
    final_score: data.finalScore,
    level: data.level,
    notes: data.notes,
    reviewed_by: data.reviewedBy,
    updated_at: data.updatedAt,
  };
}

function mapEmployeeRow(rawRow: Record<string, unknown>): EmployeeRow {
  const row = safeRecord(rawRow);
  return {
    id: (row.id as string) || "",
    name: (row.name as string) || "",
    isActive: row.is_active !== false && row.isActive !== false,
  };
}

function mapAttendanceRow(rawRow: Record<string, unknown>): AttendanceRow {
  const row = safeRecord(rawRow);
  return {
    employeeId: (row.employee_id as string) || (row.employeeId as string) || "",
    date: (row.date as string) || "",
    status: ((row.status as string) || "").toLowerCase(),
    lateMinutes: toNumber(row.late_minutes ?? row.lateMinutes),
  };
}

function mapTaskRow(rawRow: Record<string, unknown>): TaskRow {
  const row = safeRecord(rawRow);
  return {
    assignedTo: (row.assigned_to as string) || (row.assigned_to_id as string) || (row.assignedToId as string) || "",
    status: ((row.status as string) || "").toLowerCase(),
    deadline: (row.deadline as string) || null,
    completedAt: (row.completed_at as string) || (row.completedAt as string) || null,
    createdAt: (row.created_at as string) || (row.createdAt as string) || null,
    qualityScore:
      row.quality_score === null || row.qualityScore === null
        ? null
        : toNumber(row.quality_score ?? row.qualityScore, NaN),
  };
}

// ============================================================================
// Data Access
// ============================================================================

async function getEmployees(): Promise<EmployeeRow[]> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("employees")
          .select("id,name,is_active")
          .order("name", { ascending: true });

        if (!error && data) {
          return safeArray<Record<string, unknown>>(data).map(mapEmployeeRow).filter((employee) => employee.id);
        }
      } catch (err) {
        console.warn("[KpiService] getEmployees:", err);
      }
    }
  }

  return getLocalArray<Record<string, unknown>>(EMPLOYEES_STORAGE_KEY)
    .map(mapEmployeeRow)
    .filter((employee) => employee.id);
}

async function getAttendanceForEmployee(employeeId: string, month: number, year: number): Promise<AttendanceRow[]> {
  const { start, end } = getMonthDateRange(month, year);

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("attendance_records")
          .select("employee_id,date,status,late_minutes")
          .eq("employee_id", employeeId)
          .gte("date", start)
          .lte("date", end);

        if (!error && data) {
          return safeArray<Record<string, unknown>>(data).map(mapAttendanceRow).filter((record) => record.employeeId);
        }
      } catch (err) {
        console.warn("[KpiService] getAttendanceForEmployee:", err);
      }
    }
  }

  const attendance = [
    ...getLocalArray<Record<string, unknown>>(ATTENDANCE_STORAGE_KEY),
    ...getLocalArray<Record<string, unknown>>(LEGACY_ATTENDANCE_STORAGE_KEY),
  ];

  return attendance
    .map(mapAttendanceRow)
    .filter((record) => record.employeeId === employeeId && isInMonth(record.date, month, year));
}

async function getTasksForEmployee(employeeId: string, month: number, year: number): Promise<TaskRow[]> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("staff_tasks")
          .select("assigned_to,status,deadline,completed_at,created_at,quality_score")
          .eq("assigned_to", employeeId);

        if (!error && data) {
          return safeArray<Record<string, unknown>>(data)
            .map(mapTaskRow)
            .filter((task) => task.assignedTo === employeeId && isTaskInPeriod(task, month, year));
        }
      } catch (err) {
        console.warn("[KpiService] getTasksForEmployee:", err);
      }
    }
  }

  return getLocalArray<Record<string, unknown>>(TASKS_STORAGE_KEY)
    .map(mapTaskRow)
    .filter((task) => task.assignedTo === employeeId && isTaskInPeriod(task, month, year));
}

function isTaskInPeriod(task: TaskRow, month: number, year: number): boolean {
  return (
    isInMonth(task.deadline, month, year) ||
    isInMonth(task.completedAt, month, year) ||
    isInMonth(task.createdAt, month, year)
  );
}

// ============================================================================
// Calculations
// ============================================================================

export function getKpiLevel(finalScore: number): KpiLevel {
  const score = clampScore(finalScore);
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "needs_improve";
  return "poor";
}

export function calcFinalScore(
  attendanceScore: number,
  taskCompletionScore: number,
  deadlineScore: number,
  qualityScore: number
): number {
  return clampScore(
    attendanceScore * KPI_WEIGHTS.attendance +
      taskCompletionScore * KPI_WEIGHTS.taskCompletion +
      deadlineScore * KPI_WEIGHTS.deadline +
      qualityScore * KPI_WEIGHTS.quality
  );
}

export function calcAttendanceScore(records: AttendanceRow[], month: number, year: number): number {
  const safeRecords = safeArray<AttendanceRow>(records);
  if (safeRecords.length === 0) return 0;

  const workingDays = countWorkingDays(month, year);
  if (workingDays === 0) return 0;

  const earnedDays = safeRecords.reduce((total, record) => {
    if (record.status === "present" || record.status === "remote") return total + 1;
    if (record.status === "late") {
      const latePenalty =
        record.lateMinutes > 0
          ? Math.min(1, record.lateMinutes / WORKDAY_MINUTES)
          : 0.5;
      return total + Math.max(0, 1 - latePenalty);
    }
    return total;
  }, 0);

  return clampScore((earnedDays / workingDays) * 100);
}

export function calcTaskCompletionScore(tasks: TaskRow[]): number {
  const safeTasks = safeArray<TaskRow>(tasks);
  if (safeTasks.length === 0) return 0;

  const completed = safeTasks.filter((task) => task.status === "completed").length;
  return clampScore((completed / safeTasks.length) * 100);
}

export function calcDeadlineScore(tasks: TaskRow[]): number {
  const safeTasks = safeArray<TaskRow>(tasks);
  const completedTasks = safeTasks.filter((task) => task.status === "completed" && task.completedAt);
  if (completedTasks.length === 0) return 0;

  const completedOnTime = completedTasks.filter((task) => {
    if (!task.deadline || !task.completedAt) return false;
    return new Date(task.completedAt).getTime() <= new Date(task.deadline).getTime();
  }).length;

  return clampScore((completedOnTime / completedTasks.length) * 100);
}

export function calcQualityScore(tasks: TaskRow[]): number {
  const safeTasks = safeArray<TaskRow>(tasks);
  const scores = safeTasks
    .filter((task) => task.status === "completed" && Number.isFinite(task.qualityScore))
    .map((task) => task.qualityScore as number);

  if (scores.length === 0) return 0;

  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return clampScore(avg <= 5 ? avg * 20 : avg);
}

function buildKpiBreakdown(attendance: AttendanceRow[], tasks: TaskRow[]): KpiBreakdown {
  const safeAttendance = safeArray<AttendanceRow>(attendance);
  const safeTasks = safeArray<TaskRow>(tasks);
  const completedTasks = safeTasks.filter((task) => task.status === "completed");
  const now = Date.now();
  const scoredTasks = completedTasks.filter((task) => Number.isFinite(task.qualityScore));
  const averageQualityScore =
    scoredTasks.length > 0
      ? Math.round(
          (scoredTasks.reduce((sum, task) => sum + (task.qualityScore || 0), 0) /
            scoredTasks.length) *
            10
        ) / 10
      : 0;

  return {
    attendanceSummary: {
      present: safeAttendance.filter((record) => record.status === "present" || record.status === "remote").length,
      late: safeAttendance.filter((record) => record.status === "late").length,
      absent: safeAttendance.filter((record) => record.status === "absent").length,
      leave: safeAttendance.filter((record) => record.status === "leave").length,
    },
    taskSummary: {
      total: safeTasks.length,
      completed: completedTasks.length,
      overdue: safeTasks.filter((task) => {
        if (task.status === "completed" || task.status === "cancelled" || !task.deadline) return false;
        return new Date(task.deadline).getTime() < now;
      }).length,
      revision: safeTasks.filter((task) => task.status === "revision").length,
    },
    qualitySummary: {
      averageQualityScore,
    },
  };
}

// ============================================================================
// Public Service Functions
// ============================================================================

export async function getKpiReviews(params: KpiReviewParams = {}): Promise<KpiReview[]> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        let query = client.from("kpi_reviews").select("*");

        if (params.employeeId) query = query.eq("employee_id", params.employeeId);
        if (params.month) query = query.eq("period_month", params.month);
        if (params.year) query = query.eq("period_year", params.year);
        if (params.level) query = query.eq("level", params.level);

        const { data, error } = await query.order("period_year", { ascending: false });

        if (!error && data) {
          const records = safeArray<Record<string, unknown>>(data).map(mapKpiRow);
          cacheKpiReviews(records);
          return records;
        }
      } catch (err) {
        console.warn("[KpiService] getKpiReviews:", err);
      }
    }
  }

  return getLocalArray<KpiReview>(KPI_STORAGE_KEY).filter((record) => {
    if (!record?.employeeId) return false;
    if (params.employeeId && record.employeeId !== params.employeeId) return false;
    if (params.month && record.month !== params.month) return false;
    if (params.year && record.year !== params.year) return false;
    if (params.level && record.level !== params.level) return false;
    return true;
  });
}

export async function getKpiReviewByEmployee(
  employeeId: string,
  month: number,
  year: number
): Promise<KpiReview | null> {
  const reviews = await getKpiReviews({ employeeId, month, year });
  return reviews[0] || null;
}

export async function calculateEmployeeKpi(
  employeeId: string,
  month: number,
  year: number
): Promise<KpiReview> {
  const employees = await getEmployees();
  const employee = employees.find((item) => item.id === employeeId);
  const [attendance, tasks] = await Promise.all([
    getAttendanceForEmployee(employeeId, month, year),
    getTasksForEmployee(employeeId, month, year),
  ]);

  const attendanceScore = calcAttendanceScore(attendance, month, year);
  const taskCompletionScore = calcTaskCompletionScore(tasks);
  const deadlineScore = calcDeadlineScore(tasks);
  const qualityScore = calcQualityScore(tasks);
  const finalScore = calcFinalScore(
    attendanceScore,
    taskCompletionScore,
    deadlineScore,
    qualityScore
  );
  const now = new Date().toISOString();

  return {
    employeeId,
    employeeName: employee?.name || "",
    month: normalizeMonth(month),
    year: normalizeYear(year),
    attendanceScore,
    taskCompletionScore,
    deadlineScore,
    qualityScore,
    finalScore,
    level: getKpiLevel(finalScore),
    notes: "",
    reviewedBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getKpiBreakdown(
  employeeId: string,
  month: number,
  year: number
): Promise<KpiBreakdown> {
  const [attendance, tasks] = await Promise.all([
    getAttendanceForEmployee(employeeId, month, year),
    getTasksForEmployee(employeeId, month, year),
  ]);

  return buildKpiBreakdown(attendance, tasks);
}

export async function calculateAllEmployeesKpi(month: number, year: number): Promise<KpiReview[]> {
  const employees = await getEmployees();
  const activeEmployees = safeArray<EmployeeRow>(employees).filter((employee) => employee.isActive);

  if (activeEmployees.length === 0) return [];

  const reviews = await Promise.all(
    activeEmployees.map((employee) => calculateEmployeeKpi(employee.id, month, year))
  );

  return reviews;
}

export async function upsertKpiReview(data: UpsertKpiReviewData): Promise<KpiReview> {
  const now = new Date().toISOString();
  const attendanceScore = clampScore(data.attendanceScore ?? 0);
  const taskCompletionScore = clampScore(data.taskCompletionScore ?? 0);
  const deadlineScore = clampScore(data.deadlineScore ?? 0);
  const qualityScore = clampScore(data.qualityScore ?? 0);
  const finalScore = clampScore(
    data.finalScore ??
      calcFinalScore(attendanceScore, taskCompletionScore, deadlineScore, qualityScore)
  );

  const review: KpiReview = {
    id: data.id,
    employeeId: data.employeeId,
    employeeName: data.employeeName || "",
    month: normalizeMonth(data.month),
    year: normalizeYear(data.year),
    attendanceScore,
    taskCompletionScore,
    deadlineScore,
    qualityScore,
    finalScore,
    level: data.level || getKpiLevel(finalScore),
    notes: data.notes || "",
    reviewedBy: data.reviewedBy || null,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("kpi_reviews")
          .upsert(mapKpiToDbRow(review), {
            onConflict: "employee_id,period_month,period_year",
          })
          .select()
          .single();

        if (!error && dbData) {
          const saved = mapKpiRow(dbData);
          cacheKpiReviews([saved]);
          return saved;
        }
      } catch (err) {
        console.warn("[KpiService] upsertKpiReview:", err);
      }
    }
  }

  const stored = getLocalArray<KpiReview>(KPI_STORAGE_KEY);
  const existingIndex = stored.findIndex(
    (item) =>
      item.employeeId === review.employeeId &&
      item.month === review.month &&
      item.year === review.year
  );

  if (existingIndex >= 0) {
    stored[existingIndex] = { ...stored[existingIndex], ...review };
  } else {
    stored.push(review);
  }

  setLocalData(KPI_STORAGE_KEY, stored);
  return review;
}

export async function getKpiSummary(month: number, year: number): Promise<{
  staff: KpiReview[];
  stats: Record<KpiLevel, number> & { total: number; averageScore: number };
}> {
  const staff = safeArray<KpiReview>(await getKpiReviews({ month, year }));
  const stats: Record<KpiLevel, number> & { total: number; averageScore: number } = {
    excellent: 0,
    good: 0,
    needs_improve: 0,
    poor: 0,
    total: staff.length,
    averageScore: 0,
  };

  staff.forEach((review) => {
    const level = KPI_LEVELS[review.level] ? review.level : getKpiLevel(review.finalScore);
    stats[level] += 1;
  });

  stats.averageScore =
    staff.length > 0
      ? clampScore(staff.reduce((sum, review) => sum + toNumber(review.finalScore), 0) / staff.length)
      : 0;

  return { staff, stats };
}

// ============================================================================
// Backward-Compatible Aliases
// ============================================================================

export async function getKpiForEmployee(
  employeeId: string,
  year: number,
  month: number
): Promise<KpiReview | null> {
  return getKpiReviewByEmployee(employeeId, month, year);
}

export async function getMonthlyKpi(year: number, month: number): Promise<KpiReview[]> {
  return getKpiReviews({ month, year });
}

export async function saveKpi(kpi: KpiReview): Promise<KpiReview> {
  return upsertKpiReview(kpi);
}

export async function deleteKpi(employeeId: string, year: number, month: number): Promise<void> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client
          .from("kpi_reviews")
          .delete()
          .eq("employee_id", employeeId)
          .eq("period_year", year)
          .eq("period_month", month);
      } catch (err) {
        console.warn("[KpiService] deleteKpi:", err);
      }
    }
  }

  const stored = getLocalArray<KpiReview>(KPI_STORAGE_KEY).filter(
    (item) => !(item.employeeId === employeeId && item.year === year && item.month === month)
  );
  setLocalData(KPI_STORAGE_KEY, stored);
}
