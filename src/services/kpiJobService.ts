/**
 * KPI Job Service
 *
 * Mengelola template, job, assignment, review, dan kalkulasi KPI Job.
 * Supabase menjadi sumber utama; localStorage hanya dipakai sebagai fallback
 * development ketika Supabase belum dikonfigurasi.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

export type KpiJobPriority = "low" | "medium" | "high" | "urgent";
export type KpiAssignmentMode =
  | "all_employees"
  | "specific_role"
  | "multiple_roles"
  | "specific_employee"
  | "multiple_employees";
export type KpiJobStatus = "draft" | "active" | "completed" | "cancelled";
export type KpiJobAssignmentStatus =
  | "todo"
  | "in_progress"
  | "submitted"
  | "revision"
  | "approved"
  | "rejected"
  | "completed"
  | "overdue"
  | "cancelled";
export type KpiJobReviewAction = "approve" | "revision" | "reject";
export type StaffRole =
  | "super_admin"
  | "admin"
  | "finance"
  | "editor"
  | "photographer"
  | "videographer"
  | "staff"
  | "customer";

export interface KpiJobTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  targetRole: string | null;
  defaultPriority: KpiJobPriority;
  defaultWeight: number;
  defaultDeadlineDays: number;
  scoringRules: Record<string, unknown>;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiJob {
  id: string;
  templateId: string | null;
  title: string;
  description: string;
  category: string;
  assignmentMode: KpiAssignmentMode;
  targetRoles: string[];
  targetEmployeeIds: string[];
  priority: KpiJobPriority;
  weight: number;
  deadline: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  status: KpiJobStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiJobAssignment {
  id: string;
  kpiJobId: string;
  employeeId: string;
  assignedToUserId: string | null;
  assignedBy: string | null;
  role: string | null;
  status: KpiJobAssignmentStatus;
  startedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  deadline: string | null;
  completionScore: number;
  deadlineScore: number;
  qualityScore: number;
  finalScore: number;
  submissionNote: string;
  submissionUrl: string;
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKpiJobInput {
  templateId?: string | null;
  title: string;
  description?: string;
  category?: string;
  assignmentMode?: KpiAssignmentMode;
  targetRoles?: string[];
  targetEmployeeIds?: string[];
  priority?: KpiJobPriority;
  weight?: number;
  deadline?: string | null;
  periodMonth?: number | null;
  periodYear?: number | null;
  status?: KpiJobStatus;
  createdBy?: string | null;
}

export interface UpdateKpiJobAssignmentInput {
  status?: KpiJobAssignmentStatus;
  startedAt?: string | null;
  submittedAt?: string | null;
  submissionNote?: string;
  submissionUrl?: string;
  qualityScore?: number;
  reviewNote?: string;
}

export interface KpiJobAssignmentFilters {
  employeeId?: string;
  kpiJobId?: string;
  status?: KpiJobAssignmentStatus;
  periodMonth?: number;
  periodYear?: number;
}

export interface KpiJobReviewInput {
  action: KpiJobReviewAction;
  qualityScore?: number;
  reviewNote?: string;
}

export interface KpiJobScoreSummary {
  totalJobs: number;
  completedJobs: number;
  overdueJobs: number;
  avgQuality: number;
  deadlineScore: number;
  completionScore: number;
  finalScore: number;
}

type DbRow = Record<string, unknown>;

interface EmployeeTarget {
  id: string;
  userId: string | null;
  role: string;
  isActive: boolean;
}

interface LocalUser {
  id: string;
  role: StaffRole;
  employeeId?: string;
}

const TEMPLATE_KEY = "danivisual_kpi_job_templates";
const JOB_KEY = "danivisual_kpi_jobs";
const ASSIGNMENT_KEY = "danivisual_kpi_job_assignments";
const EMPLOYEES_KEY = "danivisual_employees";
const USER_KEY = "danivisual_user";

const ADMIN_ROLES = new Set<StaffRole>(["super_admin", "admin"]);
const TERMINAL_STATUSES = new Set<KpiJobAssignmentStatus>([
  "approved",
  "completed",
  "rejected",
  "cancelled",
]);

const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

const nowIso = (): string => new Date().toISOString();

const canUseLocalFallback = (): boolean => !isSupabaseConfigured() && import.meta.env.DEV;

const ensureSupabaseOrDevFallback = (): void => {
  if (!isSupabaseConfigured() && !import.meta.env.DEV) {
    throw new Error("Supabase belum dikonfigurasi. KPI Jobs membutuhkan database di production.");
  }
};

const ensureSupabase = (): void => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi. Operasi KPI Jobs membutuhkan database.");
  }
};

const getLocalArray = <T>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setLocalArray = <T>(key: string, data: T[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(data));
};

const getCurrentLocalUser = (): LocalUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(USER_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LocalUser;
  } catch {
    return null;
  }
};

const isAdminUser = (user: LocalUser | null): boolean =>
  Boolean(user?.role && ADMIN_ROLES.has(user.role));

const toNumber = (value: unknown, fallback = 0): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const clampScore = (value: unknown): number => Math.max(0, Math.min(100, toNumber(value)));

const normalizeArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter(Boolean).map(String) : [];

const normalizeMonth = (value: number | null | undefined): number | null => {
  if (!value) return null;
  return Math.max(1, Math.min(12, Math.floor(value)));
};

const normalizeYear = (value: number | null | undefined): number | null => {
  if (!value) return null;
  return Math.floor(value);
};

const mapTemplateRow = (row: DbRow): KpiJobTemplate => ({
  id: String(row.id || ""),
  title: String(row.title || ""),
  description: String(row.description || ""),
  category: String(row.category || "general"),
  targetRole: row.target_role ? String(row.target_role) : null,
  defaultPriority: (row.default_priority as KpiJobPriority) || "medium",
  defaultWeight: toNumber(row.default_weight, 1),
  defaultDeadlineDays: toNumber(row.default_deadline_days, 7),
  scoringRules: (row.scoring_rules as Record<string, unknown>) || {},
  isActive: row.is_active !== false,
  createdBy: row.created_by ? String(row.created_by) : null,
  createdAt: String(row.created_at || nowIso()),
  updatedAt: String(row.updated_at || nowIso()),
});

const mapTemplateToRow = (data: Partial<KpiJobTemplate>): DbRow => {
  const row: DbRow = {};
  if (data.title !== undefined) row.title = data.title;
  if (data.description !== undefined) row.description = data.description;
  if (data.category !== undefined) row.category = data.category;
  if (data.targetRole !== undefined) row.target_role = data.targetRole;
  if (data.defaultPriority !== undefined) row.default_priority = data.defaultPriority;
  if (data.defaultWeight !== undefined) row.default_weight = data.defaultWeight;
  if (data.defaultDeadlineDays !== undefined) row.default_deadline_days = data.defaultDeadlineDays;
  if (data.scoringRules !== undefined) row.scoring_rules = data.scoringRules;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  if (data.createdBy !== undefined) row.created_by = data.createdBy;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
};

const mapJobRow = (row: DbRow): KpiJob => ({
  id: String(row.id || ""),
  templateId: row.template_id ? String(row.template_id) : null,
  title: String(row.title || ""),
  description: String(row.description || ""),
  category: String(row.category || "general"),
  assignmentMode: (row.assignment_mode as KpiAssignmentMode) || "specific_role",
  targetRoles: normalizeArray(row.target_roles),
  targetEmployeeIds: normalizeArray(row.target_employee_ids),
  priority: (row.priority as KpiJobPriority) || "medium",
  weight: toNumber(row.weight, 1),
  deadline: row.deadline ? String(row.deadline) : null,
  periodMonth: row.period_month ? toNumber(row.period_month) : null,
  periodYear: row.period_year ? toNumber(row.period_year) : null,
  status: (row.status as KpiJobStatus) || "active",
  createdBy: row.created_by ? String(row.created_by) : null,
  createdAt: String(row.created_at || nowIso()),
  updatedAt: String(row.updated_at || nowIso()),
});

const mapJobToRow = (data: Partial<KpiJob>): DbRow => {
  const row: DbRow = {};
  if (data.templateId !== undefined) row.template_id = data.templateId;
  if (data.title !== undefined) row.title = data.title;
  if (data.description !== undefined) row.description = data.description;
  if (data.category !== undefined) row.category = data.category;
  if (data.assignmentMode !== undefined) row.assignment_mode = data.assignmentMode;
  if (data.targetRoles !== undefined) row.target_roles = data.targetRoles;
  if (data.targetEmployeeIds !== undefined) row.target_employee_ids = data.targetEmployeeIds;
  if (data.priority !== undefined) row.priority = data.priority;
  if (data.weight !== undefined) row.weight = data.weight;
  if (data.deadline !== undefined) row.deadline = data.deadline;
  if (data.periodMonth !== undefined) row.period_month = data.periodMonth;
  if (data.periodYear !== undefined) row.period_year = data.periodYear;
  if (data.status !== undefined) row.status = data.status;
  if (data.createdBy !== undefined) row.created_by = data.createdBy;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
};

const mapAssignmentRow = (row: DbRow): KpiJobAssignment => ({
  id: String(row.id || ""),
  kpiJobId: String(row.kpi_job_id || ""),
  employeeId: String(row.employee_id || ""),
  assignedToUserId: row.assigned_to_user_id ? String(row.assigned_to_user_id) : null,
  assignedBy: row.assigned_by ? String(row.assigned_by) : null,
  role: row.role ? String(row.role) : null,
  status: (row.status as KpiJobAssignmentStatus) || "todo",
  startedAt: row.started_at ? String(row.started_at) : null,
  submittedAt: row.submitted_at ? String(row.submitted_at) : null,
  approvedAt: row.approved_at ? String(row.approved_at) : null,
  rejectedAt: row.rejected_at ? String(row.rejected_at) : null,
  deadline: row.deadline ? String(row.deadline) : null,
  completionScore: toNumber(row.completion_score),
  deadlineScore: toNumber(row.deadline_score),
  qualityScore: toNumber(row.quality_score),
  finalScore: toNumber(row.final_score),
  submissionNote: String(row.submission_note || ""),
  submissionUrl: String(row.submission_url || ""),
  reviewNote: String(row.review_note || ""),
  createdAt: String(row.created_at || nowIso()),
  updatedAt: String(row.updated_at || nowIso()),
});

const mapAssignmentToRow = (data: Partial<KpiJobAssignment>): DbRow => {
  const row: DbRow = {};
  if (data.kpiJobId !== undefined) row.kpi_job_id = data.kpiJobId;
  if (data.employeeId !== undefined) row.employee_id = data.employeeId;
  if (data.assignedToUserId !== undefined) row.assigned_to_user_id = data.assignedToUserId;
  if (data.assignedBy !== undefined) row.assigned_by = data.assignedBy;
  if (data.role !== undefined) row.role = data.role;
  if (data.status !== undefined) row.status = data.status;
  if (data.startedAt !== undefined) row.started_at = data.startedAt;
  if (data.submittedAt !== undefined) row.submitted_at = data.submittedAt;
  if (data.approvedAt !== undefined) row.approved_at = data.approvedAt;
  if (data.rejectedAt !== undefined) row.rejected_at = data.rejectedAt;
  if (data.deadline !== undefined) row.deadline = data.deadline;
  if (data.completionScore !== undefined) row.completion_score = data.completionScore;
  if (data.deadlineScore !== undefined) row.deadline_score = data.deadlineScore;
  if (data.qualityScore !== undefined) row.quality_score = data.qualityScore;
  if (data.finalScore !== undefined) row.final_score = data.finalScore;
  if (data.submissionNote !== undefined) row.submission_note = data.submissionNote;
  if (data.submissionUrl !== undefined) row.submission_url = data.submissionUrl;
  if (data.reviewNote !== undefined) row.review_note = data.reviewNote;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
};

const mapEmployeeTarget = (row: DbRow): EmployeeTarget => ({
  id: String(row.id || ""),
  userId: row.user_id || row.userId ? String(row.user_id || row.userId) : null,
  role: String(row.role || ""),
  isActive: row.is_active !== false && row.isActive !== false,
});

const buildJobFromInput = (data: CreateKpiJobInput, id = generateId()): KpiJob => {
  const currentUser = getCurrentLocalUser();
  const now = nowIso();
  const targetRoles = data.targetRoles || [];
  const targetEmployeeIds = data.targetEmployeeIds || [];

  return {
    id,
    templateId: data.templateId || null,
    title: data.title,
    description: data.description || "",
    category: data.category || "general",
    assignmentMode: data.assignmentMode || "specific_role",
    targetRoles,
    targetEmployeeIds,
    priority: data.priority || "medium",
    weight: data.weight ?? 1,
    deadline: data.deadline || null,
    periodMonth: normalizeMonth(data.periodMonth),
    periodYear: normalizeYear(data.periodYear),
    status: data.status || "active",
    createdBy: data.createdBy ?? currentUser?.id ?? null,
    createdAt: now,
    updatedAt: now,
  };
};

const filterEmployeesForJob = (employees: EmployeeTarget[], job: KpiJob): EmployeeTarget[] => {
  const activeEmployees = employees.filter((employee) => employee.isActive && employee.role !== "customer");

  switch (job.assignmentMode) {
    case "all_employees":
      return activeEmployees;
    case "specific_role": {
      const role = job.targetRoles[0];
      return role ? activeEmployees.filter((employee) => employee.role === role) : [];
    }
    case "multiple_roles":
      return activeEmployees.filter((employee) => job.targetRoles.includes(employee.role));
    case "specific_employee": {
      const employeeId = job.targetEmployeeIds[0];
      return employeeId ? activeEmployees.filter((employee) => employee.id === employeeId) : [];
    }
    case "multiple_employees":
      return activeEmployees.filter((employee) => job.targetEmployeeIds.includes(employee.id));
    default:
      return [];
  }
};

const fetchTargetEmployees = async (job: KpiJob): Promise<EmployeeTarget[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    let query = client.from("employees").select("id,user_id,role,is_active").eq("is_active", true);

    if (job.assignmentMode === "specific_role" && job.targetRoles[0]) {
      query = query.eq("role", job.targetRoles[0]);
    } else if (job.assignmentMode === "multiple_roles" && job.targetRoles.length > 0) {
      query = query.in("role", job.targetRoles);
    } else if (
      (job.assignmentMode === "specific_employee" || job.assignmentMode === "multiple_employees") &&
      job.targetEmployeeIds.length > 0
    ) {
      query = query.in("id", job.targetEmployeeIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => mapEmployeeTarget(row as DbRow)).filter((employee) => employee.role !== "customer");
  }

  ensureSupabaseOrDevFallback();
  const employees = getLocalArray<DbRow>(EMPLOYEES_KEY).map(mapEmployeeTarget);
  return filterEmployeesForJob(employees, job);
};

const getExistingAssignmentsForJob = async (jobId: string, employeeIds: string[]): Promise<KpiJobAssignment[]> => {
  if (employeeIds.length === 0) return [];

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("kpi_job_assignments")
      .select("*")
      .eq("kpi_job_id", jobId)
      .in("employee_id", employeeIds);

    if (error) throw error;
    return (data || []).map((row) => mapAssignmentRow(row as DbRow));
  }

  ensureSupabaseOrDevFallback();
  return getLocalArray<KpiJobAssignment>(ASSIGNMENT_KEY).filter(
    (assignment) => assignment.kpiJobId === jobId && employeeIds.includes(assignment.employeeId)
  );
};

const buildAssignments = (
  job: KpiJob,
  employees: EmployeeTarget[],
  existingEmployeeIds = new Set<string>()
): KpiJobAssignment[] => {
  const now = nowIso();
  return employees
    .filter((employee) => !existingEmployeeIds.has(employee.id))
    .map((employee) => ({
      id: generateId(),
      kpiJobId: job.id,
      employeeId: employee.id,
      assignedToUserId: employee.userId,
      assignedBy: job.createdBy,
      role: employee.role,
      status: "todo",
      startedAt: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      deadline: job.deadline,
      completionScore: 0,
      deadlineScore: 0,
      qualityScore: 0,
      finalScore: 0,
      submissionNote: "",
      submissionUrl: "",
      reviewNote: "",
      createdAt: now,
      updatedAt: now,
    }));
};

const getAssignmentOrThrow = async (assignmentId: string): Promise<KpiJobAssignment> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available.");

    const { data, error } = await client
      .from("kpi_job_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (error) throw error;
    return mapAssignmentRow(data as DbRow);
  }

  ensureSupabaseOrDevFallback();
  const assignment = getLocalArray<KpiJobAssignment>(ASSIGNMENT_KEY).find((item) => item.id === assignmentId);
  if (!assignment) throw new Error("KPI job assignment not found.");
  return assignment;
};

const updateAssignment = async (
  assignmentId: string,
  updates: Partial<KpiJobAssignment>
): Promise<KpiJobAssignment> => {
  const nextUpdates = { ...updates, updatedAt: nowIso() };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available.");

    const { data, error } = await client
      .from("kpi_job_assignments")
      .update(mapAssignmentToRow(nextUpdates))
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) throw error;
    return mapAssignmentRow(data as DbRow);
  }

  ensureSupabaseOrDevFallback();
  const assignments = getLocalArray<KpiJobAssignment>(ASSIGNMENT_KEY);
  const index = assignments.findIndex((assignment) => assignment.id === assignmentId);
  if (index < 0) throw new Error("KPI job assignment not found.");

  assignments[index] = { ...assignments[index], ...nextUpdates };
  setLocalArray(ASSIGNMENT_KEY, assignments);
  return assignments[index];
};

const calculateReviewScores = (
  assignment: KpiJobAssignment,
  action: KpiJobReviewAction,
  qualityScoreInput?: number
): Pick<KpiJobAssignment, "completionScore" | "deadlineScore" | "qualityScore" | "finalScore"> => {
  if (action !== "approve") {
    return {
      completionScore: 0,
      deadlineScore: 0,
      qualityScore: action === "revision" ? clampScore(qualityScoreInput ?? assignment.qualityScore) : 0,
      finalScore: 0,
    };
  }

  const submittedAt = assignment.submittedAt ? new Date(assignment.submittedAt).getTime() : Date.now();
  const deadlineAt = assignment.deadline ? new Date(assignment.deadline).getTime() : null;
  const completionScore = 100;
  const deadlineScore = deadlineAt ? (submittedAt <= deadlineAt ? 100 : 0) : 100;
  const qualityScore = clampScore(qualityScoreInput ?? assignment.qualityScore);
  const finalScore = clampScore(completionScore * 0.4 + deadlineScore * 0.3 + qualityScore * 0.3);

  return { completionScore, deadlineScore, qualityScore, finalScore };
};

const requireLocalAdminReviewer = (): void => {
  if (isSupabaseConfigured()) return;
  const user = getCurrentLocalUser();
  if (!isAdminUser(user)) {
    throw new Error("Hanya super_admin/admin yang bisa mereview KPI Job assignments.");
  }
};

export const getKpiJobTemplates = async (): Promise<KpiJobTemplate[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("kpi_job_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => mapTemplateRow(row as DbRow));
  }

  ensureSupabaseOrDevFallback();
  return getLocalArray<KpiJobTemplate>(TEMPLATE_KEY);
};

export const createKpiJobTemplate = async (
  data: Omit<Partial<KpiJobTemplate>, "id" | "createdAt" | "updatedAt">
): Promise<KpiJobTemplate> => {
  const now = nowIso();
  const template: KpiJobTemplate = {
    id: generateId(),
    title: data.title || "",
    description: data.description || "",
    category: data.category || "general",
    targetRole: data.targetRole ?? null,
    defaultPriority: data.defaultPriority || "medium",
    defaultWeight: data.defaultWeight ?? 1,
    defaultDeadlineDays: data.defaultDeadlineDays ?? 7,
    scoringRules: data.scoringRules || {},
    isActive: data.isActive ?? true,
    createdBy: data.createdBy ?? getCurrentLocalUser()?.id ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available.");

    const { data: dbData, error } = await client
      .from("kpi_job_templates")
      .insert(mapTemplateToRow(template))
      .select()
      .single();

    if (error) throw error;
    return mapTemplateRow(dbData as DbRow);
  }

  ensureSupabaseOrDevFallback();
  const templates = getLocalArray<KpiJobTemplate>(TEMPLATE_KEY);
  templates.unshift(template);
  setLocalArray(TEMPLATE_KEY, templates);
  return template;
};

export const updateKpiJobTemplate = async (
  id: string,
  data: Partial<Omit<KpiJobTemplate, "id" | "createdAt">>
): Promise<KpiJobTemplate> => {
  const updates = { ...data, updatedAt: nowIso() };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available.");

    const { data: dbData, error } = await client
      .from("kpi_job_templates")
      .update(mapTemplateToRow(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapTemplateRow(dbData as DbRow);
  }

  ensureSupabaseOrDevFallback();
  const templates = getLocalArray<KpiJobTemplate>(TEMPLATE_KEY);
  const index = templates.findIndex((template) => template.id === id);
  if (index < 0) throw new Error("KPI job template not found.");
  templates[index] = { ...templates[index], ...updates };
  setLocalArray(TEMPLATE_KEY, templates);
  return templates[index];
};

export const deleteKpiJobTemplate = async (id: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available.");

    const { error } = await client.from("kpi_job_templates").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  ensureSupabaseOrDevFallback();
  setLocalArray(
    TEMPLATE_KEY,
    getLocalArray<KpiJobTemplate>(TEMPLATE_KEY).filter((template) => template.id !== id)
  );
};

export const createKpiJob = async (data: CreateKpiJobInput): Promise<{
  job: KpiJob;
  assignments: KpiJobAssignment[];
}> => {
  // PRODUCTION: Supabase is REQUIRED
  if (!isSupabaseConfigured()) {
    if (!import.meta.env.DEV) {
      throw new Error("Supabase belum dikonfigurasi. Tidak bisa membuat KPI Job di production.");
    }
    // DEV: Continue with localStorage fallback
  } else {
    const client = getSupabaseClient();
    if (!client) {
      if (!import.meta.env.DEV) {
        throw new Error("Koneksi database tidak tersedia. Tidak bisa membuat KPI Job di production.");
      }
    } else {
      try {
        const { data: dbJob, error: jobError } = await client
          .from("kpi_jobs")
          .insert(mapJobToRow(buildJobFromInput(data)))
          .select()
          .single();

        if (jobError) {
          console.error("[kpiJobService] createKpiJob:", jobError);
          throw new Error(`Gagal membuat KPI Job: ${jobError.message}`);
        }

        const savedJob = mapJobRow(dbJob as DbRow);
        const targets = await fetchTargetEmployees(savedJob);
        const targetIds = targets.map((employee) => employee.id);
        const existing = await getExistingAssignmentsForJob(savedJob.id, targetIds);
        const assignments = buildAssignments(
          savedJob,
          targets,
          new Set(existing.map((assignment) => assignment.employeeId))
        );

        if (assignments.length === 0) {
          return { job: savedJob, assignments: [] };
        }

        const { data: dbAssignments, error: assignmentError } = await client
          .from("kpi_job_assignments")
          .insert(assignments.map(mapAssignmentToRow))
          .select();

        if (assignmentError) {
          console.error("[kpiJobService] createKpiJob assignments:", assignmentError);
          throw new Error(`Gagal membuat assignment: ${assignmentError.message}`);
        }

        return {
          job: savedJob,
          assignments: (dbAssignments || []).map((row) => mapAssignmentRow(row as DbRow)),
        };
      } catch (err) {
        if (err instanceof Error && err.message.includes("Supabase")) throw err;
        console.error("[kpiJobService] createKpiJob:", err);
        throw new Error("Gagal membuat KPI Job. Silakan coba lagi.");
      }
    }
  }

  // DEV-ONLY: localStorage fallback
  ensureSupabaseOrDevFallback();
  const job = buildJobFromInput(data);
  const targets = await fetchTargetEmployees(job);
  const existing = await getExistingAssignmentsForJob(job.id, targets.map((employee) => employee.id));
  const assignments = buildAssignments(job, targets, new Set(existing.map((assignment) => assignment.employeeId)));

  const jobs = getLocalArray<KpiJob>(JOB_KEY);
  jobs.unshift(job);
  setLocalArray(JOB_KEY, jobs);
  setLocalArray(ASSIGNMENT_KEY, [...assignments, ...getLocalArray<KpiJobAssignment>(ASSIGNMENT_KEY)]);

  return { job, assignments };
};

export const getKpiJobs = async (): Promise<KpiJob[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) {
      if (!import.meta.env.DEV) {
        console.error("[kpiJobService] Supabase client not available in production");
        return [];
      }
      ensureSupabaseOrDevFallback();
    } else {
      try {
        const { data, error } = await client.from("kpi_jobs").select("*").order("created_at", { ascending: false });
        if (error) {
          console.error("[kpiJobService] getKpiJobs:", error);
          throw new Error(`Gagal memuat KPI Jobs: ${error.message}`);
        }
        return (data || []).map((row) => mapJobRow(row as DbRow));
      } catch (err) {
        if (err instanceof Error && err.message.includes("Gagal")) throw err;
        console.error("[kpiJobService] getKpiJobs:", err);
        throw new Error("Gagal memuat KPI Jobs. Silakan coba lagi.");
      }
    }
  }

  // DEV-ONLY: localStorage fallback
  ensureSupabaseOrDevFallback();
  const user = getCurrentLocalUser();
  const jobs = getLocalArray<KpiJob>(JOB_KEY);

  if (isAdminUser(user)) return jobs;
  if (!user?.employeeId || user.role === "customer") return [];

  const assignedJobIds = new Set(
    getLocalArray<KpiJobAssignment>(ASSIGNMENT_KEY)
      .filter((assignment) => assignment.employeeId === user.employeeId)
      .map((assignment) => assignment.kpiJobId)
  );

  return jobs.filter((job) => assignedJobIds.has(job.id));
};

export const getMyKpiJobAssignments = async (employeeId: string): Promise<KpiJobAssignment[]> => {
  if (!employeeId) return [];

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) {
      if (!import.meta.env.DEV) {
        console.error("[kpiJobService] Supabase client not available in production");
        return [];
      }
      ensureSupabaseOrDevFallback();
    } else {
      try {
        const { data, error } = await client
          .from("kpi_job_assignments")
          .select("*")
          .eq("employee_id", employeeId)
          .order("deadline", { ascending: true, nullsFirst: false });

        if (error) {
          console.error("[kpiJobService] getMyKpiJobAssignments:", error);
          throw new Error(`Gagal memuat KPI Job assignments: ${error.message}`);
        }
        return (data || []).map((row) => mapAssignmentRow(row as DbRow));
      } catch (err) {
        if (err instanceof Error && err.message.includes("Gagal")) throw err;
        console.error("[kpiJobService] getMyKpiJobAssignments:", err);
        throw new Error("Gagal memuat KPI Job assignments. Silakan coba lagi.");
      }
    }
  }

  // DEV-ONLY: localStorage fallback
  ensureSupabaseOrDevFallback();
  return getLocalArray<KpiJobAssignment>(ASSIGNMENT_KEY).filter(
    (assignment) => assignment.employeeId === employeeId
  );
};

export const getKpiJobAssignments = async (
  filters: KpiJobAssignmentFilters = {}
): Promise<KpiJobAssignment[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) {
      if (!import.meta.env.DEV) {
        console.error("[kpiJobService] Supabase client not available in production");
        return [];
      }
      ensureSupabaseOrDevFallback();
    } else {
      try {
        let query = client.from("kpi_job_assignments").select("*");
        if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
        if (filters.kpiJobId) query = query.eq("kpi_job_id", filters.kpiJobId);
        if (filters.status) query = query.eq("status", filters.status);

        const { data, error } = await query.order("deadline", { ascending: true, nullsFirst: false });
        if (error) {
          console.error("[kpiJobService] getKpiJobAssignments:", error);
          throw new Error(`Gagal memuat KPI Job assignments: ${error.message}`);
        }

        let assignments = (data || []).map((row) => mapAssignmentRow(row as DbRow));
        if (filters.periodMonth || filters.periodYear) {
          assignments = await filterAssignmentsByPeriod(assignments, filters.periodMonth, filters.periodYear);
        }
        return assignments;
      } catch (err) {
        if (err instanceof Error && err.message.includes("Gagal")) throw err;
        console.error("[kpiJobService] getKpiJobAssignments:", err);
        throw new Error("Gagal memuat KPI Job assignments. Silakan coba lagi.");
      }
    }
  }

  // DEV-ONLY: localStorage fallback
  ensureSupabaseOrDevFallback();
  const user = getCurrentLocalUser();
  if (!isAdminUser(user)) {
    throw new Error("Hanya super_admin/admin yang bisa melihat semua KPI Job assignments.");
  }

  let assignments = getLocalArray<KpiJobAssignment>(ASSIGNMENT_KEY);
  if (filters.employeeId) assignments = assignments.filter((assignment) => assignment.employeeId === filters.employeeId);
  if (filters.kpiJobId) assignments = assignments.filter((assignment) => assignment.kpiJobId === filters.kpiJobId);
  if (filters.status) assignments = assignments.filter((assignment) => assignment.status === filters.status);
  if (filters.periodMonth || filters.periodYear) {
    assignments = await filterAssignmentsByPeriod(assignments, filters.periodMonth, filters.periodYear);
  }
  return assignments;
};

export const startKpiJobAssignment = async (assignmentId: string): Promise<KpiJobAssignment> => {
  const assignment = await getAssignmentOrThrow(assignmentId);
  if (!["todo", "revision"].includes(assignment.status)) {
    throw new Error("KPI Job hanya bisa dimulai dari status 'To Do' atau 'Revision'.");
  }

  // PRODUCTION: Supabase is REQUIRED for mutations
  if (!isSupabaseConfigured()) {
    if (!import.meta.env.DEV) {
      throw new Error("Supabase belum dikonfigurasi. Tidak bisa memulai KPI Job di production.");
    }
    // DEV: Fall through to localStorage
  } else {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("kpi_job_assignments")
          .update({
            status: "in_progress",
            started_at: assignment.startedAt || nowIso(),
            updated_at: nowIso(),
          })
          .eq("id", assignmentId)
          .select()
          .single();

        if (error) {
          console.error("[kpiJobService] startKpiJobAssignment:", error);
          throw new Error(`Gagal memulai KPI Job: ${error.message}`);
        }
        return mapAssignmentRow(data as DbRow);
      } catch (err) {
        if (err instanceof Error && err.message.includes("Gagal")) throw err;
        console.error("[kpiJobService] startKpiJobAssignment:", err);
        throw new Error("Gagal memulai KPI Job. Silakan coba lagi.");
      }
    }
  }

  // DEV-ONLY: localStorage fallback
  ensureSupabaseOrDevFallback();
  return updateAssignment(assignmentId, {
    status: "in_progress",
    startedAt: assignment.startedAt || nowIso(),
  });
};

export const submitKpiJobAssignment = async (
  assignmentId: string,
  data: Pick<UpdateKpiJobAssignmentInput, "submissionNote" | "submissionUrl">
): Promise<KpiJobAssignment> => {
  const assignment = await getAssignmentOrThrow(assignmentId);
  if (!["in_progress", "revision"].includes(assignment.status)) {
    throw new Error("KPI Job hanya bisa disubmit dari status 'In Progress' atau 'Revision'.");
  }

  // PRODUCTION: Supabase is REQUIRED for mutations
  if (!isSupabaseConfigured()) {
    if (!import.meta.env.DEV) {
      throw new Error("Supabase belum dikonfigurasi. Tidak bisa submit KPI Job di production.");
    }
    // DEV: Fall through to localStorage
  } else {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("kpi_job_assignments")
          .update({
            status: "submitted",
            submitted_at: nowIso(),
            submission_note: data.submissionNote || "",
            submission_url: data.submissionUrl || "",
            updated_at: nowIso(),
          })
          .eq("id", assignmentId)
          .select()
          .single();

        if (error) {
          console.error("[kpiJobService] submitKpiJobAssignment:", error);
          throw new Error(`Gagal submit KPI Job: ${error.message}`);
        }
        return mapAssignmentRow(dbData as DbRow);
      } catch (err) {
        if (err instanceof Error && err.message.includes("Gagal")) throw err;
        console.error("[kpiJobService] submitKpiJobAssignment:", err);
        throw new Error("Gagal submit KPI Job. Silakan coba lagi.");
      }
    }
  }

  // DEV-ONLY: localStorage fallback
  ensureSupabaseOrDevFallback();
  return updateAssignment(assignmentId, {
    status: "submitted",
    submittedAt: nowIso(),
    submissionNote: data.submissionNote || "",
    submissionUrl: data.submissionUrl || "",
  });
};

export const reviewKpiJobAssignment = async (
  assignmentId: string,
  review: KpiJobReviewInput
): Promise<KpiJobAssignment> => {
  requireLocalAdminReviewer();

  const assignment = await getAssignmentOrThrow(assignmentId);
  const now = nowIso();
  const scoreUpdates = calculateReviewScores(assignment, review.action, review.qualityScore);

  // PRODUCTION: Supabase is REQUIRED for admin review mutations
  if (!isSupabaseConfigured()) {
    if (!import.meta.env.DEV) {
      throw new Error("Supabase belum dikonfigurasi. Tidak bisa mereview KPI Job di production.");
    }
    // DEV: Fall through to localStorage
  } else {
    const client = getSupabaseClient();
    if (client) {
      try {
        let dbUpdates: Record<string, unknown> = {
          updated_at: now,
        };

        if (review.action === "revision") {
          dbUpdates = {
            ...dbUpdates,
            status: "revision",
            review_note: review.reviewNote || "",
            quality_score: scoreUpdates.qualityScore,
            final_score: scoreUpdates.finalScore,
          };
        } else if (review.action === "reject") {
          dbUpdates = {
            ...dbUpdates,
            status: "rejected",
            rejected_at: now,
            approved_at: null,
            review_note: review.reviewNote || "",
            ...scoreUpdates,
          };
        } else {
          dbUpdates = {
            ...dbUpdates,
            status: "approved",
            approved_at: now,
            rejected_at: null,
            review_note: review.reviewNote || "",
            ...scoreUpdates,
          };
        }

        const { data: dbData, error } = await client
          .from("kpi_job_assignments")
          .update(dbUpdates)
          .eq("id", assignmentId)
          .select()
          .single();

        if (error) {
          console.error("[kpiJobService] reviewKpiJobAssignment:", error);
          throw new Error(`Gagal mereview KPI Job: ${error.message}`);
        }
        return mapAssignmentRow(dbData as DbRow);
      } catch (err) {
        if (err instanceof Error && err.message.includes("Gagal")) throw err;
        console.error("[kpiJobService] reviewKpiJobAssignment:", err);
        throw new Error("Gagal mereview KPI Job. Silakan coba lagi.");
      }
    }
  }

  // DEV-ONLY: localStorage fallback
  ensureSupabaseOrDevFallback();
  if (review.action === "revision") {
    return updateAssignment(assignmentId, {
      status: "revision",
      reviewNote: review.reviewNote || "",
      qualityScore: scoreUpdates.qualityScore,
      finalScore: scoreUpdates.finalScore,
    });
  }

  if (review.action === "reject") {
    return updateAssignment(assignmentId, {
      status: "rejected",
      rejectedAt: now,
      approvedAt: null,
      reviewNote: review.reviewNote || "",
      ...scoreUpdates,
    });
  }

  return updateAssignment(assignmentId, {
    status: "approved",
    approvedAt: now,
    rejectedAt: null,
    reviewNote: review.reviewNote || "",
    ...scoreUpdates,
  });
};

export const calculateKpiJobScores = async (
  employeeId: string,
  periodMonth: number,
  periodYear: number
): Promise<KpiJobScoreSummary> => {
  const assignments = await filterAssignmentsByPeriod(
    await getMyKpiJobAssignments(employeeId),
    periodMonth,
    periodYear
  );

  const activeAssignments = assignments.filter((assignment) => assignment.status !== "cancelled");
  const completedAssignments = activeAssignments.filter((assignment) =>
    ["approved", "completed"].includes(assignment.status)
  );
  const now = Date.now();
  const overdueJobs = activeAssignments.filter((assignment) => {
    if (TERMINAL_STATUSES.has(assignment.status)) return false;
    if (assignment.status === "overdue") return true;
    return assignment.deadline ? new Date(assignment.deadline).getTime() < now : false;
  }).length;

  const totalJobs = activeAssignments.length;
  const completedJobs = completedAssignments.length;
  const avgQuality =
    completedJobs > 0
      ? clampScore(
          completedAssignments.reduce((sum, assignment) => sum + toNumber(assignment.qualityScore), 0) /
            completedJobs
        )
      : 0;
  const deadlineScore =
    completedJobs > 0
      ? clampScore(
          completedAssignments.reduce((sum, assignment) => sum + toNumber(assignment.deadlineScore), 0) /
            completedJobs
        )
      : 0;
  const completionScore = totalJobs > 0 ? clampScore((completedJobs / totalJobs) * 100) : 0;
  const finalScore = clampScore(completionScore * 0.4 + deadlineScore * 0.3 + avgQuality * 0.3);

  return {
    totalJobs,
    completedJobs,
    overdueJobs,
    avgQuality,
    deadlineScore,
    completionScore,
    finalScore,
  };
};

async function filterAssignmentsByPeriod(
  assignments: KpiJobAssignment[],
  periodMonth?: number,
  periodYear?: number
): Promise<KpiJobAssignment[]> {
  if (!periodMonth && !periodYear) return assignments;
  if (assignments.length === 0) return [];

  const jobIds = Array.from(new Set(assignments.map((assignment) => assignment.kpiJobId)));
  const jobs = await getJobsByIds(jobIds);
  const matchedJobIds = new Set(
    jobs
      .filter((job) => {
        if (periodMonth && job.periodMonth !== normalizeMonth(periodMonth)) return false;
        if (periodYear && job.periodYear !== normalizeYear(periodYear)) return false;
        return true;
      })
      .map((job) => job.id)
  );

  return assignments.filter((assignment) => matchedJobIds.has(assignment.kpiJobId));
}

async function getJobsByIds(ids: string[]): Promise<KpiJob[]> {
  if (ids.length === 0) return [];

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client.from("kpi_jobs").select("*").in("id", ids);
    if (error) throw error;
    return (data || []).map((row) => mapJobRow(row as DbRow));
  }

  ensureSupabaseOrDevFallback();
  return getLocalArray<KpiJob>(JOB_KEY).filter((job) => ids.includes(job.id));
}
