import type { ReactNode } from "react";

export default function AdminStatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
}) {
  return (
    <article className="border border-border-line bg-white p-5 shadow-[0_14px_36px_rgba(38,28,16,0.035)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-secondary">{label}</p>
        {icon && <span className="flex h-9 w-9 items-center justify-center border border-premium-beige/35 bg-premium-beige/10 text-premium-beige">{icon}</span>}
      </div>
      <p className="text-3xl leading-none text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
        {value}
      </p>
      {helper && <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{helper}</p>}
    </article>
  );
}
