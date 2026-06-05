"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import {
  ArrowRight,
  Droplets,
  Leaf,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart } from "@/lib/cart";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

type QuizProduct = {
  id: number;
  firebaseId?: string;
  name: string;
  brand?: string;
  category: string;
  image: string;
  price: number;
  oldPrice: number;
  sale?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  concern?: string;
  skinType?: string;
  forText?: string;
};

const skinTypes = ["Dry", "Oily", "Combination", "Sensitive"];

const concerns = ["Acne", "Dark spots", "Dullness", "Barrier damage"];

const steps = [
  {
    icon: Droplets,
    title: "Hydration level",
    text: "Tell us how your skin feels after cleansing.",
  },
  {
    icon: ShieldCheck,
    title: "Sensitivity",
    text: "Match products to your comfort zone.",
  },
  {
    icon: Leaf,
    title: "Routine habits",
    text: "Build around the steps you can repeat daily.",
  },
];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

export default function SkinQuizPage() {
  const [products, setProducts] = useState<QuizProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedSkinType, setSelectedSkinType] = useState("");
  const [selectedConcern, setSelectedConcern] = useState("");

  useEffect(() => {
    setWishlist(getWishlist());

    const productsRef = ref(database, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        return;
      }

      const loaded: QuizProduct[] = Object.entries(data).map(
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
          concern: value.concern || "",
          skinType: value.skinType || value.forText || "",
          forText: value.forText || value.skinType || "",
        })
      );

      setProducts(loaded);
    });

    const updateWishlist = () => setWishlist(getWishlist());
    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      unsubscribe();
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  const suggestedProducts = useMemo(() => {
    if (!selectedSkinType && !selectedConcern) return [];

    const skin = selectedSkinType.toLowerCase();
    const concern = selectedConcern.toLowerCase();

    const matched = products.filter((product) => {
      const productSkinType = (product.skinType || product.forText || "").toLowerCase();
      const productConcern = (product.concern || "").toLowerCase();

      const skinMatch =
        !skin ||
        productSkinType.includes("all skin") ||
        productSkinType.includes(skin);

      const concernMatch =
        !concern ||
        productConcern.includes(concern) ||
        productConcern.includes(concern.split(" ")[0]);

      return skinMatch && concernMatch;
    });

    return matched.length > 0 ? matched.slice(0, 8) : [];
  }, [products, selectedSkinType, selectedConcern]);

  const handleToggleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
  };

  const selectedButtonClass =
    "bg-[#31571f] text-white shadow-[0_14px_34px_rgba(49,87,31,0.32)] ring-2 ring-[#31571f]/20";

  const normalButtonClass =
    "glass-soft text-[#1f2a1f] hover:bg-white/75 hover:text-[#31571f]";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar />

      <div className="pt-[175px] pb-10 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto space-y-8">
          <section className="glass rounded-[34px] p-8 lg:p-10">
            <div className="flex items-center gap-3 text-[#556B2F] font-medium mb-3">
              <Sparkles size={20} />
              Personalized Skincare Match
            </div>

            <h1 className="dream-font text-[48px] sm:text-[64px] text-black">
              Skin Quiz
            </h1>

            <p className="text-gray-600 leading-8 max-w-[760px] mt-4">
              Choose your skin type and main concern. We will suggest matching
              Korean skincare products from your store.
            </p>
          </section>

          <section className="grid lg:grid-cols-[1fr_0.9fr] gap-8">
            <div className="glass rounded-[34px] p-7 space-y-7">
              <div>
                <h2 className="text-3xl font-semibold text-black">
                  Choose your skin type
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  {skinTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedSkinType(type)}
                      className={`rounded-full px-4 py-3 font-semibold transition ${
                        selectedSkinType === type
                          ? selectedButtonClass
                          : normalButtonClass
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-semibold text-black">
                  Main concern
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {concerns.map((concern) => (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => setSelectedConcern(concern)}
                      className={`rounded-[22px] px-5 py-4 text-left font-semibold transition ${
                        selectedConcern === concern
                          ? selectedButtonClass
                          : normalButtonClass
                      }`}
                    >
                      {concern}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSkinType("");
                    setSelectedConcern("");
                  }}
                  className="glass-soft rounded-full px-7 py-4 font-bold text-[#1f2a1f] hover:bg-white/75"
                >
                  Reset Quiz
                </button>

                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover"
                >
                  Explore All Products
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="grid gap-5">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article key={step.title} className="glass rounded-[28px] p-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/40 flex items-center justify-center text-[#556B2F] mb-5">
                      <Icon size={26} />
                    </div>

                    <h3 className="text-2xl font-semibold text-black">
                      {step.title}
                    </h3>

                    <p className="text-gray-600 leading-7 mt-3">
                      {step.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {(selectedSkinType || selectedConcern) && (
            <section className="glass rounded-[34px] p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#556B2F] font-bold">
                    <Star size={20} fill="currentColor" />
                    Your Suggested Products
                  </div>

                  <h2 className="dream-font text-[42px] text-[#142012] mt-2">
                    Recommended for You
                  </h2>

                  <p className="text-gray-600 mt-2">
                    Based on:{" "}
                    <b>{selectedSkinType || "Any Skin Type"}</b>
                    {" + "}
                    <b>{selectedConcern || "Any Concern"}</b>
                  </p>
                </div>
              </div>

              {suggestedProducts.length === 0 ? (
                <div className="rounded-[24px] bg-white/35 p-6">
                  <p className="font-semibold text-[#142012]">
                    No exact matching products found.
                  </p>

                  <p className="mt-2 text-gray-600">
                    Please update products from Admin Panel with matching Skin Type
                    and Concern, or explore all products.
                  </p>

                  <Link
                    href="/shop"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#556B2F] px-7 py-3 font-bold text-white"
                  >
                    Go to Shop
                    <ArrowRight size={17} />
                  </Link>
                </div>
              ) : (
                <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
                  {suggestedProducts.map((product) => (
                    <PremiumProductCard
                      key={product.firebaseId || product.id}
                      product={product as any}
                      className="w-[270px] shrink-0 md:w-[286px]"
                      isWishlisted={wishlist.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}