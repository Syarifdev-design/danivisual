import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, CircleHelp, Home, Images, Info, Menu, Phone, UserRound, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import BrandLogo from "./BrandLogo";
import { LANGUAGE_CHANGE_EVENT } from "./FloatingWhatsApp";
import { mediaAssets } from "../data/mediaAssets";

const LANGUAGE_STORAGE_KEY = "danivisual_language";

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [language, setLanguage] = useState<"ID" | "EN">(
    () => (localStorage.getItem(LANGUAGE_STORAGE_KEY) as "ID" | "EN") || "ID"
  );
  const { isAuthenticated } = useAuth();
  const isHomeHero = location.pathname === "/" && !hasScrolled && !mobileMenuOpen;

  const navLinks = [
    { label: language === "ID" ? "Beranda" : "Home", path: "/", icon: Home },
    { label: language === "ID" ? "Portofolio" : "Portfolio", path: "/portfolio", icon: Images },
    { label: language === "ID" ? "Layanan" : "Services", path: "/services", icon: BriefcaseBusiness },
    { label: language === "ID" ? "Tentang" : "About", path: "/about", icon: Info },
    { label: "FAQ", path: "/faq", icon: CircleHelp },
    { label: language === "ID" ? "Kontak" : "Contact", path: "/contact", icon: Phone },
  ];
  const bookingLabel = language === "ID" ? "Booking" : "Book Now";
  const myBookingLabel = language === "ID" ? "Booking Saya" : "My Booking";

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const syncLanguage = (event?: Event) => {
      const customEvent = event as CustomEvent<"ID" | "EN">;
      const nextLanguage = customEvent?.detail || (localStorage.getItem(LANGUAGE_STORAGE_KEY) as "ID" | "EN") || "ID";
      setLanguage(nextLanguage);
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  return (
    <nav
      className={`sticky top-0 transition-all duration-300 ${mobileMenuOpen ? "z-[120]" : "z-50"} ${
        isHomeHero
          ? "bg-transparent border-transparent -mb-20 text-white"
          : "bg-white/95 backdrop-blur-sm border-b border-border-line text-foreground"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-[72px] lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center">
            <BrandLogo inverted={isHomeHero} imageClassName="w-[148px] max-w-[58vw] sm:w-[168px] lg:w-[176px]" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                translate="no"
                className={`notranslate whitespace-nowrap text-[13px] tracking-wide transition-all relative group xl:text-sm ${
                  isHomeHero
                    ? isActive(link.path)
                      ? "text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)]"
                      : "text-white/78 hover:text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)]"
                    : isActive(link.path)
                    ? "text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <span className="notranslate">{link.label}</span>
                <span
                  className={`absolute -bottom-1 left-0 h-[1px] transition-all ${
                    isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                  } ${isHomeHero ? "bg-soft-gold" : "bg-premium-beige"}`}
                />
              </Link>
            ))}
            <Link
              to="/packages"
              translate="no"
              className={`notranslate whitespace-nowrap text-[13px] px-4 py-2.5 transition-all rounded-sm xl:px-6 xl:text-sm ${
                isHomeHero
                  ? "bg-white text-foreground hover:bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                  : "bg-dark-premium text-white hover:bg-dark-premium/90"
              }`}
            >
              {bookingLabel}
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard/my-booking"
                translate="no"
                className={`notranslate whitespace-nowrap text-[13px] px-4 py-2.5 border transition-all rounded-sm xl:px-6 xl:text-sm ${
                  isHomeHero
                    ? "border-white/60 text-white hover:bg-white/10 drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)]"
                    : "border-premium-beige text-foreground hover:bg-premium-beige/10"
                }`}
              >
                {myBookingLabel}
              </Link>
            ) : (
              <Link
                to="/login"
                translate="no"
                className={`notranslate whitespace-nowrap text-[13px] px-4 py-2.5 border transition-all rounded-sm xl:px-6 xl:text-sm ${
                  isHomeHero
                    ? "border-white/60 text-white hover:bg-white/10 drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)]"
                    : "border-premium-beige text-foreground hover:bg-premium-beige/10"
                }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden flex h-10 w-10 shrink-0 items-center justify-center border transition sm:h-11 sm:w-11 ${
              isHomeHero ? "border-white/40 text-white" : "border-border-line text-foreground"
            }`}
            aria-label="Open navigation menu"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white text-foreground lg:hidden">
          <div className="relative flex h-[100svh] flex-col bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-border-line px-5 py-3 sm:px-6">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex min-w-0 items-center">
                <BrandLogo imageClassName="w-[132px] max-w-[54vw] sm:w-[152px]" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-border-line"
                aria-label="Close navigation menu"
              >
                <X size={19} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
                {[...navLinks, { label: isAuthenticated ? myBookingLabel : "Login", path: isAuthenticated ? "/dashboard/my-booking" : "/login", icon: UserRound }].map((link) => {
                  const Icon = link.icon;

                  return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    translate="no"
                    className={`group flex min-h-11 items-center gap-3 border px-4 py-2.5 transition ${
                      isActive(link.path)
                        ? "border-premium-beige bg-background-soft"
                        : "border-border-line hover:bg-background-soft"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-premium-beige/45 bg-white text-premium-beige transition group-hover:border-premium-beige">
                      <Icon size={14} strokeWidth={1.7} />
                    </span>
                    <span className="notranslate font-medium leading-none text-[15px] tracking-wide sm:text-base" style={{ fontFamily: "var(--font-body)" }}>
                      {link.label}
                    </span>
                  </Link>
                  );
                })}
              </div>

              <div className="mt-5 hidden overflow-hidden border border-border-line min-h-[640px]:block">
                <img
                  src={mediaAssets.ui.menu}
                  alt="Danivisual editorial menu"
                  className="h-28 w-full object-cover"
                />
              </div>
            </div>

            <div className="relative z-10 grid shrink-0 grid-cols-1 gap-3 border-t border-border-line bg-white px-5 py-4 min-[560px]:grid-cols-2">
              <Link
                to="/packages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center justify-center bg-dark-premium px-6 py-3 text-sm text-white"
                translate="no"
              >
                <span className="notranslate">{bookingLabel}</span>
              </Link>
              <a
                href="https://wa.me/6282337279636"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center justify-center border border-border-line bg-white px-6 py-3 text-sm text-foreground"
              >
                WhatsApp Admin
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
