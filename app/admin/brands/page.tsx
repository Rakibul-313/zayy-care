"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  Badge,
  Check,
  Eye,
  Grid2X2,
  LayoutList,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react";

type Brand = {
  id: string;
  firebaseId?: string;
  brandId?: string;
  deleted?: boolean;
  deletedAt?: number;
  name?: string;
  logo?: string;
  focus?: string;
  country?: string;
  category?: string | string[];
  active?: boolean;
  sortOrder?: number;
  createdAt?: number;
};

type Product = {
  id: string;
  brand?: string;
  brandId?: string;
  deleted?: boolean;
};

const BRAND_CATEGORIES = [
  "Skin Care",
  "Hair Care",
  "Body Care",
  "Sun Care",
  "Lip Care",
  "Acne Care",
  "Scalp Care",
  "Fragrance Care",
  "Men's Care",
  "Beauty Tools & Accessories",
];

function safeLogo(src?: string) {
  if (!src || src.trim() === "") return "";

  let path = src.trim();

  if (path.startsWith("public/")) path = path.replace("public", "");
  if (path.startsWith("/public/")) path = path.replace("/public", "");

  if (
    !path.startsWith("/") &&
    !path.startsWith("http://") &&
    !path.startsWith("https://") &&
    !path.startsWith("data:image")
  ) {
    path = `/${path}`;
  }

  return path;
}

