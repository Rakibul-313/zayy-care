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
    whatsapp: "",
    footerText: "Glow Naturally, Love Your Skin.",
    aboutText:
      "We bring you the best of Korean skincare - authentic, effective, and made for healthy, glowing skin.",
  });

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "settings/general"), (snapshot) => {
      const data = snapshot.val();
      if (data) setSettings((prev) => ({ ...prev, ...data }));
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
    <footer className="w-full bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-4 py-10 text-white sm:px-8 lg:px-14 lg:py-14">
      <div className="mx-auto w-full max-w-[1820px]">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.25fr_0.8fr_1fr_1.25fr_1.35fr] lg:gap-12">
          <div>
            <Link href="/" className="mb-5 inline-flex">
              <div className="relative h-[78px] w-[190px]">
                <Image
                  src={settings.logo || "/logo.png"}
                  alt={settings.siteName}
                  fill
                  sizes="190px"
                  className="object-contain object-left brightness-0 invert"
                />
              </div>
            </Link>

            <p className="dream-font text-[26px] leading-[1.2] text-white">
              {settings.footerText}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks
                .filter(([, href]) => href)
                .map(([label, href, src]) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/20 bg-white/10 transition hover:bg-white/20"
                  >
                    <Image
                      src={src}
                      alt={label}
                      width={21}
                      height={21}
                      className="object-contain brightness-0 invert"
                    />
                  </a>
                ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-white">Shop</h3>
            <div className="flex flex-col gap-2.5">
              {shopLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[14px] text-white/70 transition hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-white">
              Help & Support
            </h3>
            <div className="flex flex-col gap-2.5">
              {supportLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[14px] text-white/70 transition hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-white">
              About ZAYY Care
            </h3>

            <p className="max-w-[260px] text-[14px] leading-7 text-white/70">
              {settings.aboutText}
            </p>

            <div className="mt-4 hidden justify-end md:flex">
              <span className="dream-font text-[64px] leading-none text-white/10">
                leaf
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[17px] font-bold text-white">
              Newsletter
            </h3>

            <p className="mb-5 max-w-[280px] text-[14px] leading-7 text-white/70">
              Subscribe to get special offers and skincare tips.
            </p>

            <form className="flex max-w-[340px] items-center gap-2 rounded-[12px] border border-white/20 bg-white/10 p-2">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>

              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/50"
              />

              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#0b3d2e] transition hover:bg-[#f5f1e8]"
              >
                <ArrowRight size={19} />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {["bKash", "Nagad", "VISA", "Mastercard"].map((item) => (
                <span
                  key={item}
                  className="rounded-[8px] border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-[13px] text-white/65">
          © 2026 ZAYY Care. All rights reserved.
        </div>
      </div>
    </footer>
  );
}