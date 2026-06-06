/**
 * Staff Task Service
 *
 * Mengelola tugas staff dengan deadline dan status tracking.
 * Menggunakan Supabase sebagai sumber utama dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export type TaskStatus = "todo" | "in_progress" | "submitted" | "revision" | "completed" | "cancelled" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  assignedById: string;
  assignedByName: string;
  bookingId?: string;
  bookingOrderNumber?: string;
  productionRecordId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  resultNote: string;
  resultUrl: string;
  revisionNote: string;
  qualityScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  priority: TaskPriority;
  deadline: string;
  bookingId?: string;
  bookingOrderNumber?: string;
  productionRecordId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  resultNote?: string;
  resultUrl?: string;
  revisionNote?: string;
  qualityScore?: number | null;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const TASKS_KEY = "danivisual_staff_tasks";

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Map database row to StaffTask
const mapRowToTask = (row: Record<string, unknown>): StaffTask => ({
  id: row.id as string,
  title: row.title as string,
  description: (row.description as string) || "",
  assignedToId: row.assigned_to as string,
  assignedToName: (row.assigned_to_name as string) || "",
  assignedById: (row.assigned_by as string) || "",
  assignedByName: (row.assigned_by_name as string) || "",
  bookingId: row.booking_id as string | undefined,
  bookingOrderNumber: (row.booking_order_number as string) || undefined,
  productionRecordId: row.production_record_id as string | undefined,
  priority: (row.priority as TaskPriority) || "medium",
  status: (row.status as TaskStatus) || "todo",
  deadline: row.deadline as string,
  startedAt: row.started_at as string | null,
  submittedAt: row.submitted_at as string | null,
  completedAt: row.completed_at as string | null,
  resultNote: (row.result_note as string) || "",
  resultUrl: (row.result_url as string) || "",
  revisionNote: (row.revision_note as string) || "",
  qualityScore: row.quality_score as number | null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// Map StaffTask to database row
const mapToDbRow = (task: Partial<StaffTask>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.assignedToId !== undefined) row.assigned_to = task.assignedToId;
  if (task.assignedToName !== undefined) row.assigned_to_name = task.assignedToName;
  if (task.assignedById !== undefined) row.assigned_by = task.assignedById;
  if (task.assignedByName !== undefined) row.assigned_by_name = task.assignedByName;
  if (task.bookingId !== undefined) row.booking_id = task.bookingId;
  if (task.bookingOrderNumber !== undefined) row.booking_order_number = task.bookingOrderNumber;
  if (task.productionRecordId !== undefined) row.production_record_id = task.productionRecordId;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.status !== undefined) row.status = task.status;
  if (task.deadline !== undefined) row.deadline = task.deadline;
  if (task.startedAt !== undefined) row.started_at = task.startedAt;
  if (task.submittedAt !== undefined) row.submitted_at = task.submittedAt;
  if (task.completedAt !== undefined) row.completed_at = task.completedAt;
  if (task.resultNote !== undefined) row.result_note = task.resultNote;
  if (task.resultUrl !== undefined) row.result_url = task.resultUrl;
  if (task.revisionNote !== undefined) row.revision_note = task.revisionNote;
  if (task.qualityScore !== undefined) row.quality_score = task.qualityScore;
  return row;
};

// ============================================================================
// Task Operations
// ============================================================================

/**
 * Ambil semua tasks
 */
export const getTasks = async (): Promise<StaffTask[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("staff_tasks")
          .select("*")
          .order("deadline", { ascending: true });

        if (!error && data && data.length > 0) {
          const tasks = data.map(mapRowToTask);
          setLocalData(TASKS_KEY, tasks);
          return tasks;
        }
      } catch (err) {
        console.warn("[StaffTaskService] Supabase error:", err);
      }
    }
  }

  return getLocalData<StaffTask[]>(TASKS_KEY, []);
};

/**
 * Ambil tasks untuk employee tertentu
 */
