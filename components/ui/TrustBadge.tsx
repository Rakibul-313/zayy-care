import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/styles";

type TrustBadgeProps = {
  icon: LucideIcon;
  title: string;
  text: string;
  className?: string;
  compact?: boolean;
};

export default function TrustBadge({
  icon: Icon,
  title,
  text,
  className,
  compact = false,
}: TrustBadgeProps) {
  return (
    <div
      className={cn(
        "trust-badge",
        compact && "trust-badge-compact",
        className
      )}
    >
      <span className="trust-badge-icon" aria-hidden="true">
        <Icon size={compact ? 18 : 24} strokeWidth={1.8} />
      </span>

      <span className="min-w-0">
        <span className="trust-badge-title">{title}</span>
        <span className="trust-badge-text">{text}</span>
      </span>
    </div>
  );
}
