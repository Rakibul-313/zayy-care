"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  PackageX,
  Save,
  Search,
} from "lucide-react";

type Product = {
  firebaseId: string;
  id?: number;
  name?: string;
  brand?: string;
  category?: string;
  image?: string;
  price?: number;
  stock?: number;
  lowStockLimit?: number;
  inStock?: boolean;
  published?: boolean;
  deleted?: boolean;
  active?: boolean;
  deletedAt?: number;
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function stockStatus(product: Product) {
  const stock = Number(product.stock || 0);
  const limit = Number(product.lowStockLimit || 5);

  if (stock <= 0) return "Out of Stock";
  if (stock <= limit) return "Low Stock";
  return "In Stock";
}

function statusClass(status: string) {
  if (status === "In Stock") return "bg-green-100 text-green-700";
  if (status === "Low Stock") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");

  const [draftStock, setDraftStock] = useState<Record<string, string>>({});
  const [draftLimit, setDraftLimit] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([firebaseId, value]) => {
          const product = value as Omit<Product, "firebaseId">;

          return {
            firebaseId,
            ...product,
            stock: Number(product.stock || 0),
            lowStockLimit: Number(product.lowStockLimit || 5),
            inStock: product.inStock !== false,
          };
        })
        .filter((product) => product.deleted !== true)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setProducts(loaded);

      const stockDrafts: Record<string, string> = {};
      const limitDrafts: Record<string, string> = {};

      loaded.forEach((product) => {
        stockDrafts[product.firebaseId] = String(product.stock || 0);
        limitDrafts[product.firebaseId] = String(product.lowStockLimit || 5);
      });

      setDraftStock(stockDrafts);
      setDraftLimit(limitDrafts);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) => {
      const text = `
        ${product.name || ""}
        ${product.brand || ""}
        ${product.category || ""}
      `.toLowerCase();

      return text.includes(keyword);
    });
  }, [products, search]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const outOfStock = products.filter((p) => Number(p.stock || 0) <= 0).length;
    const lowStock = products.filter(
      (p) =>
        Number(p.stock || 0) > 0 &&
        Number(p.stock || 0) <= Number(p.lowStockLimit || 5)
    ).length;
    const inStock = products.filter((p) => Number(p.stock || 0) > 0).length;

    return { totalProducts, inStock, lowStock, outOfStock };
  }, [products]);

  const handleSave = async (product: Product) => {
    const stock = Math.max(0, Number(draftStock[product.firebaseId] || 0));
    const lowStockLimit = Math.max(
      0,
      Number(draftLimit[product.firebaseId] || 5)
    );

    try {
      setSavingId(product.firebaseId);

      await update(ref(database, `products/${product.firebaseId}`), {
        stock,
        lowStockLimit,
        inStock: stock > 0,
        updatedAt: Date.now(),
      });
    } finally {
      setSavingId("");
    }
  };

  const togglePublished = async (product: Product) => {
    await update(ref(database, `products/${product.firebaseId}`), {
      published: product.published === false,
      active: product.published === false,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Inventory</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Dashboard › Products › Inventory
          </p>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-black text-[#0b3d2e]">
          Realtime Stock
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={stats.totalProducts} icon={Boxes} />
        <StatCard title="In Stock" value={stats.inStock} icon={PackageCheck} />
        <StatCard title="Low Stock" value={stats.lowStock} icon={AlertTriangle} warning />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={PackageX} danger />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="flex items-center gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3">
          <Search size={20} className="text-[#0b3d2e]" />

          <input
            type="text"
            placeholder="Search product by name, brand or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#4f5f49]"
          />
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-[#4f5f49]">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Low Stock Limit</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const status = stockStatus(product);

                  return (
                    <tr
                      key={product.firebaseId}
                      className="border-b border-[#0b3d2e]/10 text-[#263421]"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f1e8]">
                            <img
                              src={safeImage(product.image)}
                              alt={product.name || "Product"}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          <div>
                            <p className="line-clamp-1 max-w-[280px] font-black text-[#102015]">
                              {product.name || "Unnamed Product"}
                            </p>
                            <p className="mt-1 text-xs font-bold text-[#4f5f49]">
                              {product.brand || "ZAYY Care"} •{" "}
                              {product.category || "Korean Skincare"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="font-black text-[#0b3d2e]">
                        {money(product.price)}
                      </td>

                      <td>
                        <input
                          type="number"
                          min={0}
                          value={draftStock[product.firebaseId] || "0"}
                          onChange={(e) =>
                            setDraftStock((prev) => ({
                              ...prev,
                              [product.firebaseId]: e.target.value,
                            }))
                          }
                          className="h-10 w-28 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-3 text-sm font-bold text-[#102015] outline-none"
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min={0}
                          value={draftLimit[product.firebaseId] || "5"}
                          onChange={(e) =>
                            setDraftLimit((prev) => ({
                              ...prev,
                              [product.firebaseId]: e.target.value,
                            }))
                          }
                          className="h-10 w-32 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-3 text-sm font-bold text-[#102015] outline-none"
                        />
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

                      <td>
                        <button
                          onClick={() => togglePublished(product)}
                          className={`rounded-[6px] px-3 py-1 text-xs font-black ${
                            product.published === false
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {product.published === false ? "Hidden" : "Published"}
                        </button>
                      </td>

                      <td>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSave(product)}
                            disabled={savingId === product.firebaseId}
                            className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#0b3d2e] px-4 text-sm font-black text-white disabled:opacity-60"
                          >
                            <Save size={16} />
                            {savingId === product.firebaseId ? "Saving" : "Save"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  danger,
  warning,
}: {
  title: string;
  value: string | number;
  icon: any;
  danger?: boolean;
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
            danger
              ? "bg-red-50 text-red-600"
              : warning
              ? "bg-yellow-50 text-yellow-600"
              : "bg-emerald-50 text-[#0b3d2e]"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}