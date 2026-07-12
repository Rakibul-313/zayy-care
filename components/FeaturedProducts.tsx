"use client";

import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";

import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart, saveFirebaseProducts } from "@/lib/cart";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

type FeaturedProduct = {
  id: number;
  slug?: string;
  firebaseId?: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  oldPrice: number;
  sale: string;
  rating: number;
  reviews: number;
  stock?: number;
  featured?: boolean;
  deleted?: boolean;
  active?: boolean;
};

type FirebaseProductValue = {
  id?: number | string;
  slug?: string;
  name?: string;
  brand?: string;
  category?: string;
  image?: string;
  price?: number | string;
  oldPrice?: number | string;
  discount?: number | string;
  sale?: string;
  rating?: number | string;
  reviews?: number | string;
  stock?: number | string;
  featured?: boolean;
  deleted?: boolean;
  active?: boolean;
};

const FEATURED_CACHE_KEY = "zayy_home_featured_products";

function safeImage(src?: string) {
  const cleanSource = src?.trim();

  if (!cleanSource) {
    return "/products/p1.png";
  }

  return cleanSource;
}

function readCachedProducts(): FeaturedProduct[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const cached = sessionStorage.getItem(FEATURED_CACHE_KEY);

    if (!cached) {
      return [];
    }

    const parsed = JSON.parse(cached);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCachedProducts(products: FeaturedProduct[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(
      FEATURED_CACHE_KEY,
      JSON.stringify(products)
    );
  } catch {
    // Cache fail হলেও Firebase data স্বাভাবিকভাবে চলবে।
  }
}

function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-white"
    >
      <div className="aspect-square animate-pulse bg-[#f5f1e8]" />

      <div className="space-y-3 p-3 sm:p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-[#e7e8e3]" />

        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-[#e7e8e3]" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#e7e8e3]" />
        </div>

        <div className="h-3 w-24 animate-pulse rounded bg-[#e7e8e3]" />

        <div className="flex items-end justify-between gap-3 pt-2">
          <div className="h-6 w-20 animate-pulse rounded bg-[#e7e8e3]" />
          <div className="h-10 w-10 animate-pulse rounded-[6px] bg-[#e7e8e3]" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const cachedProducts = readCachedProducts();

    if (cachedProducts.length > 0) {
      setProducts(cachedProducts);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoadError(false);

    const productsRef = ref(database, "products");

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val() as
          | Record<string, FirebaseProductValue>
          | null;

        if (!data) {
          setProducts([]);
          saveCachedProducts([]);
          saveFirebaseProducts([]);
          setLoading(false);
          return;
        }

        const formattedProducts: FeaturedProduct[] = Object.entries(data)
          .map(([firebaseId, value], index) => {
            const productId = Number(value.id);

            return {
              firebaseId,
              id:
                Number.isFinite(productId) && productId > 0
                  ? productId
                  : index + 1,
              name: value.name?.trim() || "Unnamed Product",
              slug: value.slug?.trim() || "",
              brand: value.brand?.trim() || "ZAYY Care",
              category:
                value.category?.trim() || "International Skincare",
              image: safeImage(value.image),
              price: Number(value.price || 0),
              oldPrice: Number(value.oldPrice || value.price || 0),
              sale: value.discount
                ? `${Number(value.discount)}% OFF`
                : value.sale?.trim() || "NEW",
              rating: Number(value.rating || 0),
              reviews: Number(value.reviews || 0),
              stock: Number(value.stock || 0),
              featured: value.featured === true,
              deleted: value.deleted === true,
              active: value.active !== false,
            };
          })
          .filter(
            (product) =>
              product.deleted !== true &&
              product.active !== false &&
              Number(product.stock) > 0
          );

        const featuredProducts = formattedProducts.filter(
          (product) => product.featured === true
        );

        setProducts(featuredProducts);
        saveCachedProducts(featuredProducts);

        saveFirebaseProducts(
          formattedProducts.map((product) => ({
            id: product.id,
            slug: product.slug,
            firebaseId: product.firebaseId,
            name: product.name,
            image: product.image,
            category: product.category,
            price: product.price,
            oldPrice: product.oldPrice,
            stock: product.stock,
            quantity: 0,
          }))
        );

        setLoadError(false);
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [reloadKey]);

  useEffect(() => {
    const updateWishlist = () => {
      setWishlist(getWishlist());
    };

    updateWishlist();

    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener(
        "wishlistUpdated",
        updateWishlist
      );
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  const handleAddToCart = (id: number) => {
    addToCart(id);
  };

  const handleToggleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
  };

  const handleRetry = () => {
    setLoading(true);
    setLoadError(false);
    setReloadKey((current) => current + 1);
  };

  if (
    !loading &&
    !loadError &&
    products.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="featured-products-heading"
      className="px-4 sm:px-8 lg:px-14"
    >
      <div className="mx-auto w-full max-w-[1820px]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="featured-products-heading"
            className="dream-font text-[34px] leading-none text-[#142012] sm:text-[48px]"
          >
            Featured Collection{" "}
            <span className="text-[#556B2F]">+</span>
          </h2>

          <Link
            href="/shop"
            className="hidden items-center gap-2 text-sm font-black text-[#0b3d2e] transition-all duration-300 hover:-translate-y-0.5 hover:text-[#062a18] sm:inline-flex"
          >
            View All Products
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {loadError && products.length === 0 ? (
          <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-10 text-center">
            <p className="font-bold text-[#263421]">
              Featured products could not be loaded.
            </p>

            <p className="mt-2 text-sm text-[#4f5f49]">
              Please check your internet connection and try again.
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mx-auto mt-5 flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] px-5 text-sm font-black text-white transition hover:bg-[#062a18]"
            >
              <RefreshCcw size={16} aria-hidden="true" />
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {loading && products.length === 0
              ? Array.from({ length: 6 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : products.map((product) => (
                  <PremiumProductCard
                    key={product.firebaseId || product.id}
                    product={product as any}
                    href={`/product/${product.slug || product.id}`}
                    className="w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(11,61,46,0.18)]"
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                  />
                ))}
          </div>
        )}

        <Link
          href="/shop"
          className="mt-5 flex h-12 items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/20 bg-white text-sm font-black text-[#0b3d2e] sm:hidden"
        >
          View All Products
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}