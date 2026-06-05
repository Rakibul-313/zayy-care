"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ShoppingBag } from "lucide-react";

export default function OrderSuccessPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar />

      <div className="pt-[175px] pb-20 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[900px] mx-auto glass rounded-[40px] p-10 text-center">
          <CheckCircle size={90} className="mx-auto text-[#556B2F] mb-6" />

          <p className="text-[#556B2F] font-medium mb-2">
            Order Placed Successfully
          </p>

          <h1 className="dream-font text-[48px] sm:text-[64px] text-black mb-5">
            Thank You!
          </h1>

          <p className="text-gray-600 leading-8 max-w-[620px] mx-auto">
            Your ZAYY Care order has been received. We will contact you soon to
            confirm your delivery details.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link
              href="/shop"
              className="bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover flex items-center justify-center gap-2"
            >
              <ShoppingBag size={20} />
              Continue Shopping
            </Link>

            <Link
              href="/"
              className="glass rounded-full px-8 py-4 text-[#556B2F] premium-hover"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}