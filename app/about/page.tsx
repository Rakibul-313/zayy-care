"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";
import {
  CheckCircle2,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Navbar cartCount={getCartCount()} wishlistCount={getWishlistCount()} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pt-[115px] pb-10 sm:px-8 lg:px-14 lg:pt-[130px]">
          <div className="mx-auto max-w-[1500px] space-y-8">
            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 text-center shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0b3d2e]">
                About ZAYY Care
              </p>

              <h1 className="dream-font mt-4 text-[44px] leading-none text-[#0b3d2e] sm:text-[64px]">
                Glow Naturally, Love Your Skin
              </h1>

              <p className="mx-auto mt-5 max-w-[760px] text-sm leading-8 text-[#4f5f49]">
                ZAYY Care is a premium skincare destination focused on authentic
                Korean skincare products, simple routines, and trusted beauty
                guidance for every skin type.
              </p>
            </div>

            <section className="grid gap-6 lg:grid-cols-3">
              <InfoCard
                icon={ShieldCheck}
                title="100% Authentic"
                text="We focus on trusted skincare products so customers can shop with confidence."
              />

              <InfoCard
                icon={Leaf}
                title="Skin Friendly"
                text="Our goal is to help customers choose products based on skin type, concern, and routine."
              />

              <InfoCard
                icon={Truck}
                title="Easy Shopping"
                text="Smooth online shopping, simple checkout, order updates, and customer support."
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
                    <Heart size={22} />
                  </div>

                  <h2 className="text-2xl font-black text-[#102015]">
                    Our Story
                  </h2>
                </div>

                <p className="text-sm leading-8 text-[#4f5f49]">
                  ZAYY Care was created to make premium skincare easier to
                  understand and easier to buy. Many customers want Korean
                  skincare, but choosing the right product can be confusing.
                  That is why we focus on clean product presentation, helpful
                  guides, skin quiz recommendations, and routine builder support.
                </p>

                <p className="mt-4 text-sm leading-8 text-[#4f5f49]">
                  Our mission is simple: help people build a skincare routine
                  that feels gentle, effective, and suitable for their lifestyle.
                </p>
              </div>

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-white text-[#0b3d2e]">
                    <Sparkles size={22} />
                  </div>

                  <h2 className="text-2xl font-black text-[#102015]">
                    Why Choose Us?
                  </h2>
                </div>

                <div className="space-y-4">
                  {[
                    "Authentic Korean skincare focus",
                    "Product filtering by skin concern",
                    "Skin quiz and routine builder support",
                    "Wishlist, cart, order tracking and reviews",
                    "Customer-friendly support system",
                  ].map((item) => (
                    <p
                      key={item}
                      className="flex items-start gap-3 text-sm font-bold leading-6 text-[#263421]"
                    >
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-[#0b3d2e]"
                      />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 text-center shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-10">
              <h2 className="text-3xl font-black text-[#0b3d2e]">
                Start Your Skincare Journey
              </h2>

              <p className="mx-auto mt-3 max-w-[620px] text-sm leading-7 text-[#4f5f49]">
                Explore products, take the skin quiz, or build your skincare
                routine with ZAYY Care.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/shop"
                  className="flex h-12 items-center justify-center rounded-[6px] bg-[#0b3d2e] px-7 text-sm font-black uppercase text-white"
                >
                  Shop Now
                </Link>

                <Link
                  href="/skin-quiz"
                  className="flex h-12 items-center justify-center rounded-[6px] border border-[#0b3d2e]/20 bg-[#fafaf7] px-7 text-sm font-black uppercase text-[#0b3d2e]"
                >
                  Take Skin Quiz
                </Link>
              </div>
            </section>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 text-center shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
        <Icon size={23} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#102015]">{title}</h3>

      <p className="mt-2 text-sm leading-7 text-[#4f5f49]">{text}</p>
    </div>
  );
}