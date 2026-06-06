import type { UserRole } from "../contexts/AuthContext";

// ============================================================================
// Menu Keys - Must match AdminSidebar menu item labels exactly
// ============================================================================

export const MENU_KEYS = {
  DASHBOARD: "Dashboard",
  WEBSITE_CONTENT: "Website Content",
  PORTFOLIO: "Portfolio",
  SERVICES: "Services",
  ABOUT: "About",
  FAQ: "FAQ",
  CONTACT: "Contact",
  PACKAGES: "Packages",
  BOOKINGS: "Bookings",
  PAYMENTS: "Payments",
  FINANCE: "Finance",
  PRODUCTION: "Production",
  PRODUCTION_TASKS: "Production Tasks",
  CUSTOMERS: "Customers",
  EMPLOYEES: "Employees",
  MY_KPI: "My KPI",
  ATTENDANCE: "Attendance",
  TRAFFIC: "Traffic",
  SETTINGS: "Settings",
} as const;

export type MenuKey = (typeof MENU_KEYS)[keyof typeof MENU_KEYS];

// ============================================================================
// Route Mapping - Maps menu keys to route paths
// ============================================================================

export const MENU_TO_ROUTE: Record<string, string> = {
  [MENU_KEYS.DASHBOARD]: "/admin",
  [MENU_KEYS.WEBSITE_CONTENT]: "/admin/content/home",
  [MENU_KEYS.PORTFOLIO]: "/admin/content/portfolio",
  [MENU_KEYS.SERVICES]: "/admin/content/services",
  [MENU_KEYS.ABOUT]: "/admin/content/about",
  [MENU_KEYS.FAQ]: "/admin/content/faq",
  [MENU_KEYS.CONTACT]: "/admin/content/contact",
  [MENU_KEYS.PACKAGES]: "/admin/reservation/packages",
  [MENU_KEYS.BOOKINGS]: "/admin/bookings",
  [MENU_KEYS.PAYMENTS]: "/admin/payments",
  [MENU_KEYS.FINANCE]: "/admin/finance",
  [MENU_KEYS.PRODUCTION]: "/admin/production",
  [MENU_KEYS.PRODUCTION_TASKS]: "/admin/production",
  [MENU_KEYS.CUSTOMERS]: "/admin/customers",
  [MENU_KEYS.EMPLOYEES]: "/admin/employees",
  [MENU_KEYS.MY_KPI]: "/admin/my-kpi",
  [MENU_KEYS.ATTENDANCE]: "/admin/attendance",
  [MENU_KEYS.TRAFFIC]: "/admin/traffic",
  [MENU_KEYS.SETTINGS]: "/admin/settings",
};

// ============================================================================
// Role-Based Allowlist - Explicit permissions per role
// ============================================================================

const ROLE_MENU_PERMISSIONS: Record<UserRole, Set<MenuKey>> = {
  // super_admin: All menus including Settings, My KPI, Production Tasks
  super_admin: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.WEBSITE_CONTENT,
    MENU_KEYS.PORTFOLIO,
    MENU_KEYS.SERVICES,
    MENU_KEYS.ABOUT,
    MENU_KEYS.FAQ,
    MENU_KEYS.CONTACT,
    MENU_KEYS.PACKAGES,
    MENU_KEYS.BOOKINGS,
    MENU_KEYS.PAYMENTS,
    MENU_KEYS.FINANCE,
    MENU_KEYS.PRODUCTION,
    MENU_KEYS.PRODUCTION_TASKS,
    MENU_KEYS.CUSTOMERS,
    MENU_KEYS.EMPLOYEES,
    MENU_KEYS.MY_KPI,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.TRAFFIC,
    MENU_KEYS.SETTINGS,
  ]),

  // admin: All menus EXCEPT Settings
  admin: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.WEBSITE_CONTENT,
    MENU_KEYS.PORTFOLIO,
    MENU_KEYS.SERVICES,
    MENU_KEYS.ABOUT,
    MENU_KEYS.FAQ,
    MENU_KEYS.CONTACT,
    MENU_KEYS.PACKAGES,
    MENU_KEYS.BOOKINGS,
    MENU_KEYS.PRODUCTION,
    MENU_KEYS.PRODUCTION_TASKS,
    MENU_KEYS.CUSTOMERS,
    MENU_KEYS.EMPLOYEES,
    MENU_KEYS.MY_KPI,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.TRAFFIC,
  ]),

  // finance: Dashboard, Payments, Finance, Bookings (read-only), Customers (read-only)
  finance: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.PAYMENTS,
    MENU_KEYS.FINANCE,
    MENU_KEYS.BOOKINGS,
    MENU_KEYS.CUSTOMERS,
  ]),

  // editor: Dashboard, Portfolio, Production, Production Tasks, Attendance, My KPI
  editor: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.PORTFOLIO,
    MENU_KEYS.PRODUCTION,
    MENU_KEYS.PRODUCTION_TASKS,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.MY_KPI,
  ]),

  // photographer: Dashboard, Attendance, Production Tasks, My KPI
  photographer: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.PRODUCTION_TASKS,
    MENU_KEYS.MY_KPI,
  ]),

  // videographer: Dashboard, Attendance, Production Tasks, My KPI
  videographer: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.PRODUCTION_TASKS,
    MENU_KEYS.MY_KPI,
  ]),

  // staff: Dashboard, Attendance, Production Tasks (My Tasks), My KPI
  staff: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.PRODUCTION_TASKS,
    MENU_KEYS.MY_KPI,
  ]),

  // customer: No admin panel access
  customer: new Set([]),
};

