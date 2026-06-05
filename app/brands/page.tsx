"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { ArrowRight, Package, Search, Sparkles } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart } from "@/lib/cart";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

type Brand = {
  id: string;
  name?: string;
  logo?: string;
  focus?: string;
  active?: boolean;
};

type BrandProduct = {
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
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src.startsWith("public/") ? src.replace("public", "") : src;
}

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

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setWishlist(getWishlist());

    const unsubBrands = onValue(ref(database, "brands"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBrands([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          name: value.name || "Brand",
          logo: safeLogo(value.logo),
          focus: value.focus || "Korean skincare",
          active: value.active !== false,
        }))
        .filter((brand) => brand.active);

      setBrands(loaded);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        return;
      }

      const loaded: BrandProduct[] = Object.entries(data).map(
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
        })
      );

      setProducts(loaded);
    });

    const updateWishlist = () => setWishlist(getWishlist());
    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      unsubBrands();
      unsubProducts();
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) =>
      (brand.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [brands, search]);

  const selectedBrandProducts = useMemo(() => {
    if (!selectedBrand) return [];

    return products.filter(
      (product) =>
        product.brand?.toLowerCase() === selectedBrand.toLowerCase()
    );
  }, [products, selectedBrand]);

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
      <div className="page-glow" />

      <Navbar />

      <div className="pt-[175px] pb-10 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto space-y-8">
          <section className="glass glass-premium rounded-[38px] p-8 lg:p-11">
            <p className="text-[#556B2F] font-bold mb-2 uppercase tracking-[0.14em] text-sm">
              Curated Korean Skincare
            </p>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="dream-font text-[54px] sm:text-[72px] text-black leading-none">
                  Brands
                </h1>

                <p className="text-gray-600 leading-8 max-w-[760px] mt-5">
                  Explore trusted skincare brands selected for authentic formulas,
                  gentle routines, and visible everyday glow.
                </p>
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover w-fit shadow-[0_18px_45px_rgba(85,107,47,0.28)]"
              >
                Shop Products
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>

          <section className="glass glass-premium rounded-[30px] p-5">
            <div className="glass-soft flex items-center gap-3 rounded-2xl px-5 py-4">
              <Search className="text-[#556B2F]" size={20} />
              <input
                type="text"
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-[#1f2a1f]"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.length === 0 ? (
              <div className="glass glass-premium rounded-[30px] p-8 text-gray-600">
                No brands found. Add brands from Admin Panel.
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const brandName = brand.name || "Brand";
                const count = products.filter(
                  (product) =>
                    product.brand?.toLowerCase() === brandName.toLowerCase()
                ).length;
                const active = selectedBrand === brandName;

                return (
                  <button
                    type="button"
                    key={brand.id}
                    onClick={() => setSelectedBrand(active ? "" : brandName)}
                    className={`glass glass-premium rounded-[32px] p-6 premium-hover min-h-[230px] flex flex-col justify-between text-left transition ${
                      active
                        ? "ring-2 ring-[#31571f] bg-[#31571f]/10"
                        : ""
                    }`}
                  >
                    <div className="glass-soft rounded-[26px] h-[104px] flex items-center justify-center px-6">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brandName}
                          className="max-h-[62px] max-w-[160px] object-contain"
                        />
                      ) : (
                        <div className="flex h-[66px] w-[66px] items-center justify-center rounded-2xl bg-[#31571f] text-lg font-black text-white shadow-[0_18px_40px_rgba(49,87,31,0.28)]">
                          {getBrandInitials(brandName)}
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <h2 className="text-2xl font-bold text-black">
                        {brandName}
                      </h2>

                      <p className="text-gray-600 mt-2 leading-7">
                        {brand.focus || "Korean skincare"}
                      </p>

                      <p className="mt-3 inline-flex rounded-full bg-white/35 px-4 py-2 text-sm font-bold text-[#556B2F]">
                        {count > 0 ? `${count} products available` : "Coming soon"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          {selectedBrand && (
            <section className="glass glass-premium rounded-[38px] p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#556B2F] font-bold">
                    <Sparkles size={20} />
                    Selected Brand
                  </div>

                  <h2 className="dream-font text-[46px] text-[#142012] mt-2">
                    {selectedBrand}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    Products from {selectedBrand}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBrand("")}
                  className="glass-soft rounded-full px-6 py-3 font-bold text-[#1f2a1f]"
                >
                  Clear
                </button>
              </div>

              {selectedBrandProducts.length === 0 ? (
                <div className="glass-soft rounded-[26px] p-6">
                  <Package className="text-[#556B2F]" size={34} />

                  <p className="mt-4 font-bold text-[#142012]">
                    No products found for this brand.
                  </p>

                  <p className="mt-2 text-gray-600">
                    Product edit করে Brand field exactly{" "}
                    <b>{selectedBrand}</b> করো।
                  </p>
                </div>
              ) : (
                <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
                  {selectedBrandProducts.map((product) => (
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