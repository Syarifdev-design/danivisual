import type { ReactNode } from "react";

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-border-line pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-premium-beige">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl leading-tight text-foreground lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary lg:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
