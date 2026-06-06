import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCustomer } from "../../contexts/CustomerContext";
import { useContent } from "../../contexts/ContentContext";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useCustomer();
  const { getField } = useContent();
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");

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
            Hubungi admin jika tidak ingat nomor booking atau mengalami kesulitan login.
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