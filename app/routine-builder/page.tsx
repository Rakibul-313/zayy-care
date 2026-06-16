"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Heart,
  Leaf,
  Moon,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart, getCartCount, saveFirebaseProducts } from "@/lib/cart";
import { getWishlist, getWishlistCount, toggleWishlist } from "@/lib/wishlist";

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
  skinTypes?: string[];
  concerns?: string[];
  lifestyles?: string[];
  goals?: string[];
  goal?: string;
  benefit?: string;
  deleted?: boolean;
  active?: boolean;
};

const skinTypes = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const concerns = ["Acne", "Dark spots", "Dullness", "Barrier damage"];
const lifestyles = ["Minimal Routine", "Daily Outdoor", "Makeup User", "Busy Schedule"];
const goals = ["Glow", "Hydration", "Clear Skin", "Repair"];

const morningSteps = ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen"];
const eveningSteps = ["Cleanser", "Toner", "Serum", "Cream", "Sleeping Mask"];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const image = src.trim();
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

function normalize(text?: string) {
  return (text || "").toLowerCase();
}

function asText(value?: string | string[]) {
  if (Array.isArray(value)) return value.join(" ");
  return value || "";
}

function matchValue(source: string, selected: string) {
  if (!selected) return true;
  const src = normalize(source);
  const value = normalize(selected);
  return src.includes(value) || src.includes(value.split(" ")[0]);
}

