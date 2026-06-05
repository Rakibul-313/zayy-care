"use client";

import { useEffect, useState } from "react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import { Plus, Search, Pencil, Trash2, Package, X } from "lucide-react";

type AdminProduct = {
  id: string;
  name?: string;
  brand?: string;
  price?: number;
  oldPrice?: number;
  discount?: number;
  stock?: number;
  category?: string;
  image?: string;
  forText?: string;
  skinType?: string;
  concern?: string;
  volume?: string;
  description?: string;
  howToUse?: string;
  ingredients?: string;
  benefits?: string;
  codAvailable?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
};

const skinTypeOptions = [
  "All Skin Types",
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState("100");

  const [skinType, setSkinType] = useState("All Skin Types");
  const [concern, setConcern] = useState("");
  const [volume, setVolume] = useState("");
  const [description, setDescription] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [benefits, setBenefits] = useState("");

  const discount =
    Number(oldPrice) > 0 && Number(price) > 0
      ? Math.max(
          0,
          Math.round(((Number(oldPrice) - Number(price)) / Number(oldPrice)) * 100)
        )
      : 0;

  useEffect(() => {
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const formatted = Object.entries(data).map(([id, value]: any) => ({
        id,
        ...value,
      }));

      setProducts(formatted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setProductName("");
    setBrand("");
    setOldPrice("");
    setPrice("");
    setCategory("");
    setImage("");
    setStock("100");
    setSkinType("All Skin Types");
    setConcern("");
    setVolume("");
    setDescription("");
    setHowToUse("");
    setIngredients("");
    setBenefits("");
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
    setOldPrice(String(product.oldPrice || ""));
    setPrice(String(product.price || ""));
    setCategory(product.category || "");
    setImage(product.image || "");
    setStock(String(product.stock || 0));
    setSkinType(product.skinType || product.forText || "All Skin Types");
    setConcern(product.concern || "");
    setVolume(product.volume || "");
    setDescription(product.description || "");
    setHowToUse(product.howToUse || "");
    setIngredients(product.ingredients || "");
    setBenefits(product.benefits || "");
    setShowModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productName || !brand || !oldPrice || !price || !category || !image || !stock) {
      alert("Please fill required fields");
      return;
    }

    const productData = {
      name: productName,
      brand,
      oldPrice: Number(oldPrice),
      price: Number(price),
      discount,
      category,
      image,
      stock: Number(stock),

      skinType,
      forText: skinType,
      concern,
      volume,
      description,
      howToUse,
      ingredients,
      benefits,

      updatedAt: Date.now(),
    };

    try {
      if (editingProduct) {
        await update(ref(database, `products/${editingProduct.id}`), productData);
        alert("Product updated successfully");
      } else {
        const productRef = push(ref(database, "products"));

        await set(productRef, {
          ...productData,
          codAvailable: true,
          featured: false,
          bestSeller: false,
          createdAt: Date.now(),
        });

        alert("Product added successfully");
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.log(error);
      alert("Failed to save product");
    }
  };

  const handleDeleteProduct = async (product: AdminProduct) => {
    const confirmDelete = confirm(`Are you sure you want to delete "${product.name}"?`);
    if (!confirmDelete) return;

    await remove(ref(database, `products/${product.id}`));
  };

  const toggleCOD = async (product: AdminProduct) => {
    await update(ref(database, `products/${product.id}`), {
      codAvailable: product.codAvailable === false ? true : false,
    });
  };

  const toggleFeatured = async (product: AdminProduct) => {
    await update(ref(database, `products/${product.id}`), {
      featured: !product.featured,
    });
  };

  const toggleBestSeller = async (product: AdminProduct) => {
    await update(ref(database, `products/${product.id}`), {
      bestSeller: !product.bestSeller,
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">Products</h1>
            <p className="mt-2 text-gray-600">
              Manage products, brand, price, discount, skin type and details.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-2xl bg-[#556B2F] px-5 py-3 font-semibold text-white"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-5 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white/45 px-4 py-3">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-transparent outline-none"
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {loading ? (
          <p className="py-10 text-center">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto text-[#556B2F]" size={44} />
            <h2 className="mt-4 text-2xl font-bold text-[#172313]">
              No products found
            </h2>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="pb-4">Product</th>
                  <th className="pb-4">Brand</th>
                  <th className="pb-4">Category</th>
                  <th className="pb-4">Skin Type</th>
                  <th className="pb-4">Concern</th>
                  <th className="pb-4">Original</th>
                  <th className="pb-4">Sale</th>
                  <th className="pb-4">Discount</th>
                  <th className="pb-4">Stock</th>
                  <th className="pb-4">COD</th>
                  <th className="pb-4">Featured</th>
                  <th className="pb-4">Best Seller</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-black/5">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white/50">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name || "Product"}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <Package size={22} />
                          )}
                        </div>

                        <span className="font-semibold">
                          {product.name || "Unnamed Product"}
                        </span>
                      </div>
                    </td>

                    <td className="font-semibold text-[#31571f]">
                      {product.brand || "N/A"}
                    </td>
                    <td>{product.category || "N/A"}</td>
                    <td>{product.skinType || product.forText || "All Skin Types"}</td>
                    <td>{product.concern || "N/A"}</td>

                    <td className="text-gray-500 line-through">
                      ৳{product.oldPrice || 0}
                    </td>

                    <td className="font-bold text-[#556B2F]">
                      ৳{product.price || 0}
                    </td>

                    <td>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        {product.discount || 0}% OFF
                      </span>
                    </td>

                    <td>{product.stock || 0}</td>

                    <td>
                      <button
                        onClick={() => toggleCOD(product)}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          product.codAvailable === false
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.codAvailable === false ? "OFF" : "ON"}
                      </button>
                    </td>

                    <td>
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          product.featured
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.featured ? "ON" : "OFF"}
                      </button>
                    </td>

                    <td>
                      <button
                        onClick={() => toggleBestSeller(product)}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          product.bestSeller
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.bestSeller ? "ON" : "OFF"}
                      </button>
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"
                        >
                          <Trash2 size={17} />
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
          <div className="max-h-[92vh] w-full max-w-[820px] overflow-y-auto rounded-[32px] border border-white/60 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[#172313]">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
                <p className="mt-1 text-gray-600">
                  Add pricing, brand, stock, skin type and full product details.
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
                placeholder="Product Name *"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <input
                placeholder="Brand * e.g. Anua"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Category *"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Original Price *"
                type="number"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Sale Price *"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <div className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 font-bold text-[#556B2F]">
                Discount: {discount}% OFF
              </div>

              <input
                placeholder="Stock *"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              >
                {skinTypeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              >
                <option value="">Select Concern</option>
                {concernOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                placeholder="Volume e.g. 50ml"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                placeholder="Image URL e.g. /products/anua.png *"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <textarea
                placeholder="How to Use"
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                rows={3}
                className="resize-none rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <textarea
                placeholder="Ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={3}
                className="resize-none rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />

              <textarea
                placeholder="Benefits, one per line"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                rows={4}
                className="resize-none rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSaveProduct}
                className="rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white"
              >
                {editingProduct ? "Update Product" : "Save Product"}
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