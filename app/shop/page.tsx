"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import {
  Check,
  Grid2X2,
  Heart,
  Headphones,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";

import { database } from "@/firebase/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { addToCart, getCartCount, saveFirebaseProducts } from "@/lib/cart";
import { toggleWishlist, getWishlistCount, isWishlisted } from "@/lib/wishlist";

type ShopProduct = {
  id: number;
  firebaseId?: string;
  slug?: string;
  name: string;
  brand: string;
  category: string;
  productType?: string;
  image: string;
  price: number;
  oldPrice: number;
  sale: string;
  rating: number;
  reviews: number;
  stock?: number;
  deleted?: boolean;
  active?: boolean;
  bestSeller?: boolean;
};

type ShippingSettings = {
  enabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingMinAmount: number;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  noLimitMode: boolean;
};

const defaultShippingSettings: ShippingSettings = {
  enabled: true,
  freeShippingEnabled: true,
  freeShippingMinAmount: 1500,
  insideDhakaCharge: 80,
  outsideDhakaCharge: 120,
  noLimitMode: false,
};

const taka = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
const PRODUCTS_PER_PAGE = 24;

function formatPrice(price?: number) {
  return `৳${taka.format(Number(price || 0))}`;
}

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

function getBadge(product: ShopProduct) {
  if (product.bestSeller) return "BEST";
  if (product.oldPrice > product.price) return "SALE";
  return "NEW";
}

