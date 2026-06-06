import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  isAdminRole as checkAdminRole,
  isCustomerRole as checkCustomerRole,
  isSuperAdmin as checkSuperAdmin,
} from "../utils/permissions";

export {
  canAccessAdminMenuItem,
  canAccessAttendance,
  canAccessMenu,
  canAccessRoute,
  canAccessStaffKpi,
  canApproveTasks,
  canManageAttendance,
  canManageAllTasks,
  canManageKpi,
  canManageSettings,
  canManageStaffKpi,
  canUpdateOwnTasks,
  canViewAllAttendance,
  canViewAllStaffData,
  canViewAllStaffKpi,
  canViewAllTasks,
  canViewOwnAttendance,
  canViewOwnKpi,
  canViewOwnStaffKpi,
  canViewTasks,
  isAdminRole,
  isCustomerRole,
  isOperationalStaffRole,
  isSuperAdmin,
  isSuperAdminRole,
} from "../utils/permissions";

// ============================================================================
// Types
// ============================================================================

export type UserRole = "super_admin" | "admin" | "finance" | "editor" | "staff" | "photographer" | "videographer" | "customer";

// Roles that require employeeId for attendance/KPI functionality
const OPERATIONAL_ROLES: UserRole[] = ["staff", "editor", "photographer", "videographer"];

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  whatsapp?: string;
  avatarUrl?: string;
  /** Employee ID for operational staff - used for attendance, KPI, and task filtering */
  employeeId?: string;
  /** Customer ID for customer portal linkage */
  customerId?: string;
  /** Warning flag when staff has no linked employee profile */
  employeeIdMissing?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// Local Storage Keys
// ============================================================================

const USER_STORAGE_KEY = "danivisual_user";
const SESSION_KEY = "danivisual_session";
const DEV_STAFF_USERS_KEY = "danivisual_dev_staff_users";
const VALID_ROLES: UserRole[] = ["super_admin", "admin", "finance", "editor", "staff", "photographer", "videographer", "customer"];

const DEV_DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  admin: {
    password: "admin",
    user: {
      id: "dev-admin",
      email: "admin@danivisual.dev",
      username: "admin",
      name: "Admin Danivisual",
      role: "admin",
    },
  },
  danivisual: {
    password: "client",
    user: {
      id: "dev-customer",
      email: "danivisual@danivisual.dev",
      username: "danivisual",
      name: "Dani Indra",
      role: "customer",
      whatsapp: "081234567890",
    },
  },
  "superadmin@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-super-admin",
      email: "superadmin@danivisual.test",
      username: "superadmin",
      name: "Super Admin",
      role: "super_admin",
    },
  },
  "admin@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-admin-test",
      email: "admin@danivisual.test",
      username: "admin",
      name: "Admin Danivisual",
      role: "admin",
    },
  },
  "finance@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-finance",
      email: "finance@danivisual.test",
      username: "finance",
      name: "Finance Danivisual",
      role: "finance",
    },
  },
  "editor@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-editor",
      email: "editor@danivisual.test",
      username: "editor",
      name: "Editor Danivisual",
      role: "editor",
      employeeId: "dev-employee-editor",
    },
  },
  "photographer@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-photographer",
      email: "photographer@danivisual.test",
      username: "photographer",
      name: "Photographer Danivisual",
      role: "photographer",
      employeeId: "dev-employee-photographer",
    },
  },
  "videographer@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-videographer",
      email: "videographer@danivisual.test",
      username: "videographer",
      name: "Videographer Danivisual",
      role: "videographer",
      employeeId: "dev-employee-videographer",
    },
  },
  "staff@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-staff",
      email: "staff@danivisual.test",
      username: "staff",
      name: "Staff Danivisual",
      role: "staff",
      employeeId: "dev-employee-staff",
    },
  },
  "customer@danivisual.test": {
    password: "Test123456",
    user: {
      id: "dev-customer-test",
      email: "customer@danivisual.test",
      username: "customer",
      name: "Customer Danivisual",
      role: "customer",
      customerId: "dev-customer-customer",
    },
  },
};

// ============================================================================
// Environment Check
// ============================================================================

// Check if we're in development mode without Supabase configured
const IS_DEV_MODE = !isSupabaseConfigured();

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Helper Functions
// ============================================================================

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    // Validate structure
    if (!parsed.id || !parsed.role) return null;
    return parsed as AuthUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function setStoredUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function isKnownRole(role: unknown): role is UserRole {
  return typeof role === "string" && VALID_ROLES.includes(role as UserRole);
}

