import { useState } from "react";
import { User, Lock, Bell, Check } from "lucide-react";

export default function ProfileSettings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Profile Settings
        </h1>
        <p className="text-foreground-secondary">
          Kelola informasi akun, kontak, dan preferensi notifikasi Anda.
        </p>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-success-soft border border-green-600/30 rounded-sm flex items-center gap-3">
          <Check size={20} className="text-green-600" />
          <span className="text-sm text-green-600 font-medium">Profile updated successfully.</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white border border-border-line rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-background-soft rounded-sm flex items-center justify-center">
              <User size={20} className="text-premium-beige" />
            </div>
            <div>
              <h2 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>
                Personal Information
              </h2>
              <p className="text-sm text-foreground-secondary">Update your personal details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Nama Lengkap</label>
              <input
                type="text"
                defaultValue="Admin User"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                defaultValue="admin@danivisual.com"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Nomor WhatsApp</label>
              <input
                type="text"
                defaultValue="+62 812 3456 7890"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Username Instagram</label>
              <input
                type="text"
                defaultValue="@adminuser"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white border border-border-line rounded-sm p-6">
          <h3 className="text-lg mb-4 font-medium" style={{ fontFamily: "var(--font-heading)" }}>
            Address Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Alamat Lengkap</label>
              <textarea
                rows={2}
                defaultValue="Jl. Sudirman No. 123, Jakarta"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Kota</label>
                <input
                  type="text"
                  defaultValue="Jakarta Selatan"
                  className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Provinsi</label>
                <input
                  type="text"
                  defaultValue="DKI Jakarta"
                  className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Kode Pos</label>
                <input
                  type="text"
                  defaultValue="12190"
                  className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-border-line rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-background-soft rounded-sm flex items-center justify-center">
              <Lock size={20} className="text-premium-beige" />
            </div>
            <div>
              <h2 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>
                Security
              </h2>
              <p className="text-sm text-foreground-secondary">Update your password</p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm mb-2">Password Lama</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Password Baru</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Konfirmasi Password Baru</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>
            <button className="px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm">
              Update Password
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white border border-border-line rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-background-soft rounded-sm flex items-center justify-center">
              <Bell size={20} className="text-premium-beige" />
            </div>
            <div>
              <h2 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>
                Notification Preferences
              </h2>
              <p className="text-sm text-foreground-secondary">Manage your notification settings</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border border-border-line rounded-sm cursor-pointer hover:bg-background-soft transition">
              <input type="checkbox" defaultChecked className="rounded" />
              <div>
                <p className="text-sm font-medium">Notifikasi WhatsApp</p>
                <p className="text-xs text-foreground-secondary">
                  Terima update via WhatsApp
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-border-line rounded-sm cursor-pointer hover:bg-background-soft transition">
              <input type="checkbox" defaultChecked className="rounded" />
              <div>
                <p className="text-sm font-medium">Notifikasi Email</p>
                <p className="text-xs text-foreground-secondary">
                  Terima update via email
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-border-line rounded-sm cursor-pointer hover:bg-background-soft transition">
              <input type="checkbox" defaultChecked className="rounded" />
              <div>
                <p className="text-sm font-medium">Update Progress Album</p>
                <p className="text-xs text-foreground-secondary">
                  Notifikasi setiap ada progress album
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-border-line rounded-sm cursor-pointer hover:bg-background-soft transition">
              <input type="checkbox" defaultChecked className="rounded" />
              <div>
                <p className="text-sm font-medium">Reminder Pembayaran</p>
                <p className="text-xs text-foreground-secondary">
                  Pengingat untuk pembayaran dan pelunasan
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-border-line rounded-sm cursor-pointer hover:bg-background-soft transition">
              <input type="checkbox" defaultChecked className="rounded" />
              <div>
                <p className="text-sm font-medium">Reminder Foto Selection</p>
                <p className="text-xs text-foreground-secondary">
                  Pengingat deadline foto selection
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
          >
            Save Changes
          </button>
          <button className="px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
