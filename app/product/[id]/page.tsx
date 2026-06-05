"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { onValue, push, ref, set } from "firebase/database";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumProductCard from "@/components/ui/PremiumProductCard";

import { auth, database } from "@/firebase/config";
import { products as staticProducts } from "@/data/products";
import { addToCart } from "@/lib/cart";
import { isWishlisted, toggleWishlist } from "@/lib/wishlist";

import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Leaf,
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
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

function formatPrice(price: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(price || 0)}`;
}

export default function ProductPage() {
  const params = useParams();
  const id = Number(params.id);

  const [firebaseProducts, setFirebaseProducts] = useState<ProductType[]>([]);
  const [firebaseReviews, setFirebaseReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("Description");

  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setFirebaseProducts([]);
        setLoading(false);
        return;
      }

      const formatted = Object.entries(data).map(
        ([firebaseId, value]: any, index) => ({
          firebaseId,
          id: Number(value.id || index + 1),
          name: value.name || "Unnamed Product",
          brand: value.brand || "ZAYY Care",
          category: value.category || "Korean Skincare",
          image: safeImage(value.image),
          price: Number(value.price || 0),
          oldPrice: Number(value.oldPrice || value.price || 0),
          discount: Number(value.discount || 0),
          stock: Number(value.stock || 0),
          sale: value.discount ? `${value.discount}% OFF` : "New",
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
        })
      );

      setFirebaseProducts(formatted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const reviewsRef = ref(database, "reviews");

    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setFirebaseReviews([]);
        return;
      }

      const formatted = Object.entries(data)
        .map(([reviewId, value]: any) => ({
          id: reviewId,
          ...value,
        }))
        .filter(
          (review: ReviewType) =>
            Number(review.productId) === id && review.approved !== false
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
      image: fallbackProduct.image,
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
    };

  const relatedProducts = useMemo(() => {
    const source = firebaseProducts.length > 0 ? firebaseProducts : staticProducts;
    return source.filter((item: any) => item.id !== product.id).slice(0, 8);
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

  const benefitList = product.benefits
    ? product.benefits.split("\n").filter(Boolean)
    : [];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id);
    }
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
      console.log(error);
      alert("Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/58 backdrop-blur-[2px]" />

      <Navbar />

      <div className="space-y-6 pt-[130px] pb-10 lg:pt-[156px]">
        <section className="px-4 sm:px-8 lg:px-14">
          <div className="glass mx-auto flex max-w-[1820px] flex-wrap items-center gap-2 rounded-[28px] px-5 py-4 text-sm font-medium text-[#263421]">
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
          <div className="glass mx-auto grid max-w-[1820px] gap-6 rounded-[38px] p-4 shadow-[0_30px_100px_rgba(31,43,20,0.18)] lg:grid-cols-[1.15fr_.85fr] lg:p-6">
            <div className="glass-soft relative min-h-[430px] overflow-hidden rounded-[32px] border border-white/65 lg:min-h-[620px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_48%,rgba(255,255,255,0.76),rgba(184,199,154,0.24)_50%,transparent_72%)]" />

              <span className="glass absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase text-[#142012]">
                <Star size={16} fill="#d59a22" className="text-[#d59a22]" />
                {product.sale}
              </span>

              <div className="relative z-10 flex h-full min-h-[430px] items-center justify-center p-8 lg:min-h-[620px]">
                <img
                  src={safeImage(product.image)}
                  alt={product.name}
                  className="max-h-[540px] w-full object-contain drop-shadow-[0_34px_72px_rgba(31,43,20,0.25)] transition duration-500 hover:scale-[1.04] lg:max-h-[610px]"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-[32px] p-3 sm:p-5 lg:p-8">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.06em] text-[#31571f]">
                {product.brand}
              </p>

              <h1 className="dream-font text-[44px] leading-[1] text-[#0d120c] sm:text-[58px] lg:text-[64px]">
                {product.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex text-[#d59a22]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={18} fill="currentColor" />
                  ))}
                </div>

                <p className="text-sm font-semibold text-[#263421]">
                  {averageRating}{" "}
                  {firebaseReviews.length > 0 &&
                    `(${firebaseReviews.length} Reviews)`}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="text-[34px] font-black text-[#31571f] sm:text-[42px]">
                  {formatPrice(product.price)}
                </span>

                {product.oldPrice > product.price && (
                  <span className="text-xl text-[#62705c]/70 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}

                {product.discount > 0 && (
                  <span className="rounded-full bg-[#31571f] px-4 py-2 text-sm font-black text-white">
                    {product.discount}% OFF
                  </span>
                )}
              </div>

              <p className="mt-5 max-w-[560px] text-[16px] leading-8 text-[#263421]">
                {product.description}
              </p>

              <div className="mt-5 grid gap-3 text-sm text-[#142012]">
                <p>
                  <span className="font-black">For:</span> {product.forText}
                </p>
                <p>
                  <span className="font-black">Concern:</span> {product.concern}
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

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="glass flex h-14 items-center overflow-hidden rounded-2xl text-[#142012]">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    className="flex h-full w-14 items-center justify-center"
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
                    className="flex h-full w-14 items-center justify-center"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!isInStock}
                  onClick={handleAddToCart}
                  className={`flex h-14 min-w-[250px] flex-1 items-center justify-center gap-3 rounded-2xl text-[17px] font-black shadow-[0_18px_45px_rgba(49,87,31,0.3)] transition ${
                    isInStock
                      ? "bg-[#31571f] text-white hover:-translate-y-1"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  <ShoppingBag size={21} />
                  {isInStock ? "Add to Cart" : "Out of Stock"}
                </button>

                <button
                  type="button"
                  onClick={handleWishlist}
                  className={`glass flex h-14 w-14 items-center justify-center rounded-2xl transition hover:-translate-y-1 ${
                    liked ? "text-red-500" : "text-[#31571f]"
                  }`}
                >
                  <Heart fill={liked ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] gap-6 lg:grid-cols-[1.55fr_0.85fr]">
            <div className="glass rounded-[34px] p-6 sm:p-8">
              <div className="mb-7 flex gap-5 overflow-x-auto border-b border-[#142012]/10 pb-4">
                {["Description", "How to Use", "Ingredients", "Reviews"].map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 border-b-2 px-1 pb-2 font-bold transition ${
                        activeTab === tab
                          ? "border-[#31571f] text-[#31571f]"
                          : "border-transparent text-[#142012]"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              {activeTab !== "Reviews" ? (
                <p className="max-w-[980px] whitespace-pre-line text-[16px] leading-8 text-[#263421]">
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
                            className="rounded-2xl border border-white/40 bg-white/30 p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-[#142012]">
                                  {review.customerName || "Customer"}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {review.createdAt
                                    ? new Date(
                                        review.createdAt
                                      ).toLocaleDateString()
                                    : ""}
                                </p>
                              </div>

                              <div className="flex text-[#d59a22]">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={16}
                                    fill={
                                      star <= Number(review.rating)
                                        ? "currentColor"
                                        : "transparent"
                                    }
                                  />
                                ))}
                              </div>
                            </div>

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

                  <div className="glass rounded-[28px] p-6">
                    <h3 className="mb-5 text-2xl font-bold text-[#142012]">
                      Write a Review
                    </h3>

                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="rounded-2xl bg-white/45 px-5 py-4 text-sm text-[#263421]">
                        Review will be submitted as:{" "}
                        <span className="font-bold">
                          {auth.currentUser?.displayName ||
                            auth.currentUser?.email ||
                            "Logged in user"}
                        </span>
                      </div>

                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(e.target.value)}
                        required
                        className="w-full rounded-2xl bg-white/50 px-5 py-4 outline-none"
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
                        className="w-full resize-none rounded-2xl bg-white/50 px-5 py-4 outline-none"
                      />

                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="rounded-2xl bg-[#31571f] px-7 py-4 font-bold text-white disabled:opacity-60"
                      >
                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            <div className="glass rounded-[34px] p-6 sm:p-8">
              <h2 className="dream-font text-[34px] leading-none text-[#142012]">
                Why you&apos;ll love it
              </h2>

              <div className="mt-6 space-y-4">
                {benefitList.map((item) => (
                  <p
                    key={item}
                    className="flex items-center gap-3 text-sm font-semibold text-[#263421]"
                  >
                    <CheckCircle2 className="text-[#31571f]" size={20} />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-[1820px]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="dream-font text-[42px] leading-none text-[#142012]">
                You May Also Like
              </h2>

              <Link
                href="/shop"
                className="hidden items-center gap-2 text-sm font-bold text-[#31571f] sm:flex"
              >
                View All
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-3">
              {relatedProducts.map((item: any) => (
                <PremiumProductCard
                  key={item.id}
                  product={item}
                  className="w-[270px] shrink-0 md:w-[286px]"
                  isWishlisted={isWishlisted(item.id)}
                  onAddToCart={addToCart}
                  onToggleWishlist={(productId) => toggleWishlist(productId)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-8 lg:px-14">
          <div className="glass mx-auto grid max-w-[1820px] gap-3 rounded-[30px] px-5 py-5 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                icon: ShieldCheck,
                title: "100% Authentic",
                text: "Korean Products",
              },
              {
                icon: Truck,
                title: "Free Delivery",
                text: "On orders over ৳1,500",
              },
              {
                icon: RefreshCcw,
                title: "Easy Return",
                text: "7 Days Return Policy",
              },
              {
                icon: LockKeyhole,
                title: "Secure Payment",
                text: "bKash, Nagad, COD",
              },
              {
                icon: Leaf,
                title: "Dermatologically Tested",
                text: "Safe for all skin types",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-2xl p-4"
                >
                  <Icon className="text-[#31571f]" />
                  <div>
                    <h4 className="font-bold">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}