export const getTasksByEmployee = async (employeeId: string): Promise<StaffTask[]> => {
  const allTasks = await getTasks();
  return allTasks.filter((task) => task.assignedToId === employeeId);
};

/**
 * Ambil tasks yang dibuat oleh admin tertentu
 */
export const getTasksByCreator = async (createdById: string): Promise<StaffTask[]> => {
  const allTasks = await getTasks();
  return allTasks.filter((task) => task.assignedById === createdById);
};

/**
 * Ambil tasks untuk booking/production tertentu
 */
export const getTasksByBooking = async (bookingId: string): Promise<StaffTask[]> => {
  const allTasks = await getTasks();
  return allTasks.filter(
    (task) => task.bookingId === bookingId || task.productionRecordId === bookingId
  );
};

/**
 * Ambil tasks berdasarkan status
 */
export const getTasksByStatus = async (status: TaskStatus): Promise<StaffTask[]> => {
  const allTasks = await getTasks();
  return allTasks.filter((task) => task.status === status);
};

/**
 * Buat task baru
 */
export const createTask = async (
  data: CreateTaskData,
  createdById: string,
  createdByName: string
): Promise<StaffTask | null> => {
  const now = new Date().toISOString();
  const newTask: StaffTask = {
    id: generateId(),
    title: data.title,
    description: data.description,
    assignedToId: data.assignedToId,
    assignedToName: data.assignedToName,
    assignedById: createdById,
    assignedByName: createdByName,
    bookingId: data.bookingId,
    bookingOrderNumber: data.bookingOrderNumber,
    productionRecordId: data.productionRecordId,
    priority: data.priority,
    status: "todo",
    deadline: data.deadline,
    startedAt: null,
    submittedAt: null,
    completedAt: null,
    resultNote: "",
    resultUrl: "",
    revisionNote: "",
    qualityScore: null,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("staff_tasks")
          .insert(mapToDbRow(newTask))
          .select()
          .single();

        if (!error && dbData) {
          const created = mapRowToTask(dbData);
          const allTasks = await getTasks();
          setLocalData(TASKS_KEY, [created, ...allTasks]);
          return created;
        }
      } catch (err) {
        console.warn("[StaffTaskService] createTask error:", err);
      }
    }
  }

  // Fallback localStorage
  const allTasks = await getTasks();
  setLocalData(TASKS_KEY, [newTask, ...allTasks]);
  return newTask;
};

/**
 * Update task
 */
export const updateTask = async (
  id: string,
  updates: UpdateTaskData
): Promise<StaffTask | null> => {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const dbUpdates: Record<string, unknown> = mapToDbRow(updates);
        dbUpdates.updated_at = now;

        const { data: dbData, error } = await client
          .from("staff_tasks")
          .update(dbUpdates)
          .eq("id", id)
          .select()
          .single();

        if (!error && dbData) {
          const updated = mapRowToTask(dbData);
          const allTasks = await getTasks();
          const updatedTasks = allTasks.map((t) => (t.id === id ? updated : t));
          setLocalData(TASKS_KEY, updatedTasks);
          return updated;
        }
      } catch (err) {
        console.warn("[StaffTaskService] updateTask error:", err);
      }
    }
  }

  // Fallback localStorage
  const allTasks = await getTasks();
  const updatedTasks = allTasks.map((t) =>
    t.id === id ? { ...t, ...updates, updatedAt: now } : t
  );
  setLocalData(TASKS_KEY, updatedTasks);
  return updatedTasks.find((t) => t.id === id) || null;
};

/**
 * Start task (staff mulai mengerjakan)
 */
export const startTask = async (id: string): Promise<StaffTask | null> => {
  const now = new Date().toISOString();
  return updateTask(id, { status: "in_progress", startedAt: now });
};

/**
 * Submit task result (staff selesai mengerjakan)
 */
export const submitTask = async (
  id: string,
  resultNote: string,
  resultUrl?: string
): Promise<StaffTask | null> => {
  const now = new Date().toISOString();
  return updateTask(id, {
    status: "submitted",
    submittedAt: now,
    resultNote,
    resultUrl,
  });
};