function getCategoryText(category?: string | string[]) {
  if (!category) return "No category";
  if (Array.isArray(category)) return category.join(", ");
  return category;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const [brandId, setBrandId] = useState("");
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [focus, setFocus] = useState("");
  const [country, setCountry] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const unsubBrands = onValue(ref(database, "brands"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBrands([]);
        setPage(1);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Brand, "id">),
        }))
        .filter((brand) => brand.deleted !== true)
        .sort((a, b) => {
          const sortA = Number(a.sortOrder || 9999);
          const sortB = Number(b.sortOrder || 9999);
          if (sortA !== sortB) return sortA - sortB;
          return Number(b.createdAt || 0) - Number(a.createdAt || 0);
        });

      setBrands(formatted);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      const loaded: Product[] = data
        ? Object.entries(data)
            .map(([id, value]) => ({
              id,
              ...(value as Omit<Product, "id">),
            }))
            .filter((product) => product.deleted !== true)
        : [];

      setProducts(loaded);
    });

    return () => {
      unsubBrands();
      unsubProducts();
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(brands.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleBrands = brands.slice((page - 1) * perPage, page * perPage);

  const startItem = brands.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, brands.length);

  const stats = useMemo(() => {
    const totalBrands = brands.length;
    const activeBrands = brands.filter((brand) => brand.active !== false).length;
    const inactiveBrands = brands.filter(
      (brand) => brand.active === false
    ).length;

    return {
      totalBrands,
      activeBrands,
      inactiveBrands,
      totalProducts: products.length,
    };
  }, [brands, products]);

  const brandProductCount = (brand: Brand) => {
    const currentBrandId = brand.brandId || brand.id;
    const currentName = brand.name || "";

    return products.filter((product) => {
      return (
        product.brandId === currentBrandId ||
        product.brand === currentName ||
        product.brand?.toLowerCase() === currentName.toLowerCase()
      );
    }).length;
  };

  const resetForm = () => {
    setBrandId("");
    setName("");
    setLogo("");
    setFocus("");
    setCountry("");
    setSortOrder("");
    setCategories([]);
    setEditingBrand(null);
  };

  const openAddModal = () => {
    resetForm();
    setSortOrder(String(brands.length + 1));
    setShowModal(true);
  };

  const openEditModal = (brand: Brand) => {
    const oldCategory = Array.isArray(brand.category)
      ? brand.category
      : brand.category
      ? [brand.category]
      : [];

    setEditingBrand(brand);
    setBrandId(brand.brandId || brand.id || "");
    setName(brand.name || "");
    setLogo(brand.logo || "");
    setFocus(brand.focus || "");
    setCountry(brand.country || "");
    setSortOrder(String(brand.sortOrder || ""));
    setCategories(oldCategory);
    setShowModal(true);
  };

  const toggleCategory = (category: string) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleSaveBrand = async () => {
    if (!name.trim()) {
      alert("Brand name is required");
      return;
    }

    if (!brandId.trim()) {
      alert("Brand ID is required");
      return;
    }

    if (categories.length === 0) {
      alert("Please select at least one category");
      return;
    }

    const brandData = {
      brandId: brandId.trim().toLowerCase().replace(/\s+/g, "-"),
      name: name.trim(),
      logo: safeLogo(logo),
      focus: focus.trim(),
      country: country.trim() || "Korea",
      category: categories,
      sortOrder: Number(sortOrder || brands.length + 1),
      updatedAt: Date.now(),
    };

    if (editingBrand) {
      await update(ref(database, `brands/${editingBrand.id}`), brandData);
      alert("Brand updated");
    } else {
      const brandRef = push(ref(database, "brands"));

      await set(brandRef, {
        firebaseId: brandRef.key,
        ...brandData,
        active: true,
        deleted: false,
        createdAt: Date.now(),
      });

      alert("Brand added");
    }

    resetForm();
    setShowModal(false);
  };

  const toggleBrand = async (brand: Brand) => {
    await update(ref(database, `brands/${brand.id}`), {
      active: brand.active === false,
      updatedAt: Date.now(),
    });
  };

  const deleteBrand = async (brand: Brand) => {
    const ok = confirm(`Delete "${brand.name}"?`);
    if (!ok) return;

    await update(ref(database, `brands/${brand.id}`), {
      deleted: true,
      active: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const handleExportCSV = () => {
    const rows = [
      [
        "Brand",
        "Brand ID",
        "Description",
        "Country",
        "Categories",
        "Products",
        "Status",
        "Sort Order",
      ],
      ...brands.map((brand) => [
        brand.name || "",
        brand.brandId || brand.id,
        brand.focus || "",
        brand.country || "",
        getCategoryText(brand.category),
        String(brandProductCount(brand)),
        brand.active === false ? "Inactive" : "Active",
        String(brand.sortOrder || ""),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "zayy-care-brands.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Brands</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Dashboard › Products › Brands
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex h-11 items-center gap-2 rounded-[6px] bg-[#003f2a] px-5 text-sm font-black text-white"
          >
            <Plus size={17} />
            Add New Brand
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e]">
            <Grid2X2 size={18} />
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e]">
            <LayoutList size={18} />
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Brands" value={stats.totalBrands} icon={Tags} />
        <StatCard title="Active Brands" value={stats.activeBrands} icon={Eye} />
        <StatCard
          title="Inactive Brands"
          value={stats.inactiveBrands}
          icon={X}
          danger
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Badge}
        />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {startItem} to {endItem} of {brands.length} brands
          </p>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex h-10 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm font-black text-[#0b3d2e]"
          >
            Export
          </button>
        </div>

        {brands.length === 0 ? (
          <div className="py-12 text-center">
            <Tags className="mx-auto text-[#003f2a]" size={48} />
            <h2 className="mt-4 text-2xl font-black text-[#102015]">
              No brands found
            </h2>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-left text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Brand</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Country</th>
                  <th>Categories</th>
                  <th>Status</th>
                  <th>Sort Order</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleBrands.map((brand) => {
                  const active = brand.active !== false;

                  return (
                    <tr
                      key={brand.id}
                      className="border-b border-[#0b3d2e]/10 text-[#263421]"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8]">
                            {brand.logo ? (
                              <img
                                src={safeLogo(brand.logo)}
                                alt={brand.name || "Brand"}
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <Tags size={22} className="text-[#003f2a]" />
                            )}
                          </div>

                          <div>
                            <p className="font-black text-[#102015]">
                              {brand.name || "Unnamed Brand"}
                            </p>
                            <p className="mt-1 text-xs font-bold text-[#4f5f49]">
                              {brand.brandId || brand.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-[320px] text-[#4f5f49]">
                        {brand.focus || "No description added"}
                      </td>

                      <td className="font-black text-[#0b3d2e]">
                        {brandProductCount(brand)}
                      </td>

                      <td>{brand.country || "Korea"}</td>

                      <td className="max-w-[240px] text-[#4f5f49]">
                        {getCategoryText(brand.category)}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => toggleBrand(brand)}
                          className={`rounded-[6px] px-3 py-1 text-xs font-black ${
                            active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="font-black text-[#102015]">
                        {brand.sortOrder || "-"}
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(brand)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-yellow-50 text-yellow-700"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => deleteBrand(brand)}
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

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#4f5f49]">
                Showing {startItem} to {endItem} of {brands.length} brands
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="h-9 w-9 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] text-[#0b3d2e] disabled:opacity-40"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-9 w-9 rounded-[6px] border border-[#0b3d2e]/10 ${
                        page === pageNumber
                          ? "bg-[#0b3d2e] text-white"
                          : "bg-[#fafaf7] text-[#0b3d2e]"
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
                  className="h-9 w-9 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] text-[#0b3d2e] disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-[#102015]">
                {editingBrand ? "Edit Brand" : "Add Brand"}
              </h2>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#FCFCFA] text-[#003f2a]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                placeholder="Brand ID e.g. anua"
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brand Name e.g. Anua"
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <input
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="Logo URL e.g. /brands/anua.png"
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Description e.g. Minimalist skincare"
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country e.g. Korea"
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <input
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                type="number"
                placeholder="Sort Order e.g. 1"
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <div className="sm:col-span-2">
                <p className="mb-3 text-sm font-black uppercase text-[#102015]">
                  Select Categories
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {BRAND_CATEGORIES.map((category) => {
                    const active = categories.includes(category);

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={`flex items-center justify-between rounded-[6px] border px-4 py-3 text-left text-sm font-bold transition ${
                          active
                            ? "border-[#003f2a] bg-[#003f2a] text-white"
                            : "border-[#0b3d2e]/10 bg-[#FCFCFA] text-[#263421]"
                        }`}
                      >
                        {category}
                        {active && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>

                {categories.length > 0 && (
                  <p className="mt-3 text-sm font-semibold text-[#003f2a]">
                    Selected: {categories.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveBrand}
              className="mt-6 rounded-[6px] bg-[#003f2a] px-6 py-4 font-black text-white"
            >
              {editingBrand ? "Update Brand" : "Save Brand"}
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
          <p className="mt-2 text-xs font-black text-[#4f5f49]">
            {danger ? "Hidden from store" : "Realtime data"}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            danger
              ? "bg-orange-50 text-orange-600"
              : "bg-emerald-50 text-[#0b3d2e]"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}