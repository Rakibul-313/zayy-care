"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Leaf, Sparkles } from "lucide-react";
import { onValue, ref } from "firebase/database";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { database } from "@/firebase/config";

type BlogPost = {
  id: string;
  title?: string;
  category?: string;
  summary?: string;
  content?: string;
  image?: string;
  published?: boolean;
  createdAt?: number;
};

const fallbackPosts: BlogPost[] = [
  {
    id: "fallback-1",
    title: "How to layer Korean skincare without overwhelming your skin",
    category: "Routine",
    summary:
      "A calm order for cleanser, toner, serum, moisturizer, and sunscreen.",
    published: true,
    createdAt: Date.now(),
  },
  {
    id: "fallback-2",
    title: "Centella, snail mucin, and heartleaf: what they are used for",
    category: "Ingredients",
    summary: "A plain-language guide to popular Korean skincare ingredients.",
    published: true,
    createdAt: Date.now(),
  },
  {
    id: "fallback-3",
    title: "A beginner routine for humid weather",
    category: "Skin Guide",
    summary:
      "Lightweight product categories for a fresh routine in Bangladesh.",
    published: true,
    createdAt: Date.now(),
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(fallbackPosts);

  useEffect(() => {
    const blogsRef = ref(database, "blogs");

    const unsubscribe = onValue(blogsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setPosts(fallbackPosts);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]: any) => ({ id, ...value }))
        .filter((post: BlogPost) => post.published !== false)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setPosts(loaded.length > 0 ? loaded : fallbackPosts);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar />

      <div className="pt-[175px] pb-10 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto space-y-8">
          <section className="glass rounded-[34px] p-8 lg:p-10">
            <div className="flex items-center gap-3 text-[#556B2F] font-medium mb-3">
              <Leaf size={20} />
              Skincare Education
            </div>

            <h1 className="dream-font text-[48px] sm:text-[64px] text-black">
              Blog
            </h1>

            <p className="text-gray-600 leading-8 max-w-[760px] mt-4">
              Guides, ingredient notes, and routine ideas to help you choose
              Korean skincare with more confidence.
            </p>
          </section>

          <section className="grid lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="glass rounded-[30px] p-7 premium-hover"
              >
                {post.image && (
                  <div className="mb-6 h-[190px] overflow-hidden rounded-[24px] bg-white/40">
                    <img
                      src={post.image}
                      alt={post.title || "Blog"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 mb-6">
                  <span className="glass-soft rounded-full px-4 py-2 text-sm text-[#556B2F]">
                    {post.category}
                  </span>

                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays size={16} />
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold text-black leading-8">
                  {post.title}
                </h2>

                <p className="text-gray-600 leading-7 mt-4">
                  {post.summary}
                </p>

                <Link
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center gap-2 text-[#556B2F] font-semibold mt-7"
                >
                  Read article
                  <Sparkles size={17} />
                </Link>
              </article>
            ))}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}