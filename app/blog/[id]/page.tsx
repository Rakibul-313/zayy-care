"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, ArrowLeft, Leaf } from "lucide-react";
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

export default function BlogDetailsPage() {
  const params = useParams();
  const id = String(params.id);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postRef = ref(database, `blogs/${id}`);

    const unsubscribe = onValue(postRef, (snapshot) => {
      const data = snapshot.val();

      if (!data || data.published === false) {
        setPost(null);
      } else {
        setPost({
          id,
          ...data,
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar />

      <div className="px-4 pb-10 pt-[175px] sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <Link
            href="/blog"
            className="glass inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-[#556B2F]"
          >
            <ArrowLeft size={17} />
            Back to Blog
          </Link>

          {loading ? (
            <section className="glass rounded-[34px] p-10 text-center">
              Loading article...
            </section>
          ) : !post ? (
            <section className="glass rounded-[34px] p-10 text-center">
              <h1 className="text-3xl font-bold text-[#172313]">
                Article not found
              </h1>

              <p className="mt-3 text-gray-600">
                This blog post may be unpublished or deleted.
              </p>
            </section>
          ) : (
            <>
              <section className="glass rounded-[34px] p-8 lg:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <span className="glass-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#556B2F]">
                    <Leaf size={16} />
                    {post.category || "Skincare"}
                  </span>

                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays size={16} />
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>

                <h1 className="dream-font text-[44px] leading-[1] text-black sm:text-[64px]">
                  {post.title}
                </h1>

                {post.summary && (
                  <p className="mt-5 max-w-[850px] text-[17px] leading-8 text-gray-600">
                    {post.summary}
                  </p>
                )}
              </section>

              {post.image && (
                <section className="glass overflow-hidden rounded-[34px] p-4">
                  <img
                    src={post.image}
                    alt={post.title || "Blog"}
                    className="h-auto max-h-[520px] w-full rounded-[28px] object-cover"
                  />
                </section>
              )}

              <section className="glass rounded-[34px] p-8 lg:p-10">
                <article className="prose prose-lg max-w-none text-[#263421]">
                  <p className="whitespace-pre-line text-[17px] leading-9">
                    {post.content}
                  </p>
                </article>
              </section>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}