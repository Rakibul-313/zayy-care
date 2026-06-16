"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";
import { Star } from "lucide-react";

type Review = {
  customerName?: string;
  rating?: number;
  comment?: string;
  approved?: boolean;
};

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const reviewsRef = ref(database, "reviews");

    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setReviews([]);
        return;
      }

      const approvedReviews = Object.values(data)
        .filter((review: any) => review.approved !== false)
        .slice(0, 6);

      setReviews(approvedReviews as Review[]);
    });

    return () => unsubscribe();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1820px]">
        <h2 className="dream-font mb-5 text-[38px] text-[#142012] sm:text-[48px]">
        Our Customers Say <span className="text-[#556B2F]">+</span>
        </h2>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <div
              key={index}
             className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4 shadow-[0_8px_24px_rgba(11,61,46,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(11,61,46,0.12)]"
            >
              <div className="mb-3 flex text-[#d59a22]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    fill={
                      star <= Number(review.rating)
                        ? "currentColor"
                        : "transparent"
                    }
                  />
                ))}
              </div>

              <p className="mb-4 text-[14px] leading-6 text-[#263421]">
                “{review.comment}”
              </p>

              <p className="text-[14px] font-bold text-[#142012]">
                — {review.customerName || "ZAYY Customer"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}