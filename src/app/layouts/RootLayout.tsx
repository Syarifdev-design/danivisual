import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingWhatsApp from "../components/FloatingWhatsApp";
import PromoPopup from "../components/PromoPopup";
import { mediaAssets } from "../data/mediaAssets";

const PROMO_SESSION_KEY = "danivisual_promo_seen_this_session";

const promoContent = {
  label: "PROMO TERBATAS",
  title: "Abadikan Momen Terbaik Anda Bersama Danivisual",
  subtitle: "Nikmati penawaran khusus untuk booking wedding, prewedding, studio, atau event bulan ini.",
  image: mediaAssets.ui.promo,
  benefits: [
    "Konsultasi konsep gratis",
    "H+2 highlight photos",
    "Akses private client portal",
    "Pilihan album premium",
  ],
  primaryButtonText: "Booking Sekarang",
  primaryButtonUrl: "/packages",
  secondaryButtonText: "Lihat Paket",
  secondaryButtonUrl: "/packages",
  note: "Slot terbatas. Jadwal booking dikonfirmasi setelah DP diverifikasi.",
};

export default function RootLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  const shouldAllowPromoPopup = useMemo(() => {
    const excludedPrefixes = [
      "/login",
      "/checkout",
      "/review",
      "/booking-review",
      "/booking-success",
      "/customer",
      "/my-booking",
      "/progress",
      "/dashboard",
    ];

    if (excludedPrefixes.some((path) => location.pathname.startsWith(path))) {
      return false;
    }

    const allowedRoutes = ["/", "/home", "/portfolio", "/services", "/about", "/faq", "/contact", "/booking", "/packages"];
    return allowedRoutes.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  }, [location.pathname]);

  useEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload") {
      sessionStorage.removeItem(PROMO_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (!shouldAllowPromoPopup) {
      setShowPromoPopup(false);
      return;
    }

    if (sessionStorage.getItem(PROMO_SESSION_KEY) === "true") {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowPromoPopup(true);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [shouldAllowPromoPopup, location.pathname]);

  const closePromoPopup = () => {
    sessionStorage.setItem(PROMO_SESSION_KEY, "true");
    setShowPromoPopup(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isLoginPage && <Footer />}
      {!isLoginPage && <FloatingWhatsApp />}
      <PromoPopup isOpen={showPromoPopup} onClose={closePromoPopup} {...promoContent} />
    </div>
  );
}
