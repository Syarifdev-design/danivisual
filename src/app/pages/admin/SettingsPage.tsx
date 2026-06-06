import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import { isSupabaseConfigured, checkSupabaseConnection, getStorageDiagnostics, ConnectionDiagnostic } from "../../../lib/supabaseClient";
import {
  Plus, Edit2, Trash2, X, UserCog, Shield, Users, Clock,
  Check, Eye, EyeOff, Key, AlertTriangle, Download, FileUp,
  Database, HardDrive, Wifi, RefreshCw, Gauge
} from "lucide-react";
import { useAdmin, AdminUser, AdminRole } from "../../contexts/AdminContext";
import { useAuth, useIsSuperAdmin } from "../../contexts/AuthContext";
import { useRef } from "react";
import { createSampleUsers } from "../../../services/staffUserService";

// Build info from environment variables (set during CI/CD build)
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "v1.0.0";
const BUILD_DATE = import.meta.env.VITE_BUILD_DATE || null;
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT || null;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

// Role Permissions Matrix - READ-ONLY reference (synced with permissions.ts)
// This is for reference only. Actual permissions enforced server-side via RLS policies.
const roleConfig: Record<AdminRole, { label: string; bg: string; text: string; summary: string[]; menuAccess: string[]; dataAccess: string[] }> = {
  super_admin: {
    label: "Super Admin",
    bg: "bg-red-50",
    text: "text-red-700",
    summary: ["Full system access", "Manage all admin users", "System settings"],
    menuAccess: ["Dashboard", "Website Content", "Portfolio", "Services", "Bookings", "Payments", "Finance", "Production", "Customers", "Employees", "My KPI", "Attendance", "Traffic", "Settings"],
    dataAccess: ["All data", "Manage users", "Manage employees", "KPI management"],
  },
  admin: {
    label: "Admin",
    bg: "bg-blue-50",
    text: "text-blue-700",
    summary: ["Operational management", "All menus except Settings", "No system settings"],
    menuAccess: ["Dashboard", "Website Content", "Portfolio", "Services", "Bookings", "Payments", "Finance", "Production", "Customers", "Employees", "My KPI", "Attendance", "Traffic"],
    dataAccess: ["Operational data", "Manage employees", "KPI management", "No Settings access"],
  },
  finance: {
    label: "Finance",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    summary: ["Payment verification", "Finance reports", "Bookings/Customers read-only"],
    menuAccess: ["Dashboard", "Payments", "Finance", "Bookings", "Customers", "Attendance"],
    dataAccess: ["Payments full", "Bookings read-only", "Customers read-only", "No user management"],
  },
  editor: {
    label: "Editor",
    bg: "bg-amber-50",
    text: "text-amber-700",
    summary: ["Portfolio management", "Production tasks", "Attendance & My KPI"],
    menuAccess: ["Dashboard", "Portfolio", "Production", "Attendance", "My KPI"],
    dataAccess: ["Portfolio full", "Production tasks", "Own attendance", "Own KPI"],
  },
  photographer: {
    label: "Photographer",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    summary: ["Production tasks", "Attendance", "My KPI"],
    menuAccess: ["Dashboard", "Production", "Attendance", "My KPI"],
    dataAccess: ["Production tasks", "Own attendance", "Own KPI"],
  },
  videographer: {
    label: "Videographer",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    summary: ["Production tasks", "Attendance", "My KPI"],
    menuAccess: ["Dashboard", "Production", "Attendance", "My KPI"],
    dataAccess: ["Production tasks", "Own attendance", "Own KPI"],
  },
  staff: {
    label: "Staff",
    bg: "bg-purple-50",
    text: "text-purple-700",
    summary: ["Production support", "Attendance", "My KPI"],
    menuAccess: ["Dashboard", "Production", "Attendance", "My KPI"],
    dataAccess: ["Production support", "Own attendance", "Own KPI"],
  },
  customer: {
    label: "Customer",
    bg: "bg-gray-50",
    text: "text-gray-700",
    summary: ["Client portal only", "No admin panel access"],
    menuAccess: ["(Customer Portal - /dashboard)"],
    dataAccess: ["Own booking status", "Own payment history", "No admin access"],
  },
};

