"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { database } from "@/firebase/config";
import { CheckCircle2, Clock, Star, Trash2 } from "lucide-react";

type Review = {
  id: string;
  productId?: number;
  productName?: string;
  customerName?: string;
  customerEmail?: string;
  rating?: number;
  comment?: string;
  approved?: boolean;
  createdAt?: number;
  deleted?: boolean;
  active?: boolean;
  deletedAt?: number;
};

function dateText(value?: number) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reviewsRef = ref(database, "reviews");

    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Review, "id">),
        }))
        .filter((review) => review.deleted !== true)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setReviews(formatted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((item) => item.approved === false).length;
    const approved = reviews.filter((item) => item.approved !== false).length;

    const average =
      reviews.length > 0
        ? (
            reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        : "0.0";

    return { total, pending, approved, average };
  }, [reviews]);

  const approveReview = async (review: Review) => {
    await update(ref(database, `reviews/${review.id}`), {
      approved: true,
      active: true,
      updatedAt: Date.now(),
    });
  };

  const unapproveReview = async (review: Review) => {
    await update(ref(database, `reviews/${review.id}`), {
      approved: false,
      active: false,
      updatedAt: Date.now(),
    });
  };

  const deleteReview = async (review: Review) => {
    const ok = confirm("Delete this review?");
    if (!ok) return;

    await update(ref(database, `reviews/${review.id}`), {
      deleted: true,
      active: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Reviews</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Dashboard › Reviews
          </p>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-black text-[#0b3d2e]">
          Realtime Reviews
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Reviews" value={stats.total} icon={Star} />
        <StatCard title="Pending Reviews" value={stats.pending} icon={Clock} warning />
        <StatCard title="Approved Reviews" value={stats.approved} icon={CheckCircle2} />
        <StatCard title="Average Rating" value={`${stats.average}/5`} icon={Star} />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {reviews.length} reviews
          </p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-[#4f5f49]">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-[#4f5f49]">
            No reviews found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Customer</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-[#0b3d2e]/10 text-[#263421]"
                  >
                    <td className="py-4">
                      <p className="font-black text-[#102015]">
                        {review.customerName || "Customer"}
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#4f5f49]">
                        {review.customerEmail || "No email"}
                      </p>
                    </td>

                    <td>
                      <p className="max-w-[220px] font-black text-[#102015]">
                        {review.productName || `Product #${review.productId}`}
                      </p>
                    </td>

                    <td>
                      <div className="flex items-center gap-1 text-[#d59a22]">
                        <Star size={16} fill="currentColor" />
                        <span className="font-black text-[#102015]">
                          {review.rating || 0}
                        </span>
                      </div>
                    </td>

                    <td className="max-w-[280px]">
                      <p className="line-clamp-2 text-[#4f5f49]">
                        {review.comment || "No comment"}
                      </p>
                    </td>

                    <td className="text-[#4f5f49]">
                      {dateText(review.createdAt)}
                    </td>

                    <td>
                      <span
                        className={`rounded-[6px] px-3 py-1 text-xs font-black ${
                          review.approved === false
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {review.approved === false ? "Pending" : "Approved"}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {review.approved === false ? (
                          <button
                            type="button"
                            onClick={() => approveReview(review)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-green-50 text-green-700"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => unapproveReview(review)}
                            className="rounded-[6px] bg-yellow-50 px-3 py-2 text-xs font-black text-yellow-700"
                          >
                            Hold
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteReview(review)}
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-red-50 text-red-700"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  warning,
}: {
  title: string;
  value: string | number;
  icon: any;
  warning?: boolean;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#4f5f49]">{title}</p>
          <h2 className="mt-3 text-3xl font-black text-[#102015]">{value}</h2>
          <p className="mt-2 text-xs font-black text-green-600">
            Realtime data
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            warning
              ? "bg-yellow-50 text-yellow-600"
              : "bg-emerald-50 text-[#0b3d2e]"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}