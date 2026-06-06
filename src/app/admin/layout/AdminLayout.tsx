import { useState, type ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminStatusBanner from "../components/AdminStatusBanner";
import { useAuth } from "../../contexts/AuthContext";
import { isSuperAdmin, isAdminRole } from "../../utils/permissions";

export default function AdminLayout({
  activeItem,
  onSelectItem,
  onLogout,
  children,
}: {
  activeItem: string;
  onSelectItem: (item: string) => void;
  onLogout?: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  // Only show status banner for super_admin and admin
  const showStatusBanner = user && (isSuperAdmin(user.role) || isAdminRole(user.role));

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-foreground">
      <AdminSidebar
        activeItem={activeItem}
        onSelect={onSelectItem}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((open) => !open)}
      />
      <div className="lg:pl-[288px]">
        <AdminTopbar title={activeItem} onLogout={onLogout} />
        {/* Supabase Status Banner - only for super_admin and admin */}
        {showStatusBanner && <AdminStatusBanner compact />}
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
