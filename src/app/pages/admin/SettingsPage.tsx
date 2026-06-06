import { useState } from "react";
import {
  Plus, Edit2, Trash2, X, UserCog, Shield, Users, Clock,
  Check, Eye, EyeOff, Key, AlertTriangle, Download, FileUp
} from "lucide-react";
import { useAdmin, AdminUser, AdminRole } from "../../contexts/AdminContext";
import { useAuth, useIsSuperAdmin } from "../../contexts/AuthContext";
import { useRef } from "react";
import { createSampleUsers } from "../../../services/staffUserService";

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

const roleConfig: Record<AdminRole, { label: string; bg: string; text: string; permissions: string[] }> = {
  super_admin: {
    label: "Super Admin",
    bg: "bg-red-50",
    text: "text-red-700",
    permissions: ["All access", "Manage admins", "System settings"],
  },
  admin: {
    label: "Admin",
    bg: "bg-blue-50",
    text: "text-blue-700",
    permissions: ["Content management", "Booking management", "Analytics"],
  },
  finance: {
    label: "Finance",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    permissions: ["Payment verification", "Finance reports", "Revenue analytics"],
  },
  editor: {
    label: "Editor",
    bg: "bg-amber-50",
    text: "text-amber-700",
    permissions: ["Content editing", "Portfolio management", "FAQ editing"],
  },
  photographer: {
    label: "Photographer",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    permissions: ["Attendance", "My tasks", "My KPI"],
  },
  videographer: {
    label: "Videographer",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    permissions: ["Attendance", "My tasks", "My KPI"],
  },
  staff: {
    label: "Staff",
    bg: "bg-purple-50",
    text: "text-purple-700",
    permissions: ["Production tracking", "Booking support", "Media upload"],
  },
  customer: {
    label: "Customer",
    bg: "bg-gray-50",
    text: "text-gray-700",
    permissions: ["Client portal", "Booking status", "Payment uploads"],
  },
};

export default function SettingsPage() {
  // Permission guard - only super_admin can access Settings
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const { admins, addAdmin, updateAdmin, deleteAdmin, resetAll, refreshAdmins } = useAdmin();
  const importRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<"admins" | "system">("admins");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
      await deleteAdmin(id);
      await refreshAdmins();
      setShowDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate user");
    }
  };

  const handleResetData = () => {
    if (confirm("Yakin ingin reset semua data admin? Ini akan menghapus semua bookings, payments, dan data lainnya. Data tidak bisa dikembalikan.")) {
      resetAll();
      alert("All data has been reset");
    }
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
          onClick={() => setActiveTab("admins")}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
            activeTab === "admins" ? "bg-dark-premium text-white" : "border border-border-line bg-white"
          }`}
        >
          <Users size={16} className="mr-2 inline" />
          Admin Accounts
        </button>
        <button
          onClick={() => setActiveTab("system")}
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-line">
                  {admins.map((admin) => {
                    const role = roleConfig[admin.role];
                    return (
                      <tr key={admin.id} className="hover:bg-premium-beige/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-premium-beige/10 text-premium-beige">
                              <span className="text-sm font-bold">{admin.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold">{admin.name}</p>
                              <p className="text-xs text-foreground-secondary">{admin.email || `@${admin.username}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${role.bg} ${role.text}`}>
                            {role.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {admin.isActive ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground-secondary">{formatDate(admin.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => updateAdmin(admin.id, { isActive: !admin.isActive })}
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                              title={admin.isActive ? "Deactivate" : "Activate"}
                            >
                              {admin.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => handleOpenModal(admin)}
                              className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                            >
                              <Edit2 size={16} />
                            </button>
                            {admin.role !== "super_admin" && (
                              <button
                                onClick={() => setShowDeleteConfirm(admin.id)}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </button>
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

          {/* Role Permissions */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <h3 className="mb-4 font-semibold">Role Permissions</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(roleConfig).map(([role, config]) => (
                <div key={role} className="rounded-xl border border-border-line p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
                    {config.label}
                  </span>
                  <ul className="mt-3 space-y-1">
                    {config.permissions.map((perm, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground-secondary">
                        <Check size={14} className="text-emerald-500" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* System Tab */}
      {activeTab === "system" && (
        <>
          {/* System Info */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <h3 className="mb-4 font-semibold">System Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Version</p>
                <p className="mt-1 font-semibold">DaniVisual Admin v1.0.0</p>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Storage</p>
                <p className="mt-1 font-semibold">localStorage (IndexedDB ready)</p>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Last Updated</p>
                <p className="mt-1 font-semibold">{new Date().toLocaleDateString("id-ID")}</p>
              </div>
              <div className="rounded-lg border border-border-line p-4">
                <p className="text-xs text-foreground-secondary">Mode</p>
                <p className="mt-1 font-semibold">Development (Demo)</p>
              </div>
            </div>
          </div>

          {/* Backup */}
          <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
            <h3 className="mb-2 font-semibold">Backup & Migration</h3>
            <p className="max-w-2xl text-sm text-foreground-secondary">
              Export semua data CMS/admin berbasis localStorage ke JSON. Struktur ini disiapkan agar nanti mudah dipindah ke backend.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={exportSystemBackup}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-sm font-semibold text-white"
              >
                <Download size={16} /> Export Full Backup
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-sm font-semibold"
              >
                <FileUp size={16} /> Import Backup
              </button>
              <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importSystemBackup(event.target.files?.[0])} />
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
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingAdmin(null); }} className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">{isSubmitting ? "Saving..." : editingAdmin ? "Update" : "Create"} User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold">Delete Admin</h3>
            </div>
            <p className="text-sm text-foreground-secondary">Are you sure you want to delete this admin? This action cannot be undone.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-full border border-border-line bg-white px-4 py-2 text-sm font-semibold">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
