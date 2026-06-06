import { MessageCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useBooking } from "../../contexts/BookingContext";
import { useContent } from "../../contexts/ContentContext";
import { ADMIN_WHATSAPP } from "../../data/bookingData";
import StatusBadge from "../../components/StatusBadge";

export default function Account() {
  const { user, logout } = useAuth();
  const booking = useBooking();
  const { getField } = useContent();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = (user?.name || "Customer")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-5 lg:mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.24em] text-foreground-secondary">
          {getField("dashboard", "account", "eyebrow", "Account")}
        </p>
        <h1 className="text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
          {getField("dashboard", "account", "title", "Client Profile")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary lg:mt-3 lg:text-base">
          {getField("dashboard", "account", "description", "Informasi akun customer dan akses bantuan admin.")}
        </p>
      </div>

      <section className="account-profile-card rounded-xl border border-border-line bg-white p-3 shadow-[0_10px_26px_rgba(38,28,16,0.035)] lg:rounded-none lg:p-6 lg:shadow-[0_18px_50px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-3 lg:mb-6 lg:gap-4">
          <div className="account-avatar flex h-12 w-12 items-center justify-center rounded-full text-base font-medium lg:h-16 lg:w-16 lg:text-xl">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl leading-tight lg:text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              {user?.name || "Customer"}
            </h2>
            <p className="text-xs text-foreground-secondary lg:text-sm">{user?.username || "danivisual"}</p>
          </div>
        </div>

        <div className="space-y-2 lg:space-y-3">
          <Info label="WhatsApp" value={user?.whatsapp || booking.eventData.whatsapp || "-"} />
          <Info label="Email" value={booking.eventData.email || "-"} />
          <Info label="Order number" value={booking.orderNumber || "#DV-260718-001"} />
          <div className="flex items-center justify-between gap-3 border-b border-border-line pb-2 text-xs lg:gap-5 lg:pb-3 lg:text-sm">
            <span className="text-foreground-secondary">Booking status</span>
            <StatusBadge variant="finishing">Waiting DP Verification</StatusBadge>
          </div>
        </div>

        <div className="mt-4 grid gap-2 lg:mt-7 lg:gap-3">
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-dark-premium px-3 py-2 text-xs text-white lg:min-h-[52px] lg:rounded-none lg:px-5 lg:text-sm"
          >
            <MessageCircle size={17} /> Chat Admin
          </a>
          <button
            onClick={handleLogout}
            className="account-secondary-action inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border-line px-3 py-2 text-xs text-foreground lg:min-h-[52px] lg:rounded-none lg:px-5 lg:text-sm"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-line pb-2 text-xs lg:gap-5 lg:pb-3 lg:text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  );
}
