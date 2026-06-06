import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

export type StaffUserRole =
  | "super_admin"
  | "admin"
  | "finance"
  | "editor"
  | "photographer"
  | "videographer"
  | "staff"
  | "customer";

export interface StaffUser {
  id: string;
  userId?: string;
  adminUserId?: string;
  employeeId?: string | null;
  customerId?: string | null;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffUserRole;
  position?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface CreateStaffUserInput {
  name: string;
  email: string;
  temporaryPassword: string;
  role: StaffUserRole;
  position?: string;
  phone?: string;
  isActive: boolean;
}

export type UpdateStaffUserInput = Partial<Omit<CreateStaffUserInput, "temporaryPassword">> & {
  temporaryPassword?: string;
};

const DEV_STAFF_USERS_KEY = "danivisual_dev_staff_users";
const DEV_EMPLOYEE_ID_BY_EMAIL: Record<string, string> = {
  "admin@danivisual.test": "dev-employee-admin",
  "finance@danivisual.test": "dev-employee-finance",
  "editor@danivisual.test": "dev-employee-editor",
  "photographer@danivisual.test": "dev-employee-photographer",
  "videographer@danivisual.test": "dev-employee-videographer",
  "staff@danivisual.test": "dev-employee-staff",
};

function isDevFallbackAllowed() {
  return import.meta.env.DEV;
}

function usernameFromEmail(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
}

function readDevUsers(): Array<StaffUser & { temporaryPassword?: string }> {
  if (!isDevFallbackAllowed() || typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEV_STAFF_USERS_KEY) || "[]");
  } catch {
    localStorage.removeItem(DEV_STAFF_USERS_KEY);
    return [];
  }
}

function writeDevUsers(users: Array<StaffUser & { temporaryPassword?: string }>) {
  if (!isDevFallbackAllowed()) return;
  localStorage.setItem(DEV_STAFF_USERS_KEY, JSON.stringify(users));
}