/**
 * Check if role is operational staff that requires employeeId
 */
function isOperationalStaffRole(role: UserRole): boolean {
  return OPERATIONAL_ROLES.includes(role);
}

/**
 * Resolve employeeId for a user after successful login.
 * Resolution order:
 * 1. profiles.employee_id (if available in admin_users table)
 * 2. employees.user_id === auth.users.id
 * 3. employees.email === user.email (fallback)
 *
 * Returns employeeId if found, or warning flag if not found for operational staff.
 */
async function resolveEmployeeId(
  client: ReturnType<typeof import("../../lib/supabaseClient").getSupabaseClient>,
  authUserId: string,
  userEmail: string,
  userRole: UserRole
): Promise<{ employeeId?: string; employeeIdMissing?: boolean }> {
  // Only operational staff need employeeId
  if (!isOperationalStaffRole(userRole)) {
    return {};
  }

  try {
    // Method 1: Check admin_users table for employee_id column
    const { data: profile } = await client
      .from("admin_users")
      .select("employee_id")
      .eq("auth_id", authUserId)
      .single();

    if (profile?.employee_id) {
      return { employeeId: profile.employee_id };
    }

    // Method 2: Look up employees table by user_id
    const { data: employeeByUserId } = await client
      .from("employees")
      .select("id")
      .eq("user_id", authUserId)
      .single();

    if (employeeByUserId) {
      return { employeeId: employeeByUserId.id };
    }

    // Method 3: Look up employees table by email
    const { data: employeeByEmail } = await client
      .from("employees")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (employeeByEmail) {
      return { employeeId: employeeByEmail.id };
    }

    // Operational staff without employeeId - show warning
    console.warn(`[AuthContext] Operational staff "${userRole}" has no linked employee profile`);
    return { employeeIdMissing: true };
  } catch (err) {
    console.error("[AuthContext] Error resolving employeeId:", err);
    return { employeeIdMissing: true };
  }
}

