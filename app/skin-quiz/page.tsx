"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Droplets,
  Gift,
  HeartPulse,
  Leaf,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  UserRound,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart, getCartCount, saveFirebaseProducts } from "@/lib/cart";
import { getWishlist, getWishlistCount, toggleWishlist } from "@/lib/wishlist";

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
  lifestyle?: string;
  goal?: string;
  benefit?: string;
  deleted?: boolean;
  active?: boolean;
};

const skinTypes = [
  ["Normal", "Balanced, not too oily or dry", UserRound],
  ["Dry", "Feels tight, flaky or rough", Droplets],
  ["Oily", "Shiny, especially on T-zone", Sparkles],
  ["Combination", "Oily in some areas, dry in others", Leaf],
  ["Sensitive", "Easily irritated or reactive", HeartPulse],
];

const concerns = ["Acne", "Dark spots", "Dullness", "Barrier damage"];

const lifestyles = [
  ["Minimal Routine", "I want simple 2-3 steps", Clock],
  ["Daily Outdoor", "I go outside often", ShieldCheck],
  ["Makeup User", "I use makeup regularly", Sparkles],
  ["Busy Schedule", "I need quick skincare", Target],
];

const goals = [
  ["Glow", "Healthy bright glow"],
  ["Hydration", "Soft and moisturized skin"],
  ["Clear Skin", "Reduce acne and clogged pores"],
  ["Repair", "Repair barrier and calm skin"],
];

const sidebarSteps = [
  ["Skin Type", "Choose type"],
  ["Skin Concerns", "Choose concern"],
  ["Lifestyle", "Routine match"],
  ["Skin Goals", "Target result"],
  ["Results", "Products"],
];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const image = src.trim();
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

function textMatch(source: string, value: string) {
  if (!value) return true;
  const src = source.toLowerCase();
  const val = value.toLowerCase();
  return src.includes(val) || src.includes(val.split(" ")[0]);
}

