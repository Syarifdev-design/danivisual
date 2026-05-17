type BadgeVariant = "waiting" | "finishing" | "delivery" | "success" | "action-required" | "locked";

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export default function StatusBadge({ variant, children }: StatusBadgeProps) {
  const variants = {
    waiting: "bg-muted text-foreground-secondary",
    finishing: "bg-warning-soft text-[#8B7355]",
    delivery: "bg-dark-premium/5 text-dark-premium border border-dark-premium/20",
    success: "bg-success-soft text-[#2D5F3F]",
    "action-required": "bg-premium-beige/20 text-[#8B7355]",
    locked: "bg-muted text-foreground-secondary",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
