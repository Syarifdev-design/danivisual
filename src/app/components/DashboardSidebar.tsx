import { Calendar, LogOut, TrendingUp, UserCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import BrandLogo from "./BrandLogo";

export default function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const menuItems = [
    { icon: Calendar, label: "My Booking", path: "/dashboard/my-booking" },
    { icon: TrendingUp, label: "Progress", path: "/dashboard/progress" },
  ];

  const bottomItems = [
    { icon: Calendar, label: "Booking", path: "/dashboard/my-booking" },
    { icon: TrendingUp, label: "Progress", path: "/dashboard/progress" },
    { icon: UserCircle, label: "Account", path: "/dashboard/account" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <aside className="hidden h-screen w-60 flex-col border-r border-border-line bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex">
        <div className="border-b border-border-line px-6 py-8">
          <Link to="/" className="flex items-center">
            <BrandLogo imageClassName="h-8" />
          </Link>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-foreground-secondary">Client Portal</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path === "/dashboard/my-booking" && location.pathname === "/dashboard");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-4 py-3 text-sm transition ${
                  active ? "bg-background-soft text-foreground" : "text-foreground-secondary hover:bg-background-soft hover:text-foreground"
                }`}
              >
                {active && <span className="absolute left-0 top-0 h-full w-[3px] bg-premium-beige" />}
                <Icon size={18} strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-line p-3">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground-secondary hover:bg-background-soft hover:text-foreground">
            <LogOut size={18} strokeWidth={1.7} />
            Logout
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-border-line bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between px-5 py-3">
          <div>
            <Link to="/" className="flex items-center">
              <BrandLogo imageClassName="h-8" />
            </Link>
            <p className="text-xs text-foreground-secondary">Hi, {user?.name || "Customer"}</p>
          </div>
          <Link to="/dashboard/account" aria-label="Open account" className="flex h-11 w-11 items-center justify-center rounded-full border border-border-line">
            <UserCircle size={22} />
          </Link>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-border-line bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-16px_40px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path || (item.path === "/dashboard/my-booking" && location.pathname === "/dashboard");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-xs ${
                active ? "text-foreground" : "text-foreground-secondary"
              }`}
            >
              {active && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-premium-beige" />}
              <Icon size={19} strokeWidth={active ? 2 : 1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