function ShopProductCard({
  product,
  liked,
  onWishlist,
  onCart,
}: {
  product: ShopProduct;
  liked: boolean;
  onWishlist: () => void;
  onCart: () => void;
}) {
  return (
    <article className="group relative w-full min-w-0 overflow-hidden rounded-[12px] border border-[#e8e3d7] bg-white shadow-[0_10px_28px_rgba(11,61,46,0.09)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(11,61,46,0.14)]">
      <Link
        href={`/product/${(product as any).slug || product.id}`}
        className="relative flex aspect-[27/23] items-center justify-center overflow-hidden bg-[#f5f1e8]"
      >
        <img
          src={safeImage(product.image)}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>

      <span
        className={`absolute left-2 top-2 z-20 rounded-[5px] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-md sm:left-2.5 sm:top-2.5 sm:text-[9px] ${
          getBadge(product) === "SALE" ? "bg-[#ef3b2d]" : "bg-[#0b3d2e]"
        }`}
      >
        {getBadge(product)}
      </span>

      <button
        type="button"
        onClick={onWishlist}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b3d2e] shadow-md transition hover:scale-105 sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8"
      >
        <Heart size={14} fill={liked ? "currentColor" : "none"} />
      </button>

      <div className="p-2.5 sm:p-3">
        <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-[#4f7a3a] sm:text-[10px]">
          {product.brand}
        </p>

        <Link
          href={`/product/${(product as any).slug || product.id}`}
          className="line-clamp-2 min-h-[34px] text-[12px] font-bold leading-snug text-[#102015] hover:text-[#0b3d2e] sm:min-h-[36px] sm:text-[13px]"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <div className="flex items-center text-[#e3a51a]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={10}
                fill={
                  star <= Math.round(Number(product.rating || 0))
                    ? "currentColor"
                    : "transparent"
                }
              />
            ))}
          </div>

          <span className="text-[10px] font-semibold text-[#5f6d58]">
            ({product.reviews || 0})
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[16px] font-black text-[#102015] sm:text-[17px]">
            {formatPrice(product.price)}
          </span>

          {product.oldPrice > product.price && (
            <span className="text-[10px] font-semibold text-[#9a9a8f] line-through sm:text-[11px]">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onCart}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] text-[11px] font-black uppercase text-white shadow-[0_8px_18px_rgba(11,61,46,0.20)] transition hover:bg-[#062a18] sm:text-[12px]"
        >
          Add to Cart
          <ShoppingBag size={14} />
        </button>
      </div>
    </article>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedProductType, setSelectedProductType] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState("popular");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings>(defaultShippingSettings);

  const searchParams = useSearchParams();
  const searchKeyword =
    searchParams.get("search")?.trim().toLowerCase() || "";

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
    const unsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        saveFirebaseProducts([]);
        setLoading(false);
        return;
      }

      const formatted: ShopProduct[] = Object.entries(data)
        .map(([firebaseId, value], index) => {
          const product = value as Partial<ShopProduct>;

          return {
            firebaseId,
            id: Number(product.id || index + 1),
            name: product.name || "Unnamed Product",
            slug: (product as any).slug || "",
            brand: product.brand || "ZAYY Care",
            category: product.category || "Korean Skincare",
            productType: product.productType || "",
            image: safeImage(product.image),
            price: Number(product.price || 0),
            oldPrice: Number(product.oldPrice || product.price || 0),
            sale: product.sale || "New",
            rating: Number(product.rating || 0),
            reviews: Number(product.reviews || 0),
            stock: Number(product.stock || 0),
            deleted: product.deleted,
            active: product.active,
            bestSeller: product.bestSeller === true,
          };
        })
        .filter(
          (product) => product.deleted !== true && product.active !== false
        );

      setProducts(formatted);
      setMaxPrice(Math.max(...formatted.map((p) => p.price || 0), 1000));

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
    const unsubscribe = onValue(ref(database, "settings/shipping"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setShippingSettings(defaultShippingSettings);
        return;
      }

      setShippingSettings({
        enabled:
          typeof data.enabled === "boolean"
            ? data.enabled
            : defaultShippingSettings.enabled,
        freeShippingEnabled:
          typeof data.freeShippingEnabled === "boolean"
            ? data.freeShippingEnabled
            : defaultShippingSettings.freeShippingEnabled,
        freeShippingMinAmount:
          Number(data.freeShippingMinAmount) ||
          defaultShippingSettings.freeShippingMinAmount,
        insideDhakaCharge:
          Number(data.insideDhakaCharge) ||
          defaultShippingSettings.insideDhakaCharge,
        outsideDhakaCharge:
          Number(data.outsideDhakaCharge) ||
          defaultShippingSettings.outsideDhakaCharge,
        noLimitMode:
          typeof data.noLimitMode === "boolean"
            ? data.noLimitMode
            : defaultShippingSettings.noLimitMode,
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
    setWishlistIds(products.filter((p) => isWishlisted(p.id)).map((p) => p.id));
  }, [products]);

  const highestPrice = useMemo(() => {
    return Math.max(...products.map((p) => p.price || 0), 1000);
  }, [products]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    );
    return ["All", ...unique];
  }, [products]);

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  }, [products]);

  const productTypes = useMemo<string[]>(() => {
    const unique = Array.from(
      new Set(
        products
          .map((p) => p.productType)
          .filter((type): type is string => Boolean(type))
      )
    );

    return ["All", ...unique];
  }, [products]);

  const deliveryTitle = shippingSettings.enabled ? "Delivery Charge" : "Free Delivery";

  const deliveryText = useMemo(() => {
    if (!shippingSettings.enabled) return "Free for all orders";

    if (shippingSettings.freeShippingEnabled && !shippingSettings.noLimitMode) {
      return `On orders over ${formatPrice(
        shippingSettings.freeShippingMinAmount
      )}`;
    }

    return `Dhaka ${formatPrice(
      shippingSettings.insideDhakaCharge
    )} / Outside ${formatPrice(shippingSettings.outsideDhakaCharge)}`;
  }, [shippingSettings]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchCategory =
        selectedCategory === "All" ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchBrand =
        selectedBrand === "All" ||
        product.brand.toLowerCase() === selectedBrand.toLowerCase();

      const matchProductType =
        selectedProductType === "All" ||
        (product.productType || "").toLowerCase() ===
          selectedProductType.toLowerCase();

      const matchSearch =
        searchKeyword === "" ||
        product.name.toLowerCase().includes(searchKeyword) ||
        product.brand.toLowerCase().includes(searchKeyword) ||
        product.category.toLowerCase().includes(searchKeyword) ||
        (product.productType || "").toLowerCase().includes(searchKeyword);

      return (
        matchCategory &&
        matchBrand &&
        matchProductType &&
        product.price <= maxPrice &&
        matchSearch
      );
    });

    if (sortBy === "latest") result.sort((a, b) => b.id - a.id);
    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    if (sortBy === "popular") result.sort((a, b) => b.reviews - a.reviews);

    return result;
  }, [
    products,
    selectedCategory,
    selectedBrand,
    selectedProductType,
    maxPrice,
    sortBy,
    searchKeyword,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedBrand,
    selectedProductType,
    maxPrice,
    sortBy,
    searchKeyword,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);

    window.requestAnimationFrame(() => {
      document
        .getElementById("shop-products")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedBrand("All");
    setSelectedProductType("All");
    setMaxPrice(highestPrice);
  };

  const handleAddToCart = (id: number) => {
    const product = products.find((p) => p.id === id);

    if (!product || Number(product.stock || 0) <= 0) {
      alert("This product is out of stock.");
      return;
    }

    addToCart(id);
    setCartCount(getCartCount());
  };

  const handleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlistCount(getWishlistCount());
    setWishlistIds(products.filter((p) => isWishlisted(p.id)).map((p) => p.id));
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
                <h3 className="text-lg font-black text-[#102015]">Filter By</h3>

                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]"
                >
                  <X size={18} />
                </button>
              </div>

              <h4 className="mb-3 text-sm font-black uppercase text-[#102015]">
                Category
              </h4>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-[6px] border px-4 py-2 text-sm font-bold ${
                      selectedCategory === cat
                        ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                        : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#263421]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-sm font-black uppercase text-[#102015]">
                  Product Type
                </h4>

                <div className="flex flex-wrap gap-2">
                  {productTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedProductType(type)}
                      className={`rounded-[6px] border px-4 py-2 text-sm font-bold ${
                        selectedProductType === type
                          ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                          : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#263421]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-sm font-black uppercase text-[#102015]">
                  Brand
                </h4>

                <div className="flex flex-wrap gap-2">
                  {["All", ...brands].map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={`rounded-[6px] border px-4 py-2 text-sm font-bold ${
                        selectedBrand === brand
                          ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                          : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#263421]"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-sm font-black uppercase text-[#102015]">
                  Price Range
                </h4>

                <input
                  type="range"
                  min={0}
                  max={highestPrice}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#0b3d2e]"
                />

                <div className="mt-2 flex justify-between text-sm font-bold text-[#0b3d2e]">
                  <span>৳0</span>
                  <span>{formatPrice(maxPrice)}</span>
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
                  className="rounded-[6px] bg-[#0b3d2e] py-3 font-black text-white"
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
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 70, damping: 20, mass: 0.9 }}
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
                alt="ZAYY Care shop hero"
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
                  <Link href="/shop">Shop</Link>
                  <span>›</span>
                  <span>All Products</span>
                </div>

                <h1 className="dream-font text-[48px] leading-none text-[#0b3d2e] sm:text-[70px]">
                  All Products
                </h1>

                <p className="mt-4 max-w-[460px] text-[16px] leading-8 text-[#263421] sm:text-[17px]">
                  Discover our premium collection of authentic Korean skincare.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 lg:px-14">
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
                  Category
                </h4>

                <div className="space-y-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className="flex w-full items-center justify-between text-sm text-[#263421]"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                            selectedCategory === cat
                              ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                              : "border-[#0b3d2e]/20"
                          }`}
                        >
                          {selectedCategory === cat && <Check size={12} />}
                        </span>
                        {cat}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="my-6 border-t border-[#0b3d2e]/10" />

                <h4 className="mb-3 text-xs font-black uppercase text-[#102015]">
                  Product Type
                </h4>

                <div className="space-y-3">
                  {productTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedProductType(type)}
                      className="flex w-full items-center gap-2 text-sm text-[#263421]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                          selectedProductType === type
                            ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                            : "border-[#0b3d2e]/20"
                        }`}
                      >
                        {selectedProductType === type && <Check size={12} />}
                      </span>
                      {type}
                    </button>
                  ))}
                </div>

                <div className="my-6 border-t border-[#0b3d2e]/10" />

                <h4 className="mb-3 text-xs font-black uppercase text-[#102015]">
                  Brand
                </h4>

                <div className="space-y-3">
                  {["All", ...brands.slice(0, 8)].map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className="flex w-full items-center gap-2 text-sm text-[#263421]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                          selectedBrand === brand
                            ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                            : "border-[#0b3d2e]/20"
                        }`}
                      >
                        {selectedBrand === brand && <Check size={12} />}
                      </span>
                      {brand}
                    </button>
                  ))}
                </div>

                <div className="my-6 border-t border-[#0b3d2e]/10" />

                <h4 className="mb-3 text-xs font-black uppercase text-[#102015]">
                  Price Range
                </h4>

                <input
                  type="range"
                  min={0}
                  max={highestPrice}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#0b3d2e]"
                />

                <div className="mt-2 flex items-center justify-between text-xs font-semibold text-[#6b7568]">
                  <span>৳0</span>
                  <span>{formatPrice(maxPrice)}</span>
                </div>
              </div>
            </aside>

            <div id="shop-products">
              <div className="mb-5 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-[#4f5f49]">
                    {loading
                      ? "Loading..."
                      : `${filteredProducts.length} Products • Page ${currentPage} of ${totalPages}`}
                  </p>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-2 text-sm font-semibold outline-none"
                  >
                    <option value="popular">Sort by: Popular</option>
                    <option value="latest">Sort by: Latest</option>
                    <option value="price-low">Price Low to High</option>
                    <option value="price-high">Price High to Low</option>
                  </select>
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(true)}
                    className="flex shrink-0 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-2.5 text-sm font-black text-[#102015]"
                  >
                    Filter
                    <SlidersHorizontal size={17} />
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 rounded-[6px] border px-5 py-2.5 text-sm font-bold ${
                        selectedCategory === cat
                          ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                          : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#263421]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7]">
                    <Grid2X2 size={18} />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
                  No products found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[repeat(2,minmax(150px,1fr))] gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                    {paginatedProducts.map((product) => (
                      <ShopProductCard
                        key={product.firebaseId || product.id}
                        product={product}
                        liked={wishlistIds.includes(product.id)}
                        onWishlist={() => handleWishlist(product.id)}
                        onCart={() => handleAddToCart(product.id)}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => goToPage(currentPage - 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#d9d5ca] bg-white text-[#263421] transition hover:border-[#0b3d2e] hover:text-[#0b3d2e] disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                        aria-label="Previous page"
                      >
                        ‹
                      </button>

                      {visiblePages[0] > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => goToPage(1)}
                            className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#d9d5ca] bg-white text-sm font-bold text-[#263421] transition hover:border-[#0b3d2e] hover:text-[#0b3d2e] sm:h-11 sm:w-11"
                          >
                            1
                          </button>

                          {visiblePages[0] > 2 && (
                            <span className="px-1 text-sm font-black text-[#6b7568]">
                              ...
                            </span>
                          )}
                        </>
                      )}

                      {visiblePages.map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => goToPage(page)}
                          className={`flex h-10 w-10 items-center justify-center rounded-[6px] border text-sm font-bold transition sm:h-11 sm:w-11 ${
                            currentPage === page
                              ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                              : "border-[#d9d5ca] bg-white text-[#263421] hover:border-[#0b3d2e] hover:text-[#0b3d2e]"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      {visiblePages[visiblePages.length - 1] < totalPages && (
                        <>
                          {visiblePages[visiblePages.length - 1] <
                            totalPages - 1 && (
                            <span className="px-1 text-sm font-black text-[#6b7568]">
                              ...
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => goToPage(totalPages)}
                            className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#d9d5ca] bg-white text-sm font-bold text-[#263421] transition hover:border-[#0b3d2e] hover:text-[#0b3d2e] sm:h-11 sm:w-11"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#d9d5ca] bg-white text-[#263421] transition hover:border-[#0b3d2e] hover:text-[#0b3d2e] disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                        aria-label="Next page"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] grid-cols-2 gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4 lg:grid-cols-5">
            {[
              [ShieldCheck, "100% Authentic", "Genuine Korean Products"],
              [Truck, deliveryTitle, deliveryText],
              [ShoppingBag, "Secure Payment", "100% Safe Checkout"],
              [RefreshCcw, "Easy Returns", "Hassle-free returns"],
              [Headphones, "24/7 Support", "We’re here to help"],
            ].map(([Icon, title, text]: any) => (
              <div
                key={title}
                className="flex items-center gap-3 border-[#0b3d2e]/10 p-3 lg:border-r lg:last:border-r-0"
              >
                <Icon size={22} className="text-[#0b3d2e]" />
                <div>
                  <h4 className="text-sm font-black text-[#102015]">
                    {title}
                  </h4>
                  <p className="text-xs text-[#4f5f49]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </motion.main>

      {mobileFilterDrawer}
    </>
  );
}