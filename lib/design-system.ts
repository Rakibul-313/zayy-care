import {
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

export const designTokens = {
  colors: {
    leaf: "var(--color-leaf)",
    moss: "var(--color-moss)",
    sage: "var(--color-sage)",
    cream: "var(--color-cream)",
    porcelain: "var(--color-porcelain)",
    ink: "var(--color-ink)",
    muted: "var(--color-muted)",
    gold: "var(--color-gold)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
  },
  space: {
    pageX: "var(--space-page-x)",
    sectionY: "var(--space-section-y)",
    card: "var(--space-card)",
  },
} as const;

export const defaultTrustBadges = [
  {
    icon: ShieldCheck,
    title: "100% Authentic",
    text: "Korean Products",
  },
  {
    icon: Truck,
    title: "Free Delivery",
    text: "On orders over ৳1,500",
  },
  {
    icon: RefreshCcw,
    title: "Easy Return",
    text: "7 Days Return Policy",
  },
  {
    icon: LockKeyhole,
    title: "Secure Payment",
    text: "bKash, Nagad, COD",
  },
] as const;
