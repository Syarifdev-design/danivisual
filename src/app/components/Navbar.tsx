import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, CircleHelp, Home, Images, Info, Menu, Phone, UserRound, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import BrandLogo from "./BrandLogo";
import { mediaAssets } from "../data/mediaAssets";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { getField, getImage } = useContent();
  const isHomeHero = location.pathname === "/" && !hasScrolled && !mobileMenuOpen;

  const navLinks = [
    { label: getField("navigation", "main-menu", "home", t({ ID: "Beranda", EN: "Home" })), path: "/", icon: Home },
    { label: getField("navigation", "main-menu", "portfolio", t({ ID: "Portofolio", EN: "Portfolio" })), path: "/portfolio", icon: Images },
    { label: getField("navigation", "main-menu", "services", t({ ID: "Layanan", EN: "Services" })), path: "/services", icon: BriefcaseBusiness },
    { label: getField("navigation", "main-menu", "about", t({ ID: "Tentang", EN: "About" })), path: "/about", icon: Info },
    { label: getField("navigation", "main-menu", "faq", "FAQ"), path: "/faq", icon: CircleHelp },
    { label: getField("navigation", "main-menu", "contact", t({ ID: "Kontak", EN: "Contact" })), path: "/contact", icon: Phone },
  ];
  const bookingLabel = getField("navigation", "actions", "reserve", t({ ID: "Reservasi", EN: "Reserve Date" }));
  const myBookingLabel = getField("navigation", "actions", "client-lounge", t({ ID: "Ruang Klien", EN: "Client Lounge" }));
  const loginLabel = getField("navigation", "actions", "login", "Login");
  const whatsappAdminLabel = getField("navigation", "actions", "whatsapp-admin", "WhatsApp Admin");
  const whatsappUrl = getField("contact", "details", "whatsapp_url", "https://wa.me/6282337279636");
  const authenticatedPath = user?.role === "admin" ? "/admin" : "/dashboard/my-booking";

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
                to={authenticatedPath}
                translate="no"
                className={`notranslate whitespace-nowrap text-[13px] px-4 py-2.5 border transition-all rounded-sm xl:px-6 xl:text-sm ${
                  isHomeHero
                    ? "border-white/60 text-white hover:bg-white/10 drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)]"
                    : "border-premium-beige text-foreground hover:bg-premium-beige/10"
                }`}
              >
                {user?.role === "admin" ? "Admin Panel" : myBookingLabel}
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
                {loginLabel}
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
                {[...navLinks, { label: isAuthenticated ? (user?.role === "admin" ? "Admin Panel" : myBookingLabel) : loginLabel, path: isAuthenticated ? authenticatedPath : "/login", icon: UserRound }].map((link, index) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);

                  return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    translate="no"
                    className={`mobile-nav-card group relative flex min-h-11 items-center gap-3 overflow-hidden border px-4 py-2.5 transition ${
                      active
                        ? "is-active border-premium-beige bg-background-soft"
                        : "border-border-line hover:bg-background-soft"
                    }`}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <span className="mobile-nav-card-accent" />
                    <span className="mobile-nav-icon flex h-7 w-7 shrink-0 items-center justify-center border border-premium-beige/45 bg-white text-premium-beige transition group-hover:border-premium-beige">
                      <Icon size={14} strokeWidth={1.7} />
                    </span>
                    <span className="notranslate relative z-10 font-medium leading-none text-[15px] tracking-wide sm:text-base" style={{ fontFamily: "var(--font-body)" }}>
                      {link.label}
                    </span>
                  </Link>
                  );
                })}
              </div>

              <div className="mt-5 hidden overflow-hidden border border-border-line min-h-[640px]:block">
                <img
                  src={getImage("navigation_mobile_menu_image", mediaAssets.ui.menu)}
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
                href={whatsappUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center justify-center border border-border-line bg-white px-6 py-3 text-sm text-foreground"
              >
                {whatsappAdminLabel}
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
