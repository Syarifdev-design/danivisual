import type { ReactNode } from "react";

export default function AdminFormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden border border-border-line bg-white p-5 lg:p-7">
      <div className="mb-6 max-w-2xl">
        {eyebrow && <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-premium-beige">{eyebrow}</p>}
        <h2 className="text-2xl leading-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{description}</p>}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}