export default function SettingsPage({ defaultTab }: { defaultTab?: "admins" | "system" }) {
  // Permission guard - only super_admin can access Settings
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const { admins, addAdmin, updateAdmin, deleteAdmin, resetAll, refreshAdmins } = useAdmin();
  const importRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Determine active tab: URL ?tab= takes precedence over defaultTab prop
  const getInitialTab = (): "admins" | "system" => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "system") return "system";
    return "admins";
  };

  const [activeTab, setActiveTab] = useState<"admins" | "system">(getInitialTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync activeTab when URL changes (browser back/forward)
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [searchParams]);

  // Handle tab change: update URL and state
  const handleTabChange = (newTab: "admins" | "system") => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab }, { replace: true });
  };

  // Connection test state
  const [connectionTestResult, setConnectionTestResult] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionTestMessage, setConnectionTestMessage] = useState<string>("");
  const [lastConnectionTest, setLastConnectionTest] = useState<Date | null>(null);
  const [connectionResponseTime, setConnectionResponseTime] = useState<number | null>(null);

  // Storage check state
  const [storageChecked, setStorageChecked] = useState(false);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Test Supabase connection
  const handleTestConnection = async () => {
    setConnectionTestResult("testing");
    setConnectionTestMessage("Testing connection...");
    setConnectionResponseTime(null);

    try {
      const result: ConnectionDiagnostic = await checkSupabaseConnection();
      const checkedAt = new Date(result.checkedAt);
      setLastConnectionTest(checkedAt);

      if (result.responseTimeMs) {
        setConnectionResponseTime(result.responseTimeMs);
      }

      if (result.ok && result.status === "connected") {
        setConnectionTestResult("success");
        setConnectionTestMessage(result.message);
      } else {
        setConnectionTestResult("error");
        setConnectionTestMessage(result.message);
      }
    } catch (err) {
      setConnectionTestResult("error");
      setConnectionTestMessage("Connection test failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Check storage buckets using real diagnostics
  const handleCheckStorage = async () => {
    setStorageLoading(true);
    setStorageError(null);

    try {
      const result = await getStorageDiagnostics();
      setStorageChecked(true);

      if (result.errorMessage && result.buckets.length === 0) {
        setStorageError(result.errorMessage);
      }
    } catch (err) {
      setStorageError("Failed to check storage: " + (err instanceof Error ? err.message : "Unknown error"));
      setStorageChecked(true);
    } finally {
      setStorageLoading(false);
    }
  };

  // Format last connection time
  const formatLastTest = (date: Date | null): string => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("id-ID");
  };

  // Super Admin risk acknowledgment for creating/editing super_admin
  const [acknowledgeSuperAdminRisk, setAcknowledgeSuperAdminRisk] = useState(false);

  // Computed: count active super_admin users
  const activeSuperAdminCount = useMemo(() => {
    return admins.filter(a => a.role === "super_admin" && a.isActive !== false).length;
  }, [admins]);

  // Check if a specific user is the last active super_admin
  const isLastSuperAdmin = (adminId: string): boolean => {
    const admin = admins.find(a => a.id === adminId);
    if (!admin || admin.role !== "super_admin" || admin.isActive === false) return false;
    return activeSuperAdminCount <= 1;
  };

  // Check if deactivating a super_admin would leave no active super_admin
  const canDeactivateSuperAdmin = (adminId: string): boolean => {
    const admin = admins.find(a => a.id === adminId);
    if (!admin || admin.role !== "super_admin") return true;
    // Can deactivate if not the last super_admin OR if it's inactive already
    if (admin.isActive === false) return true;
    return activeSuperAdminCount > 1;
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "editor" as AdminRole,
    temporaryPassword: "",
    confirmPassword: "",
    position: "",
    phone: "",
    isActive: true,
  });

  // Redirect non-super_admin users
  if (!user || !isSuperAdmin) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <Shield className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-semibold text-red-700">Access Denied</h2>
          <p className="mt-2 text-sm text-red-600">
            Only Super Admin can access System Settings.
          </p>
          <p className="mt-1 text-xs text-foreground-secondary">
            Current role: {user?.role || "Unknown"}
          </p>
        </div>
      </div>
    );
  }

  const handleOpenModal = (admin?: AdminUser) => {
    setAcknowledgeSuperAdminRisk(false);
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email || "",
        role: admin.role,
        temporaryPassword: "",
        confirmPassword: "",
        position: admin.position || "",
        phone: admin.phone || "",
        isActive: admin.isActive,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        name: "",
        email: "",
        role: "editor",
        temporaryPassword: "",
        confirmPassword: "",
        position: "",
        phone: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for super_admin role acknowledgment
    const isCreatingSuperAdmin = !editingAdmin && formData.role === "super_admin";
    const isEditingToSuperAdmin = editingAdmin && editingAdmin.role !== "super_admin" && formData.role === "super_admin";
    if ((isCreatingSuperAdmin || isEditingToSuperAdmin) && !acknowledgeSuperAdminRisk) {
      alert("Anda harus mengakui risiko membuat Super Admin baru.");
      return;
    }

    if (!editingAdmin && formData.temporaryPassword !== formData.confirmPassword) {
      alert("Password confirmation does not match");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAdmin) {
        await updateAdmin(editingAdmin.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          position: formData.position,
          phone: formData.phone,
          isActive: formData.isActive,
        });
      } else {
        if (!formData.temporaryPassword) {
          alert("Temporary password is required for new users");
          return;
        }
        await addAdmin({
          username: formData.email.split("@")[0],
          name: formData.name,
          email: formData.email,
          role: formData.role,
          position: formData.position,
          phone: formData.phone,
          temporaryPassword: formData.temporaryPassword,
          isActive: formData.isActive,
        });
      }
      await refreshAdmins();
      setShowModal(false);
      setEditingAdmin(null);
      setFormData({
        name: "",
        email: "",
        role: "editor",
        temporaryPassword: "",
        confirmPassword: "",
        position: "",
        phone: "",
        isActive: true,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSampleUsers = async () => {
    if (!import.meta.env.DEV) return;
    if (!confirm("Create sample users for all roles?")) return;
    setIsSubmitting(true);
    try {
      await createSampleUsers();
      await refreshAdmins();
      alert("Sample users created.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create sample users");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const targetAdmin = admins.find(a => a.id === id || a.adminUserId === id);
    if (!targetAdmin) {
      setShowDeleteConfirm(null);
      return;
    }

    // Check if this is deactivation or reactivation
    const isDeactivating = targetAdmin.isActive !== false;

    // Prevent deactivating the last super_admin
    if (isDeactivating && targetAdmin.role === "super_admin" && isLastSuperAdmin(id)) {
      alert("Tidak dapat menonaktifkan satu-satunya Super Admin aktif. Sistem harus memiliki minimal satu Super Admin.");
      setShowDeleteConfirm(null);
      return;
    }

    // Prevent deactivating yourself
    if (isDeactivating && targetAdmin.id === user?.id && targetAdmin.role === "super_admin") {
      alert("Tidak dapat menonaktifkan akun Anda sendiri sebagai Super Admin.");
      setShowDeleteConfirm(null);
      return;
    }

    try {
      if (isDeactivating) {
        // Deactivate user
        await deleteAdmin(id);
      } else {
        // Reactivate user - need to call updateAdmin directly
        await updateAdmin(id, { isActive: true });
      }
      await refreshAdmins();
      setShowDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
    setResetConfirmText("");
  };

  const exportSystemBackup = () => {
    const data = Object.fromEntries(
      Object.keys(localStorage)
        .filter(key => key.startsWith("danivisual_"))
        .map(key => [key, localStorage.getItem(key)])
    );
    const blob = new Blob([JSON.stringify({
      schema: "danivisual.full-backup.v1",
      exportedAt: new Date().toISOString(),
      storage: data,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `danivisual-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importSystemBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.schema !== "danivisual.full-backup.v1" || !parsed.storage) throw new Error();
      Object.entries(parsed.storage).forEach(([key, value]) => {
        if (key.startsWith("danivisual_") && typeof value === "string") localStorage.setItem(key, value);
      });
      alert("Backup berhasil di-import. Refresh halaman untuk memuat data.");
    } catch {
      alert("File backup tidak valid.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">System</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Settings</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola admin accounts, role permissions, dan pengaturan sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTabChange("admins")}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
            activeTab === "admins" ? "bg-dark-premium text-white" : "border border-border-line bg-white"
          }`}
        >
          <Users size={16} className="mr-2 inline" />
          Admin Accounts
        </button>
        <button
          onClick={() => handleTabChange("system")}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
            activeTab === "system" ? "bg-dark-premium text-white" : "border border-border-line bg-white"
          }`}
        >
          <Shield size={16} className="mr-2 inline" />
          System
        </button>
      </div>

      {/* Admin Accounts Tab */}
      {activeTab === "admins" && (
        <>
          <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-line p-4">
              <h3 className="font-semibold">Admin Users</h3>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {import.meta.env.DEV && (
                  <button
                    onClick={handleCreateSampleUsers}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold"
                  >
                    <Users size={14} />
                    Create Sample Users
                  </button>
                )}
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus size={14} />
                  Add User
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-premium-beige/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-line">
                  {admins.map((admin) => {
                    const role = roleConfig[admin.role] || roleConfig.customer;
                    return (
                      <tr key={admin.id} className="hover:bg-premium-beige/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-premium-beige/10 text-premium-beige">
                              <span className="text-sm font-bold">{admin.name?.charAt(0)?.toUpperCase() || "?"}</span>
                            </div>
                            <div>
                              <p className="font-semibold">{admin.name || "Unknown"}</p>
                              <p className="text-xs text-foreground-secondary">{admin.email || `@${admin.username || "unknown"}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${role.bg} ${role.text}`}>
                            {role.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {admin.isActive ? (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Inactive</span>
                            )}
                            {admin.role === "super_admin" && admin.isActive && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">Protected</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground-secondary">{formatDate(admin.createdAt)}</span>
                          {admin.id === user?.id && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">You</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Deactivate/Activate button */}
                            {admin.role === "super_admin" ? (
                              <button
                                onClick={() => {
                                  if (isLastSuperAdmin(admin.id)) {
                                    alert("Tidak dapat menonaktifkan satu-satunya Super Admin aktif. Sistem harus memiliki minimal satu Super Admin.");
                                    return;
                                  }
                                  if (admin.isActive && admin.id === user?.id) {
                                    alert("Tidak dapat menonaktifkan akun Anda sendiri sebagai Super Admin.");
                                    return;
                                  }
                                  updateAdmin(admin.id, { isActive: !admin.isActive });
                                }}
                                className={`rounded-lg p-2 transition ${
                                  isLastSuperAdmin(admin.id) && admin.isActive
                                    ? "cursor-not-allowed text-gray-300"
                                    : "hover:bg-premium-beige/10 text-foreground-secondary"
                                }`}
                                title={
                                  isLastSuperAdmin(admin.id) && admin.isActive
                                    ? "Tidak dapat menonaktifkan Super Admin terakhir"
                                    : admin.isActive
                                      ? "Nonaktifkan user"
                                      : "Aktifkan user"
                                }
                                disabled={isLastSuperAdmin(admin.id) && admin.isActive}
                              >
                                {admin.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            ) : (
                              <button
                                onClick={() => updateAdmin(admin.id, { isActive: !admin.isActive })}
                                className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                                title={admin.isActive ? "Nonaktifkan user" : "Aktifkan user"}
                              >
                                {admin.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenModal(admin)}
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                              title="Edit user"
                            >
                              <Edit2 size={16} />
                            </button>
                            {admin.role !== "super_admin" && (
                              admin.isActive ? (
                                <button
                                  onClick={() => setShowDeleteConfirm(admin.id)}
                                  className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-500"
                                  title="Nonaktifkan user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setShowDeleteConfirm(admin.id)}
                                  className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                                  title="Aktifkan kembali user"
                                >
                                  <Eye size={16} />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permissions - READ-ONLY REFERENCE */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="mb-4">
              <h3 className="font-semibold">Role Permissions</h3>
              <p className="mt-1 text-xs text-foreground-secondary">
                Read-only reference. Actual permissions enforced via RLS policies.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(roleConfig).map(([role, config]) => (
                <div key={role} className="rounded-xl border border-border-line p-4">
                  <div className="mb-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {/* Summary */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Summary</p>
                      <ul className="mt-1 space-y-0.5">
                        {config.summary.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                            <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Menu Access */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Menu Access</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {config.menuAccess.map((menu, i) => (
                          <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                            {menu}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Data Access */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Data Access</p>
                      <ul className="mt-1 space-y-0.5">
                        {config.dataAccess.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground-secondary">
                            <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* System Tab */}
      {activeTab === "system" && (
        <>
          {/* Page Header for System Tab */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">System</p>
                <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>System Settings</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                  Pantau status aplikasi, koneksi Supabase, mode penyimpanan, dan konfigurasi dasar sistem.
                </p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="mb-4">
              <h3 className="font-semibold">System Information</h3>
              <p className="mt-1 text-xs text-foreground-secondary">Runtime environment status. No secrets exposed.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Application</p>
                <p className="mt-1 font-semibold">DaniVisual Admin</p>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Version</p>
                <p className="mt-1 font-semibold">{APP_VERSION}</p>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Environment</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${import.meta.env.DEV ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {import.meta.env.DEV ? "Development" : "Production"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Build Mode</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">SPA</span>
                  <span className="text-xs text-foreground-secondary">/ Vite</span>
                </div>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Build Date</p>
                <p className="mt-1 font-semibold">
                  {BUILD_DATE ? new Date(BUILD_DATE).toLocaleDateString("id-ID") : "Not available"}
                </p>
                {BUILD_DATE && (
                  <p className="mt-1 text-[10px] text-foreground-secondary">
                    Built: {new Date(BUILD_DATE).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Build Hash</p>
                <p className="mt-1 font-mono text-sm">{GIT_COMMIT || "-"}</p>
              </div>
            </div>
          </div>

          {/* Supabase Status */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Supabase Status</h3>
                <p className="mt-1 text-xs text-foreground-secondary">Database connection and configuration status.</p>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={connectionTestResult === "testing"}
                className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold transition hover:bg-premium-beige/5 disabled:opacity-50"
              >
                {connectionTestResult === "testing" ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Wifi size={14} />
                )}
                Test Connection
              </button>
            </div>

            {/* Status cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Database</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured() ? "bg-emerald-500" : "bg-gray-400"}`} />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isSupabaseConfigured() ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {isSupabaseConfigured() ? "Connected" : "Not Configured"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Supabase Configured</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured() ? "bg-emerald-500" : "bg-gray-400"}`} />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isSupabaseConfigured() ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {isSupabaseConfigured() ? "Yes" : "No"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Connection Status</p>
                <div className="mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    connectionTestResult === "success" ? "bg-emerald-100 text-emerald-700" :
                    connectionTestResult === "error" ? "bg-red-100 text-red-700" :
                    connectionTestResult === "testing" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {connectionTestResult === "idle" ? "Not tested" :
                     connectionTestResult === "testing" ? "Testing..." :
                     connectionTestResult === "success" ? "Success" : "Error"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Last Tested</p>
                <p className="mt-1 font-semibold text-sm">{formatLastTest(lastConnectionTest)}</p>
              </div>
              {connectionResponseTime !== null && (
                <div className="rounded-lg border border-border-line p-4">
                  <p className="text-xs text-foreground-secondary">Response Time</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Gauge size={14} className="text-foreground-secondary" />
                    <span className="font-semibold text-sm">{connectionResponseTime}ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Connection test result message */}
            {connectionTestMessage && (
              <div className={`mt-4 rounded-lg p-3 ${
                connectionTestResult === "success" ? "bg-emerald-50 border border-emerald-200" :
                connectionTestResult === "error" ? "bg-red-50 border border-red-200" :
                "bg-gray-50 border border-gray-200"
              }`}>
                <p className={`text-xs ${
                  connectionTestResult === "success" ? "text-emerald-700" :
                  connectionTestResult === "error" ? "text-red-700" :
                  "text-gray-700"
                }`}>
                  {connectionTestMessage}
                </p>
              </div>
            )}
          </div>

          {/* Storage & Media */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Storage & Media</h3>
                <p className="mt-1 text-xs text-foreground-secondary">Storage mode and bucket availability.</p>
              </div>
              <button
                onClick={handleCheckStorage}
                disabled={storageLoading}
                className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold transition hover:bg-premium-beige/5 disabled:opacity-50"
              >
                {storageLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <HardDrive size={14} />
                )}
                Check Storage
              </button>
            </div>

            {/* Storage info cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Storage Mode</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured() ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isSupabaseConfigured() ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {isSupabaseConfigured() ? "Supabase" : "localStorage"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-foreground-secondary">
                  {isSupabaseConfigured() ? "Using Supabase Storage" : "Fallback mode"}
                </p>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Upload Mode</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isSupabaseConfigured() ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {isSupabaseConfigured() ? "Direct" : "Base64"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-foreground-secondary">
                  {isSupabaseConfigured() ? "Supabase Storage upload" : "localStorage encode"}
                </p>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Image Storage</p>
                <div className="mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isSupabaseConfigured() ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {isSupabaseConfigured() ? "Cloud" : "Local"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Bucket Status</p>
                <div className="mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${storageChecked ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {storageChecked ? "Checked" : "Not checked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bucket list */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-foreground-secondary">Storage Buckets</p>
              {storageError && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">{storageError}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {storageChecked ? (
                  // Show real bucket status from diagnostics
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <Check size={12} />
                      content-images
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <Check size={12} />
                      portfolio-media
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <Check size={12} />
                      payment-proofs
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <Check size={12} />
                      attendance-selfies
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      content-images
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      portfolio-media
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      payment-proofs
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      attendance-selfies
                    </div>
                  </>
                )}
              </div>
              {!storageChecked && (
                <p className="mt-2 text-xs text-foreground-secondary">
                  Click "Check Storage" to verify bucket availability.
                </p>
              )}
            </div>
          </div>

          {/* Backup & Export */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <div className="mb-4">
              <h3 className="font-semibold">Backup & Export</h3>
              {isSupabaseConfigured() ? (
                <p className="mt-1 text-xs text-foreground-secondary">
                  Export/import localStorage data for development testing. Production data is in Supabase.
                </p>
              ) : (
                <p className="mt-1 text-xs text-foreground-secondary">
                  Export/import all admin data to JSON. Useful for backup and migration.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={exportSystemBackup}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-sm font-semibold text-white"
              >
                <Download size={16} /> Export Data
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-sm font-semibold"
              >
                <FileUp size={16} /> Import Data
              </button>
              <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importSystemBackup(event.target.files?.[0])} />
            </div>
            {!isSupabaseConfigured() && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-700">Local Mode Only</p>
                <p className="mt-1 text-xs text-amber-600">
                  Running in localStorage mode. Connect Supabase for production use.
                </p>
              </div>
            )}
            <div className="mt-4 rounded-lg border border-border-line bg-gray-50 p-3">
              <p className="text-xs text-foreground-secondary">
                <strong>Note:</strong> Export/Import ini hanya untuk localStorage fallback/development. Data production tersimpan di Supabase.
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-red-700">Danger Zone</h3>
                <p className="text-sm text-red-600">Tindakan di bawah tidak bisa di-undo.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleResetData}
                className="rounded-full border border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
              >
                Reset All Data
              </button>
            </div>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>Warning:</strong> Reset hanya membersihkan local fallback data. Data Supabase tidak terhapus.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">{editingAdmin ? "Edit" : "Add"} User</p>
                <h3 className="mt-1 text-xl font-semibold">{editingAdmin ? "Edit User" : "New User"}</h3>
              </div>
              <button onClick={() => { setShowModal(false); setEditingAdmin(null); }} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClassName}
                  placeholder="Display name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                  className={inputClassName}
                  placeholder="name@danivisual.test"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className={inputClassName}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="finance">Finance</option>
                  <option value="editor">Editor</option>
                  <option value="photographer">Photographer</option>
                  <option value="videographer">Videographer</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className={inputClassName}
                  placeholder="Role title"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClassName}
                  placeholder="08..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Temporary Password {editingAdmin ? "(unchanged here)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  disabled={Boolean(editingAdmin)}
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className={inputClassName}
                  placeholder={editingAdmin ? "Password changes are handled by reset flow" : "Minimum 8 characters"}
                />
              </div>
              {!editingAdmin && (
                <div>
                  <label className="mb-1 block text-sm font-semibold">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={inputClassName}
                    placeholder="Repeat temporary password"
                  />
                </div>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border-line"
                />
                <span className="text-sm">Active (can login)</span>
              </label>

              {/* Super Admin Risk Warning */}
              {(formData.role === "super_admin") && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-700">Peringatan: Membuat Super Admin Baru</p>
                      <p className="mt-1 text-xs text-red-600">
                        Anda akan membuat user dengan role Super Admin. Role ini memiliki akses penuh ke seluruh sistem, termasuk ability untuk mengelola admin lain dan pengaturan kritis.
                      </p>
                      <label className="mt-3 flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={acknowledgeSuperAdminRisk}
                          onChange={(e) => setAcknowledgeSuperAdminRisk(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-red-300"
                        />
                        <span className="text-xs text-red-700">
                          Saya memahami risiko membuat Super Admin baru dan bertanggung jawab atas tindakan ini.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingAdmin(null); setAcknowledgeSuperAdminRisk(false); }} className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting || (formData.role === "super_admin" && !acknowledgeSuperAdminRisk)}
                  className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingAdmin ? "Update" : "Create"} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation - handles both deactivate and reactivate */}
      {showDeleteConfirm && (
        (() => {
          const adminToDelete = admins.find(a => a.id === showDeleteConfirm || a.adminUserId === showDeleteConfirm);
          const isTargetSuperAdmin = adminToDelete?.role === "super_admin";
          const isLastSuperAdminUser = isLastSuperAdmin(showDeleteConfirm);
          const isDeactivating = adminToDelete?.isActive !== false;
          const isSelfDeactivation = adminToDelete?.id === user?.id && adminToDelete?.role === "super_admin";
          const isReactivate = !isDeactivating;

          // Determine modal styling based on action
          const modalBgClass = isReactivate ? "bg-emerald-50" : "bg-red-50";
          const modalIconBgClass = isReactivate ? "bg-emerald-100" : "bg-red-100";
          const modalIconColorClass = isReactivate ? "text-emerald-600" : "text-red-600";
          const titleColorClass = isReactivate ? "text-emerald-700" : "text-red-700";
          const buttonBgClass = isReactivate ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600";

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
                <div className={`mb-4 flex items-start gap-3 rounded-xl p-4 ${modalBgClass}`}>
                  <div className={`rounded-full p-2 ${modalIconBgClass}`}>
                    <AlertTriangle className={modalIconColorClass} size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${titleColorClass}`}>
                      {isReactivate ? "Aktifkan User" : (isTargetSuperAdmin ? "Nonaktifkan Super Admin" : "Nonaktifkan User")}
                    </h3>
                    {isLastSuperAdminUser ? (
                      <p className="mt-2 text-sm text-red-600">
                        Tidak dapat menonaktifkan satu-satunya Super Admin aktif. Sistem harus memiliki minimal satu Super Admin.
                      </p>
                    ) : isSelfDeactivation ? (
                      <p className="mt-2 text-sm text-red-600">
                        Tidak dapat menonaktifkan akun Anda sendiri sebagai Super Admin.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-foreground-secondary">
                        {isReactivate
                          ? `Aktifkan kembali ${adminToDelete?.name || "user"}? User akan bisa login kembali.`
                          : `Nonaktifkan ${adminToDelete?.name || "user"}? User tidak akan bisa login, tetapi histori data tetap disimpan.`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-full border border-border-line bg-white px-4 py-2 text-sm font-semibold">Batal</button>
                  {isLastSuperAdminUser || isSelfDeactivation ? (
                    <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-full bg-gray-400 px-4 py-2 text-sm font-semibold text-white" disabled>Tidak Bisa</button>
                  ) : (
                    <button onClick={() => handleDelete(showDeleteConfirm)} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white ${buttonBgClass}`}>
                      {isReactivate ? "Aktifkan Kembali" : (isTargetSuperAdmin ? "Nonaktifkan" : "Nonaktifkan User")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Reset Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-700">Reset Semua Data</h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  Tindakan ini akan menghapus semua data admin secara permanen. Data tidak bisa dikembalikan.
                </p>
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">⚠️ Rekomendasi sebelum reset:</p>
                  <ul className="mt-1 text-xs text-amber-600 list-inside list-disc">
                    <li>Export backup terlebih dahulu dengan klik "Export Full Backup"</li>
                    <li>Pastikan Anda memahami bahwa semua data akan hilang</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold">
                Ketik <span className="text-red-600">RESET</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Ketik RESET di sini"
                className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => { setShowResetConfirm(false); setResetConfirmText(""); }} className="flex-1 rounded-full border border-border-line bg-white px-4 py-2 text-sm font-semibold">Batal</button>
              <button
                onClick={() => {
                  resetAll();
                  setShowResetConfirm(false);
                  setResetConfirmText("");
                  alert("Semua data telah di-reset.");
                }}
                disabled={resetConfirmText !== "RESET"}
                className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
