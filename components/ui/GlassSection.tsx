import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/styles";

type GlassSectionProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  variant?: "default" | "soft" | "dark";
  padded?: boolean;
  constrained?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function GlassSection<T extends ElementType = "section">({
  as,
  children,
  className,
  containerClassName,
  variant = "default",
  padded = true,
  constrained = true,
  ...props
}: GlassSectionProps<T>) {
  const Component = as || "section";

  return (
    <div className={cn("section-shell", containerClassName)}>
      <Component
        className={cn(
          variant === "default" && "glass",
          variant === "soft" && "glass-soft",
          variant === "dark" && "glass-dark",
          "glass-section",
          padded && "glass-section-padded",
          constrained && "section-container",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    </div>
  );
}
