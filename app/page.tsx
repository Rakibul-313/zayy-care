import type { Metadata } from "next";
import HomeClient from "../components/HomeClient";

export const metadata: Metadata = {
  title: "International Skincare & Beauty Products in Bangladesh",

  description:
    "Shop carefully selected skincare and beauty products from Korean, Japanese, Hong Kong and other international brands in Bangladesh. Discover cleansers, toners, serums, moisturizers, sunscreens and personalized skincare solutions at ZAYY Care.",

  keywords: [
    "ZAYY Care",
    "international skincare Bangladesh",
    "global beauty products Bangladesh",
    "Korean skincare Bangladesh",
    "Japanese skincare Bangladesh",
    "Hong Kong skincare Bangladesh",
    "international beauty brands BD",
    "skincare products Bangladesh",
    "serum Bangladesh",
    "sunscreen Bangladesh",
    "cleanser Bangladesh",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "International Skincare & Beauty Products in Bangladesh",
    description:
      "Discover carefully selected skincare and beauty products from Korean, Japanese, Hong Kong and other international brands at ZAYY Care.",
    url: "/",
    siteName: "ZAYY Care",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "ZAYY Care International Skincare and Beauty",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "International Skincare & Beauty Products in Bangladesh",
    description:
      "Shop skincare and beauty products from trusted international brands at ZAYY Care.",
    images: ["/logo.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}