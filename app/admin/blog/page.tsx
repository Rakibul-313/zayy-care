"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  CheckCircle2,
  Eye,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type BlogPost = {
  id: string;
  slug?: string;
  firebaseId?: string;
  deleted?: boolean;
  active?: boolean;
  deletedAt?: number;
  title?: string;
  category?: string;
  summary?: string;
  content?: string;
  image?: string;
  published?: boolean;
  featured?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

function dateText(value?: number) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

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
        .map(([id, value]) => ({
          id,
          ...(value as Omit<BlogPost, "id">),
        }))
        .filter((post) => post.deleted !== true)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setPosts(formatted);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      live: posts.filter((post) => post.published !== false).length,
      draft: posts.filter((post) => post.published === false).length,
      featured: posts.filter((post) => post.featured === true).length,
    };
  }, [posts]);

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

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }
  const handleSavePost = async () => {
    if (!title.trim() || !category.trim() || !summary.trim() || !content.trim()) {
      alert("Please fill title, category, summary and content");
      return;
    }
    function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

    const postData = {
      title: title.trim(),
      slug: generateSlug(title),
      category: category.trim(),
      summary: summary.trim(),
      content: content.trim(),
      image: safeImage(image),
      updatedAt: Date.now(),
    };

    if (editingPost) {
      await update(ref(database, `blogs/${editingPost.id}`), postData);
      alert("Blog updated");
    } else {
      const blogRef = push(ref(database, "blogs"));

      await set(blogRef, {
        firebaseId: blogRef.key,
        ...postData,
        published: true,
        featured: false,
        deleted: false,
        active: true,
        createdAt: Date.now(),
      });

      alert("Blog added");
    }

    resetForm();
    setShowModal(false);
  };
  

  const togglePublish = async (post: BlogPost) => {
    await update(ref(database, `blogs/${post.id}`), {
      published: post.published === false,
      active: post.published === false,
      updatedAt: Date.now(),
    });
  };

  const toggleFeatured = async (post: BlogPost) => {
    await update(ref(database, `blogs/${post.id}`), {
      featured: !post.featured,
      updatedAt: Date.now(),
    });
  };

  const deletePost = async (post: BlogPost) => {
    const ok = confirm(`Delete "${post.title}"?`);
    if (!ok) return;

    await update(ref(database, `blogs/${post.id}`), {
      deleted: true,
      active: false,
      published: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Blog</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Dashboard › Blog
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex h-11 items-center gap-2 rounded-[6px] bg-[#003f2a] px-5 text-sm font-black text-white"
        >
          <Plus size={17} />
          Add Blog
        </button>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Posts" value={stats.total} icon={FileText} />
        <StatCard title="Live Posts" value={stats.live} icon={Eye} />
        <StatCard title="Drafts" value={stats.draft} icon={FileText} warning />
        <StatCard title="Featured" value={stats.featured} icon={CheckCircle2} />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {posts.length} blog posts
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto text-[#0b3d2e]" size={46} />
            <h2 className="mt-4 text-2xl font-black text-[#102015]">
              No blog posts found
            </h2>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Post</th>
                  <th>Category</th>
                  <th>Summary</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-[#0b3d2e]/10 text-[#263421]"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f1e8]">
                          {post.image ? (
                            <img
                              src={safeImage(post.image)}
                              alt={post.title || "Blog"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="text-[#0b3d2e]" size={22} />
                          )}
                        </div>

                        <div>
                          <p className="line-clamp-1 max-w-[260px] font-black text-[#102015]">
                            {post.title || "Untitled Blog"}
                          </p>

                          <p className="mt-1 max-w-[260px] truncate text-xs font-bold text-[#4f5f49]">
                            ID: {post.firebaseId || post.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="rounded-[6px] bg-[#f5f1e8] px-3 py-1 text-xs font-black text-[#0b3d2e]">
                        {post.category || "General"}
                      </span>
                    </td>

                    <td className="max-w-[300px]">
                      <p className="line-clamp-2 text-[#4f5f49]">
                        {post.summary || "No summary"}
                      </p>
                    </td>

                    <td>
                      <button
                        onClick={() => togglePublish(post)}
                        className={`rounded-[6px] px-3 py-1 text-xs font-black ${
                          post.published === false
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {post.published === false ? "Draft" : "Live"}
                      </button>
                    </td>

                    <td>
                      <button
                        onClick={() => toggleFeatured(post)}
                        className={`rounded-[6px] px-3 py-1 text-xs font-black ${
                          post.featured
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {post.featured ? "Yes" : "No"}
                      </button>
                    </td>

                    <td className="text-[#4f5f49]">
                      {dateText(post.createdAt)}
                    </td>

                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(post)}
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-yellow-50 text-yellow-700"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => deletePost(post)}
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-red-50 text-red-700"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="max-h-[92vh] w-full max-w-[820px] overflow-y-auto rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-[#102015]">
                {editingPost ? "Edit Blog" : "Add Blog"}
              </h2>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-white text-[#003f2a]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <input
                placeholder="Blog Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                placeholder="Category e.g. Routine *"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                placeholder="Image URL e.g. /blog/post1.png"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              {image && (
                <div className="flex items-center gap-3 rounded-[6px] bg-white p-3">
                  <img
                    src={safeImage(image)}
                    alt="Preview"
                    className="h-20 w-28 rounded-[6px] object-cover"
                  />

                  <div>
                    <p className="font-black text-[#102015]">Image Preview</p>
                    <p className="text-sm text-[#4f5f49]">{safeImage(image)}</p>
                  </div>
                </div>
              )}

              <textarea
                placeholder="Short Summary *"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <textarea
                placeholder="Full Blog Content *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />
            </div>

            <button
              onClick={handleSavePost}
              className="mt-6 rounded-[6px] bg-[#003f2a] px-6 py-4 font-black text-white"
            >
              {editingPost ? "Update Blog" : "Save Blog"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  warning,
}: {
  title: string;
  value: string | number;
  icon: any;
  warning?: boolean;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#4f5f49]">{title}</p>
          <h2 className="mt-3 text-3xl font-black text-[#102015]">{value}</h2>
          <p className="mt-2 text-xs font-black text-green-600">
            Realtime data
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            warning ? "bg-yellow-50 text-yellow-600" : "bg-emerald-50 text-[#0b3d2e]"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}