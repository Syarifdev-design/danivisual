import { MessageCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ADMIN_WHATSAPP } from "../data/bookingData";

export default function DashboardHeader() {
  const { user } = useAuth();

  return (
    <header className="hidden border-b border-white/70 bg-white/88 px-6 py-4 shadow-[0_10px_34px_rgba(15,23,42,0.035)] backdrop-blur lg:fixed lg:left-60 lg:right-0 lg:top-0 lg:z-40 lg:block">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-secondary">Private client portal</p>
          <h1 className="mt-0.5 text-[28px] leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome, {user?.name || "Customer"}
          </h1>
        </div>
        <a
          href={`https://wa.me/${ADMIN_WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="premium-button-secondary inline-flex min-h-10 items-center gap-2 px-4 text-sm text-foreground-secondary"
        >
          <MessageCircle size={16} />
          Chat Admin
        </a>
      </div>
    </header>
  );
}
