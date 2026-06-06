/**
 * Auth Service
 *
 * Mengelola operasi autentikasi untuk:
 * - Admin login
 * - Client login
 * - User session
 * - Role-based access
 *
 * Menggunakan Supabase Auth dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export type UserRole = "customer" | "admin" | "super_admin" | "finance" | "editor" | "photographer" | "videographer" | "staff";
export type AdminRole = "super_admin" | "admin" | "finance" | "editor" | "photographer" | "videographer" | "staff" | "customer";

export interface AuthUser {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  whatsapp?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const USER_STORAGE_KEY = "danivisual_user";
const SESSION_KEY = "danivisual_session";

// ============================================================================
// Default Admin Credentials (fallback)
// ============================================================================

const DEFAULT_ADMINS: AuthUser[] = [
  { username: "admin", name: "Admin Utama", role: "admin" },
];

const DEFAULT_CLIENTS: AuthUser[] = [
  { username: "danivisual", name: "Dani Indra", role: "customer", whatsapp: "081234567890" },
  { username: "dani0001", name: "Dani Indra", role: "customer", whatsapp: "081234567890" },
];

// ============================================================================
// Helper Functions
// ============================================================================

const getStoredUser = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<AuthUser>;
    return {
      username: parsed.username || "danivisual",
      name: parsed.name || "Dani Indra",
      role: parsed.role || "customer",
      whatsapp: parsed.whatsapp,
    };
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const setStoredUser = (user: AuthUser): void => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const clearStoredUser = (): void => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

// ============================================================================
// Authentication Operations
// ============================================================================

/**
 * Login user
 */
export const login = async (
  username: string,
  password: string
): Promise<AuthResult> => {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Check Supabase first if configured
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        // Try Supabase auth
        const { data, error } = await client.auth.signInWithPassword({
          email: `${cleanUsername}@danivisual.app`,
          password: cleanPassword,
        });

        if (!error && data.user) {
          // Get user profile from database
          const { data: profile } = await client
            .from("admin_users")
            .select("*")
            .eq("username", cleanUsername)
            .single();

          const user: AuthUser = {
            id: data.user.id,
            username: cleanUsername,
            name: profile?.name || cleanUsername,
            role: profile?.role === "super_admin" ? "super_admin" as const : "admin",
          };

          // Update last login
          if (profile) {
            await client
              .from("admin_users")
              .update({ last_login: new Date().toISOString() })
              .eq("username", cleanUsername);
          }

          setStoredUser(user);
          return { success: true, user };
        }
      } catch (err) {
        console.error("[AuthService] Supabase login error:", err);
      }
    }
  }

  // Fallback: Check default credentials
  if (cleanUsername === "admin" && cleanPassword === "admin") {
    const user: AuthUser = { username: "admin", name: "Admin Danivisual", role: "admin" };
    setStoredUser(user);
    return { success: true, user };
  }

  const clientUser = DEFAULT_CLIENTS.find(
    (c) => c.username === cleanUsername && cleanPassword === "client"
  );

  if (clientUser) {
    setStoredUser(clientUser);
    return { success: true, user: clientUser };
  }

  return { success: false, error: "Username atau password salah" };
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut().catch(() => {
        // Ignore signOut errors
      });
    }
  }

  clearStoredUser();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  // Check localStorage first
  const storedUser = getStoredUser();
  if (storedUser) return true;

  // Check Supabase session if configured
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.auth.getSession();
      return !!data.session;
    }
  }

  return false;
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  // Check localStorage first
  const storedUser = getStoredUser();
  if (storedUser) return storedUser;

  // Check Supabase session if configured
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.auth.getSession();
      if (data.session?.user) {
        return {
          id: data.session.user.id,
          username: data.session.user.email?.split("@")[0] || "user",
          name: data.session.user.user_metadata?.name || "User",
          role: "customer" as const,
        };
      }
    }
  }

  return null;
};

/**
 * Refresh session
 */
export const refreshSession = async (): Promise<AuthUser | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.refreshSession();
      if (!error && data.session) {
        return {
          id: data.session.user.id,
          username: data.session.user.email?.split("@")[0] || "user",
          name: data.session.user.user_metadata?.name || "User",
          role: "customer" as const,
        };
      }
    }
  }

  return getStoredUser();
};

// ============================================================================
// Admin User Management (for Settings page)
// ============================================================================

