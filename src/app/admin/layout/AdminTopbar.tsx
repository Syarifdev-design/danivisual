import { Bell, LogOut, Search } from "lucide-react";
import { Link } from "react-router";

export default function AdminTopbar({
  title,
  onLogout,
}: {
  title: string;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border-line bg-white/92 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-5 pl-16 lg:px-8 lg:pl-8">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-premium-beige">Admin Panel</p>
          <h2 className="mt-1 truncate text-lg font-medium text-foreground">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden min-h-10 items-center gap-2 border border-border-line bg-background-soft px-3 text-sm text-foreground-secondary md:flex">
            <Search size={15} />
            <span className="w-40">Search content...</span>
          </div>
          <button type="button" className="flex h-10 w-10 items-center justify-center border border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground" aria-label="Notifications">
            <Bell size={17} />
          </button>
          <Link to="/" className="hidden min-h-10 items-center border border-border-line bg-white px-4 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground sm:inline-flex">
            Website
          </Link>
          {onLogout && (
            <button type="button" onClick={onLogout} className="inline-flex min-h-10 items-center gap-2 bg-dark-premium px-4 text-sm text-white transition hover:bg-dark-premium/90">
              <LogOut size={15} /> Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
