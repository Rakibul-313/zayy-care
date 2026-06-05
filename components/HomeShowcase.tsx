"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";

import {
  ArrowRight,
  ShieldCheck,
  Star,
  Undo2,
  UserRound,
  Sparkles,
  Leaf,
} from "lucide-react";

type Order = {
  customer?: { email?: string };
  shippingAddress?: { phone?: string };
};

type Review = {
  rating?: number;
  approved?: boolean;
};

function formatCustomerCount(count: number) {
  if (count >= 10000) return "10,000+";
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return `${count}+`;
}

export default function HomeShowcase() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const ordersRef = ref(database, "orders");

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      setOrders(data ? Object.values(data) : []);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const reviewsRef = ref(database, "reviews");

    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      setReviews(data ? Object.values(data) : []);
    });

    return () => unsubscribe();
  }, []);

  const customerCount = useMemo(() => {
    const unique = new Set(
      orders
        .map((order) => order.customer?.email || order.shippingAddress?.phone)
        .filter(Boolean)
    );

    return unique.size;
  }, [orders]);

  const averageRating = useMemo(() => {
    const approvedReviews = reviews.filter(
      (review) => review.approved !== false && Number(review.rating) > 0
    );

    if (approvedReviews.length < 5) return "4.8/5";

    const total = approvedReviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return `${(total / approvedReviews.length).toFixed(1)}/5`;
  }, [reviews]);

  const stats = [
    {
      icon: UserRound,
      title: formatCustomerCount(
        customerCount < 100 ? 10000 : customerCount
      ),
      text: "Happy Customers",
    },
    {
      icon: Star,
      title: averageRating,
      text: "Average Rating",
    },
    {
      icon: Undo2,
      title: "7 Days",
      text: "Easy Return",
    },
    {
      icon: ShieldCheck,
      title: "Secure",
      text: "Safe Payment",
    },
  ];

  return (
    <>
      <section className="px-4 sm:px-8 lg:px-16">
        <div className="mx-auto grid w-full max-w-[1820px] gap-8 lg:grid-cols-2">
          <div className="glass relative min-h-[360px] overflow-hidden rounded-[38px] p-8 shadow-[0_28px_80px_rgba(85,107,47,0.18)] sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_34%,rgba(184,199,154,0.45),transparent_36%),linear-gradient(135deg,rgba(255,250,241,0.78),rgba(255,255,255,0.18))]" />

            <div className="relative z-10 max-w-[390px]">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-white/40 px-4 py-2 text-sm font-semibold text-[#556B2F]">
                <Sparkles size={16} />
                Skin Quiz
              </div>

              <h2 className="dream-font text-[46px] leading-[1] text-[#142012]">
                Not sure what your skin needs?
              </h2>

              <p className="mt-5 text-[16px] leading-7 text-[#263421]">
                Take our Skin Quiz and get personalized product recommendations
                for your unique skin routine.
              </p>

              <Link
                href="/skin-quiz"
                className="mt-7 inline-flex items-center gap-12 rounded-full bg-[#556B2F] px-7 py-4 font-bold text-white shadow-[0_18px_42px_rgba(85,107,47,0.3)] transition hover:-translate-y-1"
              >
                Start Skin Quiz
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <div className="glass relative min-h-[360px] overflow-hidden rounded-[38px] p-8 shadow-[0_28px_80px_rgba(85,107,47,0.18)] sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgba(184,199,154,0.45),transparent_38%),linear-gradient(135deg,rgba(255,250,241,0.78),rgba(255,255,255,0.18))]" />

            <div className="relative z-10 max-w-[390px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-sm font-semibold text-[#556B2F]">
                <Leaf size={16} />
                Routine Builder
              </div>

              <h2 className="dream-font text-[46px] leading-[1] text-[#142012]">
                Build Your Routine
              </h2>

              <p className="mt-5 text-[16px] leading-7 text-[#263421]">
                Create your perfect skincare routine with the right products
                selected for your skin.
              </p>

              <Link
                href="/routine-builder"
                className="mt-7 inline-flex items-center gap-12 rounded-full bg-[#556B2F] px-7 py-4 font-bold text-white shadow-[0_18px_42px_rgba(85,107,47,0.3)] transition hover:-translate-y-1"
              >
                Build Routine
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 lg:px-14 mt-10">
        <div className="glass mx-auto grid w-full max-w-[1820px] grid-cols-1 gap-12 rounded-[34px] px-5 py-6 shadow-[0_24px_70px_rgba(85,107,47,0.14)] sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.text}
                className="flex items-center justify-center gap-4 rounded-2xl p-4 lg:border-r lg:border-white/35 lg:last:border-r-0"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/45 text-[#556B2F]">
                  <Icon size={27} />
                </span>

                <span>
                  <span className="block text-[28px] font-black leading-none text-[#556B2F]">
                    {item.title}
                  </span>

                  <span className="mt-1 block text-sm text-[#263421]">
                    {item.text}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}