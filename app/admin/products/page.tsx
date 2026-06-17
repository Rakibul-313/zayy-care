"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  BadgeDollarSign,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Flame,
  Grid2X2,
  LayoutList,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type BrandOption = {
  id: string;
  brandId?: string;
  name?: string;
  active?: boolean;
  deleted?: boolean;
};

type AdminProduct = {
  id: string;
  firebaseId?: string;
  name?: string;
  sku?: string;
  slug?: string;
  brand?: string;
  brandId?: string;
  price?: number;
  oldPrice?: number;
  discount?: number;
  stock?: number;
  sold?: number;
  category?: string;
  productType?: string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  images?: string[];
  forText?: string;
  skinType?: string;
  concern?: string;
  skinTypes?: string[];
  concerns?: string[];
  lifestyles?: string[];
  goals?: string[];
  goal?: string;
  benefit?: string;
  volume?: string;
  description?: string;
  howToUse?: string;
  ingredients?: string;
  benefits?: string;
  codAvailable?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEndAt?: number;
  deleted?: boolean;
  active?: boolean;
  deletedAt?: number;
  createdAt?: number;
  updatedAt?: number;
};

const PRODUCTS_PER_PAGE = 24;

const productCategories = [
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

const skinTypeOptions = [
  "All Skin Types",
  "Normal",
  "Dry",
  "Oily",
  "Combination",
  "Sensitive",
];

const concernOptions = [
  "Acne",
  "Dark spots",
  "Dullness",
  "Barrier damage",
  "Hydration",
  "Brightening",
  "Anti-aging",
  "Soothing",
];

const lifestyleOptions = [
  "Minimal Routine",
  "Daily Outdoor",
  "Makeup User",
  "Busy Schedule",
];

const goalOptions = ["Glow", "Hydration", "Clear Skin", "Repair"];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";

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

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanImages(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => safeImage(item));
}

function toArray(value?: string | string[]) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function formatDate(value?: number) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function productStatus(product: AdminProduct) {
  if (Number(product.stock || 0) <= 0) return "Out of Stock";
  if (product.active === false) return "Draft";
  return "Published";
}

