"use client";

import { useEffect, useState } from "react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import { ImageIcon, Plus, Trash2, Pencil, X } from "lucide-react";

type Banner = {
  id: string;
  badge?: string;
  title?: string;
  highlight?: string;
  text?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  enabled?: boolean;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [badge, setBadge] = useState("");
  const [title, setTitle] = useState("");
  const [highlight, setHighlight] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [buttonText, setButtonText] = useState("Shop Now");
  const [buttonLink, setButtonLink] = useState("/shop");

  useEffect(() => {
    const bannersRef = ref(database, "banners");

    const unsubscribe = onValue(bannersRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBanners([]);
        return;
      }

      const formatted = Object.entries(data).map(([id, value]: any) => ({
        id,
        ...value,
      }));

      setBanners(formatted);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setBadge("");
    setTitle("");
    setHighlight("");
    setText("");
    setImage("");
    setButtonText("Shop Now");
    setButtonLink("/shop");
    setEditingBanner(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setBadge(banner.badge || "");
    setTitle(banner.title || "");
    setHighlight(banner.highlight || "");
    setText(banner.text || "");
    setImage(banner.image || "");
    setButtonText(banner.buttonText || "Shop Now");
    setButtonLink(banner.buttonLink || "/shop");
    setShowModal(true);
  };

  const handleSaveBanner = async () => {
    if (!badge || !title || !highlight || !text || !image) {
      alert("Please fill all required fields");
      return;
    }

    const bannerData = {
      badge,
      title,
      highlight,
      text,
      image,
      buttonText,
      buttonLink,
      updatedAt: Date.now(),
    };

    if (editingBanner) {
      await update(ref(database, `banners/${editingBanner.id}`), bannerData);
      alert("Banner updated");
    } else {
      const bannerRef = push(ref(database, "banners"));

      await set(bannerRef, {
        ...bannerData,
        enabled: true,
        createdAt: Date.now(),
      });

      alert("Banner added");
    }

    resetForm();
    setShowModal(false);
  };

  const toggleBanner = async (banner: Banner) => {
    await update(ref(database, `banners/${banner.id}`), {
      enabled: !banner.enabled,
    });
  };

  const deleteBanner = async (banner: Banner) => {
    const ok = confirm(`Delete banner "${banner.title}"?`);
    if (!ok) return;

    await remove(ref(database, `banners/${banner.id}`));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">
              Banners
            </h1>

            <p className="mt-2 text-gray-600">
              Manage homepage hero banners.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-2xl bg-[#556B2F] px-5 py-3 font-semibold text-white"
          >
            <Plus size={18} />
            Add Banner
          </button>
        </div>
      </section>

      <section className="grid gap-5">
        {banners.length === 0 ? (
          <div className="rounded-[30px] border border-white/65 bg-white/36 p-10 text-center shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <ImageIcon className="mx-auto text-[#556B2F]" size={48} />

            <h2 className="mt-4 text-2xl font-bold text-[#172313]">
              No banners found
            </h2>

            <p className="mt-2 text-gray-600">
              Add your first homepage banner.
            </p>
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-[30px] border border-white/65 bg-white/36 p-5 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl"
            >
              <div className="grid gap-5 lg:grid-cols-[260px_1fr_auto]">
                <div className="h-[160px] overflow-hidden rounded-[24px] bg-white/40">
                  <img
                    src={banner.image || "/hero-product.png"}
                    alt={banner.title || "Banner"}
                    className="h-full w-full object-contain p-4"
                  />
                </div>

                <div>
                  <span className="rounded-full bg-[#556B2F]/12 px-3 py-1 text-xs font-bold text-[#556B2F]">
                    {banner.badge}
                  </span>

                  <h2 className="mt-4 text-3xl font-bold text-[#172313]">
                    {banner.title}{" "}
                    <span className="text-[#556B2F]">
                      {banner.highlight}
                    </span>
                  </h2>

                  <p className="mt-2 text-gray-600">
                    {banner.text}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-[#556B2F]">
                    Button: {banner.buttonText} → {banner.buttonLink}
                  </p>
                </div>

                <div className="flex flex-row gap-2 lg:flex-col">
                  <button
                    onClick={() => toggleBanner(banner)}
                    className={`rounded-xl px-4 py-3 text-xs font-bold ${
                      banner.enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {banner.enabled ? "ON" : "OFF"}
                  </button>

                  <button
                    onClick={() => openEditModal(banner)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => deleteBanner(banner)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[32px] border border-white/60 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[#172313]">
                  {editingBanner ? "Edit Banner" : "Add Banner"}
                </h2>

                <p className="mt-1 text-gray-600">
                  Use image path like /hero-product.png or /products/banner.png
                </p>
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-[#172313]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Badge *"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                placeholder="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Highlight *"
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <textarea
                placeholder="Banner Text *"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="resize-none rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                placeholder="Image URL e.g. /hero-product.png *"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                placeholder="Button Text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Button Link e.g. /shop"
                value={buttonLink}
                onChange={(e) => setButtonLink(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSaveBanner}
                className="rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white"
              >
                {editingBanner ? "Update Banner" : "Save Banner"}
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="rounded-2xl border border-black/10 bg-white/60 px-6 py-4 font-semibold text-[#172313]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}