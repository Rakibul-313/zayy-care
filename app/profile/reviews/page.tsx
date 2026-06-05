"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set } from "firebase/database";
import { auth, database } from "@/firebase/config";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { ArrowLeft, MessageSquare, Star } from "lucide-react";

type OrderItem = {
  id?: number;
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  id: string;
  orderNumber?: string;
  status?: string;
  customer?: {
    uid?: string;
    email?: string;
    name?: string;
  };
  items?: OrderItem[];
};

type Review = {
  id: string;
  uid?: string;
  orderId?: string;
  productId?: number;
};

type ReviewTarget = {
  orderId: string;
  orderNumber?: string;
  product: OrderItem;
};

export default function ProfileReviewsPage() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      setUid(user.uid);
      setEmail(user.email || "");
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          ...value,
        }))
        .filter((order: Order) => {
          const uidMatch = order.customer?.uid === uid;
          const emailMatch =
            email &&
            order.customer?.email?.toLowerCase() === email.toLowerCase();

          return order.status === "delivered" && (uidMatch || emailMatch);
        });

      setOrders(loaded);
      setLoading(false);
    });

    const unsubReviews = onValue(ref(database, "reviews"), (snapshot) => {
      const data = snapshot.val();

      setReviews(
        data
          ? Object.entries(data).map(([id, value]: any) => ({
              id,
              ...value,
            }))
          : []
      );
    });

    return () => {
      unsubOrders();
      unsubReviews();
    };
  }, [uid, email]);

  const targets = useMemo<ReviewTarget[]>(() => {
    const list: ReviewTarget[] = [];

    orders.forEach((order) => {
      order.items?.forEach((product) => {
        const alreadyReviewed = reviews.some(
          (review) =>
            review.uid === uid &&
            review.orderId === order.id &&
            Number(review.productId) === Number(product.id)
        );

        if (!alreadyReviewed) {
          list.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            product,
          });
        }
      });
    });

    return list;
  }, [orders, reviews, uid]);

  const submitReview = async (target: ReviewTarget) => {
    const product = target.product;
    const key = `${target.orderId}-${product.id}`;
    const rating = ratings[key];

    if (!rating || rating < 1 || rating > 5) {
      alert("Please select rating between 1 and 5.");
      return;
    }

    const reviewRef = push(ref(database, "reviews"));

    await set(reviewRef, {
      uid,
      orderId: target.orderId,
      orderNumber: target.orderNumber || target.orderId,
      productId: product.id,
      productName: product.name,
      productImage: product.image || "",
      customerName: auth.currentUser?.displayName || "Customer",
      customerEmail: auth.currentUser?.email || "",
      rating,
      comment: comments[key] || "",
      approved: false,
      createdAt: Date.now(),
    });

    alert("Review submitted successfully. Admin approval pending.");
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

      <div className="pt-[170px] pb-12 px-4 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1500px] space-y-8">
          <section className="glass glass-premium rounded-[40px] p-8">
            <Link
              href="/profile"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/40 px-5 py-3 font-bold text-[#31571f]"
            >
              <ArrowLeft size={18} />
              Back to Profile
            </Link>

            <h1 className="dream-font text-[52px] leading-none text-[#142012] sm:text-[72px]">
              Write Reviews
            </h1>

            <p className="mt-4 max-w-[700px] text-gray-600">
              Review your delivered skincare products and help other customers.
            </p>
          </section>

          {loading ? (
            <section className="glass glass-premium rounded-[34px] p-10 text-center">
              Loading reviewable products...
            </section>
          ) : targets.length === 0 ? (
            <section className="glass glass-premium rounded-[34px] p-12 text-center">
              <MessageSquare className="mx-auto text-[#31571f]" size={44} />
              <h2 className="mt-4 text-2xl font-bold text-[#142012]">
                No products to review
              </h2>
              <p className="mt-2 text-gray-600">
                Delivered products you have not reviewed yet will appear here.
              </p>
            </section>
          ) : (
            <section className="grid gap-5">
              {targets.map((target) => {
                const product = target.product;
                const key = `${target.orderId}-${product.id}`;

                return (
                  <article
                    key={key}
                    className="glass glass-premium rounded-[34px] p-6"
                  >
                    <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
                      <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-3xl bg-white/45">
                        <img
                          src={product.image || "/products/p1.png"}
                          alt={product.name || "Product"}
                          className="h-full w-full object-contain p-3"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#556B2F]">
                          Order #{target.orderNumber || target.orderId}
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-[#142012]">
                          {product.name}
                        </h2>

                        <div className="mt-5">
                          <label className="font-semibold text-[#142012]">
                            Rating
                          </label>

                          <div className="mt-3 flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setRatings((prev) => ({
                                    ...prev,
                                    [key]: star,
                                  }))
                                }
                                className={`rounded-full p-2 ${
                                  Number(ratings[key] || 0) >= star
                                    ? "text-yellow-500"
                                    : "text-gray-400"
                                }`}
                              >
                                <Star
                                  size={28}
                                  fill={
                                    Number(ratings[key] || 0) >= star
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={4}
                          value={comments[key] || ""}
                          onChange={(e) =>
                            setComments((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder="Write your honest review..."
                          className="mt-5 w-full resize-none rounded-2xl bg-white/45 px-5 py-4 outline-none"
                        />

                        <button
                          onClick={() => submitReview(target)}
                          className="mt-5 rounded-full bg-[#31571f] px-6 py-3 font-bold text-white"
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}