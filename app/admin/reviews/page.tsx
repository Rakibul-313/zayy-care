"use client";

import { useEffect, useState } from "react";
import { onValue, ref, remove, update } from "firebase/database";
import { database } from "@/firebase/config";
import { CheckCircle2, Star, Trash2 } from "lucide-react";

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
};

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
        .map(([id, value]: any) => ({
          id,
          ...value,
        }))
        .sort((a: Review, b: Review) => (b.createdAt || 0) - (a.createdAt || 0));

      setReviews(formatted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const approveReview = async (review: Review) => {
    await update(ref(database, `reviews/${review.id}`), {
      approved: true,
    });
  };

  const unapproveReview = async (review: Review) => {
    await update(ref(database, `reviews/${review.id}`), {
      approved: false,
    });
  };

  const deleteReview = async (review: Review) => {
    const ok = confirm("Delete this review?");
    if (!ok) return;

    await remove(ref(database, `reviews/${review.id}`));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h1 className="text-4xl font-bold text-[#172313]">Reviews</h1>

        <p className="mt-2 text-gray-600">
          Approve, manage and delete customer product reviews.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <p className="text-sm text-gray-600">Total Reviews</p>
          <h2 className="mt-2 text-3xl font-black text-[#172313]">
            {reviews.length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <p className="text-sm text-gray-600">Pending Reviews</p>
          <h2 className="mt-2 text-3xl font-black text-[#172313]">
            {reviews.filter((item) => item.approved === false).length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <p className="text-sm text-gray-600">Approved Reviews</p>
          <h2 className="mt-2 text-3xl font-black text-[#172313]">
            {reviews.filter((item) => item.approved !== false).length}
          </h2>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {loading ? (
          <p className="py-10 text-center">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="py-10 text-center text-gray-600">
            No reviews found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-gray-500">
                  <th className="py-4">Customer</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b border-black/5">
                    <td className="py-5">
                      <p className="font-bold text-[#172313]">
                        {review.customerName || "Customer"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {review.customerEmail || "No email"}
                      </p>
                    </td>

                    <td>
                      <p className="font-semibold">
                        {review.productName || `Product #${review.productId}`}
                      </p>
                    </td>

                    <td>
                      <div className="flex items-center gap-1 text-[#d59a22]">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold text-[#172313]">
                          {review.rating || 0}
                        </span>
                      </div>
                    </td>

                    <td className="max-w-[280px]">
                      <p className="line-clamp-2 text-gray-700">
                        {review.comment || "No comment"}
                      </p>
                    </td>

                    <td>
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          review.approved === false
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {review.approved === false ? "Pending" : "Approved"}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        {review.approved === false ? (
                          <button
                            onClick={() => approveReview(review)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => unapproveReview(review)}
                            className="rounded-xl bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-700"
                          >
                            Hold
                          </button>
                        )}

                        <button
                          onClick={() => deleteReview(review)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"
                        >
                          <Trash2 size={18} />
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