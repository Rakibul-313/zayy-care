"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";

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

function formatPrice(price: number) {
  return `৳${taka.format(price)}`;
}

export default function PremiumProductCard({
  product,
  href = `/product/${product.id}`,
  className,
  isWishlisted = false,
  priority = false,
  onAddToCart,
  onToggleWishlist,
}: PremiumProductCardProps) {
  return (
    <article className={cn("premium-product-card product-glow", className)}>
      <div className="premium-product-card-top">
        <span className="premium-product-sale">{product.sale}</span>

        <button
          type="button"
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={() => onToggleWishlist?.(product.id)}
          className={cn(
            "premium-icon-button",
            isWishlisted && "premium-icon-button-active"
          )}
        >
          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="premium-product-media">
        <img
          src={
            product.image && product.image.trim() !== ""
              ? product.image
              : "/products/p1.png"
          }
          alt={product.name}
          className="premium-product-image"
        />

        <div className="premium-product-actions">
          <Link href={href} className="premium-icon-button" aria-label={`View ${product.name}`}>
            <Eye size={19} />
          </Link>

          <button
            type="button"
            onClick={() => onAddToCart?.(product.id)}
            className="premium-icon-button premium-icon-button-solid"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={19} />
          </button>
        </div>
      </div>

      <div className="premium-product-body">
        <p className="premium-product-category">{product.category}</p>

        <Link href={href} className="premium-product-title">
          {product.name}
        </Link>

        <div className="premium-product-rating" aria-label={`${product.rating} out of 5 stars`}>
          <Star size={15} fill="currentColor" />
          <span>
            {product.rating} ({product.reviews})
          </span>
        </div>

        <div className="premium-product-footer">
          <div className="premium-product-prices">
            <span className="premium-product-price">
              {formatPrice(product.price)}
            </span>
            <span className="premium-product-old-price">
              {formatPrice(product.oldPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(product.id);
            }}
            className="premium-cart-button relative z-20"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
