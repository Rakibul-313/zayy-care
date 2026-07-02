import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";

export const dreamFont = localFont({
  src: "../public/fonts/DreamAvenue.woff2",
  variable: "--font-dream",
});

export const metadata: Metadata = {
  title: {
    default: "ZAYY Care | Premium Korean Skincare in Bangladesh",
    template: "%s | ZAYY Care",
  },
  description:
    "Shop 100% authentic Korean skincare products in Bangladesh. Discover cleansers, serums, toners, sunscreens and skincare routines from ZAYY Care.",
  keywords: [
    "ZAYY Care",
    "Korean skincare Bangladesh",
    "authentic Korean skincare",
    "K beauty Bangladesh",
    "skincare products BD",
    "COSRX Bangladesh",
    "Anua Bangladesh",
    "Beauty of Joseon Bangladesh",
  ],
  authors: [{ name: "ZAYY Care" }],
  creator: "ZAYY Care",
  publisher: "ZAYY Care",
  openGraph: {
    title: "ZAYY Care | Premium Korean Skincare",
    description:
      "Premium authentic Korean skincare products for healthy, glowing skin.",
    url: "https://zayycare.com",
    siteName: "ZAYY Care",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZAYY Care Korean Skincare",
      },
    ],
    locale: "en_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZAYY Care | Premium Korean Skincare",
    description: "Shop authentic Korean skincare products in Bangladesh.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={dreamFont.variable}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}