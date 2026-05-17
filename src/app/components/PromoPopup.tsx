import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { Link } from "react-router";

type PromoPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  title: string;
  subtitle: string;
  image: string;
  benefits: string[];
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  note: string;
  variant?: "light" | "editorial";
};

export default function PromoPopup({
  isOpen,
  onClose,
  label,
  title,
  subtitle,
  image,
  benefits,
  primaryButtonText,
  primaryButtonUrl,
  secondaryButtonText,
  secondaryButtonUrl,
  note,
}: PromoPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 260);
  };

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleParts = title.split("Danivisual");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close promotional popup overlay"
        onClick={requestClose}
        className={`absolute inset-0 cursor-default bg-black/55 backdrop-blur-[8px] ${
          isClosing ? "animate-[promoOverlayOut_260ms_ease-in_forwards]" : "animate-[promoOverlayIn_360ms_ease-out]"
        }`}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
        className={`relative z-10 grid max-h-[90vh] w-[92vw] max-w-[900px] overflow-y-auto rounded-[18px] border border-[rgba(190,160,110,0.35)] bg-[#fbf8f3] shadow-[0_34px_120px_rgba(22,16,10,0.34)] md:grid-cols-[0.95fr_1fr] md:overflow-hidden ${
          isClosing ? "animate-[promoModalOut_260ms_ease-in_forwards]" : "animate-[promoModalIn_520ms_cubic-bezier(.16,1,.3,1)_forwards]"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close promotional popup"
          onClick={requestClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-foreground shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-premium-beige md:border-[rgba(190,160,110,0.35)]"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[260px] overflow-hidden md:min-h-[560px]">
          <img
            src={image}
            alt="Danivisual promotional campaign"
            className="promo-image-zoom h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.20)_46%,rgba(0,0,0,0.50)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/12 to-transparent" />
          <div className="absolute bottom-6 left-6 hidden max-w-[220px] text-white md:block">
            <div className="mb-4 h-px w-12 bg-[#d8c7a3]" />
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-white/70">
              Wedding Editorial
            </p>
            <p className="mt-2 text-lg leading-6" style={{ fontFamily: "var(--font-heading)" }}>
              Crafted with calm cinematic detail.
            </p>
          </div>
        </div>

        <div className="flex flex-col border-l border-[rgba(190,160,110,0.24)] bg-[linear-gradient(145deg,#fffaf3_0%,#fbf8f3_48%,#f7f1e8_100%)] p-6 sm:p-8 md:p-10">
          <p className="promo-stagger promo-luxury-label mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#a98d5d]">
            {label}
          </p>
          <h2
            id="promo-popup-title"
            className="promo-stagger mb-4 text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] tracking-[-0.025em] text-[#17130f]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {titleParts.length > 1 ? (
              <>
                {titleParts[0]}
                <span className="text-[#9d7b3f]">Danivisual</span>
                {titleParts.slice(1).join("Danivisual")}
              </>
            ) : (
              title
            )}
          </h2>
          <p className="promo-stagger mb-6 text-sm leading-7 text-[#6d6258] sm:text-base">{subtitle}</p>

          <ul className="mb-7 space-y-3">
            {benefits.map((benefit, index) => (
              <li
                key={benefit}
                className="promo-stagger flex items-start gap-3 text-sm text-[#5f574f]"
                style={{ animationDelay: `${210 + index * 55}ms` }}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[rgba(190,160,110,0.55)] bg-white/45 text-[#a98d5d]">
                  <Check size={12} strokeWidth={1.8} />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="promo-stagger mt-auto space-y-3" style={{ animationDelay: "460ms" }}>
            <Link
              to={primaryButtonUrl}
              onClick={requestClose}
              className="promo-primary-cta block min-h-[58px] w-full overflow-hidden rounded-[12px] bg-[linear-gradient(135deg,#050505_0%,#211b15_54%,#050505_100%)] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_16px_34px_rgba(5,5,5,0.22)] transition focus:outline-none focus:ring-2 focus:ring-premium-beige"
            >
              {primaryButtonText}
            </Link>
            <Link
              to={secondaryButtonUrl}
              onClick={requestClose}
              className="block min-h-[52px] w-full rounded-[12px] border border-[rgba(190,160,110,0.42)] bg-white/35 px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#2a241e] transition hover:bg-[#d8c7a3]/10 focus:outline-none focus:ring-2 focus:ring-premium-beige"
            >
              {secondaryButtonText}
            </Link>
            <button
              type="button"
              onClick={requestClose}
              className="block min-h-10 w-full px-6 py-2 text-center text-xs font-medium text-[#8a8178] transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-premium-beige"
            >
              Mungkin nanti
            </button>
          </div>

          <p className="promo-stagger mt-5 border-t border-[rgba(190,160,110,0.32)] pt-4 text-xs leading-relaxed text-[#7d7369]" style={{ animationDelay: "540ms" }}>
            {note}
          </p>
        </div>
      </div>
    </div>
  );
}
