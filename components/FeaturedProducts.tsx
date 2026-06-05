"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";

import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart, saveFirebaseProducts } from "@/lib/cart";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

type FeaturedProduct = {
  id: number;
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
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

export default function FeaturedProducts() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollLeft = () => {
    containerRef.current?.scrollBy({ left: -340, behavior: "smooth" });
  };

  const scrollRight = () => {
    containerRef.current?.scrollBy({ left: 340, behavior: "smooth" });
  };

  useEffect(() => {
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const formatted: FeaturedProduct[] = Object.entries(data).map(
        ([firebaseId, value]: any, index) => ({
          firebaseId,
          id: Number(value.id || index + 1),
          name: value.name || "Unnamed Product",
          brand: value.brand || "ZAYY Care",
          category: value.category || "Korean Skincare",
          image: safeImage(value.image),
          price: Number(value.price || 0),
          oldPrice: Number(value.oldPrice || value.price || 0),
          sale: value.discount ? `${value.discount}% OFF` : value.sale || "New",
          rating: Number(value.rating || 0),
          reviews: Number(value.reviews || 0),
          stock: Number(value.stock || 0),
          featured: Boolean(value.featured),
        })
      );

      const featured = formatted.filter((product) => product.featured);

      setProducts(featured);

      saveFirebaseProducts(
        formatted.map((product) => ({
          id: product.id,
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
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setWishlist(getWishlist());

    const updateWishlist = () => {
      setWishlist(getWishlist());
    };

    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", updateWishlist);
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

  if (!loading && products.length === 0) return null;

  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[1820px]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="dream-font text-[38px] leading-none text-[#142012] sm:text-[48px]">
            Featured Collection <span className="text-[#556B2F]">+</span>
          </h2>

          <div className="flex items-center gap-4">
            <Link
              href="/shop"
              className="hidden items-center gap-2 text-sm font-bold text-[#31571f] sm:inline-flex"
            >
              View All Products
              <ArrowRight size={16} />
            </Link>

            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Scroll featured products left"
                onClick={scrollLeft}
                className="glass-soft flex h-11 w-11 items-center justify-center rounded-full text-[#31571f] transition hover:-translate-y-1"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                type="button"
                aria-label="Scroll featured products right"
                onClick={scrollRight}
                className="glass-soft flex h-11 w-11 items-center justify-center rounded-full text-[#31571f] transition hover:-translate-y-1"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex w-full gap-5 overflow-x-auto scroll-smooth pb-3 scrollbar-hide"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {loading ? (
            <div className="glass rounded-[30px] p-8 text-[#263421]">
              Loading featured products...
            </div>
          ) : (
            products.map((product) => (
              <PremiumProductCard
                key={product.firebaseId || product.id}
                product={product as any}
                className="w-[270px] shrink-0 md:w-[286px]"
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}