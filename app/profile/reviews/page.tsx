"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set, update } from "firebase/database";
import { auth, database } from "@/firebase/config";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit,
  MessageSquare,
  Star,
  Trash2,
} from "lucide-react";

type OrderItem = {
  id?: number;
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;
  category?: string;
  volume?: string;
};

type Order = {
  id: string;
  deleted?: boolean;
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
  firebaseId?: string;
  deleted?: boolean;
  uid?: string;
  orderId?: string;
  orderNumber?: string;
  productId?: number;
  productName?: string;
  productImage?: string;
  rating?: number;
  comment?: string;
  approved?: boolean;
  rejected?: boolean;
  createdAt?: number;
};

type ReviewTarget = {
  orderId: string;
  orderNumber?: string;
  product: OrderItem;
};

const tabs = [
  { label: "All Reviews", value: "all" },
  { label: "Published", value: "published" },
  { label: "Pending", value: "pending" },
  { label: "Not Approved", value: "rejected" },
];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const image = src.trim();
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

function formatDate(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getReviewStatus(review: Review) {
  if (review.rejected) return "rejected";
  if (review.approved) return "published";
  return "pending";
}

export default function ProfileReviewsPage() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const [loading, setLoading] = useState(true);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [page, setPage] = useState(1);

  const perPage = 8;

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    };

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
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Order, "id">),
        }))
        .filter((order) => {
          if (order.deleted === true) return false;

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

      const loaded: Review[] = data
        ? Object.entries(data)
            .map(([id, value]: any) => ({
              id,
              ...value,
            }))
            .filter((review: Review) => review.deleted !== true && review.uid === uid)
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        : [];

      setReviews(loaded);
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
            review.deleted !== true &&
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

  const filteredReviews = useMemo(() => {
  return reviews;
}, [reviews]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / perPage));

  const visibleReviews = useMemo(() => {
    return filteredReviews.slice((page - 1) * perPage, page * perPage);
  }, [filteredReviews, page]);

  const submitReview = async (target: ReviewTarget) => {
    const product = target.product;
    const key = `${target.orderId}-${product.id}`;
    const rating = ratings[key];

    if (!rating || rating < 1 || rating > 5) {
      alert("Please select rating between 1 and 5.");
      return;
    }

    const reviewRef = push(ref(database, "reviews"));

    try {
      await set(reviewRef, {
        firebaseId: reviewRef.key,
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
        rejected: false,
        deleted: false,
        createdAt: Date.now(),
      });

      setRatings((prev) => ({ ...prev, [key]: 0 }));
      setComments((prev) => ({ ...prev, [key]: "" }));

      alert("Review submitted successfully. Admin approval pending.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit review.");
    }
  };

  const handleDeleteReview = async (review: Review) => {
    const ok = confirm("Are you sure you want to delete this review?");
    if (!ok) return;

    await update(ref(database, `reviews/${review.id}`), {
      deleted: true,
      updatedAt: Date.now(),
    });
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    if (!editingReview.rating || editingReview.rating < 1) {
      alert("Please select rating.");
      return;
    }

    await update(ref(database, `reviews/${editingReview.id}`), {
      rating: editingReview.rating,
      comment: editingReview.comment || "",
      approved: false,
      rejected: false,
      updatedAt: Date.now(),
    });

    setEditingReview(null);
    alert("Review updated. Admin approval pending.");
  };

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pt-[110px] pb-10 sm:px-8 lg:px-14 lg:pt-[125px]">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <div>
              <Link
                href="/profile"
                className="mb-4 inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-white px-4 text-sm font-black text-[#0b3d2e]"
              >
                <ArrowLeft size={16} />
                Back to Profile
              </Link>

              <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                My Reviews
              </h1>

              <p className="mt-2 text-sm text-[#4f5f49]">
                Manage and view all your product reviews.
              </p>
            </div>

            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
  

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-[#0b3d2e]/10 text-left text-xs font-black uppercase text-[#4f5f49]">
                      <th className="py-3">Product</th>
                      <th className="py-3">Rating</th>
                      <th className="py-3">Review</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Date</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-[#4f5f49]">
                          Loading reviews...
                        </td>
                      </tr>
                    ) : visibleReviews.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-[#4f5f49]">
                          No reviews found.
                        </td>
                      </tr>
                    ) : (
                      visibleReviews.map((review) => (
                        <tr
                          key={review.id}
                          className="border-b border-[#0b3d2e]/10 text-sm"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-14 w-14 items-center justify-center rounded-[6px] bg-[#f5f1e8]">
                                <img
                                  src={safeImage(review.productImage)}
                                  alt={review.productName || "Product"}
                                  className="h-full w-full object-contain p-2"
                                />
                              </div>

                              <div>
                                <p className="line-clamp-2 font-black text-[#102015]">
                                  {review.productName || "Product"}
                                </p>
                                <p className="mt-1 text-xs text-[#4f5f49]">
                                  Order #{review.orderNumber || review.orderId}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4">
                            <Stars value={Number(review.rating || 0)} />
                          </td>

                          <td className="max-w-[330px] py-4">
                            <p className="line-clamp-2 font-bold text-[#102015]">
                              {review.comment || "No comment"}
                            </p>
                          </td>

                          <td className="py-4">
                            <StatusBadge status={getReviewStatus(review)} />
                          </td>

                          <td className="py-4 text-[#4f5f49]">
                            {formatDate(review.createdAt)}
                          </td>

                          <td className="py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingReview(review)}
                                className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] text-[#0b3d2e]"
                              >
                                <Edit size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReview(review)}
                                className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-red-200 bg-red-50 text-red-500"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4f5f49]">
                <span>
                  Showing {visibleReviews.length} of {filteredReviews.length} reviews
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e] disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#0b3d2e] text-xs font-black text-white">
                    {page}
                  </span>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e] disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {targets.length > 0 && (
              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                <h2 className="text-xl font-black text-[#102015]">
                  Products Waiting for Review
                </h2>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {targets.map((target) => {
                    const product = target.product;
                    const key = `${target.orderId}-${product.id}`;

                    return (
                      <div
                        key={key}
                        className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-4"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[6px] bg-[#f5f1e8]">
                            <img
                              src={safeImage(product.image)}
                              alt={product.name || "Product"}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          <div className="flex-1">
                            <p className="text-xs font-black text-[#0b3d2e]">
                              Order #{target.orderNumber || target.orderId}
                            </p>

                            <h3 className="mt-1 font-black text-[#102015]">
                              {product.name}
                            </h3>

                            <div className="mt-3">
                              <StarsInput
                                value={ratings[key] || 0}
                                onChange={(value) =>
                                  setRatings((prev) => ({
                                    ...prev,
                                    [key]: value,
                                  }))
                                }
                              />
                            </div>

                            <textarea
                              rows={3}
                              value={comments[key] || ""}
                              onChange={(e) =>
                                setComments((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              placeholder="Write your honest review..."
                              className="mt-3 w-full resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => submitReview(target)}
                              className="mt-3 h-10 rounded-[6px] bg-[#0b3d2e] px-5 text-xs font-black uppercase text-white"
                            >
                              Submit Review
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>

      {editingReview && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[560px] rounded-[6px] bg-white p-6">
            <h2 className="text-2xl font-black text-[#102015]">
              Edit Review
            </h2>

            <p className="mt-1 text-sm text-[#4f5f49]">
              After update, review will go to pending approval again.
            </p>

            <div className="mt-5">
              <StarsInput
                value={Number(editingReview.rating || 0)}
                onChange={(value) =>
                  setEditingReview((prev) =>
                    prev ? { ...prev, rating: value } : prev
                  )
                }
              />

              <textarea
                rows={5}
                value={editingReview.comment || ""}
                onChange={(e) =>
                  setEditingReview((prev) =>
                    prev ? { ...prev, comment: e.target.value } : prev
                  )
                }
                className="mt-4 w-full resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="h-10 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-5 text-xs font-black text-[#0b3d2e]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateReview}
                className="h-10 rounded-[6px] bg-[#0b3d2e] px-5 text-xs font-black uppercase text-white"
              >
                Update Review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 text-yellow-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
          fill={value >= star ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function StarsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-1 text-yellow-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}>
          <Star
            size={24}
            fill={value >= star ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "published"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  const text =
    status === "published"
      ? "Published"
      : status === "rejected"
      ? "Not Approved"
      : "Pending";

  return (
    <span className={`rounded-[6px] px-3 py-1 text-xs font-black ${cls}`}>
      {text}
    </span>
  );
}