function statusClass(status: string) {
  if (status === "Published") return "bg-green-100 text-green-700";
  if (status === "Draft") return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function getInputDateTime(value?: number) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function getTimestampFromInput(value: string) {
  if (!value) return 0;
  return new Date(value).getTime();
}

function MultiSelectBox({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-4 sm:col-span-2">
      <p className="mb-3 font-black text-[#102015]">{title}</p>

      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`rounded-[6px] border px-3 py-2 text-sm font-black ${
                active
                  ? "border-[#003f2a] bg-[#003f2a] text-white"
                  : "border-[#0b3d2e]/10 bg-[#f5f1e8] text-[#003f2a]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeatureSwitch({
  label,
  description,
  icon: Icon,
  checked,
  onClick,
  activeClassName = "bg-green-50 text-green-700 border-green-100",
}: {
  label: string;
  description: string;
  icon: any;
  checked: boolean;
  onClick: () => void;
  activeClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border p-4 text-left transition ${
        checked
          ? activeClassName
          : "border-[#0b3d2e]/10 bg-[#f5f1e8] text-[#003f2a]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-white">
            <Icon size={18} />
          </span>

          <div>
            <p className="font-black">{label}</p>
            <p className="mt-1 text-xs font-bold opacity-80">{description}</p>
          </div>
        </div>

        <span
          className={`rounded-[6px] px-3 py-1 text-xs font-black ${
            checked ? "bg-white/80" : "bg-white"
          }`}
        >
          {checked ? "ON" : "OFF"}
        </span>
      </div>
    </button>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null
  );

  const [currentPage, setCurrentPage] = useState(1);

  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [brandId, setBrandId] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [images, setImages] = useState<string[]>([""]);
  const [stock, setStock] = useState("100");

  const [skinTypes, setSkinTypes] = useState<string[]>(["All Skin Types"]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [lifestyles, setLifestyles] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  const [volume, setVolume] = useState("");
  const [description, setDescription] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [benefits, setBenefits] = useState("");

  const [codAvailable, setCodAvailable] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [flashSale, setFlashSale] = useState(false);
  const [flashSalePrice, setFlashSalePrice] = useState("");
  const [flashSaleEndAt, setFlashSaleEndAt] = useState("");

  const discount =
    Number(oldPrice) > 0 && Number(price) > 0
      ? Math.max(
          0,
          Math.round(
            ((Number(oldPrice) - Number(price)) / Number(oldPrice)) * 100
          )
        )
      : 0;

  useEffect(() => {
    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<AdminProduct, "id">),
        }))
        .filter((product) => product.deleted !== true)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setProducts(formatted);
      setLoading(false);
    });

    const unsubBrands = onValue(ref(database, "brands"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBrands([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => {
          const brandValue = value as Partial<BrandOption>;

          return {
            id,
            brandId: brandValue.brandId || id,
            name: brandValue.name || "Brand",
            active: brandValue.active !== false,
            deleted: brandValue.deleted,
          };
        })
        .filter((item) => item.active !== false && item.deleted !== true);

      setBrands(loaded);
    });

    return () => {
      unsubProducts();
      unsubBrands();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) => {
      const text = `
        ${product.name || ""}
        ${product.brand || ""}
        ${product.brandId || ""}
        ${product.sku || ""}
        ${product.category || ""}
        ${product.productType || ""}
      `.toLowerCase();

      return text.includes(keyword);
    });
  }, [products, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const published = products.filter(
      (item) => productStatus(item) === "Published"
    ).length;
    const drafts = products.filter((item) => productStatus(item) === "Draft")
      .length;
    const outStock = products.filter(
      (item) => productStatus(item) === "Out of Stock"
    ).length;
    const flashSaleCount = products.filter((item) => item.flashSale === true)
      .length;
    const revenue = products.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.sold || 0),
      0
    );

    return { total, published, drafts, outStock, flashSaleCount, revenue };
  }, [products]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);

    window.requestAnimationFrame(() => {
      document
        .getElementById("admin-products-table")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const showingFrom =
    filteredProducts.length === 0
      ? 0
      : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;

  const showingTo = Math.min(
    currentPage * PRODUCTS_PER_PAGE,
    filteredProducts.length
  );

  const toggleArrayValue = (
    value: string,
    current: string[],
    setter: (items: string[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  const resetForm = () => {
    setProductName("");
    setBrand("");
    setBrandId("");
    setOldPrice("");
    setPrice("");
    setCategory("");
    setProductType("");
    setImages([""]);
    setStock("100");
    setSkinTypes(["All Skin Types"]);
    setConcerns([]);
    setLifestyles([]);
    setGoals([]);
    setVolume("");
    setDescription("");
    setHowToUse("");
    setIngredients("");
    setBenefits("");
    setCodAvailable(true);
    setFeatured(false);
    setBestSeller(false);
    setFlashSale(false);
    setFlashSalePrice("");
    setFlashSaleEndAt("");
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingProduct(product);
    setProductName(product.name || "");
    setBrand(product.brand || "");
    setBrandId(product.brandId || "");
    setOldPrice(String(product.oldPrice || ""));
    setPrice(String(product.price || ""));
    setCategory(product.category || "");
    setProductType(product.productType || "");

    setImages(
      product.images?.length
        ? product.images
        : [product.image || product.imageUrl || product.thumbnail || ""]
    );

    setStock(String(product.stock || 0));

    setSkinTypes(
      product.skinTypes?.length
        ? product.skinTypes
        : toArray(product.skinType || product.forText || "All Skin Types")
    );

    setConcerns(
      product.concerns?.length ? product.concerns : toArray(product.concern)
    );

    setLifestyles(product.lifestyles || []);
    setGoals(product.goals?.length ? product.goals : toArray(product.goal));

    setVolume(product.volume || "");
    setDescription(product.description || "");
    setHowToUse(product.howToUse || "");
    setIngredients(product.ingredients || "");
    setBenefits(product.benefits || "");

    setCodAvailable(product.codAvailable !== false);
    setFeatured(product.featured === true);
    setBestSeller(product.bestSeller === true);
    setFlashSale(product.flashSale === true);
    setFlashSalePrice(String(product.flashSalePrice || ""));
    setFlashSaleEndAt(getInputDateTime(product.flashSaleEndAt));

    setShowModal(true);
  };

  const handleBrandChange = (value: string) => {
    const selected = brands.find((item) => (item.brandId || item.id) === value);

    if (!selected) {
      setBrandId("");
      setBrand("");
      return;
    }

    setBrandId(selected.brandId || selected.id);
    setBrand(selected.name || "Brand");
  };

  const handleSaveProduct = async () => {
    const finalImages = cleanImages(images);

    if (
      !productName.trim() ||
      !brand.trim() ||
      !brandId.trim() ||
      !oldPrice ||
      !price ||
      !category ||
      finalImages.length === 0 ||
      !stock
    ) {
      alert("Please fill required fields");
      return;
    }

    if (flashSale && !flashSalePrice) {
      alert("Flash sale price required");
      return;
    }

    if (flashSale && Number(flashSalePrice || 0) >= Number(price || 0)) {
      alert("Flash sale price must be lower than sale price");
      return;
    }

    const mainImage = finalImages[0];

    const productData = {
      name: productName.trim(),
      slug: createSlug(productName),
      brand: brand.trim(),
      brandId: brandId.trim(),
      oldPrice: Number(oldPrice),
      price: Number(price),
      discount,
      category,
      productType: productType.trim(),
      image: mainImage,
      imageUrl: mainImage,
      thumbnail: mainImage,
      images: finalImages,
      stock: Number(stock),

      skinTypes,
      concerns,
      lifestyles,
      goals,

      skinType: skinTypes.join(", "),
      forText: skinTypes.join(", "),
      concern: concerns.join(", "),
      goal: goals.join(", "),
      benefit: goals.join(", "),

      volume,
      description,
      howToUse,
      ingredients,
      benefits,

      codAvailable,
      featured,
      bestSeller,
      flashSale,
      flashSalePrice: flashSale ? Number(flashSalePrice || 0) : 0,
      flashSaleEndAt: flashSale ? getTimestampFromInput(flashSaleEndAt) : 0,

      active: true,
      updatedAt: Date.now(),
    };

    try {
      if (editingProduct) {
        await update(ref(database, `products/${editingProduct.id}`), productData);
        alert("Product updated successfully");
      } else {
        const productRef = push(ref(database, "products"));

        await set(productRef, {
          firebaseId: productRef.key,
          sku: `ZC-${String(products.length + 1).padStart(4, "0")}`,
          sold: 0,
          ...productData,
          deleted: false,
          createdAt: Date.now(),
        });

        alert("Product added successfully");
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save product");
    }
  };

  const handleDeleteProduct = async (product: AdminProduct) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmDelete) return;

    await update(ref(database, `products/${product.id}`), {
      deleted: true,
      active: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const toggleCOD = async (product: AdminProduct) => {
    await update(ref(database, `products/${product.id}`), {
      codAvailable: product.codAvailable === false,
      updatedAt: Date.now(),
    });
  };

  const toggleFeatured = async (product: AdminProduct) => {
    await update(ref(database, `products/${product.id}`), {
      featured: !product.featured,
      updatedAt: Date.now(),
    });
  };

  const toggleBestSeller = async (product: AdminProduct) => {
    await update(ref(database, `products/${product.id}`), {
      bestSeller: !product.bestSeller,
      updatedAt: Date.now(),
    });
  };

  const toggleFlashSale = async (product: AdminProduct) => {
    await update(ref(database, `products/${product.id}`), {
      flashSale: !product.flashSale,
      flashSalePrice: product.flashSale ? 0 : Number(product.flashSalePrice || 0),
      updatedAt: Date.now(),
    });
  };

  const handleExportCSV = () => {
    const rows = [
      [
        "Product",
        "SKU",
        "Brand",
        "Category",
        "Price",
        "Flash Sale",
        "Flash Sale Price",
        "Stock",
        "Status",
        "Featured",
        "Best Seller",
        "Sold",
        "Date",
      ],
      ...filteredProducts.map((item) => [
        item.name || "",
        item.sku || item.firebaseId || item.id,
        item.brand || "",
        item.category || "",
        String(item.price || 0),
        item.flashSale ? "ON" : "OFF",
        String(item.flashSalePrice || 0),
        String(item.stock || 0),
        productStatus(item),
        item.featured ? "ON" : "OFF",
        item.bestSeller ? "ON" : "OFF",
        String(item.sold || 0),
        formatDate(item.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "zayy-care-products.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Products</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">Dashboard › Products</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex h-11 items-center gap-2 rounded-[6px] bg-[#003f2a] px-5 text-sm font-black text-white"
          >
            <Plus size={17} />
            Add New Product
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e]">
            <Grid2X2 size={18} />
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-white text-[#0b3d2e]">
            <LayoutList size={18} />
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Products" value={stats.total} icon={Package} />
        <StatCard title="Published" value={stats.published} icon={CheckCircle2} />
        <StatCard title="Drafts" value={stats.drafts} icon={FileText} />
        <StatCard title="Out of Stock" value={stats.outStock} icon={XCircle} />
        <StatCard title="Flash Sale" value={stats.flashSaleCount} icon={Flame} />
        <StatCard title="Total Revenue" value={money(stats.revenue)} icon={BadgeDollarSign} />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="flex items-center gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3">
          <Search size={20} className="text-[#0b3d2e]" />
          <input
            type="text"
            placeholder="Search product by name, SKU, brand, category or product type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#4f5f49]"
          />
        </div>
      </section>

      <section
        id="admin-products-table"
        className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {showingFrom} to {showingTo} of {filteredProducts.length} products
          </p>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex h-10 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm font-black text-[#0b3d2e]"
          >
            Export
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-[#4f5f49]">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto text-[#003f2a]" size={44} />
            <h2 className="mt-4 text-2xl font-black text-[#102015]">
              No products found
            </h2>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead>
                  <tr className="border-b border-[#0b3d2e]/10 text-left text-xs uppercase text-[#4f5f49]">
                    <th className="py-3">
                      <input type="checkbox" className="h-4 w-4 accent-[#0b3d2e]" />
                    </th>
                    <th className="py-3">Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Sold</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.map((product) => {
                    const status = productStatus(product);

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-[#0b3d2e]/10 text-[#263421]"
                      >
                        <td className="py-4">
                          <input type="checkbox" className="h-4 w-4 accent-[#0b3d2e]" />
                        </td>

                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f1e8]">
                              <img
                                src={safeImage(product.image)}
                                alt={product.name || "Product"}
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div>
                              <p className="line-clamp-1 max-w-[260px] font-black text-[#102015]">
                                {product.name || "Unnamed Product"}
                              </p>

                              <p className="mt-1 text-xs font-bold text-orange-500">
                                {product.discount || 0}% OFF
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="font-bold text-[#4f5f49]">
                          {product.sku || product.firebaseId || product.id.slice(0, 8)}
                        </td>

                        <td>{product.category || "N/A"}</td>

                        <td>
                          <p className="font-black text-[#102015]">
                            {money(product.price)}
                          </p>

                          {product.flashSale && Number(product.flashSalePrice || 0) > 0 && (
                            <p className="mt-1 text-xs font-black text-red-600">
                              Flash: {money(product.flashSalePrice)}
                            </p>
                          )}
                        </td>

                        <td
                          className={`font-black ${
                            Number(product.stock || 0) <= 0
                              ? "text-red-600"
                              : Number(product.stock || 0) <= 10
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {product.stock || 0}
                        </td>

                        <td>
                          <span
                            className={`rounded-[6px] px-3 py-1 text-xs font-black ${statusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td>{product.sold || 0}</td>

                        <td className="text-[#4f5f49]">
                          {formatDate(product.createdAt)}
                        </td>

                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleCOD(product)}
                              title="COD ON/OFF"
                              className={`flex h-8 items-center gap-1 rounded-[6px] px-2 text-[10px] font-black ${
                                product.codAvailable === false
                                  ? "bg-red-50 text-red-600"
                                  : "bg-green-50 text-green-600"
                              }`}
                            >
                              <Eye size={13} />
                              COD
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleFeatured(product)}
                              title="Featured ON/OFF"
                              className={`flex h-8 items-center gap-1 rounded-[6px] px-2 text-[10px] font-black ${
                                product.featured
                                  ? "bg-green-50 text-green-600"
                                  : "bg-[#f5f1e8] text-[#0b3d2e]"
                              }`}
                            >
                              <Star size={13} />
                              Feature
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleBestSeller(product)}
                              title="Best Seller ON/OFF"
                              className={`flex h-8 items-center gap-1 rounded-[6px] px-2 text-[10px] font-black ${
                                product.bestSeller
                                  ? "bg-green-50 text-green-600"
                                  : "bg-[#f5f1e8] text-[#0b3d2e]"
                              }`}
                            >
                              <CheckCircle2 size={13} />
                              Best
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleFlashSale(product)}
                              title="Flash Sale ON/OFF"
                              className={`flex h-8 items-center gap-1 rounded-[6px] px-2 text-[10px] font-black ${
                                product.flashSale
                                  ? "bg-red-50 text-red-700"
                                  : "bg-[#f5f1e8] text-[#0b3d2e]"
                              }`}
                            >
                              <Flame size={13} />
                              Flash
                            </button>

                            <button
                              onClick={() => openEditModal(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-yellow-50 text-yellow-700"
                              title="Edit Product"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-red-50 text-red-700"
                              title="Delete Product"
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
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#d9d5ca] bg-white text-[#263421] transition hover:border-[#0b3d2e] hover:text-[#0b3d2e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`flex h-10 w-10 items-center justify-center rounded-[6px] border text-sm font-bold transition ${
                      currentPage === page
                        ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                        : "border-[#d9d5ca] bg-white text-[#263421] hover:border-[#0b3d2e] hover:text-[#0b3d2e]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#d9d5ca] bg-white text-[#263421] transition hover:border-[#0b3d2e] hover:text-[#0b3d2e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/45 px-4 py-8">
          <div className="mx-auto w-full max-w-[900px] rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-[#102015]">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
                <p className="mt-1 text-[#4f5f49]">
                  Product quiz matching fields can select multiple options.
                </p>
              </div>

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
                placeholder="Product Name *"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none sm:col-span-2"
              />

              <select
                value={brandId}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              >
                <option value="">Select Brand *</option>
                {brands.map((item) => (
                  <option key={item.id} value={item.brandId || item.id}>
                    {item.name} ({item.brandId || item.id})
                  </option>
                ))}
              </select>

              <input
                value={brand}
                readOnly
                placeholder="Brand name auto"
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 font-bold text-[#003f2a] outline-none"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              >
                <option value="">Select Category *</option>
                {productCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                placeholder="Product Type e.g. Oil, Face Mask, Cleanser"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <input
                value={brandId}
                readOnly
                placeholder="Brand ID auto"
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 font-bold text-[#003f2a] outline-none"
              />

              <input
                placeholder="Original Price *"
                type="number"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <input
                placeholder="Sale Price *"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 font-black text-[#003f2a]">
                Discount: {discount}% OFF
              </div>

              <input
                placeholder="Stock *"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <div className="grid gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-4 sm:col-span-2 md:grid-cols-2">
                <FeatureSwitch
                  label="Featured Collection"
                  description="Show in home Featured section"
                  icon={Star}
                  checked={featured}
                  onClick={() => setFeatured((prev) => !prev)}
                />

                <FeatureSwitch
                  label="Best Seller"
                  description="Show in home Best Sellers"
                  icon={CheckCircle2}
                  checked={bestSeller}
                  onClick={() => setBestSeller((prev) => !prev)}
                />

                <FeatureSwitch
                  label="Flash Sale"
                  description="Show in home Flash Sale"
                  icon={Flame}
                  checked={flashSale}
                  onClick={() => setFlashSale((prev) => !prev)}
                  activeClassName="border-red-100 bg-red-50 text-red-700"
                />

                <FeatureSwitch
                  label="Cash On Delivery"
                  description="Allow COD checkout"
                  icon={Eye}
                  checked={codAvailable}
                  onClick={() => setCodAvailable((prev) => !prev)}
                />
              </div>

              {flashSale && (
                <div className="grid gap-4 rounded-[6px] border border-red-100 bg-red-50 p-4 sm:col-span-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase text-red-700">
                      Flash Sale Price *
                    </label>
                    <input
                      placeholder="Flash Sale Price"
                      type="number"
                      value={flashSalePrice}
                      onChange={(e) => setFlashSalePrice(e.target.value)}
                      className="w-full rounded-[6px] border border-red-100 bg-white px-5 py-4 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase text-red-700">
                      Flash Sale End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={flashSaleEndAt}
                      onChange={(e) => setFlashSaleEndAt(e.target.value)}
                      className="w-full rounded-[6px] border border-red-100 bg-white px-5 py-4 outline-none"
                    />
                  </div>

                  <p className="text-sm font-bold text-red-700 sm:col-span-2">
                    Flash Sale ON করলে এই product home page Flash Sale section এ show হবে।
                  </p>
                </div>
              )}

              <MultiSelectBox
                title="Skin Types"
                options={skinTypeOptions}
                selected={skinTypes}
                onToggle={(value) =>
                  toggleArrayValue(value, skinTypes, setSkinTypes)
                }
              />

              <MultiSelectBox
                title="Skin Concerns"
                options={concernOptions}
                selected={concerns}
                onToggle={(value) =>
                  toggleArrayValue(value, concerns, setConcerns)
                }
              />

              <MultiSelectBox
                title="Lifestyle"
                options={lifestyleOptions}
                selected={lifestyles}
                onToggle={(value) =>
                  toggleArrayValue(value, lifestyles, setLifestyles)
                }
              />

              <MultiSelectBox
                title="Skin Goals"
                options={goalOptions}
                selected={goals}
                onToggle={(value) => toggleArrayValue(value, goals, setGoals)}
              />

              <input
                placeholder="Volume e.g. 50ml"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
              />

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-4 sm:col-span-2">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-[#102015]">Product Images *</p>
                    <p className="text-xs font-bold text-[#4f5f49]">
                      First image will be main product image.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setImages((prev) => [...prev, ""])}
                    className="rounded-[6px] bg-[#003f2a] px-4 py-2 text-sm font-black text-white"
                  >
                    Add Image
                  </button>
                </div>

                <div className="space-y-3">
                  {images.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        placeholder={`/products/p${index + 1}.png`}
                        value={item}
                        onChange={(e) => {
                          const value = e.target.value;
                          setImages((prev) =>
                            prev.map((img, imgIndex) =>
                              imgIndex === index ? value : img
                            )
                          );
                        }}
                        className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none"
                      />

                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setImages((prev) =>
                              prev.filter((_, imgIndex) => imgIndex !== index)
                            )
                          }
                          className="rounded-[6px] bg-red-50 px-4 font-black text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {cleanImages(images).length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {cleanImages(images).map((item, index) => (
                      <div
                        key={item + index}
                        className="rounded-[6px] bg-[#f5f1e8] p-2"
                      >
                        <img
                          src={item}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full rounded-[6px] object-cover"
                        />
                        <p className="mt-2 line-clamp-1 text-xs font-bold text-[#4f5f49]">
                          {index === 0 ? "Main: " : ""}
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none sm:col-span-2"
              />

              <textarea
                placeholder="How to Use"
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                rows={3}
                className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none sm:col-span-2"
              />

              <textarea
                placeholder="Ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={3}
                className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none sm:col-span-2"
              />

              <textarea
                placeholder="Benefits, one per line"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                rows={4}
                className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-5 py-4 outline-none sm:col-span-2"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSaveProduct}
                className="flex items-center gap-2 rounded-[6px] bg-[#003f2a] px-6 py-4 font-black text-white"
              >
                <Check size={18} />
                {editingProduct ? "Update Product" : "Save Product"}
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-6 py-4 font-black text-[#003f2a]"
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
}: {
  title: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#4f5f49]">{title}</p>
          <h2 className="mt-3 text-3xl font-black text-[#102015]">{value}</h2>
          <p className="mt-2 flex items-center gap-1 text-xs font-black text-green-600">
            + live
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}