/**
 * Auth Service
 *
 * Mengelola operasi autentikasi untuk:
 * - Admin login
 * - User session
 * - Role-based access
 *
 * Menggunakan PHP API backend dengan session cookie.
 * Demo login hanya tampil di development mode.
 */

import { apiClient } from "../lib/apiClient";

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
  email?: string;
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
// Session Storage Keys
// ============================================================================

const SESSION_KEY = "danivisual_session";
const USER_STORAGE_KEY = "danivisual_user";

// ============================================================================
// Demo Credentials (HANYA untuk development)
// ============================================================================

const DEFAULT_ADMINS: AuthUser[] = [
  { username: "admin", name: "Admin Utama", role: "admin" },
];

const DEFAULT_CLIENTS: AuthUser[] = [
  { username: "danivisual", name: "Dani Indra", role: "customer", whatsapp: "081234567890" },
];

const isDev = import.meta.env.DEV;
const showDemoLogin = import.meta.env.VITE_SHOW_DEMO_LOGIN !== 'false';

// ============================================================================
// Helper Functions
// ============================================================================

export const getStoredUser = (): AuthUser | null => {
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
 * Login user via PHP API
 */
export const login = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Try PHP API login first
  try {
    const response = await apiClient.login(cleanEmail, cleanPassword);
    if (response.success && response.data) {
      const user: AuthUser = {
        id: response.data.id,
        username: response.data.username || response.data.email?.split('@')[0] || '',
        name: response.data.name || response.data.username || '',
        role: response.data.role || 'customer',
        email: response.data.email,
        whatsapp: response.data.whatsapp,
      };
      setStoredUser(user);
      return { success: true, user };
    }
  } catch (err) {
    console.warn("[AuthService] API login failed:", err);
  }

  // Development-only: fallback demo credentials
  // PRODUCTION: Matikan fallback ini dengan set VITE_SHOW_DEMO_LOGIN=false
  if (isDev || showDemoLogin) {
    // Admin demo login
    if (cleanEmail === "admin@danivisual.com" && cleanPassword === "admin123") {
      const user: AuthUser = { username: "admin", name: "Admin Danivisual", role: "admin" };
      setStoredUser(user);
      return { success: true, user };
    }

    // Client demo login
    if (cleanEmail === "danivisual" && cleanPassword === "client") {
      const clientUser = DEFAULT_CLIENTS.find((c) => c.username === cleanEmail);
      if (clientUser) {
        setStoredUser(clientUser);
        return { success: true, user: clientUser };
      }
    }
  }

  return { success: false, error: "Email atau password salah" };
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.logout();
  } catch (err) {
    console.warn("[AuthService] API logout failed:", err);
  }

  clearStoredUser();
};

/**
 * Check if user is authenticated (from session)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await apiClient.me();
    return response.success;
  } catch {
    return false;
  }
};

/**
 * Get current user from session
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const response = await apiClient.me();
    if (response.success && response.data) {
      return response.data as AuthUser;
    }
  } catch {
    // Fallback to localStorage if session fails
  }

  return getStoredUser();
};

/**
 * Refresh session
 */
export const refreshSession = async (): Promise<AuthUser | null> => {
  return getCurrentUser();
};

// ============================================================================
// Admin User Management (via PHP API)
// ============================================================================

/**
 * Get all admin users
 */
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const response = await apiClient.get('/staff');
    if (response.success && Array.isArray(response.data)) {
      return response.data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        username: row.username as string || row.email as string,
        name: row.name as string,
        role: row.role as AdminRole,
        isActive: Boolean(row.is_active ?? row.isActive ?? true),
        lastLogin: row.last_login as string | undefined,
        createdAt: row.created_at as string || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.error("[AuthService] getAdminUsers error:", err);
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
  try {
    const response = await apiClient.createStaff(userData);
    if (response.success && response.data) {
      return {
        ...userData,
        id: (response.data as { id?: string }).id || String(Date.now()),
        createdAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("[AuthService] createAdminUser error:", err);
  }
  return null;
};

/**
 * Update admin user
 */
export const updateAdminUser = async (
  id: string,
  updates: Partial<AdminUser>
): Promise<boolean> => {
  try {
    const response = await apiClient.updateStaff(id, updates);
    return response.success;
  } catch (err) {
    console.error("[AuthService] updateAdminUser error:", err);
    return false;
  }
};

/**
 * Delete admin user
 */
export const deleteAdminUser = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.deleteStaff(id);
    return response.success;
  } catch (err) {
    console.error("[AuthService] deleteAdminUser error:", err);
    return false;
  }
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
// Session Management (non-sensitive only)
// ============================================================================

export const saveSession = (user: AuthUser): void => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    user,
    timestamp: Date.now(),
  }));
};

export const getSession = (): AuthUser | null => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;

    const parsed = JSON.parse(session);
    if (Date.now() - parsed.timestamp > 30 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};