// ============================================================================
// Role Category Definitions
// ============================================================================

const ADMIN_PORTAL_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "finance",
  "editor",
  "staff",
  "photographer",
  "videographer",
];

const ADMIN_STAFF_DATA_ROLES: UserRole[] = ["super_admin", "admin"];

const OPERATIONAL_STAFF_ROLES: UserRole[] = [
  "staff",
  "photographer",
  "videographer",
  "editor",
];

// ============================================================================
// Basic Role Checks
// ============================================================================

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_PORTAL_ROLES.includes(role);
}

export function isCustomerRole(role: UserRole): boolean {
  return role === "customer";
}

export function isOperationalStaffRole(role: UserRole): boolean {
  return OPERATIONAL_STAFF_ROLES.includes(role);
}

// ============================================================================
// Menu Access Functions
// ============================================================================

/**
 * Check if a role can access a specific menu item.
 * Uses explicit allowlist - only listed menus are accessible.
 */
export function canAccessMenu(role: UserRole, menuKey: MenuKey): boolean {
  const allowedMenus = ROLE_MENU_PERMISSIONS[role];
  return allowedMenus.has(menuKey);
}

/**
 * Backward-compatible alias for canAccessMenu
 */
export function canAccessAdminMenuItem(role: UserRole, item: string): boolean {
  return canAccessMenu(role, item as MenuKey);
}

/**
 * Check if a role can access a specific route path.
 * Maps route to menu key and checks permissions.
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  // super_admin can access all routes
  if (role === "super_admin") return true;

  // Normalize route path
  const normalizedRoute = route.replace(/^\/admin\/?/, "") || "dashboard";

  // Find matching menu key for route
  for (const [menu, path] of Object.entries(MENU_TO_ROUTE)) {
    const normalizedPath = path.replace(/^\/admin\/?/, "") || "dashboard";
    if (normalizedRoute === normalizedPath || normalizedRoute.startsWith(normalizedPath + "/")) {
      return canAccessMenu(role, menu as MenuKey);
    }
  }

  // Default: no access
  return false;
}

// ============================================================================
// Settings Access
// ============================================================================

/**
 * Check if a role can manage settings.
 * Only super_admin can access Settings by default.
 */
export function canManageSettings(role: UserRole): boolean {
  return role === "super_admin";
}

// ============================================================================
// Staff Data Access
// ============================================================================

/**
 * Check if a role can view all staff data (attendance, KPIs, etc.)
 * Only super_admin and admin can view all staff data.
 */
export function canViewAllStaffData(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Backward-compatible alias
 */
export const canViewAllAttendance = canViewAllStaffData;
export const canViewAllStaffKpi = canViewAllStaffData;

// ============================================================================
// KPI Access
// ============================================================================

/**
 * Check if a role can manage KPIs (view all staff KPIs, edit targets, etc.)
 * Only super_admin and admin can manage KPIs.
 */
export function canManageKpi(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Check if a role can view their own KPIs.
 * Operational staff (editor, photographer, videographer, staff) can view their own KPIs.
 */
export function canViewOwnKpi(role: UserRole): boolean {
  return isOperationalStaffRole(role) || ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Backward-compatible alias
 */
export const canViewOwnStaffKpi = canViewOwnKpi;
export const canManageStaffKpi = canManageKpi;

// ============================================================================
// Attendance Access
// ============================================================================

/**
 * Check if a role can manage attendance (view all, edit, etc.)
 * Only super_admin and admin can manage attendance.
 */
export function canManageAttendance(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Check if a role can view their own attendance.
 * Operational staff can view their own attendance records.
 */
export function canViewOwnAttendance(role: UserRole): boolean {
  return isOperationalStaffRole(role) || ADMIN_STAFF_DATA_ROLES.includes(role);
}

// ============================================================================
// Combined Access Functions
// ============================================================================

/**
 * Check if a role can access attendance (either manage all or view own)
 */
export function canAccessAttendance(role: UserRole): boolean {
  return canViewAllStaffData(role) || canViewOwnAttendance(role);
}

/**
 * Check if a role can access staff KPIs (either manage all or view own)
 */
export function canAccessStaffKpi(role: UserRole): boolean {
  return canViewAllStaffData(role) || canViewOwnKpi(role);
}

// ============================================================================
// Staff Tasks Access
// ============================================================================

/**
 * Check if a role can view all tasks (admin view).
 * Only super_admin and admin can view all tasks.
 */
export function canViewAllTasks(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Check if a role can manage all tasks (create, assign, delete).
 * Only super_admin and admin can create/delete tasks.
 */
export function canManageAllTasks(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Check if a role can approve/revision tasks.
 * Only super_admin and admin can approve, set quality score, or request revision.
 */
export function canApproveTasks(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Check if a role can update their own tasks (start, submit).
 * Operational staff can update their own task status.
 */
export function canUpdateOwnTasks(role: UserRole): boolean {
  return isOperationalStaffRole(role);
}

/**
 * Check if a role can view tasks (either all or their own).
 * super_admin/admin: all tasks
 * staff/editor/photographer/videographer: their own tasks only
 * customer: none
 */
export function canViewTasks(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role) || isOperationalStaffRole(role);
}

// ============================================================================
// Export Aliases for Backward Compatibility
// ============================================================================

export const isSuperAdminRole = isSuperAdmin;