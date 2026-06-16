"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";

import type { Product } from "@/data/products";
import { cn } from "@/lib/styles";

type PremiumProductCardProps = {
  product: Product;
  href?: string;
  className?: string;
  isWishlisted?: boolean;
  priority?: boolean;
  onAddToCart?: (id: number) => void;
  onToggleWishlist?: (id: number) => void;
};

const taka = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

function formatPrice(price?: number) {
  return `৳${taka.format(price || 0)}`;
}

function getFlashTimeText(endAt?: number) {
  if (!endAt || Number(endAt) <= 0) return "";

  const diff = Number(endAt) - Date.now();

  if (diff <= 0) return "ENDED";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return `${days}D ${hours}H LEFT`;
  if (hours > 0) return `${hours}H ${minutes}M LEFT`;

  return `${minutes}M LEFT`;
}

function getBadgeText(product: Product) {
  if ((product as any).flashSale) {
    const timeText = getFlashTimeText((product as any).flashSaleEndAt);
    return timeText || (product as any).sale || "FLASH SALE";
  }

  if ((product as any).bestSeller) return "BEST SELLER";

  if (product.oldPrice && product.price && product.oldPrice > product.price) {
    return (product as any).sale || "SALE";
  }

  return (product as any).sale || "NEW";
}

function getBadgeClass(product: Product) {
  if ((product as any).flashSale) return "bg-red-600";
  if ((product as any).bestSeller) return "bg-[#0b3d2e]";

  if (product.oldPrice && product.price && product.oldPrice > product.price) {
    return "bg-[#ef3b2d]";
  }

  return "bg-[#3f6f28]";
}

export default function PremiumProductCard({
  product,
  href = `/product/${product.id}`,
  className,
  isWishlisted = false,
  onAddToCart,
  onToggleWishlist,
}: PremiumProductCardProps) {
  const image =
    product.image && product.image.trim() !== ""
      ? product.image
      : "/products/p1.png";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[12px] border border-[#e8e3d7] bg-white shadow-[0_10px_28px_rgba(11,61,46,0.09)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(11,61,46,0.14)]",
        className
      )}
    >
      <div className="relative">
        <Link
          href={href}
          className="relative flex aspect-[27/23] items-center justify-center overflow-hidden bg-[#f5f1e8]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.45),rgba(245,241,232,0.75)_48%,rgba(219,231,201,0.65))]" />

          <img
            src={image}
            alt={product.name}
            className="relative z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>

        <span
          className={cn(
            "absolute left-2 top-2 z-20 rounded-[5px] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-md sm:left-2.5 sm:top-2.5 sm:text-[9px]",
            getBadgeClass(product)
          )}
        >
          {getBadgeText(product)}
        </span>

        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => onToggleWishlist?.(product.id)}
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b3d2e] shadow-md transition hover:scale-105 sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8"
        >
          <Heart
            size={14}
            className={cn(
              "transition sm:h-4 sm:w-4",
              isWishlisted ? "fill-red-500 text-red-500" : "text-[#0b3d2e]"
            )}
          />
        </button>
      </div>

      <div className="p-2.5 sm:p-3">
        <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-[#4f7a3a] sm:text-[10px]">
          {product.brand || product.category || "Korean Skincare"}
        </p>

        <Link
          href={href}
          className="line-clamp-2 min-h-[34px] text-[12px] font-bold leading-snug text-[#102015] hover:text-[#0b3d2e] sm:min-h-[36px] sm:text-[13px]"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <div className="flex items-center text-[#e3a51a]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={10}
                fill={
                  star <= Math.round(Number(product.rating || 0))
                    ? "currentColor"
                    : "transparent"
                }
              />
            ))}
          </div>

          <span className="text-[10px] font-semibold text-[#5f6d58]">
            ({product.reviews || 0})
          </span>
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[16px] font-black text-[#102015] sm:text-[17px]">
                {formatPrice(product.price)}
              </span>

              {product.oldPrice && product.oldPrice > product.price ? (
                <span className="text-[10px] font-semibold text-[#9a9a8f] line-through sm:text-[11px]">
                  {formatPrice(product.oldPrice)}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart?.(product.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#0b3d2e] text-white shadow-[0_8px_18px_rgba(11,61,46,0.20)] transition hover:bg-[#062a18] sm:h-9 sm:w-9"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}