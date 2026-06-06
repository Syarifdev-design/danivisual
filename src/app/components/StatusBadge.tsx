type BadgeVariant = "waiting" | "finishing" | "delivery" | "success" | "action-required" | "locked";

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export default function StatusBadge({ variant, children }: StatusBadgeProps) {
  const variants = {
    waiting: "border-[#d8c7a3] bg-[#fff8ec] text-[#8b6f3f] shadow-[0_8px_20px_rgba(139,111,63,0.08)]",
    finishing: "border-[#c8a96d] bg-[#111111] text-[#f2d9a6] shadow-[0_10px_24px_rgba(17,17,17,0.14)]",
    delivery: "border-[#b7c6a5] bg-[#f4f6ef] text-[#65704d] shadow-[0_8px_20px_rgba(101,112,77,0.08)]",
    success: "border-[#9fcfb8] bg-[#effaf5] text-[#087653] shadow-[0_8px_20px_rgba(8,118,83,0.08)]",
    "action-required": "border-[#d4b06f] bg-[#fff4dc] text-[#7f6130] shadow-[0_8px_20px_rgba(127,97,48,0.08)]",
    locked: "border-[#cfc6b8] bg-[#f6f1ea] text-[#6e665e] shadow-[0_8px_20px_rgba(38,28,16,0.06)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold leading-4 sm:px-3 sm:py-1 sm:text-[11px] sm:leading-5 ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
