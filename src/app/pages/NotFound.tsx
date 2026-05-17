import { Link } from "react-router";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-8xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          404
        </h1>
        <p className="text-foreground-secondary mb-8">Halaman yang Anda cari tidak ditemukan.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