export default function SkinQuizPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState<QuizProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [selectedSkinType, setSelectedSkinType] = useState("");
  const [selectedConcern, setSelectedConcern] = useState("");
  const [selectedLifestyle, setSelectedLifestyle] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");

  useEffect(() => {
    setWishlist(getWishlist());
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const unsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        return;
      }

      const loaded: QuizProduct[] = Object.entries(data)
        .map(([firebaseId, value]: any, index) => ({
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
          lifestyle: value.lifestyle || "",
          goal: value.goal || "",
          benefit: value.benefit || "",
          deleted: value.deleted,
          active: value.active,
        }))
        .filter((p) => p.deleted !== true && p.active !== false);

      setProducts(loaded);

      saveFirebaseProducts(
        loaded.map((p) => ({
          id: p.id,
          firebaseId: p.firebaseId,
          name: p.name,
          image: p.image,
          category: p.category,
          price: p.price,
          oldPrice: p.oldPrice,
          stock: p.stock,
          quantity: 0,
        }))
      );
    });

    const updateWishlist = () => {
      setWishlist(getWishlist());
      setWishlistCount(getWishlistCount());
    };

    const updateCart = () => setCartCount(getCartCount());

    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("cartUpdated", updateCart);
    window.addEventListener("storage", updateWishlist);
    window.addEventListener("storage", updateCart);

    return () => {
      unsubscribe();
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("cartUpdated", updateCart);
      window.removeEventListener("storage", updateWishlist);
      window.removeEventListener("storage", updateCart);
    };
  }, []);

  const suggestedProducts = useMemo(() => {
    const matched = products.filter((product) => {
      const productSkin = `${product.skinType || ""} ${product.forText || ""}`;
      const productConcern = `${product.concern || ""}`;
      const productGoal = `${product.goal || ""} ${product.benefit || ""} ${
        product.category || ""
      } ${product.name || ""}`;

      const skinMatch =
        !selectedSkinType ||
        productSkin.toLowerCase().includes("all skin") ||
        textMatch(productSkin, selectedSkinType);

      const concernMatch =
        !selectedConcern || textMatch(productConcern, selectedConcern);

      const goalMatch = !selectedGoal || textMatch(productGoal, selectedGoal);

      return skinMatch && concernMatch && goalMatch;
    });

    return matched.slice(0, 8);
  }, [products, selectedSkinType, selectedConcern, selectedGoal]);

  const canGoNext =
    (currentStep === 1 && selectedSkinType) ||
    (currentStep === 2 && selectedConcern) ||
    (currentStep === 3 && selectedLifestyle) ||
    (currentStep === 4 && selectedGoal) ||
    currentStep === 5;

  const nextStep = () => {
    if (!canGoNext) return;
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  const resetQuiz = () => {
    setCurrentStep(1);
    setSelectedSkinType("");
    setSelectedConcern("");
    setSelectedLifestyle("");
    setSelectedGoal("");
  };

  const handleToggleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
    setWishlistCount(getWishlistCount());
  };

  const handleAddToCart = (id: number) => {
    addToCart(id);
    setCartCount(getCartCount());
  };

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 70, damping: 20, mass: 0.9 }}
        className="min-h-screen bg-[#fafaf7]"
      >
        <section className="px-4 pt-[105px] sm:px-8 lg:px-14 lg:pt-[115px]">
          <div className="mx-auto max-w-[1820px] py-8 text-center">
            <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[58px]">
              Skin Quiz
            </h1>

            <p className="mx-auto mt-3 max-w-[620px] text-sm leading-7 text-[#4f5f49]">
              Let’s find the perfect skincare for you. Answer a few quick
              questions about your skin.
            </p>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1360px] gap-5 lg:grid-cols-[250px_1fr]">
            <aside className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4">
              <div className="space-y-3">
                {sidebarSteps.map(([title, text], index) => {
                  const stepNumber = index + 1;
                  const active = currentStep === stepNumber;
                  const done = currentStep > stepNumber;

                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setCurrentStep(stepNumber)}
                      className={`flex w-full items-center gap-3 rounded-[6px] p-3 text-left ${
                        active
                          ? "bg-[#f5f1e8] text-[#0b3d2e]"
                          : "text-[#6b7568] hover:bg-[#fafaf7]"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-[6px] text-xs font-black ${
                          active || done
                            ? "bg-[#0b3d2e] text-white"
                            : "bg-[#fafaf7] text-[#6b7568]"
                        }`}
                      >
                        {done ? <Check size={14} /> : stepNumber}
                      </span>

                      <div>
                        <p className="text-sm font-black">{title}</p>
                        <p className="text-xs">{text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[6px] bg-[#f5f1e8] p-4">
                <Gift size={22} className="mb-2 text-[#0b3d2e]" />
                <p className="text-sm font-black text-[#102015]">
                  Complete the quiz
                </p>
                <p className="mt-1 text-xs leading-5 text-[#4f5f49]">
                  Get personalized product recommendations.
                </p>
              </div>
            </aside>

            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
              <span className="rounded-[6px] bg-[#f5f1e8] px-3 py-1 text-xs font-black text-[#0b3d2e]">
                Question {currentStep} of 5
              </span>

              {currentStep === 1 && (
                <>
                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    What’s your skin type?
                  </h2>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {skinTypes.map(([title, text, Icon]: any) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setSelectedSkinType(title)}
                        className={`rounded-[6px] border p-4 text-center transition ${
                          selectedSkinType === title
                            ? "border-[#0b3d2e] bg-[#f5f1e8]"
                            : "border-[#0b3d2e]/10 bg-white hover:bg-[#fafaf7]"
                        }`}
                      >
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[6px] bg-[#fafaf7] text-[#0b3d2e]">
                          <Icon size={30} />
                        </div>

                        <p className="text-sm font-black text-[#102015]">
                          {title}
                        </p>

                        <p className="mt-1 min-h-[34px] text-[11px] leading-4 text-[#4f5f49]">
                          {text}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    What is your main skin concern?
                  </h2>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {concerns.map((concern) => (
                      <button
                        key={concern}
                        type="button"
                        onClick={() => setSelectedConcern(concern)}
                        className={`rounded-[6px] border px-5 py-4 text-left font-black transition ${
                          selectedConcern === concern
                            ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                            : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#102015]"
                        }`}
                      >
                        {concern}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    What fits your lifestyle?
                  </h2>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {lifestyles.map(([title, text, Icon]: any) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setSelectedLifestyle(title)}
                        className={`rounded-[6px] border p-4 text-left transition ${
                          selectedLifestyle === title
                            ? "border-[#0b3d2e] bg-[#f5f1e8]"
                            : "border-[#0b3d2e]/10 bg-white hover:bg-[#fafaf7]"
                        }`}
                      >
                        <Icon className="mb-3 text-[#0b3d2e]" size={26} />

                        <p className="font-black text-[#102015]">{title}</p>
                        <p className="mt-1 text-sm text-[#4f5f49]">{text}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    What is your skin goal?
                  </h2>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {goals.map(([title, text]) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setSelectedGoal(title)}
                        className={`rounded-[6px] border p-4 text-left transition ${
                          selectedGoal === title
                            ? "border-[#0b3d2e] bg-[#f5f1e8]"
                            : "border-[#0b3d2e]/10 bg-white hover:bg-[#fafaf7]"
                        }`}
                      >
                        <p className="font-black text-[#102015]">{title}</p>
                        <p className="mt-1 text-sm text-[#4f5f49]">{text}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <h2 className="mt-4 dream-font text-[42px] leading-none text-[#0b3d2e]">
                    Recommended for You
                  </h2>

                  <p className="mt-2 text-sm text-[#4f5f49]">
                    Based on: <b>{selectedSkinType}</b> +{" "}
                    <b>{selectedConcern}</b> + <b>{selectedGoal}</b>
                  </p>

                  {suggestedProducts.length === 0 ? (
                    <div className="mt-6 rounded-[6px] bg-[#f5f1e8] p-6">
                      <p className="font-black text-[#102015]">
                        No matching products found.
                      </p>

                      <p className="mt-2 text-sm text-[#4f5f49]">
                        Admin product e matching skinType, concern, goal /
                        benefit add korle ekhane product show korbe.
                      </p>

                      <Link
                        href="/shop"
                        className="mt-5 inline-flex rounded-[6px] bg-[#0b3d2e] px-6 py-3 text-sm font-black text-white"
                      >
                        Go to Shop
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
                      {suggestedProducts.map((product) => (
                        <PremiumProductCard
                          key={product.firebaseId || product.id}
                          product={product as any}
                          className="w-[250px] shrink-0 md:w-[270px]"
                          isWishlisted={wishlist.includes(product.id)}
                          onToggleWishlist={handleToggleWishlist}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 rounded-[6px] bg-[#f5f1e8] p-3 text-xs font-semibold text-[#4f5f49]">
                Not sure? You can select the one that feels closest.
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-5 py-3 text-sm font-black text-[#0b3d2e]"
                >
                  Reset Quiz
                </button>

                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-5 py-3 text-sm font-black text-[#0b3d2e]"
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </button>
                  )}

                  {currentStep < 5 ? (
                    <button
                      type="button"
                      disabled={!canGoNext}
                      onClick={nextStep}
                      className="flex items-center gap-2 rounded-[6px] bg-[#0b3d2e] px-5 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
                    >
                      Next Question
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <Link
                      href="/shop"
                      className="flex items-center gap-2 rounded-[6px] bg-[#0b3d2e] px-5 py-3 text-sm font-black uppercase text-white"
                    >
                      Explore Shop
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] grid-cols-2 gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4 lg:grid-cols-5">
            {[
              [ShieldCheck, "100% Authentic", "Korean Skincare Products"],
              [ShoppingBag, "Free Delivery", "on orders over ৳1,500"],
              [Target, "Secure Payment", "100% Safe Checkout"],
              [Leaf, "Easy Returns", "7 Days Return"],
              [Sparkles, "Personal Match", "Quiz based suggestion"],
            ].map(([Icon, title, text]: any) => (
              <div
                key={title}
                className="flex items-center gap-3 border-[#0b3d2e]/10 p-3 lg:border-r lg:last:border-r-0"
              >
                <Icon size={22} className="text-[#0b3d2e]" />

                <div>
                  <h4 className="text-sm font-black text-[#102015]">{title}</h4>
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