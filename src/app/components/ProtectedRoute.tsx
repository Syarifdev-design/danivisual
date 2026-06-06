/**
 * Protected Route Component
 *
 * Route protection berdasarkan role user:
 * - Admin routes: hanya untuk super_admin, admin, finance, editor, staff
 * - Customer routes: hanya untuk customer
 * - Auth routes: hanya untuk non-authenticated users
 */

import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth, UserRole, ROLE_LABELS } from "../contexts/AuthContext";
import UnauthorizedPage from "../pages/Unauthorized";

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

  useEffect(() => {
    // Skip redirect during loading
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
      return;
    }

    // Check role-based access
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      if (showUnauthorized) {
        // Show unauthorized page
        return;
      }
      // Redirect based on role
      const redirectTo = getRedirectPath(user.role);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, showUnauthorized, navigate, location.pathname]);

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Not authenticated - show nothing (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Role check failed - show unauthorized page
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const requiredRoleLabel = allowedRoles.length === 1
      ? ROLE_LABELS[allowedRoles[0]]
      : allowedRoles.map(r => ROLE_LABELS[r]).join(" atau ");

    return (
      <UnauthorizedPage
        requiredRole={requiredRoleLabel}
        message={`Halaman ini memerlukan akses sebagai ${requiredRoleLabel}. Akun Anda saat ini adalah ${ROLE_LABELS[user.role]}.`}
      />
    );
  }

  return <>{children}</>;
}

// Redirect helper
function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "customer":
      return "/dashboard";
    case "super_admin":
    case "admin":
    case "finance":
    case "editor":
    case "staff":
    case "photographer":
    case "videographer":
      return "/admin";
    default:
      return "/";
  }
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

interface CustomerRouteProps {
  children: ReactNode;
  showUnauthorized?: boolean;
}

export function CustomerRoute({
  children,
  showUnauthorized = true,
}: CustomerRouteProps) {
  return (
    <ProtectedRoute
      allowedRoles={["customer"]}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </ProtectedRoute>
  );
}

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
      // Already logged in - redirect based on role
      const to = redirectPath || getRedirectPath(user.role);
      const from = (location.state as { from?: string })?.from;
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
