import { MessageCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ADMIN_WHATSAPP } from "../data/bookingData";

export default function DashboardHeader() {
  const { user } = useAuth();

  return (
    <header className="hidden border-b border-border-line bg-white px-8 py-5 lg:fixed lg:left-60 lg:right-0 lg:top-0 lg:z-40 lg:block">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-foreground-secondary">Private client portal</p>
          <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome, {user?.name || "Customer"}
          </h1>
        </div>
        <a
          href={`https://wa.me/${ADMIN_WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-border-line px-4 py-2 text-sm text-foreground-secondary hover:bg-background-soft hover:text-foreground"
        >
          <MessageCircle size={16} />
          Chat Admin
        </a>
      </div>
    </header>
  );
}
