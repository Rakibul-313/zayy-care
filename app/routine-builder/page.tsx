"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import {
  ArrowRight,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart } from "@/lib/cart";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

type RoutineProduct = {
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

const morningSteps = ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen"];
const eveningSteps = ["Cleanser", "Toner", "Serum", "Cream", "Sleeping Mask"];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

function normalize(text?: string) {
  return (text || "").toLowerCase();
}

export default function RoutineBuilderPage() {
  const [products, setProducts] = useState<RoutineProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [routineType, setRoutineType] = useState<"morning" | "evening">(
    "morning"
  );
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

      const loaded: RoutineProduct[] = Object.entries(data).map(
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

  const routineSteps = routineType === "morning" ? morningSteps : eveningSteps;

  const recommendedProducts = useMemo(() => {
    if (!selectedSkinType && !selectedConcern) return [];

    const skin = normalize(selectedSkinType);
    const concern = normalize(selectedConcern);

    const matched = products.filter((product) => {
      const skinTarget = normalize(product.skinType || product.forText);
      const concernTarget = normalize(product.concern);

      const skinMatch =
        !skin || skinTarget.includes("all skin") || skinTarget.includes(skin);

      const concernMatch =
        !concern ||
        concernTarget.includes(concern) ||
        concernTarget.includes(concern.split(" ")[0]);

      return skinMatch && concernMatch;
    });

    return matched;
  }, [products, selectedSkinType, selectedConcern]);

  const productsByStep = useMemo(() => {
    return routineSteps.map((step) => {
      const stepLower = normalize(step);

      const stepProducts = recommendedProducts.filter((product) => {
        const category = normalize(product.category);
        const name = normalize(product.name);

        if (stepLower === "moisturizer") {
          return (
            category.includes("moisturizer") ||
            category.includes("cream") ||
            name.includes("moisturizer") ||
            name.includes("cream")
          );
        }

        if (stepLower === "sunscreen") {
          return (
            category.includes("sunscreen") ||
            name.includes("sun") ||
            name.includes("spf")
          );
        }

        if (stepLower === "sleeping mask") {
          return (
            category.includes("mask") ||
            name.includes("mask") ||
            name.includes("sleeping")
          );
        }

        return category.includes(stepLower) || name.includes(stepLower);
      });

      return {
        step,
        products: stepProducts.slice(0, 4),
      };
    });
  }, [routineSteps, recommendedProducts]);

  const selectedButtonClass =
    "bg-[#31571f] text-white shadow-[0_14px_34px_rgba(49,87,31,0.32)] ring-2 ring-[#31571f]/20";

  const normalButtonClass =
    "glass-soft text-[#1f2a1f] hover:bg-white/75 hover:text-[#31571f]";

  const handleToggleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
  };

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
              Daily Routine Planning
            </div>

            <h1 className="dream-font text-[48px] sm:text-[64px] text-black">
              Routine Builder
            </h1>

            <p className="text-gray-600 leading-8 max-w-[780px] mt-4">
              Choose your routine time, skin type and concern. We will build a
              product routine from your store automatically.
            </p>
          </section>

          <section className="glass rounded-[34px] p-7 space-y-7">
            <div>
              <h2 className="text-3xl font-semibold text-black">
                Choose routine type
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRoutineType("morning")}
                  className={`rounded-[24px] px-6 py-5 text-left font-bold transition ${
                    routineType === "morning"
                      ? selectedButtonClass
                      : normalButtonClass
                  }`}
                >
                  <Sun className="mb-3" size={26} />
                  Morning Routine
                </button>

                <button
                  type="button"
                  onClick={() => setRoutineType("evening")}
                  className={`rounded-[24px] px-6 py-5 text-left font-bold transition ${
                    routineType === "evening"
                      ? selectedButtonClass
                      : normalButtonClass
                  }`}
                >
                  <Moon className="mb-3" size={26} />
                  Evening Routine
                </button>
              </div>
            </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
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
                  setRoutineType("morning");
                  setSelectedSkinType("");
                  setSelectedConcern("");
                }}
                className="glass-soft rounded-full px-7 py-4 font-bold text-[#1f2a1f] hover:bg-white/75"
              >
                Reset Builder
              </button>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover"
              >
                Explore All Products
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>

          <section className="grid gap-5">
            <div className="glass rounded-[34px] p-7">
              <div className="flex items-center gap-3">
                {routineType === "morning" ? (
                  <Sun className="text-[#556B2F]" size={28} />
                ) : (
                  <Moon className="text-[#556B2F]" size={28} />
                )}

                <div>
                  <h2 className="dream-font text-[42px] text-[#142012]">
                    {routineType === "morning"
                      ? "Morning Routine"
                      : "Evening Routine"}
                  </h2>

                  <p className="text-gray-600">
                    Based on:{" "}
                    <b>{selectedSkinType || "Choose Skin Type"}</b>
                    {" + "}
                    <b>{selectedConcern || "Choose Concern"}</b>
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-4">
                {routineSteps.map((step, index) => (
                  <div
                    key={step}
                    className="glass-soft rounded-[24px] p-4 flex items-center gap-4"
                  >
                    <span className="w-9 h-9 rounded-full bg-[#556B2F] text-white flex items-center justify-center text-sm shrink-0">
                      {index + 1}
                    </span>

                    <p className="font-medium text-[#1f2a1f]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {(selectedSkinType || selectedConcern) && (
              <div className="space-y-6">
                {productsByStep.map((group, index) => (
                  <section key={group.step} className="glass rounded-[34px] p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#556B2F] text-sm font-bold text-white">
                        {index + 1}
                      </span>

                      <div>
                        <h3 className="text-2xl font-bold text-[#142012]">
                          {group.step}
                        </h3>

                        <p className="text-sm text-gray-600">
                          Recommended products for this step
                        </p>
                      </div>
                    </div>

                    {group.products.length === 0 ? (
                      <div className="rounded-[22px] bg-white/35 p-5 text-gray-600">
                        No matching product found for {group.step}. Add product
                        category/name like "{group.step}" from admin panel.
                      </div>
                    ) : (
                      <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
                        {group.products.map((product) => (
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
                ))}
              </div>
            )}
          </section>

          <section className="glass rounded-[34px] p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="text-[#556B2F] shrink-0 mt-1" size={28} />

              <div>
                <h2 className="text-2xl font-semibold text-black">
                  Keep it consistent
                </h2>

                <p className="text-gray-600 leading-7 mt-2">
                  Introduce one new product at a time and keep sunscreen in your
                  morning routine for best results.
                </p>
              </div>
            </div>

            <Link
              href="/shop"
              className="bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover w-fit"
            >
              Shop Routine Picks
            </Link>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}