import type { ReactNode } from "react";

export default function AdminPreviewCard({
  title,
  eyebrow,
  imageUrl,
  children,
}: {
  title: string;
  eyebrow?: string;
  imageUrl?: string;
  children?: ReactNode;
}) {
  return (
    <article className="overflow-hidden border border-border-line bg-white">
      {imageUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-background-soft">
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-5">
        {eyebrow && <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-premium-beige">{eyebrow}</p>}
        <h3 className="text-2xl leading-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{title}</h3>
        {children && <div className="mt-3 text-sm leading-relaxed text-foreground-secondary">{children}</div>}
      </div>
    </article>
  );
}
