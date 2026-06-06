import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCustomer } from "../../contexts/CustomerContext";
import { useContent } from "../../contexts/ContentContext";

/**
 * Customer Portal Login Page
 *
 * SECURITY FIX (2026-06-05):
 * - Phone-only login is DISABLED in production builds.
 * - This page is replaced by a "portal disabled" message in production.
 * - Customer portal requires proper auth (Supabase Auth or OTP) before public release.
 *
 * To re-enable client portal:
 *1. Implement Supabase Auth email/password for customers, OR
 * 2. Implement OTP WhatsApp verification via Edge Function
 * 3. Set VITE_CLIENT_PORTAL_ENABLED=true in production .env
 * 4. Remove the CLIENT_PORTAL_DISABLED guard below
 */

const CLIENT_PORTAL_ENABLED =
  !import.meta.env.PROD || import.meta.env.VITE_CLIENT_PORTAL_ENABLED === "true";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useCustomer();
  const { getField } = useContent();
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");

  // =============================================================================
  // PRODUCTION GUARD: Disable phone-only login for public release
  // =============================================================================
  if (!CLIENT_PORTAL_ENABLED) {
    return (
      <div className="min-h-screen bg-background-soft px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-premium-beige">
              Client Portal
            </p>
            <h1 className="text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
              Portal Klien
            </h1>
          </div>

          <div className="rounded-xl border border-premium-beige/30 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-premium-beige/10">
              <svg
                className="h-7 w-7 text-premium-beige"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007.007"
                />
              </svg>
            </div>

            <h2 className="mb-3 text-xl font-semibold">
              Portal Klien Sedang Dikonfigurasi
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-foreground-secondary">
              Client Portal sedang dalam tahap aktivasi. Untuk saat ini, silakan
              hubungi tim Danivisual melalui WhatsApp untuk mengecek status
              booking Anda.
</p>

            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-dark-premium px-6 text-sm font-medium text-white transition hover:bg-dark-premium/90"
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.47214.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.1951.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.1221.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.1421.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hubungi via WhatsApp
            </a>

            <p className="text-xs text-foreground-secondary">
              Kembali ke{" "}
              <Link to="/" className="text-premium-beige underline">
                halaman utama
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // DEV / INTERNAL ONLY: Phone-only login (NOT for production)
  // =============================================================================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setLocalError("Masukkan nomor WhatsApp Anda");
      return;
    }

    const success = await login(cleanPhone);
    if (success) {
      navigate("/dashboard");
    } else {
      setLocalError(
        "Booking tidak ditemukan. Pastikan nomor WhatsApp yang Anda masukkan benar."
      );
    }
  };

  return (
    <div className="min-h-screen bg-background-soft px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-premium-beige">
            {getField("dashboard", "login", "eyebrow", "Client Portal")}
          </p>
          <h1 className="text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            {getField("dashboard", "login", "title", "Masuk Client Portal")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
            {getField(
              "dashboard",
              "login",
              "description",
              "Masukkan nomor WhatsApp yang terdaftar saat booking untuk melihat status dan detail booking Anda."
            )}
          </p>
        </div>

        {/* DEV warning banner */}
        {import.meta.env.DEV && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>⚠️ Development Only:</strong> Phone-only login aktif di
            environment ini. Di production, portal ini akan dinonaktifkan.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="min-h-12 w-full rounded-xl border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige lg:rounded-lg"
            />
          </div>

          {(localError || error) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-12 w-full rounded-xl bg-dark-premium px-6 text-sm font-medium text-white transition hover:bg-dark-premium/90 disabled:opacity-50 lg:rounded-lg"
          >
            {isLoading ? "Memuat..." : "Lihat Booking Saya"}
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-border-line bg-white p-5">
          <h3 className="mb-3 text-sm font-medium">Butuh bantuan?</h3>
          <p className="mb-4 text-xs text-foreground-secondary">
            Hubungi admin jika tidak ingat nomor booking atau mengalami kesulitan
            login.
          </p>
          <Link
            to="/dashboard/help"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border-line bg-white px-4 py-2 text-xs"
          >
            Chat Admin
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-foreground-secondary">
            Kembali ke{" "}
            <Link to="/" className="text-premium-beige underline">
              halaman utama
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
