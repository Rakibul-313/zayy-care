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
  customer?: {
    email?: string;
  };
  shippingAddress?: {
    phone?: string;
  };
};

type Review = {
  rating?: number;
  approved?: boolean;
  deleted?: boolean;
};

function formatCustomerCount(count: number) {
  if (count <= 0) return "Growing";
  if (count >= 10000) return "10K+";
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;

  return `${count}+`;
}

export default function HomeShowcase() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const ordersRef = ref(database, "orders");

    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        const data = snapshot.val();

        setOrders(
          data ? (Object.values(data) as Order[]) : []
        );
      },
      () => {
        setOrders([]);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const reviewsRef = ref(database, "reviews");

    const unsubscribe = onValue(
      reviewsRef,
      (snapshot) => {
        const data = snapshot.val();

        setReviews(
          data ? (Object.values(data) as Review[]) : []
        );
      },
      () => {
        setReviews([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const customerCount = useMemo(() => {
    const uniqueCustomers = new Set(
      orders
        .map(
          (order) =>
            order.customer?.email?.trim().toLowerCase() ||
            order.shippingAddress?.phone?.trim()
        )
        .filter(Boolean)
    );

    return uniqueCustomers.size;
  }, [orders]);

  const approvedReviews = useMemo(() => {
    return reviews.filter(
      (review) =>
        review.approved !== false &&
        review.deleted !== true &&
        Number(review.rating) > 0
    );
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (approvedReviews.length === 0) {
      return "New";
    }

    const totalRating = approvedReviews.reduce(
      (sum, review) =>
        sum + Number(review.rating || 0),
      0
    );

    return `${(
      totalRating / approvedReviews.length
    ).toFixed(1)}/5`;
  }, [approvedReviews]);

  const stats = [
    {
      icon: UserRound,
      title: formatCustomerCount(customerCount),
      text:
        customerCount > 0
          ? "Verified Customers"
          : "Growing Community",
    },
    {
      icon: Star,
      title: averageRating,
      text:
        approvedReviews.length > 0
          ? "Customer Rating"
          : "Customer Feedback",
    },
    {
      icon: Undo2,
      title: "Easy",
      text: "Return Support",
    },
    {
      icon: ShieldCheck,
      title: "Secure",
      text: "Safe Checkout",
    },
  ];

  return (
    <>
      <section className="px-4 sm:px-8 lg:px-16">
        <div className="mx-auto grid w-full max-w-[1820px] gap-8 lg:grid-cols-2">
          <div className="relative min-h-[340px] overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-7 shadow-[0_14px_40px_rgba(11,61,46,0.08)] sm:p-9">
            <div className="relative z-10 max-w-[390px]">
              <div className="mb-5 inline-flex items-center gap-3 rounded-[6px] bg-[#edf3f0] px-4 py-2 text-sm font-semibold text-[#0b3d2e]">
                <Sparkles size={16} aria-hidden="true" />
                Skin Quiz
              </div>

              <h2 className="dream-font text-[42px] leading-[1] text-[#142012] sm:text-[46px]">
                Not sure what your skin needs?
              </h2>

              <p className="mt-5 text-[15px] leading-7 text-[#263421]">
                Take our Skin Quiz and get personalized
                product recommendations for your unique
                skincare needs.
              </p>

              <Link
                href="/skin-quiz"
                className="mt-7 inline-flex items-center gap-10 rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-7 py-4 font-bold text-white shadow-[0_14px_32px_rgba(11,61,46,0.24)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(11,61,46,0.32)]"
              >
                Start Skin Quiz
                <ArrowRight
                  size={17}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-7 shadow-[0_14px_40px_rgba(11,61,46,0.08)] sm:p-9">
            <div className="relative z-10 max-w-[390px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-[6px] bg-[#edf3f0] px-4 py-2 text-sm font-semibold text-[#0b3d2e]">
                <Leaf size={16} aria-hidden="true" />
                Routine Builder
              </div>

              <h2 className="dream-font text-[42px] leading-[1] text-[#142012] sm:text-[46px]">
                Build Your Routine
              </h2>

              <p className="mt-5 text-[15px] leading-7 text-[#263421]">
                Create a personalized skincare routine with
                products selected according to your skin
                type, concerns and goals.
              </p>

              <Link
                href="/routine-builder"
                className="mt-7 inline-flex items-center gap-10 rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-7 py-4 font-bold text-white shadow-[0_14px_32px_rgba(11,61,46,0.24)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(11,61,46,0.32)]"
              >
                Build Routine
                <ArrowRight
                  size={17}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 px-4 sm:px-8 lg:px-14">
        <div className="mx-auto grid w-full max-w-[1820px] grid-cols-1 gap-4 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-5 shadow-[0_14px_40px_rgba(11,61,46,0.08)] sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.text}
                className="flex items-center justify-center gap-4 border-[#0b3d2e]/10 p-3 lg:border-r lg:last:border-r-0"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] bg-[#edf3f0] text-[#0b3d2e]">
                  <Icon size={24} aria-hidden="true" />
                </span>

                <span>
                  <span className="block text-[24px] font-black leading-none text-[#0b3d2e]">
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