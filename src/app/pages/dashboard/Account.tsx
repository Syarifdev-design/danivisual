import { MessageCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useBooking } from "../../contexts/BookingContext";
import { ADMIN_WHATSAPP } from "../../data/bookingData";
import StatusBadge from "../../components/StatusBadge";

export default function Account() {
  const { user, logout } = useAuth();
  const booking = useBooking();
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 lg:mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.24em] text-foreground-secondary">Account</p>
        <h1 className="text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
          Client Profile
        </h1>
        <p className="mt-3 text-foreground-secondary">
          Informasi akun customer dan akses bantuan admin.
        </p>
      </div>

      <section className="rounded-[22px] border border-border-line bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.04)] lg:rounded-none">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-soft text-xl font-medium text-foreground">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              {user?.name || "Customer"}
            </h2>
            <p className="text-sm text-foreground-secondary">{user?.username || "danivisual"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Info label="WhatsApp" value={user?.whatsapp || booking.eventData.whatsapp || "-"} />
          <Info label="Email" value={booking.eventData.email || "-"} />
          <Info label="Order number" value={booking.orderNumber || "#DV-260718-001"} />
          <div className="flex items-center justify-between border-b border-border-line pb-3 text-sm">
            <span className="text-foreground-secondary">Booking status</span>
            <StatusBadge variant="finishing">Waiting DP Verification</StatusBadge>
          </div>
        </div>

        <div className="mt-7 grid gap-3">
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-dark-premium px-5 py-3 text-sm text-white lg:rounded-none"
          >
            <MessageCircle size={17} /> Chat Admin
          </a>
          <button
            onClick={handleLogout}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border-line px-5 py-3 text-sm text-foreground lg:rounded-none"
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
    <div className="flex items-center justify-between gap-5 border-b border-border-line pb-3 text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  );
}