/**
 * Request revision (admin minta revisi)
 */
export const requestRevision = async (
  id: string,
  revisionNote: string
): Promise<StaffTask | null> => {
  return updateTask(id, { status: "revision", revisionNote });
};

/**
 * Complete task (admin approve)
 */
export const completeTask = async (
  id: string,
  qualityScore?: number
): Promise<StaffTask | null> => {
  const now = new Date().toISOString();
  return updateTask(id, {
    status: "completed",
    completedAt: now,
    qualityScore: qualityScore || null,
  });
};

/**
 * Cancel task
 */
export const cancelTask = async (id: string): Promise<StaffTask | null> => {
  return updateTask(id, { status: "cancelled" });
};

/**
 * Delete task
 */
export const deleteTask = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from("staff_tasks").delete().eq("id", id);
        if (!error) {
          const allTasks = await getTasks();
          setLocalData(TASKS_KEY, allTasks.filter((t) => t.id !== id));
          return true;
        }
      } catch (err) {
        console.warn("[StaffTaskService] deleteTask error:", err);
      }
    }
  }

  const allTasks = await getTasks();
  setLocalData(TASKS_KEY, allTasks.filter((t) => t.id !== id));
  return true;
};

/**
 * Ambil task statistics untuk employee
 */
export const getTaskStats = async (
  employeeId: string
): Promise<{
  total: number;
  todo: number;
  inProgress: number;
  submitted: number;
  revision: number;
  completed: number;
  overdue: number;
  avgQualityScore: number;
}> => {
  const tasks = await getTasksByEmployee(employeeId);

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const submitted = tasks.filter((t) => t.status === "submitted").length;
  const revision = tasks.filter((t) => t.status === "revision").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  // Check overdue
  const now = new Date().toISOString();
  const overdue = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      new Date(t.deadline) < new Date(now)
  ).length;

  // Average quality score
  const completedWithScore = tasks.filter(
    (t) => t.status === "completed" && t.qualityScore !== null
  );
  const avgQualityScore =
    completedWithScore.length > 0
      ? Math.round(
          completedWithScore.reduce((sum, t) => sum + (t.qualityScore || 0), 0) /
            completedWithScore.length
        )
      : 0;

  return { total, todo, inProgress, submitted, revision, completed, overdue, avgQualityScore };
};

/**
 * Ambil semua task statistics (untuk admin)
 */
export const getAllTaskStats = async (): Promise<{
  total: number;
  todo: number;
  inProgress: number;
  submitted: number;
  revision: number;
  completed: number;
  overdue: number;
  byEmployee: Record<string, number>;
}> => {
  const tasks = await getTasks();

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const submitted = tasks.filter((t) => t.status === "submitted").length;
  const revision = tasks.filter((t) => t.status === "revision").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  const now = new Date().toISOString();
  const overdue = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      new Date(t.deadline) < new Date(now)
  ).length;

  // Group by employee
  const byEmployee: Record<string, number> = {};
  tasks.forEach((t) => {
    byEmployee[t.assignedToName] = (byEmployee[t.assignedToName] || 0) + 1;
  });

  return { total, todo, inProgress, submitted, revision, completed, overdue, byEmployee };
};

// ============================================================================
// Priority & Status Helpers
// ============================================================================

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "text-gray-500" },
  medium: { label: "Medium", color: "text-blue-500" },
  high: { label: "High", color: "text-amber-500" },
  urgent: { label: "Urgent", color: "text-red-500" },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: "To Do", color: "text-gray-700", bg: "bg-gray-100" },
  in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100" },
  submitted: { label: "Submitted", color: "text-purple-700", bg: "bg-purple-100" },
  revision: { label: "Revision", color: "text-amber-700", bg: "bg-amber-100" },
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-100" },
  overdue: { label: "Overdue", color: "text-red-700", bg: "bg-red-100" },
  cancelled: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100" },
};
