"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Headphones,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { products } from "@/data/products";
import type { Product } from "@/data/products";

import { addToCart, getCartCount, getFirebaseProducts } from "@/lib/cart";
import {
  getWishlist,
  getWishlistCount,
  toggleWishlist,
} from "@/lib/wishlist";

const taka = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });

type WishlistProduct = Product & {
  brand?: string;
  bestSeller?: boolean;
  deleted?: boolean;
  active?: boolean;
  firebaseId?: string;
};

function formatPrice(price?: number) {
  return `৳${taka.format(Number(price || 0))}`;
}

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";

  const image = src.trim();

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/")) {
    return image;
  }

  return `/${image}`;
}

function getBadge(product: WishlistProduct) {
  if (product.bestSeller) return "BEST";
  if (Number(product.oldPrice || 0) > Number(product.price || 0)) return "SALE";
  return product.sale || "NEW";
}

function WishlistProductCard({
  product,
  onRemove,
  onCart,
}: {
  product: WishlistProduct;
  onRemove: () => void;
  onCart: () => void;
}) {
  const badge = getBadge(product);

  return (
    <article className="group relative w-full min-w-0 overflow-hidden rounded-[6px] border border-[#e8e3d7] bg-white shadow-[0_10px_28px_rgba(11,61,46,0.09)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(11,61,46,0.14)]">
      <Link
        href={`/product/${product.id}`}
        className="relative flex aspect-[27/23] items-center justify-center overflow-hidden bg-[#f5f1e8]"
      >
        <Image
          src={safeImage(product.image)}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 220px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>

      <span
        className={`absolute left-2 top-2 z-20 rounded-[6px] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-md sm:left-2.5 sm:top-2.5 sm:text-[9px] ${
          badge === "SALE" ? "bg-[#ef3b2d]" : "bg-[#0b3d2e]"
        }`}
      >
        {badge}
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove from wishlist"
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-[6px] bg-white text-[#0b3d2e] shadow-md transition hover:scale-105 sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8"
      >
        <X size={15} />
      </button>

      <div className="p-2.5 sm:p-3">
        <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-[#4f7a3a] sm:text-[10px]">
          {product.brand || product.category || "ZAYY Care"}
        </p>

        <Link
          href={`/product/${product.id}`}
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

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[16px] font-black text-[#102015] sm:text-[17px]">
            {formatPrice(product.price)}
          </span>

          {Number(product.oldPrice || 0) > Number(product.price || 0) && (
            <span className="text-[10px] font-semibold text-[#9a9a8f] line-through sm:text-[11px]">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onCart}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] text-[11px] font-black uppercase text-white shadow-[0_8px_18px_rgba(11,61,46,0.20)] transition hover:bg-[#062a18] sm:text-[12px]"
        >
          Add to Cart
          <ShoppingBag size={14} />
        </button>
      </div>
    </article>
  );
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const loadWishlist = () => {
    const wishlist = getWishlist();
    const firebaseProducts = getFirebaseProducts() as unknown as WishlistProduct[];
    const localProducts = products as unknown as WishlistProduct[];

    const allProducts = [...firebaseProducts, ...localProducts];

    const items = wishlist
      .map((id) => allProducts.find((product) => product.id === id))
      .filter((item): item is WishlistProduct => item !== undefined)
      .filter((item) => item.deleted !== true && item.active !== false);

    setWishlistItems(items);
    setWishlistCount(getWishlistCount());
    setCartCount(getCartCount());
  };

  useEffect(() => {
    queueMicrotask(loadWishlist);

    window.addEventListener("wishlistUpdated", loadWishlist);
    window.addEventListener("cartUpdated", loadWishlist);
    window.addEventListener("storage", loadWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", loadWishlist);
      window.removeEventListener("cartUpdated", loadWishlist);
      window.removeEventListener("storage", loadWishlist);
    };
  }, []);

  const handleRemove = (id: number) => {
    toggleWishlist(id);
    loadWishlist();
  };

  const handleAddToCart = (id: number) => {
    const product = wishlistItems.find((item) => item.id === id);

    if (!product || Number(product.stock || 0) <= 0) {
      alert("This product is out of stock.");
      return;
    }

    addToCart(id);
    setCartCount(getCartCount());
  };

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((item) => {
      if (Number(item.stock || 0) > 0) {
        addToCart(item.id);
      }
    });

    setCartCount(getCartCount());
  };

  const totalItems = useMemo(() => wishlistItems.length, [wishlistItems]);

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 70, damping: 20, mass: 0.9 }}
        className="min-h-screen bg-[#fafaf7]"
      >
        <section className="pt-[105px] lg:pt-[115px]">
          <div className="relative overflow-hidden bg-[#f5f1e8]">
            <div className="absolute inset-0 opacity-40 md:opacity-100">
              <Image
                src="/banners/shop-hero-desktop.png"
                alt="ZAYY Care wishlist hero"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/85 to-[#f5f1e8]/20" />

            <div className="mx-auto max-w-[1820px] px-4 py-10 sm:px-8 md:py-14 lg:px-14 lg:py-16">
              <div className="relative z-10 max-w-[560px]">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#263421]">
                  <Link href="/">Home</Link>
                  <span>›</span>
                  <span>Wishlist</span>
                </div>

                <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[64px]">
                  Your Wishlist{" "}
                  <span className="font-sans text-[24px] font-bold">
                    ({totalItems})
                  </span>
                </h1>

                <p className="mt-4 max-w-[460px] text-[16px] leading-8 text-[#263421]">
                  Your favorite Korean skincare products are saved here.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-[1820px]">
            <div className="mb-5 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[#4f5f49]">
                  Showing {totalItems} wishlist products
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/shop"
                    className="rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 py-2.5 text-sm font-black text-[#0b3d2e]"
                  >
                    Add More Products
                  </Link>

                  {wishlistItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleMoveAllToCart}
                      className="flex items-center gap-2 rounded-[6px] bg-[#0b3d2e] px-4 py-2.5 text-sm font-black text-white"
                    >
                      <ShoppingBag size={16} />
                      Move All to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
                <Heart
                  size={62}
                  className="mx-auto mb-5 text-[#0b3d2e]"
                  fill="currentColor"
                />

                <h2 className="mb-3 text-2xl font-black text-[#102015]">
                  Your wishlist is empty
                </h2>

                <p className="mx-auto mb-7 max-w-[420px] text-sm leading-7 text-[#4f5f49]">
                  Add your favorite skincare products from shop page.
                </p>

                <Link
                  href="/shop"
                  className="inline-flex rounded-[6px] bg-[#0b3d2e] px-7 py-3 text-sm font-black text-white"
                >
                  Go to Shop
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(2,minmax(150px,1fr))] gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {wishlistItems.map((product) => (
                  <WishlistProductCard
                    key={product.firebaseId || product.id}
                    product={product}
                    onRemove={() => handleRemove(product.id)}
                    onCart={() => handleAddToCart(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] grid-cols-2 gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4 lg:grid-cols-5">
            {[
              [ShieldCheck, "100% Authentic", "Genuine Korean Products"],
              [Truck, "Free Delivery", "On orders over ৳1,500"],
              [ShoppingBag, "Secure Payment", "100% Safe Checkout"],
              [RefreshCcw, "Easy Returns", "Hassle-free returns"],
              [Headphones, "24/7 Support", "We’re here to help"],
            ].map(([Icon, title, text]: any) => (
              <div
                key={title}
                className="flex items-center gap-3 border-[#0b3d2e]/10 p-3 lg:border-r lg:last:border-r-0"
              >
                <Icon size={22} className="text-[#0b3d2e]" />
                <div>
                  <h4 className="text-sm font-black text-[#102015]">
                    {title}
                  </h4>
                  <p className="text-xs text-[#4f5f49]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}