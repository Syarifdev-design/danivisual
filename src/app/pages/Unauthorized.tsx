import { Link } from "react-router";
import { ShieldAlert, ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth, ROLE_LABELS } from "../contexts/AuthContext";
import BrandLogo from "../components/BrandLogo";

interface UnauthorizedPageProps {
  requiredRole?: string;
  message?: string;
}

export default function UnauthorizedPage({
  requiredRole,
  message,
}: UnauthorizedPageProps) {
  const { user, logout } = useAuth();

  const currentRole = user?.role ? ROLE_LABELS[user.role] : "Unknown";
  const defaultMessage = requiredRole
    ? `Halaman ini hanya untuk ${requiredRole}.`
    : "Anda tidak memiliki akses ke halaman ini.";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-premium-beige/10" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border-line bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.1)]">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <BrandLogo imageClassName="h-8" />
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Akses Ditolak
        </h1>

        {/* Message */}
        <p className="mb-6 text-sm leading-relaxed text-foreground-secondary">
          {message || defaultMessage}
        </p>

        {/* User Info */}
        <div className="mb-6 rounded-xl border border-border-line bg-background-soft p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground-secondary">
            Status Anda saat ini
          </p>
          <p className="mt-1 text-lg font-semibold">
            {currentRole}
          </p>
          {user?.name && (
            <p className="mt-1 text-sm text-foreground-secondary">
              {user.name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Go Back Button */}
          <button
            onClick={() => window.history.back()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-line bg-white px-6 py-3 text-sm font-medium text-foreground transition hover:border-premium-beige hover:text-foreground"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>

          {/* Go to Home Button */}
          <Link
            to="/"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-line bg-white px-6 py-3 text-sm font-medium text-foreground transition hover:border-premium-beige hover:text-foreground"
          >
            Halaman Utama
          </Link>

          {/* Contact Admin */}
          <a
            href="https://wa.me/6282337279636"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            <MessageCircle size={18} />
            Hubungi Admin
          </a>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-dark-premium px-6 py-3 text-sm font-medium text-white transition hover:bg-dark-premium/90"
          >
            Login dengan Akun Lain
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-xs text-foreground-secondary">
          Jika Anda merasa ini adalah kesalahan, silakan hubungi tim Danivisual untuk bantuan.
        </p>
      </div>
    </div>
  );
}