async function resolveCustomerId(
  client: ReturnType<typeof import("../../lib/supabaseClient").getSupabaseClient>,
  userEmail: string
): Promise<{ customerId?: string }> {
  if (!userEmail) return {};

  try {
    const { data: customer } = await client
      .from("customers")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    return customer?.id ? { customerId: customer.id } : {};
  } catch {
    return {};
  }
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // Check Supabase auth first
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          try {
            const { data: { user: supabaseUser } } = await client.auth.getUser();

            if (supabaseUser) {
              // Fetch user profile from database
              const { data: profile } = await client
                .from("admin_users")
                .select("*")
                .eq("auth_id", supabaseUser.id)
                .single();

              if (profile) {
                // Resolve employeeId for operational staff
                const employeeResolution = await resolveEmployeeId(
                  client,
                  supabaseUser.id,
                  supabaseUser.email || "",
                  profile.role as UserRole
                );
                const customerResolution = profile.role === "customer"
                  ? await resolveCustomerId(client, supabaseUser.email || profile.email || "")
                  : {};

                const authUser: AuthUser = {
                  id: supabaseUser.id,
                  email: supabaseUser.email || profile.email || "",
                  username: profile.username,
                  name: profile.name,
                  role: profile.role as UserRole,
                  avatarUrl: profile.avatar_url,
                  whatsapp: profile.phone,
                  ...employeeResolution,
                  ...customerResolution,
                };
                setUser(authUser);
                setStoredUser(authUser);
              } else {
                // User exists in auth but not in admin_users - treat as customer
                const customerResolution = await resolveCustomerId(client, supabaseUser.email || "");
                const authUser: AuthUser = {
                  id: supabaseUser.id,
                  email: supabaseUser.email || "",
                  username: supabaseUser.email?.split("@")[0] || "user",
                  name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "User",
                  role: "customer",
                  ...customerResolution,
                };
                setUser(authUser);
                setStoredUser(authUser);
              }
            }
          } catch (err) {
            console.warn("[AuthContext] Supabase auth init error:", err);
          }
        }
      } else {
        // Development mode without Supabase - use stored user only
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
        }
      }

      setIsLoading(false);
      setIsInitialized(true);
    };

    initAuth();
  }, []);

  // ============================================================================
  // Login
  // ============================================================================

  const login = useCallback(async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    const loginWithDemoUser = (baseError?: string): { success: boolean; error?: string } => {
      if (!import.meta.env.DEV) {
        return {
          success: false,
          error: baseError || "Username/password salah",
        };
      }

      const demo = DEV_DEMO_USERS[cleanIdentifier];
      if (demo && demo.password === cleanPassword) {
        setUser(demo.user);
        setStoredUser(demo.user);
        return { success: true };
      }

      try {
        const devUsers = JSON.parse(localStorage.getItem(DEV_STAFF_USERS_KEY) || "[]") as Array<AuthUser & {
          userId?: string;
          temporaryPassword?: string;
          isActive?: boolean;
        }>;
        const devUser = devUsers.find((item) =>
          item.email?.toLowerCase() === cleanIdentifier ||
          item.username?.toLowerCase() === cleanIdentifier
        );

        if (devUser && devUser.temporaryPassword === cleanPassword && devUser.isActive !== false && isKnownRole(devUser.role)) {
          const authUser: AuthUser = {
            id: devUser.userId || devUser.id,
            email: devUser.email,
            username: devUser.username,
            name: devUser.name,
            role: devUser.role,
            whatsapp: devUser.whatsapp,
            employeeId: devUser.employeeId,
            customerId: devUser.customerId,
          };
          setUser(authUser);
          setStoredUser(authUser);
          return { success: true };
        }
      } catch {
        localStorage.removeItem(DEV_STAFF_USERS_KEY);
      }

      if (!isSupabaseConfigured()) {
        return {
          success: false,
          error: "Supabase belum dikonfigurasi. Username/password demo salah.",
        };
      }

      return {
        success: false,
        error: "Username/password salah",
      };
    };

    // Production: Use Supabase Auth
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) {
        const result = loginWithDemoUser("Koneksi database tidak tersedia");
        setIsLoading(false);
        return result;
      }

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanIdentifier,
          password,
        });

        if (error) {
          const result = loginWithDemoUser(
            error.message.includes("Invalid login credentials")
              ? "Username/password salah"
              : error.message
          );
          setIsLoading(false);
          return result;
        }

        if (data.user) {
          // Fetch user profile
          const { data: profile, error: profileError } = await client
            .from("admin_users")
            .select("*")
            .eq("auth_id", data.user.id)
            .single();

          if (profileError || !profile) {
            const result = loginWithDemoUser("Role user tidak ditemukan. Hubungi admin untuk menghubungkan akun ke profil.");
            setIsLoading(false);
            return result;
          }

          // Check if user is active
          if (!profile.is_active) {
            setIsLoading(false);
            return { success: false, error: "Akun tidak aktif. Hubungi admin untuk informasi lebih lanjut." };
          }

          if (!isKnownRole(profile.role)) {
            setIsLoading(false);
            return { success: false, error: "Role user tidak ditemukan. Hubungi admin." };
          }

          // Resolve employeeId for operational staff
          const userRole = profile.role as UserRole;
          const employeeResolution = await resolveEmployeeId(
            client,
            data.user.id,
            data.user.email || "",
            userRole
          );
          const customerResolution = userRole === "customer"
            ? await resolveCustomerId(client, data.user.email || profile.email || "")
            : {};

          // Show warning if operational staff has no linked employee
          if (employeeResolution.employeeIdMissing) {
            console.warn(`[AuthContext] User "${profile.username}" (${userRole}) has no linked employee profile. Attendance and KPI features may be limited.`);
          }

          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || profile.email || "",
            username: profile.username,
            name: profile.name,
            role: userRole,
            avatarUrl: profile.avatar_url,
            whatsapp: profile.phone,
            ...employeeResolution,
            ...customerResolution,
          };

          // Update last login
          await client
            .from("admin_users")
            .update({
              last_login: new Date().toISOString(),
              login_count: (profile.login_count || 0) + 1
            })
            .eq("id", profile.id);

          setUser(authUser);
          setStoredUser(authUser);
          setIsLoading(false);
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: "Login gagal" };
      } catch (err) {
        console.error("[AuthContext] Login error:", err);
        const result = loginWithDemoUser("Terjadi kesalahan saat login");
        setIsLoading(false);
        return result;
      }
    }

    const result = loginWithDemoUser("Supabase belum dikonfigurasi");
    setIsLoading(false);
    return result;
  }, []);

  // ============================================================================
  // Register
  // ============================================================================

  const register = useCallback(async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return { success: false, error: "Registrasi tidak tersedia dalam mode development" };
    }

    const client = getSupabaseClient();
    if (!client) {
      setIsLoading(false);
      return { success: false, error: "Koneksi database tidak tersedia" };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile with customer role
        await client.from("admin_users").insert({
          auth_id: data.user.id,
          email: cleanEmail,
          username: cleanEmail.split("@")[0],
          name,
          role: "customer",
          is_active: true,
          created_at: new Date().toISOString(),
        });

        const authUser: AuthUser = {
          id: data.user.id,
          email: cleanEmail,
          username: cleanEmail.split("@")[0],
          name,
          role: "customer",
        };

        setUser(authUser);
        setStoredUser(authUser);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: "Registrasi gagal" };
    } catch (err) {
      console.error("[AuthContext] Register error:", err);
      setIsLoading(false);
      return { success: false, error: "Terjadi kesalahan saat registrasi" };
    }
  }, []);

  // ============================================================================
  // Logout
  // ============================================================================

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    setStoredUser(null);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
    }
  }, []);

  // ============================================================================
  // Reset Password
  // ============================================================================

  const resetPassword = useCallback(async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Reset password tidak tersedia dalam mode development" };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: "Koneksi database tidak tersedia" };
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("[AuthContext] Reset password error:", err);
      return { success: false, error: "Terjadi kesalahan saat reset password" };
    }
  }, []);

  // ============================================================================
  // Refresh User
  // ============================================================================

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user) return;

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: { user: supabaseUser } } = await client.auth.getUser();

          if (supabaseUser) {
            const { data: profile } = await client
              .from("admin_users")
              .select("*")
              .eq("auth_id", supabaseUser.id)
              .single();

            if (profile) {
              const userRole = profile.role as UserRole;
              const employeeResolution = await resolveEmployeeId(
                client,
                supabaseUser.id,
                supabaseUser.email || "",
                userRole
              );
              const customerResolution = userRole === "customer"
                ? await resolveCustomerId(client, supabaseUser.email || profile.email || "")
                : {};

              const updatedUser: AuthUser = {
                id: supabaseUser.id,
                email: supabaseUser.email || profile.email || "",
                username: profile.username,
                name: profile.name,
                role: userRole,
                avatarUrl: profile.avatar_url,
                whatsapp: profile.phone,
                ...employeeResolution,
                ...customerResolution,
              };
              setUser(updatedUser);
              setStoredUser(updatedUser);
            }
          }
        } catch (err) {
          console.warn("[AuthContext] Refresh user error:", err);
        }
      }
    }
  }, [user]);

  // ============================================================================
  // Derived State
  // ============================================================================

  const isAuthenticated = Boolean(user);

  // ============================================================================
  // Value
  // ============================================================================

  const value = {
    isAuthenticated,
    isLoading: isLoading || !isInitialized,
    user,
    login,
    register,
    logout,
    resetPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============================================================================
// Helper Hooks
// ============================================================================

export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  return { isAuthenticated, isLoading, user };
}

