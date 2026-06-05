"use client";

import { useEffect, useState } from "react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import { FileText, Plus, Pencil, Trash2, X } from "lucide-react";

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

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    const postsRef = ref(database, "blogs");

    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setPosts([]);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, value]: any) => ({ id, ...value }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setPosts(formatted);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setSummary("");
    setContent("");
    setImage("");
    setEditingPost(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title || "");
    setCategory(post.category || "");
    setSummary(post.summary || "");
    setContent(post.content || "");
    setImage(post.image || "");
    setShowModal(true);
  };

  const handleSavePost = async () => {
    if (!title || !category || !summary || !content) {
      alert("Please fill title, category, summary and content");
      return;
    }

    const postData = {
      title,
      category,
      summary,
      content,
      image,
      updatedAt: Date.now(),
    };

    if (editingPost) {
      await update(ref(database, `blogs/${editingPost.id}`), postData);
      alert("Blog updated");
    } else {
      const blogRef = push(ref(database, "blogs"));

      await set(blogRef, {
        ...postData,
        published: true,
        createdAt: Date.now(),
      });

      alert("Blog added");
    }

    resetForm();
    setShowModal(false);
  };

  const togglePublish = async (post: BlogPost) => {
    await update(ref(database, `blogs/${post.id}`), {
      published: post.published === false ? true : false,
    });
  };

  const deletePost = async (post: BlogPost) => {
    const ok = confirm(`Delete "${post.title}"?`);
    if (!ok) return;

    await remove(ref(database, `blogs/${post.id}`));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">Blog</h1>
            <p className="mt-2 text-gray-600">
              Add, edit and publish skincare education posts.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-2xl bg-[#556B2F] px-5 py-3 font-semibold text-white"
          >
            <Plus size={18} />
            Add Blog
          </button>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto text-[#556B2F]" size={46} />
            <h2 className="mt-4 text-2xl font-bold text-[#172313]">
              No blog posts found
            </h2>
          </div>
        ) : (
          <div className="grid gap-5">
            {posts.map((post) => (
              <div key={post.id} className="rounded-[26px] bg-white/35 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white/50">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.title || "Blog"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FileText className="text-[#556B2F]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="rounded-full bg-[#556B2F]/12 px-3 py-1 text-xs font-bold text-[#556B2F]">
                        {post.category}
                      </span>

                      <h2 className="mt-3 text-xl font-bold text-[#172313]">
                        {post.title}
                      </h2>

                      <p className="mt-1 max-w-[720px] text-sm text-gray-600">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold ${
                        post.published === false
                          ? "bg-gray-100 text-gray-600"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {post.published === false ? "OFF" : "LIVE"}
                    </button>

                    <button
                      onClick={() => openEditModal(post)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => deletePost(post)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="max-h-[92vh] w-full max-w-[820px] overflow-y-auto rounded-[32px] border border-white/60 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-[#172313]">
                {editingPost ? "Edit Blog" : "Add Blog"}
              </h2>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <input
                placeholder="Blog Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Category e.g. Routine *"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Image URL e.g. /blog/post1.png"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />

              <textarea
                placeholder="Short Summary *"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="resize-none rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />

              <textarea
                placeholder="Full Blog Content *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="resize-none rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />
            </div>

            <button
              onClick={handleSavePost}
              className="mt-6 rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white"
            >
              {editingPost ? "Update Blog" : "Save Blog"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}