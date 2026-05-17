import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { Link } from "react-router";
import promoAnimationVideo from "../../../asset/257526.webm";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-4">
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
        className={`relative z-10 grid max-h-[92vh] w-[92vw] max-w-[860px] overflow-y-auto rounded-[18px] border border-[rgba(190,160,110,0.35)] bg-[#fbf8f3] shadow-[0_34px_120px_rgba(22,16,10,0.34)] md:h-[min(690px,88vh)] md:grid-cols-[0.92fr_1fr] md:overflow-hidden lg:max-w-[900px] ${
          isClosing ? "animate-[promoModalOut_260ms_ease-in_forwards]" : "animate-[promoModalIn_520ms_cubic-bezier(.16,1,.3,1)_forwards]"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close promotional popup"
          onClick={requestClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 text-foreground shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-premium-beige md:border-[rgba(190,160,110,0.35)]"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[240px] overflow-hidden md:min-h-0">
          <img
            src={image}
            alt="Danivisual promotional campaign"
            className="promo-image-zoom h-full w-full object-cover object-center"
          />
          <video
            className="promo-image-video pointer-events-none absolute inset-0 h-full w-full object-cover"
            src={promoAnimationVideo}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.16)_100%)]" />
        </div>

        <div className="flex max-h-[92vh] flex-col overflow-y-auto border-l border-[rgba(190,160,110,0.24)] bg-[linear-gradient(145deg,#fffaf3_0%,#fbf8f3_48%,#f7f1e8_100%)] p-5 sm:p-6 md:max-h-none md:overflow-hidden md:p-7 lg:p-8">
          <p className="promo-stagger promo-luxury-label mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-[#a98d5d]">
            {label}
          </p>
          <h2
            id="promo-popup-title"
            className="promo-stagger mb-3 max-w-[12.5ch] text-[clamp(1.95rem,3.55vw,3.08rem)] leading-[0.98] tracking-[-0.025em] text-[#17130f]"
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
          <p className="promo-stagger mb-4 max-w-[34rem] border-l border-[rgba(190,160,110,0.42)] pl-4 text-sm leading-6 text-[#6d6258] sm:text-[0.9rem]">
            {subtitle}
          </p>

          <ul className="mb-4 grid gap-2">
            {benefits.map((benefit, index) => (
              <li
                key={benefit}
                className="promo-stagger flex items-center gap-3 border-b border-[rgba(190,160,110,0.18)] pb-2 text-sm text-[#5f574f]"
                style={{ animationDelay: `${210 + index * 55}ms` }}
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[rgba(190,160,110,0.55)] bg-white/45 text-[#a98d5d]">
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
              className="promo-primary-cta block min-h-[48px] w-full overflow-hidden rounded-[12px] bg-[linear-gradient(135deg,#050505_0%,#211b15_54%,#050505_100%)] px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_34px_rgba(5,5,5,0.22)] transition focus:outline-none focus:ring-2 focus:ring-premium-beige"
            >
              {primaryButtonText}
            </Link>
            <Link
              to={secondaryButtonUrl}
              onClick={requestClose}
              className="block min-h-[46px] w-full rounded-[12px] border border-[rgba(190,160,110,0.42)] bg-white/35 px-5 py-2.5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#2a241e] transition hover:bg-[#d8c7a3]/10 focus:outline-none focus:ring-2 focus:ring-premium-beige"
            >
              {secondaryButtonText}
            </Link>
            <button
              type="button"
              onClick={requestClose}
              className="block min-h-8 w-full px-5 py-1 text-center text-xs font-medium text-[#8a8178] transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-premium-beige"
            >
              Mungkin nanti
            </button>
          </div>

          <p className="promo-stagger mt-3 border-t border-[rgba(190,160,110,0.32)] pt-2.5 text-xs leading-relaxed text-[#7d7369]" style={{ animationDelay: "540ms" }}>
            {note}
          </p>
        </div>
      </div>
    </div>
  );
}
