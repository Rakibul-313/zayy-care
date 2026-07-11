"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, remove } from "firebase/database";
import {
  CalendarDays,
  Heart,
  Moon,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, database } from "@/firebase/config";
import { addToCart, getCartCount, saveFirebaseProducts } from "@/lib/cart";
import { getWishlistItems } from "@/lib/wishlist";

type SavedRoutineProduct = {
  id: number;
  slug?: string;
  firebaseId?: string;
  name: string;
  brand?: string;
  category?: string;
  image: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  step?: string;
};

type SavedRoutine = {
  id: string;
  routineType: "morning" | "evening";
  skinType?: string;
  concern?: string;
  lifestyle?: string;
  goal?: string;
  products?: SavedRoutineProduct[] | Record<string, SavedRoutineProduct>;
  estimatedTotal?: number;
  createdAt?: number;
  updatedAt?: number;
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";

  const image = src.trim();

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }

  return `/${image}`;
}

function formatMoney(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))}`;
}

function formatDate(value?: number) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeProducts(
  products?: SavedRoutineProduct[] | Record<string, SavedRoutineProduct>
) {
  if (!products) return [];

  if (Array.isArray(products)) {
    return products.filter(Boolean);
  }

  return Object.values(products).filter(Boolean);
}

export default function ProfileRoutinePage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistItems().length);
    };

    updateCounts();

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  useEffect(() => {
    let unsubscribeRoutines: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      unsubscribeRoutines = onValue(
        ref(database, `users/${user.uid}/savedRoutines`),
        (snapshot) => {
          const data = snapshot.val();

          if (!data) {
            setRoutines([]);
            setLoading(false);
            return;
          }

          const loaded: SavedRoutine[] = Object.entries(data)
            .map(([id, value]) => ({
              id,
              ...(value as Omit<SavedRoutine, "id">),
            }))
            .sort(
              (a, b) =>
                Number(b.updatedAt || b.createdAt || 0) -
                Number(a.updatedAt || a.createdAt || 0)
            );

          setRoutines(loaded);

          const allProducts = loaded.flatMap((routine) =>
            normalizeProducts(routine.products)
          );

          saveFirebaseProducts(
            allProducts.map((product) => ({
              id: product.id,
              slug: product.slug,
              firebaseId: product.firebaseId,
              name: product.name,
              image: product.image,
              category: product.category || "Skincare",
              price: Number(product.price || 0),
              oldPrice: Number(product.oldPrice || product.price || 0),
              stock: Number(product.stock || 0),
              quantity: 0,
            }))
          );

          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeRoutines) {
        unsubscribeRoutines();
      }
    };
  }, [router]);

  const latestRoutine = routines[0];

  const totalSavedProducts = useMemo(() => {
    return routines.reduce(
      (total, routine) => total + normalizeProducts(routine.products).length,
      0
    );
  }, [routines]);

  const handleAddRoutineToCart = (routine: SavedRoutine) => {
    const products = normalizeProducts(routine.products);

    if (products.length === 0) {
      alert("No products found in this routine.");
      return;
    }

    products.forEach((product) => {
      if (Number(product.stock || 0) > 0) {
        addToCart(product.id);
      }
    });

    setCartCount(getCartCount());
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!uid || !routineId) return;


    try {
      setDeletingId(routineId);

      await remove(
        ref(database, `users/${uid}/savedRoutines/${routineId}`)
      );
    } catch (error) {
      console.error("Failed to delete routine:", error);
      alert("Failed to delete routine.");
    } finally {
      setDeletingId("");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

        <main className="min-h-screen bg-[#fafaf7] px-4 pt-[130px]">
          <div className="mx-auto max-w-[900px] rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center text-[#4f5f49]">
            Loading saved routine...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pb-12 pt-[110px] sm:px-8 lg:px-14 lg:pt-[125px]">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[56px]">
                  My Skincare Routine
                </h1>

                <p className="mt-3 max-w-[700px] text-sm leading-7 text-[#4f5f49]">
                  View your saved skincare routines, add products to cart, or build a new personalized routine.
                </p>
              </div>

              <Link
                href="/routine-builder"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] px-5 text-sm font-black text-white"
              >
                <Sparkles size={17} />
                Build New Routine
              </Link>
            </div>

            {routines.length === 0 ? (
              <div className="rounded-[8px] border border-[#0b3d2e]/10 bg-white p-8 text-center shadow-[0_10px_30px_rgba(11,61,46,0.06)] sm:p-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f1e8] text-[#0b3d2e]">
                  <Sparkles size={28} />
                </div>

                <h2 className="mt-5 text-xl font-black text-[#102015]">
                  No saved routine yet
                </h2>

                <p className="mx-auto mt-2 max-w-[560px] text-sm leading-7 text-[#4f5f49]">
                  Build a personalized AM or PM skincare routine based on your skin type, concern, lifestyle and goal.
                </p>

                <Link
                  href="/routine-builder"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-[6px] bg-[#0b3d2e] px-6 text-sm font-black text-white"
                >
                  Build My Routine
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  <SummaryCard
                    label="Saved Routines"
                    value={routines.length}
                  />

                  <SummaryCard
                    label="Saved Products"
                    value={totalSavedProducts}
                  />

                  <SummaryCard
                    label="Latest Total"
                    value={formatMoney(latestRoutine?.estimatedTotal)}
                  />
                </div>

                <div className="space-y-6">
                  {routines.map((routine) => {
                    const products = normalizeProducts(routine.products);
                    const RoutineIcon =
                      routine.routineType === "evening" ? Moon : Sun;

                    return (
                      <article
                        key={routine.id}
                        className="overflow-hidden rounded-[8px] border border-[#0b3d2e]/10 bg-white shadow-[0_10px_30px_rgba(11,61,46,0.06)]"
                      >
                        <div className="flex flex-col justify-between gap-4 border-b border-[#0b3d2e]/10 bg-[#f5f1e8] p-5 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#0b3d2e] text-white">
                              <RoutineIcon size={21} />
                            </div>

                            <div>
                              <h2 className="text-lg font-black capitalize text-[#102015]">
                                {routine.routineType} Routine
                              </h2>

                              <p className="flex items-center gap-1.5 text-xs text-[#4f5f49]">
                                <CalendarDays size={13} />
                                Saved {formatDate(routine.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href="/routine-builder"
                              className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-white px-4 text-xs font-black text-[#0b3d2e]"
                            >
                              Edit Routine
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeleteRoutine(routine.id)}
                              disabled={deletingId === routine.id}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border border-red-200 bg-white px-4 text-xs font-black text-red-500 disabled:opacity-50"
                            >
                              <Trash2 size={15} />
                              {deletingId === routine.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-6 p-5 lg:grid-cols-[260px_1fr_220px]">
                          <div>
                            <h3 className="mb-4 text-sm font-black uppercase text-[#102015]">
                              Routine Profile
                            </h3>

                            <div className="space-y-3">
                              <InfoRow
                                label="Skin Type"
                                value={routine.skinType}
                              />

                              <InfoRow
                                label="Concern"
                                value={routine.concern}
                              />

                              <InfoRow
                                label="Lifestyle"
                                value={routine.lifestyle}
                              />

                              <InfoRow
                                label="Goal"
                                value={routine.goal}
                              />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h3 className="mb-4 text-sm font-black uppercase text-[#102015]">
                              Routine Products
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {products.map((product, index) => (
                                <Link
                                  key={`${routine.id}-${product.id}-${index}`}
                                  href={`/product/${product.slug || product.id}`}
                                  className="grid grid-cols-[64px_1fr] gap-3 rounded-[6px] border border-[#0b3d2e]/10 p-3 transition hover:border-[#0b3d2e]/30"
                                >
                                  <div className="relative h-16 w-16 overflow-hidden rounded-[6px] bg-[#f5f1e8]">
                                    <Image
                                      src={safeImage(product.image)}
                                      alt={product.name}
                                      fill
                                      sizes="64px"
                                      className="object-contain p-2"
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase text-[#0b3d2e]">
                                      {product.step || `Step ${index + 1}`}
                                    </p>

                                    <p className="line-clamp-2 text-sm font-black text-[#102015]">
                                      {product.name}
                                    </p>

                                    <p className="mt-1 text-xs font-bold text-[#0b3d2e]">
                                      {formatMoney(product.price)}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>

                          <div className="h-fit rounded-[6px] bg-[#f5f1e8] p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-[#4f5f49]">
                                Products
                              </span>

                              <span className="font-black text-[#102015]">
                                {products.length}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-[#0b3d2e]/10 pt-3">
                              <span className="text-sm font-bold text-[#4f5f49]">
                                Estimated Total
                              </span>

                              <span className="text-lg font-black text-[#0b3d2e]">
                                {formatMoney(routine.estimatedTotal)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddRoutineToCart(routine)}
                              disabled={products.length === 0}
                              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] text-sm font-black text-white disabled:opacity-50"
                            >
                              <ShoppingBag size={16} />
                              Add All to Cart
                            </button>

                            <Link
                              href="/wishlist"
                              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-white text-sm font-black text-[#0b3d2e]"
                            >
                              <Heart size={16} />
                              View Wishlist
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-[6px] bg-[#fafaf7] p-3">
      <p className="text-[10px] font-black uppercase text-[#4f5f49]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#102015]">
        {value || "Not selected"}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4 shadow-[0_8px_24px_rgba(11,61,46,0.05)]">
      <p className="text-xs font-black uppercase text-[#4f5f49]">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-[#0b3d2e]">
        {value}
      </p>
    </div>
  );
}