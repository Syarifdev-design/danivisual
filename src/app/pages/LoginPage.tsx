import { Link, useNavigate } from "react-router";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import BrandLogo from "../components/BrandLogo";
import { mediaAssets } from "../data/mediaAssets";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("danivisual");
  const [password, setPassword] = useState("client");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (login(username, password)) {
      navigate("/dashboard");
      return;
    }

    setError("Username atau password belum sesuai. Untuk demo gunakan danivisual / client.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <img
        src={mediaAssets.ui.login}
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
            Masuk untuk melihat booking dan progress project Anda.
          </p>
        </div>

        {error && (
          <div className="mb-5 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm">Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="min-h-[50px] w-full rounded-xl border border-border-line bg-white px-4 py-3 text-sm outline-none focus:border-premium-beige"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-[50px] w-full rounded-xl border border-border-line bg-white px-4 py-3 text-sm outline-none focus:border-premium-beige"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-foreground-secondary">Remember me</span>
            </label>
            <a href="https://wa.me/62xxxxxxxxxxx" className="text-foreground-secondary hover:text-foreground">
              Forgot Password
            </a>
          </div>

          <button className="min-h-[50px] w-full rounded-xl bg-dark-premium px-6 py-3 text-sm text-white transition hover:bg-dark-premium/90">
            Login
          </button>
        </form>

        <p className="mt-6 border-t border-border-line pt-5 text-center text-xs leading-relaxed text-foreground-secondary">
          Akun customer diberikan setelah booking dan pembayaran DP diverifikasi.
          <br />
          Need help? <a href="https://wa.me/62xxxxxxxxxxx" className="text-foreground">Chat Admin</a>
        </p>
      </div>
    </div>
  );
}
