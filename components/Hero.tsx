"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";
import { ArrowRight, Leaf, Play, ShoppingBag, Sparkles } from "lucide-react";

type Banner = {
  badge: string;
  title: string;
  highlight: string;
  text: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  enabled?: boolean;
};

type Order = {
  customer?: { email?: string };
  shippingAddress?: { phone?: string };
};

type Review = {
  rating?: number;
  approved?: boolean;
};

const fallbackBanners: Banner[] = [
  {
    badge: "Best of Korean Skincare",
    title: "Glow Naturally,",
    highlight: "Love Your Skin",
    text: "100% authentic Korean skincare for healthy, glowing skin.",
    image: "/hero-product.png",
    buttonText: "Shop Now",
    buttonLink: "/shop",
  },
];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/hero-product.png";

  let path = src.trim();

  if (path.startsWith("public/")) path = path.replace("public", "");
  if (path.startsWith("/public/")) path = path.replace("/public", "");
  if (!path.startsWith("/") && !path.startsWith("http")) path = `/${path}`;

  return path;
}

function formatCustomerCount(count: number) {
  if (count >= 10000) return "10,000+";
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return `${count}+`;
}

export default function Hero() {
  const [active, setActive] = useState(0);
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "banners"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBanners(fallbackBanners);
        return;
      }

      const loaded = Object.values(data)
        .filter((item: any) => item.enabled !== false)
        .map((item: any) => ({
          badge: item.badge || "ZAYY Care",
          title: item.title || "Glow Naturally,",
          highlight: item.highlight || "Love Your Skin",
          text:
            item.text ||
            "100% authentic Korean skincare for healthy, glowing skin.",
          image: safeImage(item.image),
          buttonText: item.buttonText || "Shop Now",
          buttonLink: item.buttonLink || "/shop",
        }));

      setBanners(loaded.length > 0 ? loaded : fallbackBanners);
      setActive(0);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();
      setOrders(data ? Object.values(data) : []);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "reviews"), (snapshot) => {
      const data = snapshot.val();
      setReviews(data ? Object.values(data) : []);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, 5200);

    return () => clearInterval(timer);
  }, [banners.length]);

  const customerCount = useMemo(() => {
    const unique = new Set(
      orders
        .map((order) => order.customer?.email || order.shippingAddress?.phone)
        .filter(Boolean)
    );

    return unique.size;
  }, [orders]);

  const averageRating = useMemo(() => {
    const approved = reviews.filter(
      (review) => review.approved !== false && Number(review.rating) > 0
    );

    if (approved.length === 0) return "4.8";

    const total = approved.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return (total / approved.length).toFixed(1);
  }, [reviews]);

  const banner = banners[active] || fallbackBanners[0];

  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="glass glass-premium relative mx-auto min-h-[650px] w-full max-w-[1820px] overflow-hidden rounded-[42px] border-white/80 shadow-[0_38px_125px_rgba(31,43,20,0.24),inset_0_1px_2px_rgba(255,255,255,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(184,199,154,0.58),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(255,255,255,0.92),transparent_22%),radial-gradient(circle_at_20%_80%,rgba(85,107,47,0.16),transparent_32%),linear-gradient(90deg,rgba(255,250,241,0.92),rgba(255,250,241,0.52)_45%,rgba(255,255,255,0.08))]" />

        <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" />

       

        <div className="relative z-10 grid min-h-[650px] items-center gap-8 px-6 py-10 md:px-12 lg:grid-cols-[0.86fr_1.34fr] lg:px-20 lg:py-14">
          <div key={`${active}-${banner.title}`} className="slide-left max-w-[720px]">
            <div className="glass-soft mb-7 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-bold uppercase text-[#20351a]">
              <Sparkles size={16} className="text-[#d59a22]" />
              {banner.badge}
            </div>

            <h1 className="dream-font text-[54px] leading-[0.95] text-[#0d120c] sm:text-[78px] lg:text-[96px] xl:text-[116px]">
              {banner.title}
              <br />
              <span className="text-[#31571f]">{banner.highlight}</span>
            </h1>

            <p className="mt-7 max-w-[560px] text-[18px] leading-8 text-[#263421]">
              {banner.text}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={banner.buttonLink || "/shop"}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#31571f] px-9 py-4 text-[17px] font-bold text-white shadow-[0_18px_45px_rgba(49,87,31,0.28)]"
              >
                <ShoppingBag size={19} />
                {banner.buttonText || "Shop Now"}
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/routine-builder"
                className="glass-soft inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-[17px] font-bold text-[#20351a]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#31571f]">
                  <Play size={15} fill="currentColor" />
                </span>
                Explore Routine
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {["A", "R", "N"].map((item) => (
                  <span
                    key={item}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#31571f] text-sm font-bold text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div>
                <p className="font-bold text-[#142012]">
                  {formatCustomerCount(customerCount || 10000)} Happy Customers
                </p>

                <p className="text-sm font-semibold text-[#d59a22]">
                  ★★★★★ <span className="text-[#263421]">{averageRating}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[390px] items-end justify-center lg:min-h-[560px]">
            <div className="glass-soft pointer-events-none absolute bottom-[18%] right-[10%] hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#31571f] lg:flex">
              <Leaf size={17} />
              Dermatologically tested
            </div>

            <img
              key={banner.image}
              src={safeImage(banner.image)}
              alt="ZAYY Care Korean skincare products"
              className="relative z-10 max-h-[590px] w-full max-w-[960px] animate-float rounded-[36px] border border-white/50 object-cover shadow-[0_50px_120px_rgba(31,43,20,0.32)]"
            />
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {banners.map((item, index) => (
            <button
              key={`${item.badge}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`h-3 rounded-full border border-white/70 transition-all ${
                active === index ? "w-10 bg-[#556B2F]" : "w-3 bg-white/75"
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}