export function useRequireAdmin() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user ? checkAdminRole(user.role) : false;
  return { isAdmin, isLoading, user };
}

export function useRequireCustomer() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isCustomer = user ? checkCustomerRole(user.role) : false;
  return { isCustomer, isLoading, user };
}

export function useIsSuperAdmin() {
  const { user } = useAuth();
  return user ? checkSuperAdmin(user.role) : false;
}

/**
 * Hook to check if user has missing employeeId warning
 */
export function useEmployeeIdWarning() {
  const { user } = useAuth();
  return user?.employeeIdMissing === true && isOperationalStaffRole(user.role);
}

/**
 * Get employeeId from user context - safe to use for filtering
 * DO NOT trust this for sensitive operations - it's derived from server data
 */
export function getEmployeeId(user: AuthUser | null): string | undefined {
  // For sensitive operations, always resolve from server
  // This is safe for UI filtering purposes only
  return user?.employeeId;
}

/**
 * Check if user needs employeeId for their role
 */
export function userNeedsEmployeeId(user: AuthUser | null): boolean {
  if (!user) return false;
  return isOperationalStaffRole(user.role);
}

// ============================================================================
// Role Labels
// ============================================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  finance: "Finance",
  editor: "Editor",
  staff: "Staff",
  photographer: "Photographer",
  videographer: "Videographer",
  customer: "Customer",
};

// ============================================================================
// Dev Mode Export
// ============================================================================

export { IS_DEV_MODE };
