"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";
import { ArrowRight, Leaf, Play, ShoppingBag, Sparkles } from "lucide-react";

type Banner = {
  deleted?: boolean;
  approved?: boolean;
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
  deleted?: boolean;
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

function isVideo(src?: string) {
  if (!src) return false;
  const path = src.toLowerCase();
  return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov");
}

function formatCustomerCount(count: number) {
  if (count >= 10000) return "10,000+";
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return `${count}+`;
}

export default function Hero() {
  const [active, setActive] = useState(0);
  const [previousActive, setPreviousActive] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
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
        .map((item) => item as Banner)
        .filter((item) => item.enabled !== false && item.deleted !== true)
        .map((item) => ({
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
      setPreviousActive(0);
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

  const changeBanner = (index: number) => {
    if (index === active || isChanging) return;

    setPreviousActive(active);
    setIsChanging(true);
    setActive(index);

    window.setTimeout(() => {
      setPreviousActive(index);
      setIsChanging(false);
    }, 850);
  };

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      const next = (active + 1) % banners.length;
      changeBanner(next);
    }, 5200);

    return () => clearInterval(timer);
  }, [active, banners.length, isChanging]);

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
      (review) =>
        review.approved !== false &&
        review.deleted !== true &&
        Number(review.rating) > 0
    );

    if (approved.length === 0) return "4.8";

    const total = approved.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return (total / approved.length).toFixed(1);
  }, [reviews]);

  const banner = banners[active] || fallbackBanners[0];
  const previousBanner = banners[previousActive] || banner;

  const currentMedia = safeImage(banner.image);
  const previousMedia = safeImage(previousBanner.image);
  const heroLink = banner.buttonLink || "/shop";

  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="relative mx-auto aspect-[16/7] w-full max-w-[1820px] overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <Link
          href={heroLink}
          aria-label={`Open ${banner.title} ${banner.highlight}`}
          className="absolute inset-0 z-[4] block sm:hidden"
        />

        <div className="absolute inset-0">
          {isVideo(previousMedia) ? (
            <video
              key={`previous-${previousMedia}`}
              autoPlay
              muted
              loop
              playsInline
              className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-[850ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isChanging
                  ? "scale-[1.04] opacity-0"
                  : "scale-100 opacity-100"
              }`}
            >
              <source src={previousMedia} />
            </video>
          ) : (
            <img
              key={`previous-${previousMedia}`}
              src={previousMedia}
              alt="ZAYY Care Korean skincare hero"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-[850ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isChanging
                  ? "scale-[1.04] opacity-0"
                  : "scale-100 opacity-100"
              }`}
            />
          )}

          {isVideo(currentMedia) ? (
            <video
              key={`current-${currentMedia}`}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-center opacity-100 transition-all duration-[850ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              <source src={currentMedia} />
            </video>
          ) : (
            <img
              key={`current-${currentMedia}`}
              src={currentMedia}
              alt="ZAYY Care Korean skincare hero"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-100 transition-all duration-[850ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          )}
        </div>

        <div className="absolute inset-y-0 left-0 w-[40%] bg-[#f5f1e8]/90 max-sm:w-[58%] max-sm:bg-[#f5f1e8]/82" />
        <div className="absolute inset-y-0 left-[40%] w-[16%] bg-gradient-to-r from-[#f5f1e8]/90 to-transparent max-sm:left-[58%] max-sm:w-[18%] max-sm:from-[#f5f1e8]/82" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#102015]/8 via-transparent to-transparent" />

        <div className="relative z-10 grid h-full grid-cols-[2fr_3fr] items-center px-3 py-2 sm:px-8 sm:py-4 md:px-10 lg:px-16 xl:px-20">
          <div
            key={`${active}-${banner.title}`}
            className="max-w-[560px] animate-[fadeIn_.65s_ease-out]"
          >
            <div className="mb-1 inline-flex max-w-[120px] items-center gap-1 rounded-[6px] bg-white px-2 py-1 text-[6px] font-black uppercase leading-tight tracking-wide text-[#0b3d2e] shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:mb-4 sm:max-w-none sm:gap-1.5 sm:px-4 sm:py-2 sm:text-[11px] lg:text-[12px]">
              <Sparkles size={9} className="shrink-0 text-[#d59a22] sm:size-[15px]" />
              {banner.badge}
            </div>

            <h1 className="dream-font text-[20px] leading-[0.92] text-[#102015] sm:text-[48px] lg:text-[70px] xl:text-[92px]">
              {banner.title}
              <br />
              <span className="text-[#0b3d2e]">{banner.highlight}</span>
            </h1>

            <p className="mt-1 max-w-[190px] text-[8px] font-medium leading-3 text-[#263421] sm:mt-5 sm:max-w-[480px] sm:text-[15px] sm:leading-7 lg:text-[16px]">
              {banner.text}
            </p>

            <div className="relative z-20 mt-2 flex flex-nowrap items-center gap-1.5 sm:mt-6 sm:flex-wrap sm:gap-3">
              <Link
                href={heroLink}
                className="inline-flex items-center gap-1 rounded-[6px] bg-[#003f2a] px-2.5 py-1.5 text-[8px] font-black text-white shadow-[0_8px_24px_rgba(11,61,46,0.16)] transition hover:bg-[#062A18] sm:gap-2 sm:px-7 sm:py-4 sm:text-[15px]"
              >
                <ShoppingBag size={10} className="sm:size-[18px]" />
                {banner.buttonText || "Shop Now"}
                <ArrowRight size={10} className="sm:size-[18px]" />
              </Link>

              <Link
                href="/routine-builder"
                className="inline-flex items-center gap-1 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-2.5 py-1.5 text-[8px] font-black text-[#0b3d2e] shadow-[0_8px_24px_rgba(11,61,46,0.06)] transition hover:bg-[#f5f1e8] sm:gap-3 sm:px-6 sm:py-4 sm:text-[15px]"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#f5f1e8] text-[#0b3d2e] sm:h-7 sm:w-7 sm:rounded-[6px]">
                  <Play size={8} fill="currentColor" className="sm:size-[14px]" />
                </span>
                Explore
              </Link>
            </div>
          </div>

          <div className="relative hidden h-full items-end justify-center lg:flex">
            <div className="absolute bottom-[24%] right-[8%] flex items-center gap-2 rounded-[6px] bg-white px-4 py-2 text-sm font-black text-[#0b3d2e] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
              <Leaf size={17} />
              Dermatologically tested
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-1 left-1/2 z-30 flex -translate-x-1/2 gap-1 sm:bottom-5 sm:gap-2">
            {banners.map((item, index) => (
              <button
                key={`${item.badge}-${index}`}
                type="button"
                onClick={() => changeBanner(index)}
                className={`h-1.5 rounded-[6px] border border-white transition-all duration-300 sm:h-3 ${
                  active === index
                    ? "w-6 bg-[#0b3d2e] sm:w-10"
                    : "w-1.5 bg-white sm:w-3"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}