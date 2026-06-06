/**
 * Protected Route Component
 *
 * Route protection berdasarkan role user:
 * - Admin routes: hanya untuk super_admin, admin, finance, editor, staff
 * - Customer routes: hanya untuk customer
 * - Auth routes: hanya untuk non-authenticated users
 */

import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth, UserRole, ROLE_LABELS } from "../contexts/AuthContext";
import UnauthorizedPage from "../pages/Unauthorized";

// Debug mode flag - set to true to see auth flow in console
const DEBUG_AUTH = true;

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-premium-beige border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-foreground-secondary">Memuat...</p>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = "/",
  showUnauthorized = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging
  if (DEBUG_AUTH) {
    console.log("[ProtectedRoute] Render:", {
      isAuthenticated,
      isLoading,
      isInitialized: true,
      user: user ? { id: user.id, role: user.role, name: user.name } : null,
      allowedRoles,
      location: location.pathname,
    });
  }

  // State to track if we've handled the redirect
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Reset redirect state when location changes
    setHasRedirected(false);

    if (DEBUG_AUTH) {
      console.log("[ProtectedRoute] useEffect triggered:", {
        isLoading,
        isAuthenticated,
        userRole: user?.role,
        allowedRoles,
      });
    }

    // Skip redirect during loading
    if (isLoading) {
      if (DEBUG_AUTH) console.log("[ProtectedRoute] Skipping - still loading");
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      if (DEBUG_AUTH) console.log("[ProtectedRoute] Not authenticated - redirecting to /login");
      navigate("/login", { state: { from: location.pathname }, replace: true });
      setHasRedirected(true);
      return;
    }

    // Check role-based access
    if (allowedRoles && user) {
      const hasAccess = allowedRoles.includes(user.role);
      if (DEBUG_AUTH) {
        console.log("[ProtectedRoute] Role check:", {
          userRole: user.role,
          allowedRoles,
          hasAccess,
        });
      }

      if (!hasAccess) {
        if (showUnauthorized) {
          if (DEBUG_AUTH) console.log("[ProtectedRoute] No access - will show unauthorized page");
          // Don't redirect here, let the render handle it
          return;
        }
        // Redirect based on role
        const redirectTo = getRedirectPath(user.role);
        if (DEBUG_AUTH) console.log("[ProtectedRoute] Redirecting to:", redirectTo);
        navigate(redirectTo, { replace: true });
        setHasRedirected(true);
      } else {
        if (DEBUG_AUTH) console.log("[ProtectedRoute] Access granted!");
      }
    } else if (allowedRoles && !user) {
      if (DEBUG_AUTH) console.log("[ProtectedRoute] No user but roles required - redirecting");
      navigate("/login", { state: { from: location.pathname }, replace: true });
      setHasRedirected(true);
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, showUnauthorized, navigate, location.pathname]);

  // Show loading state
  if (isLoading) {
    if (DEBUG_AUTH) console.log("[ProtectedRoute] Showing loading spinner");
    return <LoadingSpinner />;
  }

  // Not authenticated - show nothing (will redirect)
  if (!isAuthenticated) {
    if (DEBUG_AUTH) console.log("[ProtectedRoute] Not authenticated - showing null (will redirect)");
    return null;
  }

  // Role check failed - show unauthorized page
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const requiredRoleLabel = allowedRoles.length === 1
      ? ROLE_LABELS[allowedRoles[0]]
      : allowedRoles.map(r => ROLE_LABELS[r]).join(" atau ");

    if (DEBUG_AUTH) {
      console.log("[ProtectedRoute] Showing unauthorized page:", {
        userRole: user.role,
        requiredRoles: requiredRoleLabel,
      });
    }

    return (
      <UnauthorizedPage
        requiredRole={requiredRoleLabel}
        message={`Halaman ini memerlukan akses sebagai ${requiredRoleLabel}. Akun Anda saat ini adalah ${ROLE_LABELS[user.role]}.`}
      />
    );
  }

  if (DEBUG_AUTH) console.log("[ProtectedRoute] Rendering children");
  return <>{children}</>;
}

// Legacy redirect helper (kept for backward compatibility)
function getRedirectPath(role: UserRole): string {
  return getRedirectPathByRole(role);
}

// ============================================================================
// Specific Route Components
// ============================================================================

interface AdminRouteProps {
  children: ReactNode;
  showUnauthorized?: boolean;
}

export function AdminRoute({
  children,
  showUnauthorized = true,
}: AdminRouteProps) {
  return (
    <ProtectedRoute
      allowedRoles={["super_admin", "admin", "finance", "editor", "staff", "photographer", "videographer"]}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </ProtectedRoute>
  );
}

// Internal/admin roles that should be redirected to admin panel
const INTERNAL_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "finance",
  "editor",
  "photographer",
  "videographer",
  "staff",
];

interface CustomerRouteProps {
  children: ReactNode;
  showUnauthorized?: boolean;
}

export function CustomerRoute({
  children,
  showUnauthorized = true,
}: CustomerRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
      return;
    }

    // If user is logged in but has internal role - redirect to admin panel
    if (user && INTERNAL_ROLES.includes(user.role)) {
      if (DEBUG_AUTH) console.log("[CustomerRoute] Internal role detected, redirecting to /admin");
      navigate("/admin", { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, user, navigate, location.pathname]);

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Not authenticated - show nothing (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Internal role - show nothing (will redirect)
  if (user && INTERNAL_ROLES.includes(user.role)) {
    return null;
  }

  // Role check failed for customer portal
  if (user && user.role !== "customer") {
    if (showUnauthorized) {
      return (
        <UnauthorizedPage
          requiredRole="Customer"
          message={`Halaman ini hanya untuk customer. Akun Anda saat ini adalah ${ROLE_LABELS[user.role]}.`}
        />
      );
    }
    navigate("/login", { replace: true });
    return null;
  }

  return <>{children}</>;
}

// Role-based redirect helper for login page redirect
const getRedirectPathByRole = (role: UserRole): string => {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";
    case "finance":
      return "/admin/finance";
    case "editor":
    case "photographer":
    case "videographer":
      return "/admin/production";
    case "staff":
      return "/admin/my-kpi";
    case "customer":
      return "/dashboard";
    default:
      return "/login";
  }
};

interface GuestRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

export function GuestRoute({
  children,
  redirectPath,
}: GuestRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      // Use role-based redirect if no explicit path provided
      const to = redirectPath || getRedirectPathByRole(user.role);
      const from = (location.state as { from?: string })?.from;

      if (DEBUG_AUTH) {
        console.log("[GuestRoute] Redirecting authenticated user:", {
          role: user.role,
          from: from || "none",
          to,
        });
      }

      navigate(from || to, { replace: true });
    }
  }, [isAuthenticated, isLoading, user, redirectPath, navigate, location]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && user) {
    return null;
  }

  return <>{children}</>;
}

// ============================================================================
// Role Checker Hooks
// ============================================================================

export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return ["super_admin", "admin", "finance", "editor", "staff", "photographer", "videographer"].includes(user.role);
}

export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.role === "super_admin";
}

export function useIsCustomer(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.role === "customer";
}
