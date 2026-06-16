"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { database } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type BlogPost = {
  id: string;
  deleted?: boolean;
  title?: string;
  category?: string;
  summary?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  published?: boolean;
  featured?: boolean;
  author?: string;
  createdAt?: number;
};

const fallbackPosts: BlogPost[] = [
  {
    id: "fallback-1",
    title: "The Ultimate Guide to Building Your Perfect Skincare Routine",
    category: "Featured",
    summary:
      "Learn how to build a skincare routine that actually works for your skin type and concerns.",
    image: "/banners/shop-hero-desktop.png",
    featured: true,
    published: true,
    author: "Zayy Care Team",
    createdAt: Date.now(),
  },
  {
    id: "fallback-2",
    title: "Hyaluronic Acid: Hydration Hero Your Skin Loves",
    category: "Ingredient Guide",
    summary:
      "Why hyaluronic acid is a must-have ingredient for all skin types.",
    image: "/banners/shop-hero-desktop.png",
    published: true,
    author: "Zayy Care Team",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "fallback-3",
    title: "How to Treat and Prevent Acne Naturally",
    category: "Skincare Tips",
    summary:
      "Simple and effective tips to calm acne and prevent future breakouts.",
    image: "/banners/shop-hero-desktop.png",
    published: true,
    author: "Zayy Care Team",
    createdAt: Date.now() - 172800000,
  },
];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/banners/shop-hero-desktop.png";

  const image = src.trim();

  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;

  return `/${image}`;
}

function formatDate(value?: number) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(fallbackPosts);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [page, setPage] = useState(1);

  const postsPerPage = 6;

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const unsubscribe = onValue(ref(database, "blogs"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setPosts(fallbackPosts);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<BlogPost, "id">),
        }))
        .filter(
          (post: BlogPost) => post.published !== false && post.deleted !== true
        )
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setPosts(loaded.length > 0 ? loaded : fallbackPosts);
      setPage(1);
    });

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    };

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      unsubscribe();
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  const featuredPost = useMemo(() => {
    return posts.find((post) => post.featured) || posts[0];
  }, [posts]);

  const normalPosts = useMemo(() => {
    return posts.filter((post) => post.id !== featuredPost?.id);
  }, [posts, featuredPost]);

  const totalPages = Math.max(1, Math.ceil(normalPosts.length / postsPerPage));

  const visiblePosts = useMemo(() => {
    return normalPosts.slice((page - 1) * postsPerPage, page * postsPerPage);
  }, [normalPosts, page]);

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 70, damping: 20, mass: 0.9 }}
        className="min-h-screen bg-[#fafaf7]"
      >
        <section className="px-4 pt-[105px] sm:px-8 lg:px-14 lg:pt-[115px]">
          <div className="mx-auto max-w-[1820px] py-8 text-center">
            <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[58px]">
              Our Blog
            </h1>

            <p className="mx-auto mt-3 max-w-[620px] text-sm leading-7 text-[#4f5f49]">
              Skincare tips, expert advice, and all things K-beauty.
            </p>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-[1500px]">
            {featuredPost && (
              <article className="mb-8 grid overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-white shadow-[0_10px_28px_rgba(11,61,46,0.08)] lg:grid-cols-[1.05fr_.95fr]">
                <Link
                  href={`/blog/${featuredPost.id}`}
                  className="relative min-h-[280px] overflow-hidden bg-[#f5f1e8]"
                >
                  <Image
                    src={safeImage(featuredPost.image)}
                    alt={featuredPost.title || "Blog"}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                </Link>

                <div className="flex flex-col justify-center p-6 lg:p-10">
                  <span className="mb-5 w-fit rounded-[6px] bg-[#e9f6ed] px-3 py-1 text-[10px] font-black uppercase text-[#0b3d2e]">
                    Featured
                  </span>

                  <Link href={`/blog/${featuredPost.id}`}>
                    <h2 className="dream-font text-[34px] leading-tight text-[#0b3d2e] sm:text-[44px]">
                      {featuredPost.title}
                    </h2>
                  </Link>

                  <p className="mt-4 max-w-[560px] text-sm leading-7 text-[#4f5f49]">
                    {featuredPost.summary || featuredPost.excerpt}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-[#4f5f49]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f1e8] text-[#0b3d2e]">
                        <UserRound size={15} />
                      </span>
                      <span>{featuredPost.author || "Zayy Care Team"}</span>
                      <span>•</span>
                      <span>{formatDate(featuredPost.createdAt)}</span>
                    </div>

                    <Link
                      href={`/blog/${featuredPost.id}`}
                      className="flex h-10 items-center gap-2 rounded-[6px] bg-[#0b3d2e] px-5 text-xs font-black uppercase text-white"
                    >
                      Read More
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 26, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{
                    delay: index * 0.04,
                    type: "spring",
                    stiffness: 80,
                    damping: 20,
                  }}
                  className="overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-white shadow-[0_8px_24px_rgba(11,61,46,0.07)] transition hover:-translate-y-1"
                >
                  <Link
                    href={`/blog/${post.id}`}
                    className="relative block h-[210px] overflow-hidden bg-[#f5f1e8]"
                  >
                    <Image
                      src={safeImage(post.image)}
                      alt={post.title || "Blog"}
                      fill
                      sizes="(max-width: 768px) 100vw, 480px"
                      className="object-cover transition duration-500 hover:scale-105"
                    />

                    <span className="absolute left-4 top-4 rounded-[6px] bg-[#e9f6ed] px-3 py-1 text-[10px] font-black uppercase text-[#0b3d2e]">
                      {post.category || "Skincare Tips"}
                    </span>
                  </Link>

                  <div className="p-5">
                    <Link href={`/blog/${post.id}`}>
                      <h3 className="line-clamp-2 text-[18px] font-black leading-6 text-[#102015] hover:text-[#0b3d2e]">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4f5f49]">
                      {post.summary || post.excerpt}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-[#4f5f49]">
                      <span>{post.author || "Zayy Care Team"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {normalPosts.length > postsPerPage && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e] disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`flex h-9 w-9 items-center justify-center rounded-[6px] text-sm font-black ${
                        page === pageNumber
                          ? "bg-[#0b3d2e] text-white"
                          : "border border-[#0b3d2e]/10 bg-white text-[#0b3d2e]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e] disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}