"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";
import { database } from "@/firebase/config";
import { addToCart, saveFirebaseProducts } from "@/lib/cart";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

type Brand = {
  id: string;
  brandId?: string;
  name?: string;
  logo?: string;
  focus?: string;
  country?: string;
  category?: string | string[];
  active?: boolean;
  deleted?: boolean;
};

type Product = {
  id: number;
  firebaseId?: string;
  brandId?: string;
  name: string;
  brand?: string;
  category: string;
  image: string;
  images?: string[];
  gallery?: string[];
  price: number;
  oldPrice: number;
  sale?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  active?: boolean;
  deleted?: boolean;
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";

  let path = src.trim();

  if (path.startsWith("public/")) path = path.replace("public", "");
  if (path.startsWith("/public/")) path = path.replace("/public", "");

  if (
    !path.startsWith("/") &&
    !path.startsWith("http://") &&
    !path.startsWith("https://") &&
    !path.startsWith("data:image")
  ) {
    path = `/${path}`;
  }

  return path;
}

function getProductImage(value: any) {
  const image =
    value?.image ||
    value?.imageUrl ||
    value?.thumbnail ||
    value?.photo ||
    value?.coverImage ||
    value?.mainImage ||
    value?.images?.[0] ||
    value?.gallery?.[0];

  return safeImage(image);
}

function safeLogo(src?: string) {
  if (!src || src.trim() === "") return "";

  let path = src.trim();
  if (path.startsWith("public/")) path = path.replace("public", "");
  if (path.startsWith("/public/")) path = path.replace("/public", "");
  if (!path.startsWith("/") && !path.startsWith("http")) path = `/${path}`;

  return path;
}

function normalize(value?: string) {
  return (value || "").toLowerCase().trim().replace(/\s+/g, "-");
}

function getCategoryText(category?: string | string[]) {
  if (!category) return "Skin Care";
  if (Array.isArray(category)) return category.join(", ");
  return category;
}

export default function BrandDetailsPage() {
  const params = useParams();
  const brandSlug = String(params.id || "");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 768);
    resize();

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    setWishlist(getWishlist());

    const unsubBrands = onValue(ref(database, "brands"), (snapshot) => {
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
            brandId: brand.brandId || id,
            name: brand.name || "Brand",
            logo: safeLogo(brand.logo),
            focus: brand.focus || "Korean skincare",
            country: brand.country || "Unknown",
            category: brand.category || "Skin Care",
            active: brand.active !== false,
            deleted: brand.deleted,
          };
        })
        .filter((brand) => brand.active !== false && brand.deleted !== true);

      setBrands(loaded);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        saveFirebaseProducts([]);
        setLoading(false);
        return;
      }

      const loaded: Product[] = Object.entries(data)
        .map(([firebaseId, value], index) => {
          const product = value as any;

          return {
            firebaseId,
            id: Number(product.id || index + 1),
            brandId: product.brandId || "",
            name: product.name || "Unnamed Product",
            brand: product.brand || "ZAYY Care",
            category: product.category || "Korean Skincare",
            image: getProductImage(product),
            images: Array.isArray(product.images) ? product.images : [],
            gallery: Array.isArray(product.gallery) ? product.gallery : [],
            price: Number(product.price || 0),
            oldPrice: Number(product.oldPrice || product.price || 0),
            sale: product.sale || "New",
            rating: Number(product.rating || 0),
            reviews: Number(product.reviews || 0),
            stock: Number(product.stock || 0),
            deleted: product.deleted,
            active: product.active,
          };
        })
        .filter(
          (product) => product.deleted !== true && product.active !== false
        );

      setProducts(loaded);

      saveFirebaseProducts(
        loaded.map((product) => ({
          id: product.id,
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

  const brand = useMemo(() => {
    return brands.find((item) => {
      return (
        normalize(item.brandId) === normalize(brandSlug) ||
        normalize(item.id) === normalize(brandSlug) ||
        normalize(item.name) === normalize(brandSlug)
      );
    });
  }, [brands, brandSlug]);

  const brandProducts = useMemo(() => {
    if (!brand) return [];

    return products.filter((product) => {
      const matchByBrandId =
        product.brandId &&
        brand.brandId &&
        normalize(product.brandId) === normalize(brand.brandId);

      const matchByBrandName =
        product.brand &&
        brand.name &&
        normalize(product.brand) === normalize(brand.name);

      return matchByBrandId || matchByBrandName;
    });
  }, [products, brand]);

  const handleAddToCart = (id: number) => {
    const product = products.find((item) => item.id === id);

    if (!product || Number(product.stock || 0) <= 0) {
      alert("This product is out of stock.");
      return;
    }

    addToCart(id);
  };

  const handleToggleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
  };

  return (
    <>
      <Navbar />

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
                alt="ZAYY Care brand hero"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/85 to-[#f5f1e8]/20" />

            <div className="mx-auto max-w-[1820px] px-4 py-12 sm:px-8 md:py-16 lg:px-14 lg:py-20">
              <div className="relative z-10 max-w-[620px]">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#263421]">
                  <Link href="/">Home</Link>
                  <span>›</span>
                  <Link href="/brands">Brands</Link>
                  <span>›</span>
                  <span>{brand?.name || "Brand"}</span>
                </div>

                <h1 className="dream-font text-[48px] leading-none text-[#0b3d2e] sm:text-[70px]">
                  {brand?.name || "Brand"}
                </h1>

                <p className="mt-4 max-w-[520px] text-[16px] leading-8 text-[#263421] sm:text-[17px]">
                  {brand?.focus ||
                    "Explore authentic skincare products from this brand."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-[6px] bg-[#FCFCFA] px-4 py-2 text-sm font-black text-[#003f2a]">
                    {brand?.country || "Unknown"}
                  </span>

                  <span className="rounded-[6px] bg-[#FCFCFA] px-4 py-2 text-sm font-black text-[#003f2a]">
                    {getCategoryText(brand?.category)}
                  </span>

                  <span className="rounded-[6px] bg-[#003f2a] px-4 py-2 text-sm font-black text-white">
                    {brandProducts.length} Products
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-[1820px]">
            <div className="mb-5 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4">
              <p className="text-sm text-[#4f5f49]">
                {loading ? "Loading..." : `${brandProducts.length} Products`}
              </p>
            </div>

            {loading ? (
              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center text-[#263421]">
                Loading products...
              </div>
            ) : !brand ? (
              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
                <h2 className="text-2xl font-black text-[#102015]">
                  Brand not found
                </h2>
                <p className="mt-2 text-[#4f5f49]">
                  Brand ID check করো অথবা Admin Panel থেকে brand add করো।
                </p>
              </div>
            ) : brandProducts.length === 0 ? (
              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
                <h2 className="text-2xl font-black text-[#102015]">
                  No products found
                </h2>
                <p className="mt-2 text-[#4f5f49]">
                  Product-এর <b>brandId</b> exactly{" "}
                  <b>{brand.brandId || brand.id}</b> করো অথবা Brand name{" "}
                  <b>{brand.name}</b> রাখো।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {brandProducts.map((product) => (
                  <PremiumProductCard
                    key={product.firebaseId || product.id}
                    product={product as any}
                    className="w-full rounded-[6px]"
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}