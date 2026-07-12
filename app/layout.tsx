import type { Metadata } from "next";
import "./globals.css";

import localFont from "next/font/local";

import ScrollMemory from "@/components/ScrollMemory";

export const dreamFont = localFont({
  src: "../public/fonts/DreamAvenue.woff2",
  variable: "--font-dream",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zayy-care-eight.vercel.app"),

  title: {
    default: "ZAYY Care | International Skincare & Beauty in Bangladesh",
    template: "%s | ZAYY Care",
  },

  description:
    "Shop carefully selected international skincare and beauty products in Bangladesh. Discover Korean, Japanese, Hong Kong and other global brands, including cleansers, toners, serums, moisturizers and sunscreens at ZAYY Care.",

  keywords: [
    "ZAYY Care",
    "international skincare Bangladesh",
    "global skincare brands Bangladesh",
    "Korean skincare Bangladesh",
    "Japanese skincare Bangladesh",
    "Hong Kong beauty products Bangladesh",
    "skincare products BD",
    "beauty products Bangladesh",
    "international beauty brands BD",
    "serum Bangladesh",
    "sunscreen Bangladesh",
    "cleanser Bangladesh",
  ],

  authors: [{ name: "ZAYY Care" }],
  creator: "ZAYY Care",
  publisher: "ZAYY Care",
  applicationName: "ZAYY Care",
  category: "Skincare and Beauty",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.png",
    apple: "/logo.png",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/",
    siteName: "ZAYY Care",

    title: "ZAYY Care | International Skincare & Beauty in Bangladesh",

    description:
      "Discover carefully selected skincare and beauty products from Korean, Japanese, Hong Kong and other international brands at ZAYY Care.",

    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "ZAYY Care International Skincare and Beauty Bangladesh",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "ZAYY Care | International Skincare & Beauty in Bangladesh",

    description:
      "Shop skincare and beauty products from trusted international brands at ZAYY Care.",

    images: ["/logo.png"],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dreamFont.variable} antialiased`}>
        <ScrollMemory />
        {children}
      </body>
    </html>
  );
}