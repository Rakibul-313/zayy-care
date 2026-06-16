"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import { ArrowRight, Check, SlidersHorizontal, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { database } from "@/firebase/config";

type Brand = {
  id: string;
  firebaseId?: string;
  brandId?: string;
  name?: string;
  logo?: string;
  focus?: string;
  country?: string;
  category?: string | string[];
  type?: string;
  active?: boolean;
  deleted?: boolean;
};

function safeLogo(src?: string) {
  if (!src || src.trim() === "") return "";

  let path = src.trim();

  if (path.startsWith("public/")) path = path.replace("public", "");
  if (path.startsWith("/public/")) path = path.replace("/public", "");
  if (!path.startsWith("/") && !path.startsWith("http")) path = `/${path}`;

  return path;
}

function getBrandInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getBrandCategories(category?: string | string[], type?: string) {
  if (Array.isArray(category)) return category;
  if (category) return [category];
  if (type) return [type];
  return ["Skin Care"];
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "brands"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBrands([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => {
          const brand = value as Partial<Brand>;

          return {
            id,
            firebaseId: id,
            brandId: brand.brandId || id,
            name: brand.name || "Brand",
            logo: safeLogo(brand.logo),
            focus: brand.focus || "Korean skincare",
            country: brand.country || "Unknown",
            category: brand.category || brand.type || ["Skin Care"],
            type: brand.type,
            active: brand.active !== false,
            deleted: brand.deleted,
          };
        })
        .filter((brand) => brand.active !== false && brand.deleted !== true);

      setBrands(loaded);
    });

    return () => unsubscribe();
  }, []);

  const countries = useMemo(() => {
    const unique = Array.from(
      new Set(brands.map((brand) => brand.country || "Unknown"))
    );

    return ["All", ...unique];
  }, [brands]);

  const categories = useMemo(() => {
    const allCategories = brands.flatMap((brand) =>
      getBrandCategories(brand.category, brand.type)
    );

    const unique = Array.from(new Set(allCategories.filter(Boolean)));

    return ["All", ...unique];
  }, [brands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const brandCategories = getBrandCategories(brand.category, brand.type);

      const matchCountry =
        selectedCountry === "All" ||
        (brand.country || "Unknown").toLowerCase() ===
          selectedCountry.toLowerCase();

      const matchCategory =
        selectedCategory === "All" ||
        brandCategories.some(
          (category) =>
            category.toLowerCase() === selectedCategory.toLowerCase()
        );

      return matchCountry && matchCategory;
    });
  }, [brands, selectedCountry, selectedCategory]);

  const clearFilters = () => {
    setSelectedCountry("All");
    setSelectedCategory("All");
  };

  const mobileFilterDrawer =
    mounted && mobileFilterOpen
      ? createPortal(
          <div className="fixed inset-0 z-[9999999] bg-black/50 lg:hidden">
            <button
              type="button"
              aria-label="Close filter"
              onClick={() => setMobileFilterOpen(false)}
              className="absolute inset-0 h-full w-full"
            />

            <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[86vh] overflow-y-auto rounded-t-[18px] bg-white p-5 shadow-[0_-20px_60px_rgba(0,0,0,0.18)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-[#102015]">
                  Filter By
                </h3>

                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]"
                >
                  <X size={18} />
                </button>
              </div>

              <h4 className="mb-3 text-sm font-black uppercase text-[#102015]">
                Country
              </h4>

              <div className="flex flex-wrap gap-2">
                {countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => setSelectedCountry(country)}
                    className={`rounded-[6px] border px-4 py-2 text-sm font-bold ${
                      selectedCountry === country
                        ? "border-[#003f2a] bg-[#003f2a] text-white"
                        : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#263421]"
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-sm font-black uppercase text-[#102015]">
                  Category
                </h4>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-[6px] border px-4 py-2 text-sm font-bold ${
                        selectedCategory === category
                          ? "border-[#003f2a] bg-[#003f2a] text-white"
                          : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#263421]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] py-3 font-black text-[#0b3d2e]"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="rounded-[6px] bg-[#003f2a] py-3 font-black text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{
          type: "spring",
          stiffness: 70,
          damping: 20,
          mass: 0.9,
        }}
        className="min-h-screen bg-[#fafaf7]"
      >
        <section className="pt-[105px] lg:pt-[115px]">
          <div className="relative overflow-hidden bg-[#f5f1e8]">
            <div className="absolute inset-0 opacity-25 md:opacity-100">
              <Image
                src={
                  isMobile
                    ? "/banners/shop-hero-mobile.png"
                    : "/banners/shop-hero-desktop.png"
                }
                alt="ZAYY Care brands hero"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/85 to-[#f5f1e8]/20" />

            <div className="mx-auto max-w-[1820px] px-4 py-12 sm:px-8 md:py-16 lg:px-14 lg:py-20">
              <div className="relative z-10 max-w-[560px]">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#263421]">
                  <Link href="/">Home</Link>
                  <span>›</span>
                  <Link href="/brands">Brands</Link>
                  <span>›</span>
                  <span>All Brands</span>
                </div>

                <h1 className="dream-font text-[48px] leading-none text-[#0b3d2e] sm:text-[70px]">
                  Brands
                </h1>

                <p className="mt-4 max-w-[460px] text-[16px] leading-8 text-[#263421] sm:text-[17px]">
                  Explore trusted skincare brands selected for authentic
                  formulas, gentle routines, and visible everyday glow.
                </p>

                <Link
                  href="/shop"
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-[6px] bg-[#003f2a] px-8 py-4 font-black uppercase text-white shadow-[0_18px_45px_rgba(11,61,46,0.24)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#062a18] hover:shadow-[0_22px_48px_rgba(11,61,46,0.32)]"
                >
                  Shop Products
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] gap-8 lg:grid-cols-[250px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-[120px] rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
                <div className="mb-5 flex items-center justify-between border-b border-[#0b3d2e]/10 pb-4">
                  <h3 className="text-sm font-black uppercase text-[#102015]">
                    Filter By
                  </h3>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-[#6b7568]"
                  >
                    Clear All
                  </button>
                </div>

                <h4 className="mb-3 text-xs font-black uppercase text-[#102015]">
                  Country
                </h4>

                <div className="space-y-3">
                  {countries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setSelectedCountry(country)}
                      className="flex w-full items-center justify-between text-sm text-[#263421]"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                            selectedCountry === country
                              ? "border-[#003f2a] bg-[#003f2a] text-white"
                              : "border-[#0b3d2e]/20"
                          }`}
                        >
                          {selectedCountry === country && <Check size={12} />}
                        </span>
                        {country}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="my-6 border-t border-[#0b3d2e]/10" />

                <h4 className="mb-3 text-xs font-black uppercase text-[#102015]">
                  Category
                </h4>

                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className="flex w-full items-center gap-2 text-sm text-[#263421]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                          selectedCategory === category
                            ? "border-[#003f2a] bg-[#003f2a] text-white"
                            : "border-[#0b3d2e]/20"
                        }`}
                      >
                        {selectedCategory === category && <Check size={12} />}
                      </span>
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              <div className="mb-5 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4">
                <p className="text-sm text-[#4f5f49]">
                  {filteredBrands.length} Brands
                </p>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(true)}
                    className="flex shrink-0 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-2.5 text-sm font-black text-[#102015]"
                  >
                    Filter
                    <SlidersHorizontal size={17} />
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`shrink-0 rounded-[6px] border px-5 py-2.5 text-sm font-bold ${
                        selectedCategory === category
                          ? "border-[#003f2a] bg-[#003f2a] text-white"
                          : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#263421]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <section className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {filteredBrands.length === 0 ? (
                  <div className="col-span-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-8 text-[#263421] shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
                    No brands found. Add brands from Admin Panel.
                  </div>
                ) : (
                  filteredBrands.map((brand, index) => {
                    const brandName = brand.name || "Brand";
                    const href = `/brands/${brand.brandId || brand.id}`;

                    return (
                      <motion.div
                        key={brand.id}
                        initial={{ opacity: 0, y: 26, scale: 0.98 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{
                          delay: index * 0.04,
                          type: "spring",
                          stiffness: 80,
                          damping: 20,
                        }}
                      >
                        <Link href={href} className="group block text-center">
                          <div className="mx-auto flex aspect-square w-full max-w-[105px] items-center justify-center overflow-hidden rounded-full border border-[#0b3d2e]/10 bg-[#FCFCFA] p-4 shadow-[0_8px_24px_rgba(11,61,46,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#003f2a] group-hover:shadow-[0_16px_38px_rgba(11,61,46,0.14)] sm:max-w-[115px]">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brandName}
                                className="max-h-[48px] max-w-[82px] object-contain sm:max-h-[55px] sm:max-w-[90px]"
                              />
                            ) : (
                              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#003f2a] text-sm font-black text-white sm:h-[58px] sm:w-[58px]">
                                {getBrandInitials(brandName)}
                              </div>
                            )}
                          </div>

                          <h2 className="mt-3 line-clamp-1 text-xs font-black text-[#102015] transition group-hover:text-[#003f2a] sm:text-sm">
                            {brandName}
                          </h2>
                        </Link>
                      </motion.div>
                    );
                  })
                )}
              </section>
            </div>
          </div>
        </section>

        <Footer />
      </motion.main>

      {mobileFilterDrawer}
    </>
  );
}