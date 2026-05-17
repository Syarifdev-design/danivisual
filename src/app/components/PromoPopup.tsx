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
    }, 220);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close promotional popup overlay"
        onClick={requestClose}
        className={`absolute inset-0 cursor-default bg-black/40 backdrop-blur-[3px] ${
          isClosing ? "animate-[promoOverlayOut_220ms_ease-in_forwards]" : "animate-[promoOverlayIn_300ms_ease-out]"
        }`}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
        className={`relative z-10 grid max-h-[90vh] w-[92vw] max-w-[860px] overflow-y-auto border border-border-line bg-white shadow-[0_28px_90px_rgba(0,0,0,0.20)] md:grid-cols-[0.95fr_1fr] md:overflow-hidden md:rounded-xl ${
          isClosing ? "animate-[promoModalOut_220ms_ease-in_forwards]" : "animate-[promoModalIn_320ms_ease-out]"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close promotional popup"
          onClick={requestClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center border border-white/60 bg-white/90 text-foreground shadow-sm transition hover:bg-white md:border-border-line"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[260px] overflow-hidden md:min-h-[560px]">
          <img src={image} alt="Danivisual promotional campaign" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        </div>

        <div className="flex flex-col p-6 sm:p-8 md:p-10">
          <div className="mb-6 h-px w-14 bg-premium-beige" />
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-foreground-secondary">{label}</p>
          <h2 id="promo-popup-title" className="mb-4 text-3xl leading-tight sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-foreground-secondary sm:text-base">{subtitle}</p>

          <ul className="mb-7 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-foreground-secondary">
                <Check size={16} className="mt-0.5 shrink-0 text-premium-beige" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto space-y-3">
            <Link
              to={primaryButtonUrl}
              onClick={requestClose}
              className="block w-full bg-dark-premium px-6 py-3 text-center text-sm text-white transition hover:bg-dark-premium/90"
            >
              {primaryButtonText}
            </Link>
            <Link
              to={secondaryButtonUrl}
              onClick={requestClose}
              className="block w-full border border-border-line px-6 py-3 text-center text-sm text-foreground transition hover:bg-background-soft"
            >
              {secondaryButtonText}
            </Link>
            <button
              type="button"
              onClick={requestClose}
              className="block min-h-10 w-full px-6 py-2 text-center text-sm text-foreground-secondary transition hover:text-foreground"
            >
              Maybe Later
            </button>
          </div>

          <p className="mt-5 border-t border-border-line pt-4 text-xs leading-relaxed text-foreground-secondary">{note}</p>
        </div>
      </div>
    </div>
  );
}