function toStaffUser(row: Record<string, unknown>): StaffUser {
  const email = String(row.email || "");
  return {
    id: String(row.id || row.auth_id || email),
    userId: row.auth_id ? String(row.auth_id) : undefined,
    adminUserId: row.id ? String(row.id) : undefined,
    employeeId: row.employee_id ? String(row.employee_id) : null,
    username: String(row.username || usernameFromEmail(email)),
    name: String(row.name || email),
    email,
    phone: row.phone ? String(row.phone) : undefined,
    role: String(row.role || "staff") as StaffUserRole,
    position: row.position ? String(row.position) : undefined,
    isActive: row.is_active !== false,
    lastLogin: row.last_login ? String(row.last_login) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function createDevUser(data: CreateStaffUserInput): StaffUser {
  const email = data.email.trim().toLowerCase();
  const users = readDevUsers();
  const existing = users.find((user) => user.email.toLowerCase() === email);
  const operational = ["admin", "finance", "editor", "photographer", "videographer", "staff"].includes(data.role);
  const sampleEmployeeId = DEV_EMPLOYEE_ID_BY_EMAIL[email];
  const fallbackEmployeeId = sampleEmployeeId || existing?.employeeId || `dev-employee-${usernameFromEmail(email)}`;
  const now = new Date().toISOString();
  const nextUser: StaffUser & { temporaryPassword?: string } = {
    id: existing?.id || `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    userId: existing?.userId || `dev-auth-${email}`,
    adminUserId: existing?.adminUserId || `dev-admin-${email}`,
    employeeId: operational ? fallbackEmployeeId : null,
    customerId: data.role === "customer" ? existing?.customerId || `dev-customer-${email}` : null,
    username: usernameFromEmail(email),
    name: data.name.trim(),
    email,
    phone: data.phone,
    role: data.role,
    position: data.position,
    isActive: data.isActive,
    createdAt: existing?.createdAt || now,
    temporaryPassword: data.temporaryPassword,
  };

  writeDevUsers(existing ? users.map((user) => (user.id === existing.id ? nextUser : user)) : [...users, nextUser]);
  return nextUser;
}

export async function createStaffUser(data: CreateStaffUserInput): Promise<StaffUser> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available");

    const { data: result, error } = await client.functions.invoke("create-staff-user", {
      body: data,
    });

    if (!error && result?.success) {
      return {
        id: result.adminUserId || result.userId,
        userId: result.userId,
        adminUserId: result.adminUserId,
        employeeId: result.employeeId || null,
        customerId: result.customerId || null,
        username: usernameFromEmail(data.email),
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        role: data.role,
        position: data.position,
        isActive: data.isActive,
        createdAt: new Date().toISOString(),
      };
    }

    if (!isDevFallbackAllowed()) {
      throw new Error(error?.message || result?.error || "Failed to create user");
    }
  }

  if (!isDevFallbackAllowed()) {
    throw new Error("Supabase Edge Function is required to create login users in production");
  }

  return createDevUser(data);
}

export async function createSampleUsers(): Promise<StaffUser[]> {
  if (!import.meta.env.DEV) {
    throw new Error("Sample users are only available in development");
  }

  const sampleUsers: CreateStaffUserInput[] = [
    { name: "Super Admin", email: "superadmin@danivisual.test", temporaryPassword: "Test123456", role: "super_admin", position: "Owner", phone: "", isActive: true },
    { name: "Admin Danivisual", email: "admin@danivisual.test", temporaryPassword: "Test123456", role: "admin", position: "Admin", phone: "", isActive: true },
    { name: "Finance Danivisual", email: "finance@danivisual.test", temporaryPassword: "Test123456", role: "finance", position: "Finance", phone: "", isActive: true },
    { name: "Editor Danivisual", email: "editor@danivisual.test", temporaryPassword: "Test123456", role: "editor", position: "Editor", phone: "", isActive: true },
    { name: "Photographer Danivisual", email: "photographer@danivisual.test", temporaryPassword: "Test123456", role: "photographer", position: "Photographer", phone: "", isActive: true },
    { name: "Videographer Danivisual", email: "videographer@danivisual.test", temporaryPassword: "Test123456", role: "videographer", position: "Videographer", phone: "", isActive: true },
    { name: "Staff Danivisual", email: "staff@danivisual.test", temporaryPassword: "Test123456", role: "staff", position: "Staff", phone: "", isActive: true },
    { name: "Customer Danivisual", email: "customer@danivisual.test", temporaryPassword: "Test123456", role: "customer", position: "Customer", phone: "", isActive: true },
  ];

  const created: StaffUser[] = [];
  for (const sample of sampleUsers) {
    created.push(await createStaffUser(sample));
  }
  return created;
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("admin_users")
      .select("id, auth_id, employee_id, username, name, email, phone, role, position, is_active, last_login, created_at")
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data.map((row) => toStaffUser(row));
    }

    if (!isDevFallbackAllowed()) {
      throw new Error(error?.message || "Failed to load users");
    }
  }

  return readDevUsers().map(({ temporaryPassword: _temporaryPassword, ...user }) => user);
}

export async function deactivateStaffUser(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available");

    const { data: result, error } = await client.functions.invoke("update-staff-user", {
      body: { userId: id, action: "deactivate" },
    });

    if (!error && result?.success) return;

    // Parse error from Edge Function
    const errorMessage = result?.error || error?.message || "Failed to deactivate user";
    const errorCode = result?.code || "";

    // LAST_SUPER_ADMIN guard returned409 from Edge Function
    if (errorCode === "LAST_SUPER_ADMIN" || String(errorMessage).includes("Tidak dapat menonaktifkan")) {
      throw new Error(
        "Tidak dapat menonaktifkan satu-satunya Super Admin aktif. Sistem harus memiliki minimal satu Super Admin aktif."
      );
    }

    if (!isDevFallbackAllowed()) {
      throw new Error(errorMessage);
    }
  }

  if (!isDevFallbackAllowed()) {
    throw new Error("Supabase Edge Function is required to deactivate users in production");
  }

  // DEV fallback
  const users = readDevUsers();
  const existing = users.find((user) => user.id === id || user.adminUserId === id);
  if (!existing) throw new Error("User not found");
  writeDevUsers(users.map((user) => (user.id === existing.id ? { ...user, isActive: false } : user)));
}

export async function reactivateStaffUser(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available");

    const { data: result, error } = await client.functions.invoke("update-staff-user", {
      body: { userId: id, action: "reactivate" },
    });

    if (!error && result?.success) return;

    const errorMessage = result?.error || error?.message || "Failed to reactivate user";
    if (!isDevFallbackAllowed()) {
      throw new Error(errorMessage);
    }
  }

  if (!isDevFallbackAllowed()) {
    throw new Error("Supabase Edge Function is required to reactivate users in production");
  }

  // DEV fallback
  const users = readDevUsers();
  const existing = users.find((user) => user.id === id || user.adminUserId === id);
  if (!existing) throw new Error("User not found");
  writeDevUsers(users.map((user) => (user.id === existing.id ? { ...user, isActive: true } : user)));
}

export async function updateStaffUser(id: string, data: UpdateStaffUserInput): Promise<StaffUser> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not available");

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email.toLowerCase();
    if (data.phone !== undefined) updates.phone = data.phone || null;
    if (data.position !== undefined) updates.position = data.position || null;
    if (data.role !== undefined) updates.role = data.role;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    updates.updated_at = new Date().toISOString();

    const { data: row, error } = await client.from("admin_users").update(updates).eq("id", id).select("*").single();
    if (!error && row) return toStaffUser(row);
    if (!isDevFallbackAllowed()) throw new Error(error?.message || "Failed to update user");
  }

  if (!isDevFallbackAllowed()) {
    throw new Error("Supabase is required to update users in production");
  }

  const users = readDevUsers();
  const existing = users.find((user) => user.id === id || user.adminUserId === id);
  if (!existing) throw new Error("User not found");
  const updated = {
    ...existing,
    ...data,
    email: data.email ? data.email.toLowerCase() : existing.email,
    username: data.email ? usernameFromEmail(data.email) : existing.username,
  };
  writeDevUsers(users.map((user) => (user.id === existing.id ? updated : user)));
  return updated;
}
