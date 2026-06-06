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
      <aside className="hidden h-screen w-60 flex-col border-r border-white/70 bg-white/88 shadow-[12px_0_36px_rgba(15,23,42,0.035)] backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex">
        <div className="border-b border-border-line/60 px-5 py-6">
          <Link to="/" className="flex items-center">
            <BrandLogo imageClassName="h-8" />
          </Link>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-foreground-secondary">Client Portal</p>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path === "/dashboard/my-booking" && location.pathname === "/dashboard");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm transition duration-200 ${
                  active
                    ? "border border-emerald-700/10 bg-[linear-gradient(135deg,rgba(22,163,74,0.09),rgba(248,246,242,0.64))] text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.045)]"
                    : "text-foreground-secondary hover:bg-white/78 hover:text-foreground hover:shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                }`}
              >
                {active && <span className="absolute left-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#16A34A]/70" />}
                <Icon size={18} strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-line/60 p-3">
          <button onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 text-sm text-foreground-secondary transition duration-200 hover:bg-white/78 hover:text-foreground">
            <LogOut size={18} strokeWidth={1.7} />
            Logout
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-white/70 bg-white/92 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between px-5 py-3">
          <div>
            <Link to="/" className="flex items-center">
              <BrandLogo imageClassName="h-8" />
            </Link>
            <p className="text-xs text-foreground-secondary">Hi, {user?.name || "Customer"}</p>
          </div>
          <Link to="/dashboard/account" aria-label="Open account" className="flex h-10 w-10 items-center justify-center rounded-full border border-border-line bg-white shadow-sm">
            <UserCircle size={22} />
          </Link>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-white/70 bg-white/94 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-16px_34px_rgba(15,23,42,0.07)] backdrop-blur lg:hidden">
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
              {active && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-[#16A34A]/70" />}
              <Icon size={19} strokeWidth={active ? 2 : 1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
