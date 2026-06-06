import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  CreditCard,
  FileQuestion,
  FileText,
  GalleryHorizontal,
  Home,
  Images,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  Printer,
  Settings,
  SquareCheckBig,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import BrandLogo from "../../components/BrandLogo";
import { useAuth } from "../../contexts/AuthContext";
import { canAccessAdminMenuItem } from "../../utils/permissions";

export interface AdminMenuItem {
  label: string;
  icon: ReactNode;
}

const adminMenu: AdminMenuItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Website Content", icon: <FileText size={18} /> },
  { label: "Portfolio", icon: <Images size={18} /> },
  { label: "Services", icon: <BriefcaseBusiness size={18} /> },
  { label: "About", icon: <BookOpen size={18} /> },
  { label: "FAQ", icon: <FileQuestion size={18} /> },
  { label: "Contact", icon: <MessageCircle size={18} /> },
  { label: "Packages", icon: <Package size={18} /> },
  { label: "Bookings", icon: <CalendarCheck size={18} /> },
  { label: "Payments", icon: <CreditCard size={18} /> },
  { label: "Finance", icon: <WalletCards size={18} /> },
  { label: "Production", icon: <Printer size={18} /> },
  { label: "Production Tasks", icon: <SquareCheckBig size={18} /> },
  { label: "Customers", icon: <Users size={18} /> },
  { label: "Employees", icon: <UserRound size={18} /> },
  { label: "My KPI", icon: <TrendingUp size={18} /> },
  { label: "Attendance", icon: <GalleryHorizontal size={18} /> },
  { label: "Traffic", icon: <BarChart3 size={18} /> },
  { label: "Settings", icon: <Settings size={18} /> },
];

export default function AdminSidebar({
  activeItem,
  onSelect,
  mobileOpen,
  onToggleMobile,
}: {
  activeItem: string;
  onSelect: (item: string) => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}) {
  const { user } = useAuth();
  const visibleMenu = user
    ? adminMenu.filter((item) => canAccessAdminMenuItem(user.role, item.label))
    : [];

  const sidebar = (
    <aside className="flex h-full w-[288px] flex-col border-r border-border-line bg-white">
      <div className="flex h-20 items-center justify-between border-b border-border-line px-5">
        <BrandLogo imageClassName="h-8" />
        <button
          type="button"
          onClick={onToggleMobile}
          className="flex h-9 w-9 items-center justify-center border border-border-line text-foreground lg:hidden"
          aria-label="Close admin menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-4 px-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-premium-beige">Danivisual Admin</p>
          <p className="mt-2 text-xs leading-relaxed text-foreground-secondary">Premium editorial control room</p>
        </div>
        <div className="grid gap-1">
          {visibleMenu.map((item) => {
            const active = item.label === activeItem;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onSelect(item.label);
                  if (mobileOpen) onToggleMobile();
                }}
                className={`group flex min-h-11 items-center gap-3 border px-3 text-left text-sm transition ${
                  active
                    ? "border-premium-beige/45 bg-premium-beige/10 text-foreground"
                    : "border-transparent text-foreground-secondary hover:border-border-line hover:bg-background-soft hover:text-foreground"
                }`}
              >
                <span className={active ? "text-premium-beige" : "text-foreground-secondary group-hover:text-premium-beige"}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border-line p-4">
        <a href="/" className="flex min-h-11 items-center justify-center gap-2 border border-border-line bg-white px-4 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
          <Home size={16} /> View Website
        </a>
      </div>
    </aside>
  );

  return (
    <>
      <button
        type="button"
        onClick={onToggleMobile}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center border border-border-line bg-white text-foreground shadow-sm lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu size={18} />
      </button>
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close admin menu overlay" className="absolute inset-0 bg-black/25" onClick={onToggleMobile} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      )}
    </>
  );
}
