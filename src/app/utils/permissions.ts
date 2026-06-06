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
  INQUIRIES: "Inquiries",
  PACKAGES: "Packages",
  BOOKINGS: "Bookings",
  PAYMENTS: "Payments",
  FINANCE: "Finance",
  PRODUCTION: "Production",
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
  [MENU_KEYS.INQUIRIES]: "/admin/content/inquiries",
  [MENU_KEYS.PACKAGES]: "/admin/reservation/packages",
  [MENU_KEYS.BOOKINGS]: "/admin/bookings",
  [MENU_KEYS.PAYMENTS]: "/admin/payments",
  [MENU_KEYS.FINANCE]: "/admin/finance",
  [MENU_KEYS.PRODUCTION]: "/admin/production",
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
  // super_admin: All menus including Settings, My KPI, Production
  super_admin: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.WEBSITE_CONTENT,
    MENU_KEYS.PORTFOLIO,
    MENU_KEYS.SERVICES,
    MENU_KEYS.ABOUT,
    MENU_KEYS.FAQ,
    MENU_KEYS.CONTACT,
    MENU_KEYS.INQUIRIES,
    MENU_KEYS.PACKAGES,
    MENU_KEYS.BOOKINGS,
    MENU_KEYS.PAYMENTS,
    MENU_KEYS.FINANCE,
    MENU_KEYS.PRODUCTION,
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
    MENU_KEYS.INQUIRIES,
    MENU_KEYS.PACKAGES,
    MENU_KEYS.BOOKINGS,
    MENU_KEYS.PAYMENTS,
    MENU_KEYS.FINANCE,
    MENU_KEYS.PRODUCTION,
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
    MENU_KEYS.ATTENDANCE,
  ]),

  // editor: Dashboard, Portfolio, Production, Attendance, My KPI
  editor: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.PORTFOLIO,
    MENU_KEYS.PRODUCTION,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.MY_KPI,
  ]),

  // photographer: Dashboard, Production, Attendance, My KPI
  photographer: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.PRODUCTION,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.MY_KPI,
  ]),

  // videographer: Dashboard, Production, Attendance, My KPI
  videographer: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.PRODUCTION,
    MENU_KEYS.ATTENDANCE,
    MENU_KEYS.MY_KPI,
  ]),

  // staff: Dashboard, Production, Attendance, My KPI
  staff: new Set([
    MENU_KEYS.DASHBOARD,
    MENU_KEYS.PRODUCTION,
    MENU_KEYS.ATTENDANCE,
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
// Role-Based Redirect Helper
// ============================================================================

const ADMIN_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "finance",
  "editor",
  "staff",
  "photographer",
  "videographer",
];

/**
 * Get the redirect path based on user role.
 * Admin roles → /admin
 * Customer → /dashboard
 * Unknown → /login
 */
export function getRedirectPathForRole(role: UserRole): string {
  if (ADMIN_ROLES.includes(role)) {
    return "/admin";
  }

  if (role === "customer") {
    return "/dashboard";
  }

  return "/login";
}

/**
 * Check if a role should access admin panel
 */
export function canAccessAdminPanel(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Check if a role should access customer dashboard
 */
export function canAccessCustomerDashboard(role: UserRole): boolean {
  return role === "customer";
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
// KPI Jobs Access
// ============================================================================

/**
 * Check if a role can CREATE KPI Jobs.
 * Only super_admin can create KPI Jobs.
 */
export function canCreateKpiJob(role: UserRole): boolean {
  return role === "super_admin";
}

/**
 * Check if a role can ASSIGN KPI Jobs to employees.
 * Only super_admin can assign KPI Jobs.
 */
export function canAssignKpiJob(role: UserRole): boolean {
  return role === "super_admin";
}

/**
 * Check if a role can REVIEW (approve/reject/request revision) KPI Job assignments.
 * Only super_admin and admin can review (if admin review permission is enabled).
 */
export function canReviewKpiJob(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Check if a role can VIEW ALL KPI Jobs (admin view).
 * Only super_admin can see all KPI jobs across all employees.
 */
export function canViewAllKpiJobs(role: UserRole): boolean {
  return role === "super_admin";
}

/**
 * Check if a role can VIEW their OWN KPI Job assignments.
 * Operational staff (editor, photographer, videographer, staff) can view their own KPI jobs.
 * Admin/finance can also view their own KPI jobs if they have an employee profile.
 */
export function canViewOwnKpiJobs(role: UserRole): boolean {
  // All operational staff roles can view their own KPI jobs
  if (isOperationalStaffRole(role)) return true;
  // Admin and finance can also view their own KPI jobs
  if (role === "admin" || role === "finance") return true;
  return false;
}

/**
 * Check if a role can SUBMIT their OWN KPI Job assignments.
 * Operational staff can submit their own KPI jobs.
 */
export function canSubmitKpiJob(role: UserRole): boolean {
  return isOperationalStaffRole(role);
}

/**
 * Check if a role can MANAGE KPI Job templates.
 * Only super_admin can manage templates.
 */
export function canManageKpiTemplates(role: UserRole): boolean {
  return role === "super_admin";
}

/**
 * Check if a role can ACCESS KPI Jobs section (either view all or own).
 * super_admin: can view all
 * admin: can view their own
 * operational staff: can view their own
 * customer: no access
 */
export function canAccessKpiJobs(role: UserRole): boolean {
  return canViewAllKpiJobs(role) || canViewOwnKpiJobs(role);
}

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
 * Admin/finance can also view their own attendance if they have an employee profile.
 */
export function canViewOwnAttendance(role: UserRole): boolean {
  // All operational staff roles can view their own attendance
  if (isOperationalStaffRole(role)) return true;
  // Admin and finance can view their own attendance (if they have employee profile)
  if (role === "admin" || role === "finance") return true;
  return false;
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
 * Check if a role can VIEW their OWN tasks only.
 * Operational staff can view their own tasks.
 */
export function canViewOwnTasks(role: UserRole): boolean {
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

/**
 * Check if a role can VIEW all PROJECTS (production records).
 * Only super_admin and admin can view all projects.
 */
export function canViewAllProjects(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

/**
 * Check if a role can MANAGE all PROJECTS (production records).
 * Only super_admin and admin can manage projects.
 */
export function canManageProjects(role: UserRole): boolean {
  return ADMIN_STAFF_DATA_ROLES.includes(role);
}

// ============================================================================
// Customer & Booking Access (for Finance role)
// ============================================================================

/**
 * Roles that can manage customers (create, edit, delete)
 * Only super_admin and admin can manage customers.
 */
const CUSTOMER_MANAGER_ROLES: UserRole[] = ["super_admin", "admin"];

/**
 * Roles that can view customers (read-only access)
 * super_admin, admin, and finance can view customers.
 */
const CUSTOMER_VIEWER_ROLES: UserRole[] = ["super_admin", "admin", "finance"];

/**
 * Roles that can manage bookings (create, edit, delete)
 * Only super_admin and admin can manage bookings.
 */
const BOOKING_MANAGER_ROLES: UserRole[] = ["super_admin", "admin"];

/**
 * Roles that can view bookings (read-only access)
 * super_admin, admin, and finance can view bookings.
 */
const BOOKING_VIEWER_ROLES: UserRole[] = ["super_admin", "admin", "finance"];

// ---------------------------------------------------------------------------
// Customer Permissions
// ---------------------------------------------------------------------------

/**
 * Check if a role can VIEW customers (read-only)
 * Finance can view customers but cannot edit/delete.
 */
export function canViewCustomer(role: UserRole): boolean {
  return CUSTOMER_VIEWER_ROLES.includes(role);
}

/**
 * Check if a role can CREATE customers
 */
export function canCreateCustomer(role: UserRole): boolean {
  return CUSTOMER_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can EDIT customers
 */
export function canEditCustomer(role: UserRole): boolean {
  return CUSTOMER_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can DELETE customers
 */
export function canDeleteCustomer(role: UserRole): boolean {
  return CUSTOMER_MANAGER_ROLES.includes(role);
}

// ---------------------------------------------------------------------------
// Booking Permissions
// ---------------------------------------------------------------------------

/**
 * Check if a role can VIEW bookings (read-only)
 * Finance can view bookings but cannot edit/delete.
 */
export function canViewBooking(role: UserRole): boolean {
  return BOOKING_VIEWER_ROLES.includes(role);
}

/**
 * Check if a role can CREATE bookings
 */
export function canCreateBooking(role: UserRole): boolean {
  return BOOKING_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can EDIT bookings
 */
export function canEditBooking(role: UserRole): boolean {
  return BOOKING_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can DELETE bookings
 */
export function canDeleteBooking(role: UserRole): boolean {
  return BOOKING_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can UPDATE booking status
 */
export function canUpdateBookingStatus(role: UserRole): boolean {
  return BOOKING_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can ARCHIVE/CANCEL bookings
 */
export function canArchiveBooking(role: UserRole): boolean {
  return BOOKING_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can EXPORT bookings
 */
export function canExportBookings(role: UserRole): boolean {
  return BOOKING_VIEWER_ROLES.includes(role);
}

// ---------------------------------------------------------------------------
// Finance-Specific Read-Only Guards
// ---------------------------------------------------------------------------

/**
 * Check if finance role is attempting sensitive operation
 * Finance should only have read access to customers and bookings.
 */
export function isFinanceReadOnlyGuard(role: UserRole, action: "view" | "create" | "edit" | "delete"): boolean {
  if (role === "finance") {
    // Finance can only view, not create/edit/delete
    return action === "view" || !CUSTOMER_MANAGER_ROLES.includes(role) && !BOOKING_MANAGER_ROLES.includes(role);
  }
  return false;
}

// ============================================================================
// Payment Access
// ============================================================================

/**
 * Roles that can manage payments (create, update, delete)
 * Only super_admin and admin can manage payments.
 */
const PAYMENT_MANAGER_ROLES: UserRole[] = ["super_admin", "admin"];

/**
 * Roles that can view payments (read-only access)
 * super_admin, admin, and finance can view payments.
 */
const PAYMENT_VIEWER_ROLES: UserRole[] = ["super_admin", "admin", "finance"];

/**
 * Check if a role can VIEW payments (read-only)
 * Finance can view payments but cannot edit/delete.
 */
export function canViewPayment(role: UserRole): boolean {
  return PAYMENT_VIEWER_ROLES.includes(role);
}

/**
 * Check if a role can MANAGE payments (create, edit, delete)
 * Only super_admin and admin can manage payments.
 */
export function canManagePayment(role: UserRole): boolean {
  return PAYMENT_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can VERIFY payments
 * Only super_admin and admin can verify (approve) payments.
 * Finance should not verify payments - only view for reporting.
 */
export function canVerifyPayment(role: UserRole): boolean {
  return PAYMENT_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can REJECT payments
 * Only super_admin and admin can reject payments.
 * Finance should not reject payments - only view for reporting.
 */
export function canRejectPayment(role: UserRole): boolean {
  return PAYMENT_MANAGER_ROLES.includes(role);
}

/**
 * Check if a role can UPDATE payment status (verify/reject)
 * Only super_admin and admin can update payment status.
 * Finance role should be READ-ONLY for payments.
 */
export function canUpdatePaymentStatus(role: UserRole): boolean {
  return PAYMENT_MANAGER_ROLES.includes(role);
}

// ============================================================================
// Export Aliases for Backward Compatibility
// ============================================================================

export const isSuperAdminRole = isSuperAdmin;
