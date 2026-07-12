"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/styles";

export type PremiumCardProduct = {
  id: number;
  firebaseId?: string;

  name: string;
  slug?: string;

  brand?: string;
  category?: string;

  image?: string;
  imageUrl?: string;
  thumbnail?: string;

  price: number;
  oldPrice?: number;

  sale?: string;
  discount?: number;

  rating?: number;
  reviews?: number;
  stock?: number;

  flashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEndAt?: number;

  bestSeller?: boolean;
  featured?: boolean;

  deleted?: boolean;
  active?: boolean;
};

type PremiumProductCardProps = {
  product: PremiumCardProduct;
  href?: string;
  className?: string;
  isWishlisted?: boolean;
  priority?: boolean;
  onAddToCart?: (id: number) => void;
  onToggleWishlist?: (id: number) => void;
};

const FALLBACK_IMAGE = "/products/p1.png";

const takaFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

function formatPrice(price?: number) {
  return `৳${takaFormatter.format(Number(price || 0))}`;
}

function normalizeImagePath(src?: string) {
  if (!src?.trim()) {
    return FALLBACK_IMAGE;
  }

  let path = src.trim();

  if (path.startsWith("/public/")) {
    path = path.replace("/public", "");
  } else if (path.startsWith("public/")) {
    path = path.replace("public", "");
  }

  if (
    !path.startsWith("/") &&
    !path.startsWith("http://") &&
    !path.startsWith("https://")
  ) {
    path = `/${path}`;
  }

  return path;
}

function getFlashTimeText(endAt?: number) {
  const endTime = Number(endAt || 0);

  if (endTime <= 0) {
    return "";
  }

  const difference = endTime - Date.now();

  if (difference <= 0) {
    return "ENDED";
  }

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  const hours = Math.floor(
    (difference / (1000 * 60 * 60)) % 24
  );

  const minutes = Math.floor(
    (difference / (1000 * 60)) % 60
  );

  if (days > 0) {
    return `${days}D ${hours}H LEFT`;
  }

  if (hours > 0) {
    return `${hours}H ${minutes}M LEFT`;
  }

  return `${Math.max(minutes, 1)}M LEFT`;
}

function getDiscountText(product: PremiumCardProduct) {
  if (product.discount && Number(product.discount) > 0) {
    return `${Number(product.discount)}% OFF`;
  }

  const regularPrice = Number(product.oldPrice || 0);
  const currentPrice = Number(product.price || 0);

  if (
    regularPrice > 0 &&
    currentPrice > 0 &&
    regularPrice > currentPrice
  ) {
    const discount = Math.round(
      ((regularPrice - currentPrice) / regularPrice) * 100
    );

    return `${discount}% OFF`;
  }

  return "";
}

function getBadgeText(product: PremiumCardProduct) {
  if (product.flashSale) {
    const timeText = getFlashTimeText(
      product.flashSaleEndAt
    );

    return (
      timeText ||
      getDiscountText(product) ||
      product.sale ||
      "FLASH SALE"
    );
  }

  if (product.bestSeller) {
    return "BEST SELLER";
  }

  const discountText = getDiscountText(product);

  if (discountText) {
    return product.sale || discountText;
  }

  return product.sale || "NEW";
}

function getBadgeClass(product: PremiumCardProduct) {
  if (product.flashSale) {
    return "bg-red-600";
  }

  if (product.bestSeller) {
    return "bg-[#0b3d2e]";
  }

  if (getDiscountText(product)) {
    return "bg-[#ef3b2d]";
  }

  return "bg-[#3f6f28]";
}

export default function PremiumProductCard({
  product,
  href,
  className,
  isWishlisted = false,
  priority = false,
  onAddToCart,
  onToggleWishlist,
}: PremiumProductCardProps) {
  const productHref =
    href || `/product/${product.slug || product.id}`;

  const productImage =
    product.image ||
    product.imageUrl ||
    product.thumbnail ||
    FALLBACK_IMAGE;

  const [imageSource, setImageSource] = useState(
    normalizeImagePath(productImage)
  );

  const stock = Number(product.stock ?? 1);
  const isOutOfStock = stock <= 0;

  const rating = Math.max(
    0,
    Math.min(5, Number(product.rating || 0))
  );

  const brandText =
    product.brand?.trim() ||
    product.category?.trim() ||
    "International Skincare";

  useEffect(() => {
    setImageSource(normalizeImagePath(productImage));
  }, [productImage]);

  const handleImageError = () => {
    if (imageSource !== FALLBACK_IMAGE) {
      setImageSource(FALLBACK_IMAGE);
    }
  };

  const handleWishlist = () => {
    onToggleWishlist?.(product.id);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    onAddToCart?.(product.id);
  };

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[12px] border border-[#e8e3d7] bg-white shadow-[0_10px_28px_rgba(11,61,46,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(11,61,46,0.14)]",
        className
      )}
    >
      <div className="relative">
        <Link
          href={productHref}
          aria-label={`View ${product.name}`}
          className="relative flex aspect-[27/23] items-center justify-center overflow-hidden bg-[#f5f1e8]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.45),rgba(245,241,232,0.75)_48%,rgba(219,231,201,0.65))]" />

          <Image
            src={imageSource}
            alt={product.name || "Product image"}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            quality={80}
            onError={handleImageError}
            className="relative z-10 object-cover transition-transform duration-500 group-hover:scale-105"
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
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b3d2e] shadow-md transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3d2e] sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8"
        >
          <Heart
            size={14}
            aria-hidden="true"
            className={cn(
              "transition sm:h-4 sm:w-4",
              isWishlisted
                ? "fill-red-500 text-red-500"
                : "text-[#0b3d2e]"
            )}
          />
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 z-[15] flex items-center justify-center bg-black/20">
            <span className="rounded-[5px] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#102015] shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3">
        <p className="mb-1 truncate text-[9px] font-black uppercase tracking-wide text-[#4f7a3a] sm:text-[10px]">
          {brandText}
        </p>

        <Link
          href={productHref}
          className="line-clamp-2 min-h-[34px] text-[12px] font-bold leading-snug text-[#102015] transition hover:text-[#0b3d2e] sm:min-h-[36px] sm:text-[13px]"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <div
            className="flex items-center text-[#e3a51a]"
            aria-label={`${rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= Math.round(rating);

              return (
                <Star
                  key={star}
                  size={10}
                  aria-hidden="true"
                  fill={active ? "currentColor" : "transparent"}
                  className={
                    active
                      ? "text-[#e3a51a]"
                      : "text-[#d8d8d1]"
                  }
                />
              );
            })}
          </div>

          <span className="text-[10px] font-semibold text-[#5f6d58]">
            ({Number(product.reviews || 0)})
          </span>
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[16px] font-black text-[#102015] sm:text-[17px]">
                {formatPrice(product.price)}
              </span>

              {Number(product.oldPrice || 0) >
              Number(product.price || 0) ? (
                <span className="text-[10px] font-semibold text-[#9a9a8f] line-through sm:text-[11px]">
                  {formatPrice(product.oldPrice)}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : `Add ${product.name} to cart`
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#0b3d2e] text-white shadow-[0_8px_18px_rgba(11,61,46,0.20)] transition hover:bg-[#062a18] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3d2e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#a7afa4] disabled:shadow-none sm:h-9 sm:w-9"
          >
            <ShoppingBag size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}