"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Leaf, UserRound } from "lucide-react";
import { onValue, ref } from "firebase/database";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { database } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type BlogPost = {
  id: string;
  slug?: string;
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

function generateSlug(text?: string) {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogDetailsPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const unsubscribePost = onValue(ref(database, "blogs"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setPost(null);
        setLoading(false);
        return;
      }

      const found = Object.entries(data)
        .map(([blogId, value]: any) => {
          const blog = value as Omit<BlogPost, "id">;

          return {
            id: blogId,
            ...blog,
            slug: blog.slug || generateSlug(blog.title),
          };
        })
        .find((blog) => blog.slug === id || blog.id === id);

      if (!found || found.published === false || found.deleted === true) {
        setPost(null);
      } else {
        setPost(found);
      }

      setLoading(false);
    });

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    };

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      unsubscribePost();
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, [id]);

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
          <div className="mx-auto max-w-[1200px] py-8">
            <Link
              href="/blog"
              className="mb-6 inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 text-sm font-black text-[#0b3d2e]"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </Link>

            {loading ? (
              <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center text-[#4f5f49]">
                Loading article...
              </section>
            ) : !post ? (
              <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
                <h1 className="text-3xl font-black text-[#102015]">
                  Article not found
                </h1>
                <p className="mt-3 text-sm text-[#4f5f49]">
                  This blog post may be unpublished or deleted.
                </p>
              </section>
            ) : (
              <>
                <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_10px_28px_rgba(11,61,46,0.08)] sm:p-8 lg:p-10">
                  <div className="mb-5 flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-2 rounded-[6px] bg-[#e9f6ed] px-3 py-1 text-[11px] font-black uppercase text-[#0b3d2e]">
                      <Leaf size={14} />
                      {post.category || "Skincare"}
                    </span>

                    <span className="flex items-center gap-2 text-sm font-bold text-[#4f5f49]">
                      <CalendarDays size={16} />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>

                  <h1 className="dream-font max-w-[980px] text-[42px] leading-none text-[#0b3d2e] sm:text-[64px]">
                    {post.title}
                  </h1>

                  {(post.summary || post.excerpt) && (
                    <p className="mt-5 max-w-[850px] text-[16px] leading-8 text-[#4f5f49]">
                      {post.summary || post.excerpt}
                    </p>
                  )}

                  <div className="mt-7 flex items-center gap-3 text-sm font-bold text-[#4f5f49]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f1e8] text-[#0b3d2e]">
                      <UserRound size={16} />
                    </span>
                    <span>{post.author || "Zayy Care Team"}</span>
                  </div>
                </section>

                <section className="mt-8 overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-white p-3 shadow-[0_8px_24px_rgba(11,61,46,0.07)]">
                  <div className="relative min-h-[260px] overflow-hidden rounded-[6px] bg-[#f5f1e8] sm:min-h-[420px]">
                    <Image
                      src={safeImage(post.image)}
                      alt={post.title || "Blog"}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className="object-cover"
                    />
                  </div>
                </section>

                <section className="mt-8 rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.07)] sm:p-8 lg:p-10">
                  <article className="prose prose-lg max-w-none">
                    <p className="whitespace-pre-line text-[17px] leading-9 text-[#263421]">
                      {post.content || "No article content available."}
                    </p>
                  </article>
                </section>
              </>
            )}
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}