/**
 * Get all admin users
 */
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[AuthService] getAdminUsers error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
    }));
  }

  // Fallback: return default admin
  return [
    {
      id: "admin-1",
      username: "admin",
      name: "Admin Utama",
      role: "super_admin",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
};

/**
 * Create admin user
 */
export const createAdminUser = async (
  userData: Omit<AdminUser, "id" | "createdAt" | "lastLogin">
): Promise<AdminUser | null> => {
  const newUser: AdminUser = {
    ...userData,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    console.warn("[AuthService] createAdminUser disabled in Supabase mode. Use staffUserService/create-staff-user Edge Function.");
    return null;
  }

  // Fallback: not implemented (users are hardcoded)
  console.warn("[AuthService] createAdminUser not available in fallback mode");
  return newUser;
};

/**
 * Update admin user
 */
export const updateAdminUser = async (
  id: string,
  updates: Partial<AdminUser>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await client
      .from("admin_users")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("[AuthService] updateAdminUser error:", error);
      return false;
    }

    return true;
  }

  // Fallback: not implemented
  return false;
};

/**
 * Delete admin user
 */
export const deleteAdminUser = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("admin_users").delete().eq("id", id);

    if (error) {
      console.error("[AuthService] deleteAdminUser error:", error);
      return false;
    }

    return true;
  }

  // Fallback: not implemented
  return false;
};

// ============================================================================
// Role-based Access Control
// ============================================================================

/**
 * Check if user has admin access
 */
export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.role === "admin" || user?.role === "super_admin";
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user: AuthUser | null): boolean => {
  return user?.role === "super_admin";
};

/**
 * Check if user is client
 */
export const isClient = (user: AuthUser | null): boolean => {
  return user?.role === "customer";
};

/**
 * Get permissions for role
 */
export const getRolePermissions = (
  role: AdminRole
): {
  canManageContent: boolean;
  canManageBookings: boolean;
  canManagePayments: boolean;
  canManagePackages: boolean;
  canManagePortfolio: boolean;
  canManageFaqs: boolean;
  canManageCalendar: boolean;
  canManageMedia: boolean;
  canViewAnalytics: boolean;
  canManageAdmins: boolean;
  canAccessSettings: boolean;
} => {
  switch (role) {
    case "super_admin":
      return {
        canManageContent: true,
        canManageBookings: true,
        canManagePayments: true,
        canManagePackages: true,
        canManagePortfolio: true,
        canManageFaqs: true,
        canManageCalendar: true,
        canManageMedia: true,
        canViewAnalytics: true,
        canManageAdmins: true,
        canAccessSettings: true,
      };
    case "admin":
      return {
        canManageContent: true,
        canManageBookings: true,
        canManagePayments: true,
        canManagePackages: true,
        canManagePortfolio: true,
        canManageFaqs: true,
        canManageCalendar: true,
        canManageMedia: true,
        canViewAnalytics: true,
        canManageAdmins: false,
        canAccessSettings: true,
      };
    case "finance":
      return {
        canManageContent: false,
        canManageBookings: true,
        canManagePayments: true,
        canManagePackages: false,
        canManagePortfolio: false,
        canManageFaqs: false,
        canManageCalendar: true,
        canManageMedia: false,
        canViewAnalytics: true,
        canManageAdmins: false,
        canAccessSettings: false,
      };
    case "editor":
      return {
        canManageContent: true,
        canManageBookings: false,
        canManagePayments: false,
        canManagePackages: false,
        canManagePortfolio: true,
        canManageFaqs: true,
        canManageCalendar: true,
        canManageMedia: true,
        canViewAnalytics: false,
        canManageAdmins: false,
        canAccessSettings: false,
      };
    case "staff":
      return {
        canManageContent: false,
        canManageBookings: true,
        canManagePayments: false,
        canManagePackages: false,
        canManagePortfolio: false,
        canManageFaqs: false,
        canManageCalendar: true,
        canManageMedia: true,
        canViewAnalytics: false,
        canManageAdmins: false,
        canAccessSettings: false,
      };
    case "customer":
      return {
        canManageContent: false,
        canManageBookings: false,
        canManagePayments: false,
        canManagePackages: false,
        canManagePortfolio: false,
        canManageFaqs: false,
        canManageCalendar: false,
        canManageMedia: false,
        canViewAnalytics: false,
        canManageAdmins: false,
        canAccessSettings: false,
      };
    default:
      return {
        canManageContent: false,
        canManageBookings: false,
        canManagePayments: false,
        canManagePackages: false,
        canManagePortfolio: false,
        canManageFaqs: false,
        canManageCalendar: false,
        canManageMedia: false,
        canViewAnalytics: false,
        canManageAdmins: false,
        canAccessSettings: false,
      };
  }
};

// ============================================================================
// Session Management
// ============================================================================

/**
 * Save session to localStorage
 */
export const saveSession = (user: AuthUser): void => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    user,
    timestamp: Date.now(),
  }));
};

/**
 * Get session from localStorage
 */
export const getSession = (): AuthUser | null => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;

    const parsed = JSON.parse(session);
    // Session expires after 30 minutes
    if (Date.now() - parsed.timestamp > 30 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    return null;
  }
};

/**
 * Clear session
 */
export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};
