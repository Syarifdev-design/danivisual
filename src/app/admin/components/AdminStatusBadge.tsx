import type { ReactNode } from "react";

type AdminStatusBadgeTone = "neutral" | "gold" | "success" | "warning" | "danger";

const toneClass: Record<AdminStatusBadgeTone, string> = {
  neutral: "border-border-line bg-white text-foreground-secondary",
  gold: "border-premium-beige/45 bg-premium-beige/10 text-[#7f6130]",
  success: "border-[#c9dfcf] bg-success-soft text-[#2f6b43]",
  warning: "border-[#ead5b7] bg-warning-soft text-[#805d2d]",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
};

export default function AdminStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: AdminStatusBadgeTone;
}) {
  return (
    <span className={`inline-flex min-h-7 items-center border px-3 text-[11px] font-medium uppercase tracking-[0.14em] ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
