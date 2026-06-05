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
        <h2 className="dream-font mb-6 text-[42px] text-[#142012]">
          What Our Customers Say
        </h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="glass rounded-[28px] p-6 shadow-[0_20px_60px_rgba(85,107,47,0.12)]"
            >
              <div className="mb-4 flex text-[#d59a22]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill={
                      star <= Number(review.rating)
                        ? "currentColor"
                        : "transparent"
                    }
                  />
                ))}
              </div>

              <p className="mb-5 text-[#263421] leading-7">
                "{review.comment}"
              </p>

              <p className="font-bold text-[#142012]">
                — {review.customerName || "ZAYY Customer"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}