import { Link, useNavigate } from "react-router";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import BrandLogo from "../components/BrandLogo";
import { mediaAssets } from "../data/mediaAssets";
import { useContent } from "../contexts/ContentContext";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { UserRole } from "../contexts/AuthContext";

// Role-based redirect helper
const getRedirectPathByRole = (role: UserRole): string => {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";
    case "finance":
      return "/admin/finance";
    case "editor":
    case "photographer":
    case "videographer":
      return "/admin/production";
    case "staff":
      return "/admin/my-kpi";
    case "customer":
      return "/dashboard";
    default:
      return "/login";
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const { getImage } = useContent();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDev = import.meta.env.DEV;
  const isSupabaseReady = isSupabaseConfigured();
  const isLoginDisabled = isSubmitting || isLoading || (!isDev && !isSupabaseReady);

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPathByRole(user.role);

      // Debug logging (DEV only)
      if (isDev) {
        console.log("[LOGIN REDIRECT]", {
          email: user.email,
          role: user.role,
          redirectPath,
        });
      }

      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, isDev]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(identifier, password);

    if (!result.success) {
      setError(result.error || "Login gagal");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <img
        src={getImage("login_background_image", mediaAssets.ui.login)}
        alt="Wedding editorial"
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[3px]"
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-white/20" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-premium-beige/70 bg-white/92 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-md sm:p-9">
        <Link to="/" className="mb-9 flex justify-center">
          <BrandLogo imageClassName="h-10" />
        </Link>

        <div className="mb-7 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-foreground-secondary">Client portal</p>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Welcome Back</h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            Masuk untuk melihat booking, progress project, atau mengelola konten website.
          </p>
        </div>

        {error && (
          <div className="mb-5 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Production Mode Notice */}
        {isSupabaseReady && (
          <div className="mb-5 rounded-lg border border-border-line bg-background-soft p-3 text-xs text-foreground-secondary">
            Gunakan email dan password yang terdaftar untuk login.
          </div>
        )}

        {/* Dev Mode Notice */}
        {isDev && !isSupabaseReady && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Development Mode: Supabase belum dikonfigurasi. Gunakan akun demo untuk testing.
          </div>
        )}

        {!isDev && !isSupabaseReady && (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            Supabase belum dikonfigurasi. Login production tidak tersedia.
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm">{isDev ? "Email / Username" : "Email"}</label>
            <input
              type={isDev ? "text" : "email"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={isDev ? "admin atau danivisual" : "email@example.com"}
              className="min-h-[50px] w-full rounded-xl border border-border-line bg-white px-4 py-3 text-sm outline-none focus:border-premium-beige"
              required
              disabled={isLoginDisabled}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="min-h-[50px] w-full rounded-xl border border-border-line bg-white px-4 py-3 text-sm outline-none focus:border-premium-beige"
              required
              disabled={isLoginDisabled}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" disabled={isLoginDisabled} />
              <span className="text-foreground-secondary">Remember me</span>
            </label>
            {isSupabaseReady && (
              <a
                href="https://wa.me/6282337279636"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-secondary hover:text-foreground"
              >
                Forgot Password
              </a>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoginDisabled}
            className="min-h-[50px] w-full rounded-xl bg-dark-premium px-6 py-3 text-sm text-white transition hover:bg-dark-premium/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Logging in...
              </span>
            ) : isDev && !isSupabaseReady ? (
              "Login Demo"
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Demo Accounts - Only show in development mode */}
        {isDev && (
          <div className="mt-5 rounded-xl border border-border-line bg-white/70 px-3 py-3 text-xs text-foreground-secondary">
            <p className="font-semibold text-foreground">Demo accounts</p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {[
                "superadmin@danivisual.test",
                "admin@danivisual.test",
                "finance@danivisual.test",
                "editor@danivisual.test",
                "photographer@danivisual.test",
                "videographer@danivisual.test",
                "staff@danivisual.test",
                "customer@danivisual.test",
              ].map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => {
                    setIdentifier(email);
                    setPassword("Test123456");
                  }}
                  className="truncate rounded-lg px-2 py-1 text-left hover:bg-premium-beige/10"
                >
                  {email}
                </button>
              ))}
            </div>
            <p className="mt-2">Password: Test123456</p>
          </div>
        )}

        <p className="mt-6 border-t border-border-line pt-5 text-center text-xs leading-relaxed text-foreground-secondary">
          Akun customer diberikan setelah booking dan pembayaran DP diverifikasi.
          <br />
          Need help?{" "}
          <a
            href="https://wa.me/6282337279636"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-premium-beige"
          >
            Chat Admin
          </a>
        </p>
      </div>
    </div>
  );
}
