"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  PackageX,
  Search,
  Save,
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
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
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
        .map(([firebaseId, value]: any) => ({
          firebaseId,
          ...value,
          stock: Number(value.stock || 0),
          lowStockLimit: Number(value.lowStockLimit || 5),
          inStock: value.inStock !== false,
        }))
        .sort((a: Product, b: Product) =>
          (a.name || "").localeCompare(b.name || "")
        );

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
    const keyword = search.toLowerCase();

    return products.filter((product) => {
      const text = `
        ${product.name}
        ${product.brand}
        ${product.category}
      `.toLowerCase();

      return text.includes(keyword);
    });
  }, [products, search]);

  const totalProducts = products.length;
  const outOfStock = products.filter((p) => Number(p.stock || 0) <= 0).length;
  const lowStock = products.filter(
    (p) =>
      Number(p.stock || 0) > 0 &&
      Number(p.stock || 0) <= Number(p.lowStockLimit || 5)
  ).length;
  const inStock = products.filter((p) => Number(p.stock || 0) > 0).length;

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
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h1 className="text-4xl font-bold text-[#172313]">Inventory</h1>
        <p className="mt-2 text-gray-600">
          Manage product stock, low stock alerts and product visibility.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Boxes className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Total Products</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {totalProducts}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <PackageCheck className="text-green-600" size={30} />
          <p className="mt-4 text-sm text-gray-600">In Stock</p>
          <h2 className="text-3xl font-black text-[#172313]">{inStock}</h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <AlertTriangle className="text-yellow-600" size={30} />
          <p className="mt-4 text-sm text-gray-600">Low Stock</p>
          <h2 className="text-3xl font-black text-[#172313]">{lowStock}</h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <PackageX className="text-red-600" size={30} />
          <p className="mt-4 text-sm text-gray-600">Out of Stock</p>
          <h2 className="text-3xl font-black text-[#172313]">{outOfStock}</h2>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-5 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white/45 px-4 py-3">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search product by name, brand or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-600">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-black/10 text-gray-500">
                  <th className="pb-4">Product</th>
                  <th className="pb-4">Price</th>
                  <th className="pb-4">Stock</th>
                  <th className="pb-4">Low Stock Limit</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Visibility</th>
                  <th className="pb-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock || 0);
                  const limit = Number(product.lowStockLimit || 5);
                  const status =
                    stock <= 0
                      ? "Out of Stock"
                      : stock <= limit
                      ? "Low Stock"
                      : "In Stock";

                  return (
                    <tr
                      key={product.firebaseId}
                      className="border-b border-black/5"
                    >
                      <td className="py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/50">
                            <img
                              src={product.image || "/products/p1.png"}
                              alt={product.name || "Product"}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          <div>
                            <p className="font-bold text-[#172313]">
                              {product.name || "Unnamed Product"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {product.brand || "ZAYY Care"} •{" "}
                              {product.category || "Korean Skincare"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="font-bold text-[#556B2F]">
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
                          className="w-28 rounded-xl bg-white/60 px-4 py-3 outline-none"
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
                          className="w-32 rounded-xl bg-white/60 px-4 py-3 outline-none"
                        />
                      </td>

                      <td>
                        <span
                          className={`rounded-full px-4 py-2 text-xs font-bold ${
                            status === "In Stock"
                              ? "bg-green-100 text-green-700"
                              : status === "Low Stock"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <button
                          onClick={() => togglePublished(product)}
                          className={`rounded-full px-4 py-2 text-xs font-bold ${
                            product.published === false
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {product.published === false
                            ? "Hidden"
                            : "Published"}
                        </button>
                      </td>

                      <td>
                        <button
                          onClick={() => handleSave(product)}
                          disabled={savingId === product.firebaseId}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#556B2F] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                        >
                          <Save size={16} />
                          {savingId === product.firebaseId ? "Saving" : "Save"}
                        </button>
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