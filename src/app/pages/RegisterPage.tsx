import { Link } from "react-router";
import { MessageCircle } from "lucide-react";
import { mediaAssets } from "../data/mediaAssets";

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left - Image */}
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src={mediaAssets.wedding.couplePortrait}
          alt="Prewedding"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dark-premium/40 to-dark-premium/20" />
      </div>

      {/* Right - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="mb-12">
            <Link to="/" className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Danivisual
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              Create Your Account
            </h1>
            <p className="text-sm text-foreground-secondary">
              Daftar untuk mulai memilih paket dan mengelola kebutuhan dokumentasi acara Anda.
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Nama lengkap"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Nomor WhatsApp</label>
              <input
                type="text"
                placeholder="+62 812 3456 7890"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Konfirmasi Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Service Interest</label>
              <div className="grid grid-cols-2 gap-2">
                {["Wedding", "Prewed Studio", "Prewed Outdoor", "Event"].map((service) => (
                  <label key={service} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span className="text-foreground-secondary">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
            >
              Register
            </button>

            <button
              type="button"
              className="w-full px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Register with WhatsApp OTP
            </button>
          </form>

          <div className="mt-6 p-4 bg-warning-soft border border-premium-beige/30 rounded-sm">
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Pastikan nomor WhatsApp aktif karena akan digunakan untuk konfirmasi booking dan
              komunikasi dengan admin.
            </p>
          </div>

          <p className="text-sm text-foreground-secondary text-center mt-8">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-foreground hover:text-premium-beige transition">
              Login sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
