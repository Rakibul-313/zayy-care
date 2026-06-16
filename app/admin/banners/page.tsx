"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  Eye,
  ImageIcon,
  LayoutList,
  Monitor,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

type Banner = {
  id: string;
  firebaseId?: string;
  deleted?: boolean;
  deletedAt?: number;
  badge?: string;
  title?: string;
  highlight?: string;
  text?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  enabled?: boolean;
  sortOrder?: number;
  showDesktop?: boolean;
  showMobile?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/hero-product.png";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

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
  const [sortOrder, setSortOrder] = useState("");

  useEffect(() => {
    const bannersRef = ref(database, "banners");

    const unsubscribe = onValue(bannersRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBanners([]);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Banner, "id">),
        }))
        .filter((banner) => banner.deleted !== true)
        .sort((a, b) => {
          const sortA = Number(a.sortOrder || 9999);
          const sortB = Number(b.sortOrder || 9999);

          if (sortA !== sortB) return sortA - sortB;

          return Number(b.createdAt || 0) - Number(a.createdAt || 0);
        });

      setBanners(formatted);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      total: banners.length,
      active: banners.filter((item) => item.enabled !== false).length,
      inactive: banners.filter((item) => item.enabled === false).length,
      desktop: banners.filter((item) => item.showDesktop !== false).length,
      mobile: banners.filter((item) => item.showMobile !== false).length,
    };
  }, [banners]);

  const resetForm = () => {
    setBadge("");
    setTitle("");
    setHighlight("");
    setText("");
    setImage("");
    setButtonText("Shop Now");
    setButtonLink("/shop");
    setSortOrder("");
    setEditingBanner(null);
  };

  const openAddModal = () => {
    resetForm();
    setSortOrder(String(banners.length + 1));
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
    setSortOrder(String(banner.sortOrder || ""));
    setShowModal(true);
  };

  const handleSaveBanner = async () => {
    if (!badge.trim() || !title.trim() || !highlight.trim() || !text.trim() || !image.trim()) {
      alert("Please fill all required fields");
      return;
    }

    const bannerData = {
      badge: badge.trim(),
      title: title.trim(),
      highlight: highlight.trim(),
      text: text.trim(),
      image: safeImage(image),
      buttonText: buttonText.trim() || "Shop Now",
      buttonLink: buttonLink.trim() || "/shop",
      sortOrder: Number(sortOrder || banners.length + 1),
      showDesktop: true,
      showMobile: true,
      updatedAt: Date.now(),
    };

    if (editingBanner) {
      await update(ref(database, `banners/${editingBanner.id}`), bannerData);
      alert("Banner updated");
    } else {
      const bannerRef = push(ref(database, "banners"));

      await set(bannerRef, {
        firebaseId: bannerRef.key,
        ...bannerData,
        enabled: true,
        deleted: false,
        createdAt: Date.now(),
      });

      alert("Banner added");
    }

    resetForm();
    setShowModal(false);
  };

  const toggleBanner = async (banner: Banner) => {
    await update(ref(database, `banners/${banner.id}`), {
      enabled: banner.enabled === false,
      updatedAt: Date.now(),
    });
  };

  const toggleDesktop = async (banner: Banner) => {
    await update(ref(database, `banners/${banner.id}`), {
      showDesktop: banner.showDesktop === false,
      updatedAt: Date.now(),
    });
  };

  const toggleMobile = async (banner: Banner) => {
    await update(ref(database, `banners/${banner.id}`), {
      showMobile: banner.showMobile === false,
      updatedAt: Date.now(),
    });
  };

  const updateSortOrder = async (banner: Banner, value: string) => {
    await update(ref(database, `banners/${banner.id}`), {
      sortOrder: Number(value || 1),
      updatedAt: Date.now(),
    });
  };

  const deleteBanner = async (banner: Banner) => {
    const ok = confirm(`Delete banner "${banner.title}"?`);
    if (!ok) return;

    await update(ref(database, `banners/${banner.id}`), {
      deleted: true,
      enabled: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Banners</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Dashboard › Homepage › Banners
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 text-sm font-black text-[#0b3d2e]"
          >
            <Eye size={16} />
            Preview Homepage
          </button>

          <button
            onClick={openAddModal}
            className="flex h-11 items-center gap-2 rounded-[6px] bg-[#003f2a] px-5 text-sm font-black text-white"
          >
            <Plus size={17} />
            Add Banner
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Banners" value={stats.total} icon={ImageIcon} />
        <StatCard title="Active" value={stats.active} icon={Eye} />
        <StatCard title="Inactive" value={stats.inactive} icon={X} danger />
        <StatCard title="Desktop Visible" value={stats.desktop} icon={Monitor} />
        <StatCard title="Mobile Visible" value={stats.mobile} icon={Smartphone} />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {banners.length} banners
          </p>

          <button className="flex h-10 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm font-black text-[#0b3d2e]">
            <LayoutList size={16} />
            List View
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto text-[#0b3d2e]" size={48} />

            <h2 className="mt-4 text-2xl font-black text-[#102015]">
              No banners found
            </h2>

            <p className="mt-2 text-sm text-[#4f5f49]">
              Add your first homepage banner.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Banner</th>
                  <th>Title</th>
                  <th>Button</th>
                  <th>Status</th>
                  <th>Display On</th>
                  <th>Sort Order</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {banners.map((banner) => {
                  const active = banner.enabled !== false;
                  const desktop = banner.showDesktop !== false;
                  const mobile = banner.showMobile !== false;

                  return (
                    <tr
                      key={banner.id}
                      className="border-b border-[#0b3d2e]/10 text-[#263421]"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f1e8]">
                            <img
                              src={safeImage(banner.image)}
                              alt={banner.title || "Banner"}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div>
                            <p className="rounded-[6px] bg-[#f5f1e8] px-2 py-1 text-xs font-black text-[#0b3d2e]">
                              {banner.badge || "Banner"}
                            </p>
                            <p className="mt-2 max-w-[220px] line-clamp-1 font-black text-[#102015]">
                              {banner.text || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <p className="max-w-[220px] font-black text-[#102015]">
                          {banner.title || "Untitled"}
                        </p>
                        <p className="text-xs font-bold text-[#0b3d2e]">
                          {banner.highlight || ""}
                        </p>
                      </td>

                      <td>
                        <p className="font-black text-[#102015]">
                          {banner.buttonText || "Shop Now"}
                        </p>
                        <p className="text-xs text-[#4f5f49]">
                          {banner.buttonLink || "/shop"}
                        </p>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => toggleBanner(banner)}
                          className={`rounded-[6px] px-3 py-1 text-xs font-black ${
                            active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleDesktop(banner)}
                            className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${
                              desktop
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Monitor size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleMobile(banner)}
                            className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${
                              mobile
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Smartphone size={15} />
                          </button>
                        </div>
                      </td>

                      <td>
                        <input
                          type="number"
                          min={1}
                          defaultValue={banner.sortOrder || 1}
                          onBlur={(e) => updateSortOrder(banner, e.target.value)}
                          className="h-9 w-20 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-3 text-sm font-black text-[#102015] outline-none"
                        />
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(banner)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-yellow-50 text-yellow-700"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => deleteBanner(banner)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-red-50 text-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="mt-4 text-xs font-bold text-[#4f5f49]">
              Drag and drop reorder future e add kora jabe. Ekhon sort order
              number diye control hobe.
            </p>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-[#102015]">
                  {editingBanner ? "Edit Banner" : "Add Banner"}
                </h2>

                <p className="mt-1 text-sm text-[#4f5f49]">
                  Image path example: /hero-product.png or /products/banner.png
                </p>
              </div>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Badge *"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                placeholder="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                placeholder="Highlight *"
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <textarea
                placeholder="Banner Text *"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                placeholder="Image URL e.g. /hero-product.png *"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none sm:col-span-2"
              />

              {image && (
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-3 rounded-[6px] bg-white p-3">
                    <img
                      src={safeImage(image)}
                      alt="Preview"
                      className="h-20 w-32 rounded-[6px] object-cover"
                    />

                    <div>
                      <p className="font-black text-[#102015]">
                        Image Preview
                      </p>
                      <p className="text-sm text-[#4f5f49]">
                        {safeImage(image)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <input
                placeholder="Button Text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                placeholder="Button Link e.g. /shop"
                value={buttonLink}
                onChange={(e) => setButtonLink(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                type="number"
                min={1}
                placeholder="Sort Order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none sm:col-span-2"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSaveBanner}
                className="rounded-[6px] bg-[#003f2a] px-6 py-4 font-black text-white"
              >
                {editingBanner ? "Update Banner" : "Save Banner"}
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-6 py-4 font-black text-[#003f2a]"
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

function StatCard({
  title,
  value,
  icon: Icon,
  danger,
}: {
  title: string;
  value: string | number;
  icon: any;
  danger?: boolean;
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
            danger ? "bg-red-50 text-red-600" : "bg-emerald-50 text-[#0b3d2e]"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}