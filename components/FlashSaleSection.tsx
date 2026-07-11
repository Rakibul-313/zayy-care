"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";

import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart, saveFirebaseProducts } from "@/lib/cart";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

type FlashSaleProduct = {
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
  flashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEndAt?: number;
  featured?: boolean;
  deleted?: boolean;
  active?: boolean;
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";

  let path = src.trim();

  if (path.startsWith("public/")) {
    path = path.replace("public", "");
  }

  if (path.startsWith("/public/")) {
    path = path.replace("/public", "");
  }

  if (!path.startsWith("/") && !path.startsWith("http")) {
    path = `/${path}`;
  }

  return path;
}

function readBoolean(value: unknown) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function getFlashSaleText(product: FlashSaleProduct) {
  const endTime = Number(product.flashSaleEndAt || 0);
  const currentTime = Date.now();

  if (endTime > currentTime) {
    const diff = endTime - currentTime;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diff / (1000 * 60 * 60)) % 24
    );
    const minutes = Math.floor(
      (diff / (1000 * 60)) % 60
    );

    if (days > 0) {
      return `${days}D ${hours}H LEFT`;
    }

    return `${hours}H ${minutes}M LEFT`;
  }

  const regularPrice = Number(
    product.oldPrice || product.price || 0
  );

  const salePrice = Number(product.price || 0);

  if (
    regularPrice > 0 &&
    salePrice > 0 &&
    salePrice < regularPrice
  ) {
    const discount = Math.round(
      ((regularPrice - salePrice) / regularPrice) * 100
    );

    return `${discount}% OFF`;
  }

  return "FLASH SALE";
}

export default function FlashSaleSection() {
  const [products, setProducts] = useState<
    FlashSaleProduct[]
  >([]);

  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setLoading(true);

    const productsRef = ref(database, "products");

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const formatted: FlashSaleProduct[] =
          Object.entries(data)
            .map(([firebaseId, value]: [string, any], index) => {
              const regularPrice = Number(value.price || 0);

              const originalPrice = Number(
                value.oldPrice || value.price || 0
              );

              const flashSalePrice = Number(
                value.flashSalePrice || 0
              );

              const finalPrice =
                flashSalePrice > 0 &&
                flashSalePrice < regularPrice
                  ? flashSalePrice
                  : regularPrice;

              const product: FlashSaleProduct = {
                firebaseId,
                id: Number(value.id || index + 1),
                slug: value.slug || "",
                name: value.name || "Unnamed Product",
                brand: value.brand || "ZAYY Care",
                category:
                  value.category || "Korean Skincare",
                image: safeImage(
                  value.image ||
                    value.imageUrl ||
                    value.thumbnail
                ),
                price: finalPrice,
                oldPrice: originalPrice,
                sale: value.sale || "Flash Sale",
                rating: Number(value.rating || 0),
                reviews: Number(value.reviews || 0),
                stock: Number(value.stock || 0),
                flashSale: readBoolean(value.flashSale),
                flashSalePrice,
                flashSaleEndAt: Number(
                  value.flashSaleEndAt || 0
                ),
                featured: readBoolean(value.featured),
                deleted: readBoolean(value.deleted),
                active:
                  value.active !== false &&
                  value.active !== "false",
              };

              return {
                ...product,
                sale: getFlashSaleText(product),
              };
            })
            .filter((product) => {
              const endTime = Number(
                product.flashSaleEndAt || 0
              );

              const flashSaleIsActive =
                endTime === 0 || endTime > currentTime;

              return (
                product.deleted !== true &&
                product.active !== false &&
                Number(product.stock || 0) > 0 &&
                product.flashSale === true &&
                flashSaleIsActive
              );
            })
            .sort((a, b) => {
              const aEndTime =
                Number(a.flashSaleEndAt || 0) ||
                Number.MAX_SAFE_INTEGER;

              const bEndTime =
                Number(b.flashSaleEndAt || 0) ||
                Number.MAX_SAFE_INTEGER;

              return aEndTime - bEndTime;
            });

        setProducts(formatted);

        saveFirebaseProducts(
          formatted.map((product) => ({
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

        setLoading(false);
      },
      (error) => {
        console.error(
          "Failed to load flash sale products:",
          error
        );

        setProducts([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentTime]);

  useEffect(() => {
    const updateWishlist = () => {
      setWishlist(getWishlist());
    };

    updateWishlist();

    window.addEventListener(
      "wishlistUpdated",
      updateWishlist
    );

    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener(
        "wishlistUpdated",
        updateWishlist
      );

      window.removeEventListener(
        "storage",
        updateWishlist
      );
    };
  }, []);

  const handleAddToCart = (id: number) => {
    const product = products.find(
      (item) => item.id === id
    );

    if (!product) return;

    if (Number(product.stock || 0) <= 0) {
      alert("This product is out of stock.");
      return;
    }

    addToCart(id);
  };

  const handleToggleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
  };

  if (!loading && products.length === 0) {
    return null;
  }

  // Home Page-এ শুধু প্রথম 6টি Flash Sale product দেখাবে
  const visibleProducts = products.slice(0, 6);

  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[1820px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-[6px] bg-red-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-red-700">
              <Zap size={14} fill="currentColor" />
              Live Deals
            </div>

            <h2 className="dream-font text-[34px] leading-none text-[#142012] sm:text-[48px]">
              Flash Sale{" "}
              <span className="text-[#556B2F]">+</span>
            </h2>
          </div>

          <Link
            href="/flash-sale"
            className="hidden items-center gap-2 text-sm font-black text-[#0b3d2e] transition-all duration-300 hover:-translate-y-0.5 hover:text-[#062a18] sm:inline-flex"
          >
            View All Deals
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-8 text-[#263421] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
            Loading flash sale products...
          </div>
        ) : (
          <>
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visibleProducts.map((product) => (
                <PremiumProductCard
                  key={product.firebaseId || product.id}
                  product={product as any}
                  className="w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(11,61,46,0.18)]"
                  isWishlisted={wishlist.includes(
                    product.id
                  )}
                  onToggleWishlist={
                    handleToggleWishlist
                  }
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            <div className="mt-6 flex justify-center sm:hidden">
              <Link
                href="/flash-sale"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e] px-6 py-3 text-sm font-black text-[#0b3d2e] transition-all duration-300 hover:bg-[#0b3d2e] hover:text-white"
              >
                View All Deals
                <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}