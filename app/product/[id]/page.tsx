"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { onValue, push, ref, set } from "firebase/database";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";

import { auth, database } from "@/firebase/config";
import { products as staticProducts } from "@/data/products";
import { addToCart } from "@/lib/cart";
import { isWishlisted, toggleWishlist } from "@/lib/wishlist";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Heart,
  LockKeyhole,
  Minus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";

type ProductType = {
  id: number;
  firebaseId?: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  images?: string[];
  gallery?: string[];
  price: number;
  oldPrice: number;
  discount: number;
  stock: number;
  sale: string;
  rating: number;
  reviews: number;
  forText?: string;
  concern?: string;
  volume?: string;
  description?: string;
  howToUse?: string;
  ingredients?: string;
  benefits?: string;
  deleted?: boolean;
  active?: boolean;
  bestSeller?: boolean;
  featured?: boolean;
  flashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEndAt?: number;
};

type ReviewType = {
  id: string;
  productId: number;
  productName?: string;
  customerName?: string;
  customerEmail?: string;
  rating: number;
  comment: string;
  approved?: boolean;
  createdAt?: number;
  deleted?: boolean;
  active?: boolean;
};

const premiumButtonHover =
  "transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0";

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const cleanSrc = src.trim();

  if (
    cleanSrc.startsWith("http://") ||
    cleanSrc.startsWith("https://") ||
    cleanSrc.startsWith("/") ||
    cleanSrc.startsWith("data:image")
  ) {
    return cleanSrc;
  }

  return `/${cleanSrc}`;
}

function readBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
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

function getProductImages(value: any) {
  const images = [
    value?.image,
    value?.imageUrl,
    value?.thumbnail,
    value?.photo,
    value?.coverImage,
    value?.mainImage,
    ...(Array.isArray(value?.images) ? value.images : []),
    ...(Array.isArray(value?.gallery) ? value.gallery : []),
  ]
    .filter(Boolean)
    .map((item) => safeImage(String(item)));

  return Array.from(new Set(images));
}

