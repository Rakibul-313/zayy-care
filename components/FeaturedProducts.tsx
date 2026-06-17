"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        saveFirebaseProducts([]);
        setLoading(false);
        return;
      }

      const formatted: FeaturedProduct[] = Object.entries(data)
        .map(([firebaseId, value]: any, index) => ({
          firebaseId,
          id: Number(value.id || index + 1),
          name: value.name || "Unnamed Product",
          slug: value.slug || "",
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
          deleted: Boolean(value.deleted),
          active: value.active !== false,
        }))
        .filter(
          (product) =>
            product.deleted !== true &&
            product.active !== false &&
            product.stock !== 0
        );

      const featured = formatted.filter((product) => product.featured);

      setProducts(featured);

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
          <h2 className="dream-font text-[34px] leading-none text-[#142012] sm:text-[48px]">
            Featured Collection <span className="text-[#556B2F]">+</span>
          </h2>

          <Link
            href="/shop"
            className="hidden items-center gap-2 text-sm font-black text-[#0b3d2e] transition-all duration-300 hover:-translate-y-0.5 hover:text-[#062a18] sm:inline-flex"
          >
            View All Products
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="glass rounded-[20px] p-8 text-[#263421]">
            Loading featured products...
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((product) => (
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
      </div>
    </section>
  );
}