"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { ArrowRight } from "lucide-react";
import { database } from "@/firebase/config";

export default function Footer() {
  const [settings, setSettings] = useState({
    siteName: "ZAYY Care",
    siteTagline: "Glow Naturally, Love Your Skin",
    logo: "/logo.png",
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    whatsapp:"",
    footerText: "Glow Naturally, Love Your Skin.",
    aboutText:
      "We bring you the best of Korean skincare - authentic, effective, and made for healthy, glowing skin.",
  });

useEffect(() => {
  const unsubscribe = onValue(ref(database, "settings/general"), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      setSettings((prev) => ({ ...prev, ...data }));
    }
  });

  return () => unsubscribe();
}, []);
  const socialLinks = [
  ["Facebook", settings.facebook, "/socials/facebook.png"],
  ["Instagram", settings.instagram, "/socials/instagram.png"],
  ["TikTok", settings.tiktok, "/socials/tiktok.png"],
  ["YouTube", settings.youtube, "/socials/youtube.png"],
  ["WhatsApp", settings.whatsapp, "/socials/whatsapp.png"],
];

  const shopLinks = [
    ["All Products", "/shop"],
    ["Best Sellers", "/shop"],
    ["New Arrivals", "/shop"],
    ["Skin Care", "/shop"],
    ["Serums", "/shop"],
    ["Cleansers", "/shop"],
    ["Toners", "/shop"],
  ];

  const supportLinks = [
    ["FAQ", "/contact"],
    ["Shipping Policy", "/contact"],
    ["Return Policy", "/contact"],
    ["Privacy Policy", "/contact"],
    ["Terms & Conditions", "/contact"],
    ["Contact Us", "/contact"],
  ];

  return (
    <footer className="w-full px-4 pb-8 sm:px-8 lg:px-14">
      <div className="glass mx-auto w-full max-w-[1820px] rounded-[34px] px-7 py-8 sm:px-9 lg:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.25fr_0.8fr_1fr_1.25fr_1.35fr] lg:gap-10">
          <div>
            <Link href="/" className="mb-4 inline-flex">
              <div className="relative h-[72px] w-[180px]">
                <Image
                  src={settings.logo || "/logo.png"}
                  alt={settings.siteName}
                  fill
                  sizes="180px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <p className="dream-font text-[24px] leading-[1.2] text-[#142012]">
              {settings.footerText}
            </p>

            <div className="mt-5 flex gap-3">
              {socialLinks
                .filter(([, href]) => href)
                .map(([label, href, src]) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="
                  flex h-12 w-12 items-center justify-center
                  rounded-full
                  border border-white/60
                  bg-white/55
                  shadow-[0_10px_30px_rgba(31,43,20,0.12)]
                  backdrop-blur-xl
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:bg-[#31571f]
                  "
                >
                  <Image
                    src={src}
                    alt={label}
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-[#142012]">Shop</h3>
            <div className="flex flex-col gap-2.5">
              {shopLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[14px] text-[#2f3b2a] transition hover:text-[#31571f]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-[#142012]">
              Help & Support
            </h3>
            <div className="flex flex-col gap-2.5">
              {supportLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[14px] text-[#2f3b2a] transition hover:text-[#31571f]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-[#142012]">
              About ZAYY Care
            </h3>

            <p className="max-w-[240px] text-[14px] leading-7 text-[#2f3b2a]">
             {settings.aboutText}
            </p>

            <div className="mt-2 hidden justify-end md:flex">
              <span className="dream-font text-[64px] leading-none text-[#556B2F]/20">
                leaf
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-[#142012]">
              Newsletter
            </h3>

            <p className="mb-5 max-w-[280px] text-[14px] leading-7 text-[#2f3b2a]">
              Subscribe to get special offers and skincare tips.
            </p>

            <form className="glass-soft flex max-w-[320px] items-center gap-2 rounded-2xl p-2">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-[#142012] outline-none placeholder:text-[#62705c]"
              />

              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#31571f] text-white shadow-[0_12px_24px_rgba(49,87,31,0.28)] transition hover:-translate-y-0.5"
              >
                <ArrowRight size={19} />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {["bKash", "Nagad", "VISA", "Mastercard"].map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-white/60 bg-white/55 px-3 py-1.5 text-[12px] font-bold text-[#142012] shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#142012]/10 pt-5 text-[13px] text-[#2f3b2a]">
          © 2026 ZAYY Care. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