function formatPrice(price: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(price || 0)}`;
}

function getBadgeText(product: ProductType) {
  if (product.flashSale) return "FLASH SALE";
  if (product.bestSeller) return "BEST SELLER";
  if (product.oldPrice > product.price) return "SALE";
  if (product.featured) return "FEATURED";
  return "NEW";
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [firebaseProducts, setFirebaseProducts] = useState<ProductType[]>([]);
  const [firebaseReviews, setFirebaseReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("Description");
  const [selectedImage, setSelectedImage] = useState(0);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const relatedScrollLeft = () => {
    document
      .getElementById("related-products-scroll")
      ?.scrollBy({ left: -340, behavior: "smooth" });
  };

  const relatedScrollRight = () => {
    document
      .getElementById("related-products-scroll")
      ?.scrollBy({ left: 340, behavior: "smooth" });
  };

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setFirebaseProducts([]);
        setLoading(false);
        return;
      }

      const formatted = Object.entries(data).map(
        ([firebaseId, value]: any, index) => {
          const regularPrice = Number(value.price || 0);
          const oldPrice = Number(value.oldPrice || value.price || 0);
          const flashSalePrice = Number(value.flashSalePrice || 0);
          const flashSale = readBoolean(value.flashSale);
          const flashSaleEndAt = Number(value.flashSaleEndAt || 0);
          const flashSaleActive =
            flashSale &&
            flashSalePrice > 0 &&
            flashSalePrice < regularPrice &&
            (!flashSaleEndAt || flashSaleEndAt > Date.now());

          const finalPrice = flashSaleActive ? flashSalePrice : regularPrice;

          return {
            firebaseId,
            id: Number(value.id || index + 1),
            name: value.name || "Unnamed Product",
            brand: value.brand || "ZAYY Care",
            category: value.category || "Korean Skincare",
            image: getProductImage(value),
            images: getProductImages(value),
            gallery: getProductImages(value),
            price: finalPrice,
            oldPrice,
            discount:
              oldPrice > 0 && finalPrice > 0 && oldPrice > finalPrice
                ? Math.round(((oldPrice - finalPrice) / oldPrice) * 100)
                : Number(value.discount || 0),
            stock: Number(value.stock || 0),
            sale: value.discount ? `${value.discount}% OFF` : value.sale || "New",
            rating: Number(value.rating || 0),
            reviews: Number(value.reviews || 0),
            forText: value.forText || "All Skin Types",
            concern: value.concern || "Healthy Skin",
            volume: value.volume || "N/A",
            description:
              value.description ||
              "Premium Korean skincare product for a healthy and glowing routine.",
            howToUse:
              value.howToUse ||
              "Apply gently after cleansing. Use daily as part of your skincare routine.",
            ingredients:
              value.ingredients ||
              "Key skincare ingredients selected for daily care.",
            benefits:
              value.benefits ||
              "Hydrates skin\nSupports glowing skin\nGentle for daily use",
            deleted: readBoolean(value.deleted),
            active: value.active !== false && value.active !== "false",
            bestSeller: readBoolean(value.bestSeller),
            featured: readBoolean(value.featured),
            flashSale,
            flashSalePrice,
            flashSaleEndAt,
          };
        }
      );

      setFirebaseProducts(formatted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "reviews"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setFirebaseReviews([]);
        return;
      }

      const formatted = Object.entries(data)
        .map(([reviewId, value]) => ({
          id: reviewId,
          ...(value as Omit<ReviewType, "id">),
        }))
        .filter(
          (review: ReviewType) =>
            Number(review.productId) === id &&
            review.approved !== false &&
            review.deleted !== true
        )
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setFirebaseReviews(formatted);
    });

    return () => unsubscribe();
  }, [id]);

  const fallbackProduct =
    staticProducts.find((p) => p.id === id) || staticProducts[0];

  const product: ProductType =
    firebaseProducts.find((p) => p.id === id) || {
      id: fallbackProduct.id,
      name: fallbackProduct.name,
      brand: fallbackProduct.brand,
      category: fallbackProduct.category,
      image: safeImage(fallbackProduct.image),
      images: [safeImage(fallbackProduct.image)],
      gallery: [safeImage(fallbackProduct.image)],
      price: fallbackProduct.price,
      oldPrice: fallbackProduct.oldPrice,
      discount: 0,
      stock: fallbackProduct.stock ? 12 : 0,
      sale: fallbackProduct.sale,
      rating: fallbackProduct.rating,
      reviews: fallbackProduct.reviews,
      forText: "All Skin Types",
      concern: "Dark Spots, Uneven Tone",
      volume: "50ml",
      description:
        "Brightening serum that helps fade dark spots and improves uneven skin tone while keeping your routine gentle and elegant.",
      howToUse: "Apply 2-3 drops after toner. Use morning or night.",
      ingredients: "Niacinamide, Squalane, Papaya Extract, Rice Bran Extract",
      benefits:
        "Fades dark spots\nBrightens skin tone\nSoothes irritation\nLightweight texture",
      bestSeller: true,
      flashSale: false,
      flashSalePrice: 0,
      flashSaleEndAt: 0,
    };

  const productImages = useMemo(() => {
    const images = [
      product.image,
      ...(Array.isArray(product.images) ? product.images : []),
      ...(Array.isArray(product.gallery) ? product.gallery : []),
    ]
      .filter(Boolean)
      .map((item) => safeImage(String(item)));

    const uniqueImages = Array.from(new Set(images));
    return uniqueImages.length > 0 ? uniqueImages : ["/products/p1.png"];
  }, [product]);

  useEffect(() => {
    setSelectedImage(0);
  }, [product.id]);

  useEffect(() => {
    if (!product.flashSale || !product.flashSaleEndAt) {
      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
      return;
    }

    const updateTimer = () => {
      const diff = Number(product.flashSaleEndAt) - Date.now();

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(interval);
  }, [product.flashSale, product.flashSaleEndAt]);

  const relatedProducts = useMemo(() => {
    return firebaseProducts
      .filter(
        (item) =>
          item.id !== product.id &&
          item.deleted !== true &&
          item.active !== false &&
          item.stock > 0
      )
      .slice(0, 10);
  }, [firebaseProducts, product.id]);

  useEffect(() => {
    setLiked(isWishlisted(product.id));
  }, [product.id]);

  const averageRating =
    firebaseReviews.length > 0
      ? (
          firebaseReviews.reduce(
            (acc, review) => acc + Number(review.rating || 0),
            0
          ) / firebaseReviews.length
        ).toFixed(1)
      : product.rating > 0
      ? product.rating.toFixed(1)
      : "No Reviews Yet";

  const isInStock = product.stock > 0;
  const hasActiveFlashSale =
    product.flashSale === true &&
    Number(product.flashSaleEndAt || 0) > Date.now();

  const benefitList = product.benefits
    ? product.benefits.split("\n").filter(Boolean)
    : [];

  const handlePrevImage = () => {
    setSelectedImage((value) =>
      value === 0 ? productImages.length - 1 : value - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImage((value) =>
      value === productImages.length - 1 ? 0 : value + 1
    );
  };

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      alert("Product is out of stock.");
      return;
    }

    for (let i = 0; i < quantity; i++) addToCart(product.id);
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) {
      alert("Product is out of stock.");
      return;
    }

    for (let i = 0; i < quantity; i++) addToCart(product.id);
    router.push("/cart");
  };

  const handleWishlist = () => {
    toggleWishlist(product.id);
    setLiked(isWishlisted(product.id));
  };

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first to submit a review.");
      return;
    }

    if (!reviewComment.trim()) {
      alert("Please write your review.");
      return;
    }

    try {
      setReviewSubmitting(true);

      const reviewRef = push(ref(database, "reviews"));

      await set(reviewRef, {
        firebaseId: reviewRef.key,
        productId: product.id,
        productName: product.name,
        customerName: user.displayName || "ZAYY Customer",
        customerEmail: user.email || "No email",
        rating: Number(reviewRating),
        comment: reviewComment,
        approved: false,
        createdAt: Date.now(),
      });

      alert("Review submitted successfully. Waiting for admin approval.");
      setReviewRating("5");
      setReviewComment("");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white pt-[140px]">
          <div className="px-4">
            <div className="mx-auto max-w-[900px] rounded-[6px] bg-[#f5f1e8] p-10 text-center">
              Loading product...
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 70,
          damping: 20,
          mass: 0.9,
        }}
        className="relative min-h-screen overflow-hidden"
      >
        <div className="fixed inset-0 -z-20 bg-white" />

        <div className="space-y-8 pt-[115px] pb-10 lg:pt-[125px]">
          <section className="px-4 sm:px-8 lg:px-14">
            <div className="mx-auto flex max-w-[1820px] flex-wrap items-center gap-2 text-sm font-medium text-[#263421]">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/shop">Shop</Link>
              <span>/</span>
              <span>{product.category}</span>
              <span>/</span>
              <span className="text-[#31571f]">{product.name}</span>
            </div>
          </section>

          <section className="px-4 sm:px-8 lg:px-14">
            <div className="mx-auto grid max-w-[1820px] gap-7 lg:grid-cols-[1fr_0.88fr_0.55fr]">
              <motion.div
                initial={{ opacity: 0, x: -26 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: "spring", damping: 20 }}
                className="grid grid-cols-[74px_1fr] gap-4 sm:grid-cols-[96px_1fr]"
              >
                <div className="flex flex-col gap-3">
                  {productImages.slice(0, 5).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-[6px] border bg-[#f5f1e8] ${premiumButtonHover} ${
                        selectedImage === index
                          ? "border-[#003f2a]"
                          : "border-[#0b3d2e]/10"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}

                  {productImages.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(5)}
                      className={`flex h-11 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] text-[#0b3d2e] ${premiumButtonHover}`}
                    >
                      <ChevronDown size={18} />
                    </button>
                  )}
                </div>

                <div className="relative aspect-square overflow-hidden rounded-[6px] bg-[#f5f1e8] shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
                  <span
                    className={`absolute left-5 top-5 z-20 rounded-[6px] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-lg ${
                      product.flashSale ? "bg-red-600" : "bg-[#003f2a]"
                    }`}
                  >
                    {getBadgeText(product)}
                  </span>

                  <button
                    type="button"
                    onClick={handleWishlist}
                    className={`absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#003f2a] shadow-[0_8px_24px_rgba(11,61,46,0.08)] hover:bg-[#efe8d8] ${premiumButtonHover}`}
                  >
                    <Heart
                      fill={liked ? "currentColor" : "none"}
                      className={liked ? "text-red-500" : "text-[#003f2a]"}
                    />
                  </button>

                  {productImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className={`absolute left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#003f2a] shadow-[0_8px_24px_rgba(11,61,46,0.08)] hover:bg-[#efe8d8] ${premiumButtonHover}`}
                      >
                        <ArrowLeft size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={handleNextImage}
                        className={`absolute right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#003f2a] shadow-[0_8px_24px_rgba(11,61,46,0.08)] hover:bg-[#efe8d8] ${premiumButtonHover}`}
                      >
                        <ArrowRight size={18} />
                      </button>
                    </>
                  )}

                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={productImages[selectedImage]}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, type: "spring", damping: 20 }}
                className="flex flex-col justify-center"
              >
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#31571f]">
                  {product.brand}
                </p>

                <h1 className="dream-font text-[42px] leading-[1.05] text-[#0d120c] sm:text-[56px] lg:text-[64px]">
                  {product.name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex text-[#d59a22]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={18} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-sm font-medium text-[#263421]">
                    {averageRating}{" "}
                    {firebaseReviews.length > 0 &&
                      `(${firebaseReviews.length} Reviews)`}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <span className="text-[36px] font-black text-[#0b3d2e]">
                    {formatPrice(product.price)}
                  </span>

                  {product.oldPrice > product.price && (
                    <span className="text-xl text-[#62705c]/70 line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}

                  {product.discount > 0 && (
                    <span className="rounded-[6px] bg-[#003f2a] px-3 py-2 text-sm font-black text-white">
                      {product.discount}% OFF
                    </span>
                  )}
                </div>

                {hasActiveFlashSale && (
                  <div className="mt-5 rounded-[6px] border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm font-black uppercase tracking-wide text-red-700">
                      ⚡ Flash Sale Ends In
                    </p>

                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      <div className="rounded-[6px] bg-white p-3 text-center shadow-[0_8px_24px_rgba(220,38,38,0.06)]">
                        <p className="text-xl font-black text-[#102015]">
                          {timeLeft.days}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-[#4f5f49]">
                          Days
                        </p>
                      </div>

                      <div className="rounded-[6px] bg-white p-3 text-center shadow-[0_8px_24px_rgba(220,38,38,0.06)]">
                        <p className="text-xl font-black text-[#102015]">
                          {timeLeft.hours}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-[#4f5f49]">
                          Hours
                        </p>
                      </div>

                      <div className="rounded-[6px] bg-white p-3 text-center shadow-[0_8px_24px_rgba(220,38,38,0.06)]">
                        <p className="text-xl font-black text-[#102015]">
                          {timeLeft.minutes}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-[#4f5f49]">
                          Min
                        </p>
                      </div>

                      <div className="rounded-[6px] bg-white p-3 text-center shadow-[0_8px_24px_rgba(220,38,38,0.06)]">
                        <p className="text-xl font-black text-[#102015]">
                          {timeLeft.seconds}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-[#4f5f49]">
                          Sec
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-3 text-sm text-[#142012]">
                  <p>
                    <span className="font-black">For:</span> {product.forText}
                  </p>
                  <p>
                    <span className="font-black">Concern:</span>{" "}
                    {product.concern}
                  </p>
                  <p>
                    <span className="font-black">Volume:</span> {product.volume}
                  </p>
                </div>

                <p
                  className={`mt-5 text-sm font-black ${
                    isInStock ? "text-[#31571f]" : "text-red-600"
                  }`}
                >
                  {isInStock ? `● In Stock (${product.stock})` : "● Stock Out"}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <div className="flex h-12 items-center overflow-hidden rounded-[6px] border border-[#0b3d2e]/20 bg-[#f5f1e8] text-[#142012]">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((value) => Math.max(1, value - 1))
                      }
                      className={`flex h-full w-12 items-center justify-center ${premiumButtonHover}`}
                    >
                      <Minus size={18} />
                    </button>

                    <span className="min-w-10 text-center font-black">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((value) =>
                          Math.min(product.stock || 1, value + 1)
                        )
                      }
                      className={`flex h-full w-12 items-center justify-center ${premiumButtonHover}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!isInStock}
                    onClick={handleAddToCart}
                    className={`flex h-12 min-w-[230px] flex-1 items-center justify-center gap-3 rounded-[6px] text-sm font-black ${
                      isInStock
                        ? `bg-[#003f2a] text-white hover:bg-[#062a18] ${premiumButtonHover}`
                        : "bg-gray-300 text-gray-500"
                    }`}
                  >
                    <ShoppingBag size={18} />
                    {isInStock ? "ADD TO CART" : "OUT OF STOCK"}
                  </button>

                  <button
                    type="button"
                    disabled={!isInStock}
                    onClick={handleBuyNow}
                    className={`flex h-12 min-w-[210px] flex-1 items-center justify-center gap-3 rounded-[6px] border border-[#0b3d2e]/25 bg-[#f5f1e8] text-sm font-black text-[#003f2a] hover:bg-[#efe8d8] ${premiumButtonHover}`}
                  >
                    <ArrowRight size={18} />
                    BUY NOW
                  </button>
                </div>
              </motion.div>

              <motion.aside
                initial={{ opacity: 0, x: 26 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring", damping: 20 }}
                className="space-y-5"
              >
                <div className="rounded-[6px] bg-[#f5f1e8] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
                  <h2 className="dream-font mb-5 text-[32px] leading-none text-[#142012]">
                    Why you&apos;ll love it
                  </h2>

                  <div className="space-y-4">
                    {benefitList.map((item) => (
                      <p
                        key={item}
                        className="flex items-center gap-3 text-sm font-semibold text-[#003f2a]"
                      >
                        <CheckCircle2 className="text-[#003f2a]" size={20} />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.aside>
            </div>
          </section>

          <section className="px-4 sm:px-8 lg:px-14">
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="mx-auto max-w-[1820px] overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] shadow-[0_8px_24px_rgba(11,61,46,0.08)]"
            >
              <div className="flex gap-5 overflow-x-auto border-b border-[#142012]/10 px-6 pt-6 pb-4">
                {["Description", "How to Use", "Ingredients", "Reviews"].map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 rounded-[6px] border-b-2 px-2 pb-2 font-bold ${premiumButtonHover} ${
                        activeTab === tab
                          ? "border-[#003f2a] text-[#003f2a]"
                          : "border-transparent text-[#142012] hover:text-[#003f2a]"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              <div className="p-6 sm:p-8">
                {activeTab !== "Reviews" ? (
                  <p className="max-w-none whitespace-pre-line text-[16px] leading-8 text-[#003f2a]">
                    {activeTab === "Description" && product.description}
                    {activeTab === "How to Use" && product.howToUse}
                    {activeTab === "Ingredients" && product.ingredients}
                  </p>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="mb-4 text-2xl font-bold text-[#142012]">
                        Customer Reviews
                      </h3>

                      {firebaseReviews.length > 0 ? (
                        <div className="space-y-4">
                          {firebaseReviews.map((review) => (
                            <div
                              key={review.id}
                              className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-5"
                            >
                              <h4 className="font-bold text-[#142012]">
                                {review.customerName || "Customer"}
                              </h4>
                              <p className="mt-3 leading-7 text-[#263421]">
                                {review.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#263421]">No reviews yet.</p>
                      )}
                    </div>

                    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-6">
                      <h3 className="mb-5 text-2xl font-bold text-[#142012]">
                        Write a Review
                      </h3>

                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(e.target.value)}
                          required
                          className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 outline-none"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ 5</option>
                          <option value="4">⭐⭐⭐⭐ 4</option>
                          <option value="3">⭐⭐⭐ 3</option>
                          <option value="2">⭐⭐ 2</option>
                          <option value="1">⭐ 1</option>
                        </select>

                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          required
                          rows={4}
                          placeholder="Write your review..."
                          className="w-full resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 outline-none"
                        />

                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className={`rounded-[6px] bg-[#003f2a] px-7 py-4 font-bold text-white hover:bg-[#062a18] disabled:opacity-60 ${premiumButtonHover}`}
                        >
                          {reviewSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </section>

          <section className="px-4 sm:px-8 lg:px-14">
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="mx-auto grid max-w-[1820px] grid-cols-2 overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] shadow-[0_8px_24px_rgba(11,61,46,0.08)] lg:grid-cols-4"
            >
              {[
                {
                  icon: ShieldCheck,
                  title: "100% Authentic",
                  text: "Genuine Korean Products",
                },
                {
                  icon: Truck,
                  title: "Free Delivery",
                  text: "On orders over ৳1,500",
                },
                {
                  icon: LockKeyhole,
                  title: "Secure Payment",
                  text: "100% Secure Checkout",
                },
                {
                  icon: RefreshCcw,
                  title: "Easy Returns",
                  text: "Hassle-free returns",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-4 border-[#0b3d2e]/10 px-6 py-5 text-left lg:border-r lg:last:border-r-0"
                  >
                    <Icon className="shrink-0 text-[#0b3d2e]" size={24} />
                    <div>
                      <h4 className="text-sm font-black text-[#102015]">
                        {item.title}
                      </h4>
                      <p className="text-xs font-medium text-[#5f6d58]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </section>

          {relatedProducts.length > 0 && (
            <section className="px-4 sm:px-8 lg:px-14">
              <motion.div
                initial={{ opacity: 0, y: 26, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
                className="mx-auto max-w-[1820px]"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="dream-font text-[42px] leading-none text-[#142012]">
                    You May Also Like
                  </h2>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/shop"
                      className={`hidden items-center gap-2 rounded-[6px] text-sm font-black text-[#003f2a] sm:flex ${premiumButtonHover}`}
                    >
                      View All Products
                      <ArrowRight size={16} />
                    </Link>

                    <button
                      type="button"
                      onClick={relatedScrollLeft}
                      className={`flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#0b3d2e] text-white shadow-[0_8px_24px_rgba(11,61,46,0.12)] hover:bg-[#062a18] hover:shadow-[0_16px_38px_rgba(11,61,46,0.18)] ${premiumButtonHover}`}
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={relatedScrollRight}
                      className={`flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#0b3d2e] text-white shadow-[0_8px_24px_rgba(11,61,46,0.12)] hover:bg-[#062a18] hover:shadow-[0_16px_38px_rgba(11,61,46,0.18)] ${premiumButtonHover}`}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>

                <div
                  id="related-products-scroll"
                  className="flex gap-5 overflow-x-auto scroll-smooth pb-3 scrollbar-hide"
                  style={{
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {relatedProducts.map((item: any) => (
                    <PremiumProductCard
                      key={item.firebaseId || item.id}
                      product={item}
                      className="w-[170px] shrink-0 rounded-[6px] bg-[#f5f1e8] sm:w-[230px] lg:w-[260px]"
                      isWishlisted={isWishlisted(item.id)}
                      onAddToCart={addToCart}
                      onToggleWishlist={(productId) =>
                        toggleWishlist(productId)
                      }
                    />
                  ))}
                </div>
              </motion.div>
            </section>
          )}

          <Footer />
        </div>
      </motion.main>
    </>
  );
}