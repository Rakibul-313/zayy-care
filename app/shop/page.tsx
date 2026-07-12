import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop International Skincare & Beauty Products",

  description:
    "Browse skincare and beauty products from Korean, Japanese, Hong Kong and other international brands. Shop cleansers, serums, toners, sunscreens and more at ZAYY Care.",

  keywords: [
    "international skincare Bangladesh",
    "beauty products Bangladesh",
    "Japanese skincare Bangladesh",
    "Korean skincare Bangladesh",
    "Hong Kong skincare",
    "shop skincare Bangladesh",
    "ZAYY Care",
  ],

  alternates: {
    canonical: "/shop",
  },

  openGraph: {
    title: "Shop International Skincare & Beauty Products",
    description:
      "Discover skincare and beauty products from trusted international brands at ZAYY Care.",
    url: "/shop",
    images: ["/logo.png"],
  },

  twitter: {
    card: "summary_large_image",
    title: "Shop International Skincare & Beauty Products",
    description:
      "Shop international skincare and beauty products in Bangladesh.",
    images: ["/logo.png"],
  },
};

export default function Page() {
  return <ShopClient />;
}