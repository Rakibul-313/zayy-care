"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, Home, ShoppingBag, ClipboardList } from "lucide-react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 70, damping: 20, mass: 0.9 }}
        className="min-h-screen bg-[#fafaf7]"
      >
        <section className="pt-[105px] lg:pt-[115px]">
          <div className="relative overflow-hidden bg-[#f5f1e8]">
            <div className="absolute inset-0 opacity-45 md:opacity-100">
              <Image
                src="/banners/shop-hero-desktop.png"
                alt="Order success"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/85 to-[#f5f1e8]/20" />

            <div className="mx-auto max-w-[1820px] px-4 py-10 sm:px-8 md:py-14 lg:px-14 lg:py-16">
              <div className="relative z-10 max-w-[620px]">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#263421]">
                  <Link href="/">Home</Link>
                  <span>›</span>
                  <span>Order Success</span>
                </div>

                <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[64px]">
                  Thank You!
                </h1>

                <p className="mt-4 max-w-[460px] text-[16px] leading-8 text-[#263421]">
                  Your ZAYY Care order has been placed successfully.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-[900px] rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 text-center shadow-[0_10px_28px_rgba(11,61,46,0.08)] sm:p-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
              <CheckCircle size={50} />
            </div>

            <p className="mb-2 text-sm font-black uppercase tracking-wide text-[#4f7a3a]">
              Order Placed Successfully
            </p>

            <h2 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[58px]">
              Order Received
            </h2>

            {orderNumber && (
              <div className="mx-auto mt-6 max-w-[420px] rounded-[6px] bg-[#f5f1e8] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                  Your Order Number
                </p>
                <p className="mt-1 text-2xl font-black text-[#102015]">
                  #{orderNumber}
                </p>
              </div>
            )}

            <p className="mx-auto mt-6 max-w-[620px] text-sm leading-7 text-[#4f5f49]">
              We have received your order. Our team will contact you soon to
              confirm your delivery details.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link href="/shop" className="flex h-12 items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase text-white shadow-[0_8px_18px_rgba(11,61,46,0.20)]">
                <ShoppingBag size={17} />
                Continue Shopping
              </Link>

              <Link href="/profile/orders" className="flex h-12 items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-sm font-black text-[#0b3d2e]">
                <ClipboardList size={17} />
                View Orders
              </Link>

              <Link href="/" className="flex h-12 items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-sm font-black text-[#0b3d2e]">
                <Home size={17} />
                Back Home
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf7]" />}>
      <OrderSuccessContent />
    </Suspense>
  );
}