export default function RoutineBuilderPage() {
  const [products, setProducts] = useState<RoutineProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [routineType, setRoutineType] = useState<"morning" | "evening">("morning");
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

      const loaded: RoutineProduct[] = Object.entries(data)
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
          skinTypes: value.skinTypes || [],
          concerns: value.concerns || [],
          lifestyles: value.lifestyles || [],
          goals: value.goals || [],
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

  const routineSteps = routineType === "morning" ? morningSteps : eveningSteps;

  const recommendedProducts = useMemo(() => {
    if (!selectedSkinType && !selectedConcern && !selectedLifestyle && !selectedGoal) {
      return [];
    }

    return products.filter((product) => {
      const skinSource = `${asText(product.skinTypes)} ${product.skinType || ""} ${product.forText || ""}`;
      const concernSource = `${asText(product.concerns)} ${product.concern || ""}`;
      const lifestyleSource = `${asText(product.lifestyles)}`;
      const goalSource = `${asText(product.goals)} ${product.goal || ""} ${product.benefit || ""} ${product.category || ""} ${product.name || ""}`;

      const skinMatch =
        !selectedSkinType ||
        normalize(skinSource).includes("all skin") ||
        matchValue(skinSource, selectedSkinType);

      const concernMatch =
        !selectedConcern || matchValue(concernSource, selectedConcern);

      const lifestyleMatch =
        !selectedLifestyle || matchValue(lifestyleSource, selectedLifestyle);

      const goalMatch = !selectedGoal || matchValue(goalSource, selectedGoal);

      return skinMatch && concernMatch && lifestyleMatch && goalMatch;
    });
  }, [products, selectedSkinType, selectedConcern, selectedLifestyle, selectedGoal]);

  const productsByStep = useMemo(() => {
    return routineSteps.map((step) => {
      const stepLower = normalize(step);

      const stepProducts = recommendedProducts.filter((product) => {
        const category = normalize(product.category);
        const name = normalize(product.name);

        if (stepLower === "moisturizer") {
          return category.includes("moisturizer") || category.includes("cream") || name.includes("moisturizer") || name.includes("cream");
        }

        if (stepLower === "sunscreen") {
          return category.includes("sun") || category.includes("sunscreen") || name.includes("sun") || name.includes("spf");
        }

        if (stepLower === "sleeping mask") {
          return category.includes("mask") || name.includes("mask") || name.includes("sleeping");
        }

        return category.includes(stepLower) || name.includes(stepLower);
      });

      return {
        step,
        products: stepProducts.slice(0, 4),
      };
    });
  }, [routineSteps, recommendedProducts]);

  const selectedRoutineProducts = productsByStep
    .map((group) => group.products[0])
    .filter(Boolean) as RoutineProduct[];

  const estimatedTotal = selectedRoutineProducts.reduce(
    (total, product) => total + Number(product.price || 0),
    0
  );

  const handleToggleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
    setWishlistCount(getWishlistCount());
  };

  const handleAddToCart = (id: number) => {
    addToCart(id);
    setCartCount(getCartCount());
  };

  const handleAddAllToCart = () => {
    selectedRoutineProducts.forEach((product) => addToCart(product.id));
    setCartCount(getCartCount());
  };

  const resetBuilder = () => {
    setRoutineType("morning");
    setSelectedSkinType("");
    setSelectedConcern("");
    setSelectedLifestyle("");
    setSelectedGoal("");
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
              Routine Builder
            </h1>
            <p className="mx-auto mt-3 max-w-[760px] text-sm leading-7 text-[#4f5f49]">
              Build your perfect skincare routine based on your skin type, concerns and goals.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [Sparkles, "Personalized for You", "Custom routine just for your skin"],
                [GiftIcon, "Expert Recommended", "Picked by skincare experts"],
                [Moon, "Day & Night Routine", "Complete AM & PM guide"],
                [CalendarCheck, "Easy to Follow", "Simple steps for better results"],
              ].map(([Icon, title, text]: any) => (
                <div key={title} className="flex items-center justify-center gap-3">
                  <Icon size={25} className="text-[#0b3d2e]" />
                  <div className="text-left">
                    <p className="text-sm font-black text-[#102015]">{title}</p>
                    <p className="text-xs text-[#4f5f49]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[300px_1fr_320px]">
            <aside className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-black text-[#102015]">Your Profile</h2>
                <button onClick={resetBuilder} className="text-sm font-bold text-[#0b3d2e]">
                  Reset
                </button>
              </div>

              <div className="space-y-5">
                <ProfileRow title="Skin Type" text={selectedSkinType || "Select skin type"} />
                <ProfileRow title="Skin Concerns" text={selectedConcern || "Select concern"} />
                <ProfileRow title="Lifestyle" text={selectedLifestyle || "Select lifestyle"} />
                <ProfileRow title="Skin Goals" text={selectedGoal || "Select goal"} />
              </div>

              <div className="mt-8 rounded-[6px] bg-[#f5f1e8] p-4">
                <p className="text-sm font-black text-[#102015]">Not sure about your profile?</p>
                <p className="mt-1 text-xs text-[#4f5f49]">Retake our Skin Quiz</p>
                <Link
                  href="/skin-quiz"
                  className="mt-4 flex h-10 items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/20 bg-white text-sm font-black text-[#0b3d2e]"
                >
                  Retake Quiz
                  <ArrowRight size={15} />
                </Link>
              </div>
            </aside>

            <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
              <div className="mb-5 flex gap-4 border-b border-[#0b3d2e]/10">
                <button
                  onClick={() => setRoutineType("morning")}
                  className={`flex items-center gap-2 border-b-2 px-2 pb-4 text-sm font-black ${
                    routineType === "morning"
                      ? "border-[#0b3d2e] text-[#0b3d2e]"
                      : "border-transparent text-[#4f5f49]"
                  }`}
                >
                  <Sun size={18} />
                  AM Routine
                </button>

                <button
                  onClick={() => setRoutineType("evening")}
                  className={`flex items-center gap-2 border-b-2 px-2 pb-4 text-sm font-black ${
                    routineType === "evening"
                      ? "border-[#0b3d2e] text-[#0b3d2e]"
                      : "border-transparent text-[#4f5f49]"
                  }`}
                >
                  <Moon size={18} />
                  PM Routine
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <OptionGroup title="Skin Type" options={skinTypes} selected={selectedSkinType} setSelected={setSelectedSkinType} />
                <OptionGroup title="Concern" options={concerns} selected={selectedConcern} setSelected={setSelectedConcern} />
                <OptionGroup title="Lifestyle" options={lifestyles} selected={selectedLifestyle} setSelected={setSelectedLifestyle} />
                <OptionGroup title="Goal" options={goals} selected={selectedGoal} setSelected={setSelectedGoal} />
              </div>

              <div className="my-7 flex items-center justify-between gap-3 overflow-x-auto pb-2">
                {routineSteps.map((step, index) => (
                  <div key={step} className="flex min-w-[90px] flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[6px] border border-[#0b3d2e]/20 bg-[#f5f1e8] text-[#0b3d2e]">
                      <ShoppingBag size={24} />
                    </div>
                    <p className="mt-2 text-xs font-black text-[#102015]">{step}</p>
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0b3d2e] text-white">
                      <Check size={12} />
                    </span>
                    {index < routineSteps.length - 1 && (
                      <span className="hidden h-px w-14 border-t border-dashed border-[#0b3d2e]/30 lg:block" />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {productsByStep.map((group, index) => (
                  <div key={group.step} className="rounded-[6px] border border-[#0b3d2e]/10 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-[#102015]">
                          Step {index + 1}: {group.step}
                        </h3>
                        <p className="text-sm text-[#4f5f49]">
                          Recommended products for this step.
                        </p>
                      </div>
                    </div>

                    {group.products.length === 0 ? (
                      <div className="rounded-[6px] bg-[#f5f1e8] p-5 text-sm text-[#4f5f49]">
                        No matching product found for {group.step}. Admin product e matching category/name + quiz fields add korle show korbe.
                      </div>
                    ) : (
                      <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
                        {group.products.map((product) => (
                          <PremiumProductCard
                            key={product.firebaseId || product.id}
                            product={product as any}
                            className="w-[245px] shrink-0 md:w-[260px]"
                            isWishlisted={wishlist.includes(product.id)}
                            onToggleWishlist={handleToggleWishlist}
                            onAddToCart={handleAddToCart}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 lg:sticky lg:top-[120px]">
              <h2 className="mb-5 text-lg font-black text-[#102015]">
                Your Routine Summary
              </h2>

              <div className="space-y-3">
                {selectedRoutineProducts.length === 0 ? (
                  <div className="rounded-[6px] bg-[#f5f1e8] p-4 text-sm text-[#4f5f49]">
                    Select profile options to build your routine.
                  </div>
                ) : (
                  selectedRoutineProducts.map((product, index) => (
                    <div key={product.id} className="grid grid-cols-[58px_1fr] gap-3">
                      <div className="relative h-[58px] w-[58px] rounded-[6px] bg-[#f5f1e8]">
                        <Image
                          src={safeImage(product.image)}
                          alt={product.name}
                          fill
                          sizes="58px"
                          className="object-contain p-2"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#0b3d2e]">
                          {routineSteps[index]}
                        </p>
                        <p className="line-clamp-2 text-sm font-black text-[#102015]">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex justify-between border-t border-[#0b3d2e]/10 pt-4">
                <span className="text-sm font-bold text-[#4f5f49]">Estimated Total</span>
                <span className="font-black text-[#0b3d2e]">৳{estimatedTotal}</span>
              </div>

              <button
                onClick={handleAddAllToCart}
                disabled={selectedRoutineProducts.length === 0}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] text-sm font-black text-white disabled:opacity-50"
              >
                <ShoppingBag size={16} />
                Add All to Cart
              </button>

              <button className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-sm font-black text-[#0b3d2e]">
                <Heart size={16} />
                Save Routine
              </button>
            </aside>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] grid-cols-2 gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4 lg:grid-cols-5">
            {[
              [ShieldCheck, "100% Authentic", "Korean Skincare Products"],
              [Truck, "Free Delivery", "on orders over ৳1,500"],
              [ShoppingBag, "Secure Payment", "100% Safe Checkout"],
              [RefreshCcw, "Easy Returns", "7 Days Return"],
              [Sparkles, "Routine Match", "Real-time product picks"],
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

function ProfileRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
        <Leaf size={15} />
      </div>
      <div>
        <p className="text-sm font-black text-[#102015]">{title}</p>
        <p className="text-sm text-[#4f5f49]">{text}</p>
      </div>
    </div>
  );
}

function OptionGroup({
  title,
  options,
  selected,
  setSelected,
}: {
  title: string;
  options: string[];
  selected: string;
  setSelected: (value: string) => void;
}) {
  return (
    <div className="rounded-[6px] bg-[#f5f1e8] p-3">
      <p className="mb-2 text-xs font-black uppercase text-[#102015]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelected(option)}
            className={`rounded-[6px] px-3 py-2 text-xs font-black ${
              selected === option
                ? "bg-[#0b3d2e] text-white"
                : "bg-white text-[#0b3d2e]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function GiftIcon(props: any) {
  return <Sparkles {...props} />;
}