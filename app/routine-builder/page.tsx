"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set } from "firebase/database";
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
import { auth, database } from "@/firebase/config";
import { addToCart, getCartCount, saveFirebaseProducts } from "@/lib/cart";
import { getWishlist, getWishlistCount, toggleWishlist } from "@/lib/wishlist";

type RoutineProduct = {
  id: number;
  slug?: string;
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

const ROUTINE_PRODUCTS_CACHE_KEY = "zayy_routine_builder_products_cache";
const ROUTINE_STATE_CACHE_KEY = "zayy_routine_builder_state_cache";
const ROUTINE_SCROLL_CACHE_KEY = "zayy_routine_builder_scroll_y";

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
  const router = useRouter();
  const [products, setProducts] = useState<RoutineProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  const [routineType, setRoutineType] = useState<"morning" | "evening">("morning");
  const [selectedSkinType, setSelectedSkinType] = useState("");
  const [selectedConcern, setSelectedConcern] = useState("");
  const [selectedLifestyle, setSelectedLifestyle] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || "");
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    setWishlist(getWishlist());
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const cachedProducts = sessionStorage.getItem(ROUTINE_PRODUCTS_CACHE_KEY);

    if (cachedProducts) {
      try {
        const parsed = JSON.parse(cachedProducts) as RoutineProduct[];
        setProducts(parsed);

        saveFirebaseProducts(
          parsed.map((p) => ({
            id: p.id,
            slug: p.slug,
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
      } catch {
        sessionStorage.removeItem(ROUTINE_PRODUCTS_CACHE_KEY);
      }
    }

    const cachedState = sessionStorage.getItem(ROUTINE_STATE_CACHE_KEY);

    if (cachedState) {
      try {
        const parsed = JSON.parse(cachedState) as {
          routineType?: "morning" | "evening";
          selectedSkinType?: string;
          selectedConcern?: string;
          selectedLifestyle?: string;
          selectedGoal?: string;
        };

        if (parsed.routineType === "morning" || parsed.routineType === "evening") {
          setRoutineType(parsed.routineType);
        }

        setSelectedSkinType(parsed.selectedSkinType || "");
        setSelectedConcern(parsed.selectedConcern || "");
        setSelectedLifestyle(parsed.selectedLifestyle || "");
        setSelectedGoal(parsed.selectedGoal || "");
      } catch {
        sessionStorage.removeItem(ROUTINE_STATE_CACHE_KEY);
      }
    }

    const restoreScroll = () => {
      const savedScroll = sessionStorage.getItem(ROUTINE_SCROLL_CACHE_KEY);
      if (!savedScroll) return;

      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo(0, Number(savedScroll));
        }, 120);
      });
    };

    restoreScroll();

    const saveScroll = () => {
      sessionStorage.setItem(ROUTINE_SCROLL_CACHE_KEY, String(window.scrollY));
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("beforeunload", saveScroll);

    const unsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        sessionStorage.removeItem(ROUTINE_PRODUCTS_CACHE_KEY);
        return;
      }

      const loaded: RoutineProduct[] = Object.entries(data)
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
      sessionStorage.setItem(ROUTINE_PRODUCTS_CACHE_KEY, JSON.stringify(loaded));

      saveFirebaseProducts(
        loaded.map((p) => ({
          id: p.id,
          slug: p.slug,
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
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("beforeunload", saveScroll);
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("cartUpdated", updateCart);
      window.removeEventListener("storage", updateWishlist);
      window.removeEventListener("storage", updateCart);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      ROUTINE_STATE_CACHE_KEY,
      JSON.stringify({
        routineType,
        selectedSkinType,
        selectedConcern,
        selectedLifestyle,
        selectedGoal,
      })
    );
  }, [routineType, selectedSkinType, selectedConcern, selectedLifestyle, selectedGoal]);

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


  const handleSaveRoutine = async () => {
    if (!currentUserId) {
      
      router.push("/login");
      return;
    }

    if (!selectedSkinType || !selectedConcern || !selectedLifestyle || !selectedGoal) {
      
      return;
    }

    if (selectedRoutineProducts.length === 0) {
            return;
    }

    try {
      setSavingRoutine(true);

      const routineRef = push(
        ref(database, `users/${currentUserId}/savedRoutines`)
      );

      const routineProducts = selectedRoutineProducts.map((product, index) => ({
        id: product.id,
        slug: product.slug || "",
        firebaseId: product.firebaseId || "",
        name: product.name,
        brand: product.brand || "ZAYY Care",
        category: product.category,
        image: product.image,
        price: Number(product.price || 0),
        oldPrice: Number(product.oldPrice || product.price || 0),
        stock: Number(product.stock || 0),
        step: routineSteps[index] || product.category,
      }));

      await set(routineRef, {
        id: routineRef.key,
        routineType,
        skinType: selectedSkinType,
        concern: selectedConcern,
        lifestyle: selectedLifestyle,
        goal: selectedGoal,
        products: routineProducts,
        estimatedTotal,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      
      router.push("/profile/routine");
    } catch (error) {
      console.error("Failed to save routine:", error);
    
    } finally {
      setSavingRoutine(false);
    }
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
        className="min-h-screen overflow-x-hidden bg-[#fafaf7]"
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
          <div className="mx-auto grid w-full max-w-[1500px] gap-5 lg:grid-cols-[300px_1fr_320px]">
            <aside className="min-w-0 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
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

            <section className="min-w-0 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4 sm:p-5">
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

              <div className="my-7 flex w-full min-w-0 items-center justify-start gap-3 overflow-x-auto pb-2">
                {routineSteps.map((step, index) => (
                  <div key={step} className="flex min-w-[90px] shrink-0 flex-col items-center">
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
                      <div className="w-full max-w-full min-w-0 overflow-hidden">
                        <div className="flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-4 pr-4 [-webkit-overflow-scrolling:touch] sm:gap-5">
                          {group.products.map((product) => (
                            <PremiumProductCard
                              key={product.firebaseId || product.id}
                              product={product as any}
                              className="w-[78vw] max-w-[245px] shrink-0 snap-start sm:w-[245px] md:w-[260px]"
                              isWishlisted={wishlist.includes(product.id)}
                              onToggleWishlist={handleToggleWishlist}
                              onAddToCart={handleAddToCart}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit min-w-0 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 lg:sticky lg:top-[120px]">
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

              <button
                type="button"
                onClick={handleSaveRoutine}
                disabled={selectedRoutineProducts.length === 0 || savingRoutine}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-sm font-black text-[#0b3d2e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Heart size={16} />
                {savingRoutine ? "Saving..." : "Save Routine"}
              </button>
            </aside>
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