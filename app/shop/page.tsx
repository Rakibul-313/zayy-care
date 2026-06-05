"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onValue, ref } from "firebase/database";

import { database } from "@/firebase/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  addToCart,
  getCartCount,
  saveFirebaseProducts,
} from "@/lib/cart";

import {
  toggleWishlist,
  getWishlistCount,
  isWishlisted,
} from "@/lib/wishlist";

import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Heart,
  Star,
  Eye,
} from "lucide-react";

type ShopProduct = {
  id: number;
  firebaseId?: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  oldPrice: number;
  sale: string;
  rating: number;
  reviews: number;
  stock?: number;
};

const categories = [
  "All",
  "Cleanser",
  "Serum",
  "Toner",
  "Cream",
  "Sunscreen",
  "Essence",
];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const productsPerPage = 16;

  useEffect(() => {
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        saveFirebaseProducts([]);
        setLoading(false);
        return;
      }

      const formatted: ShopProduct[] = Object.entries(data).map(
        ([firebaseId, value]: any, index) => ({
          firebaseId,
          id: Number(value.id || index + 1),
          name: value.name || "Unnamed Product",
          brand: value.brand || "ZAYY Care",
          category: value.category || "Korean Skincare",
          image: safeImage(value.image),
          price: Number(value.price || 0),
          oldPrice: Number(value.oldPrice || value.price || 0),
          sale: value.discount ? `${value.discount}% OFF` : value.sale || "New",
          rating: Number(value.rating || 0),
          reviews: Number(value.reviews || 0),
          stock: Number(value.stock || 0),
        })
      );

      setProducts(formatted);

      saveFirebaseProducts(
        formatted.map((product) => ({
          id: product.id,
          firebaseId: product.firebaseId,
          name: product.name,
          image: product.image,
          category: product.category,
          price: product.price,
          oldPrice: product.oldPrice,
          stock: product.stock,
          quantity: 0,
        }))
      );

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
    setWishlistIds(products.filter((p) => isWishlisted(p.id)).map((p) => p.id));
  }, [products]);

  const handleAddToCart = (id: number) => {
    addToCart(id);
    setCartCount(getCartCount());
  };

  const handleWishlist = (id: number) => {
    const updated = toggleWishlist(id);
    setWishlistCount(getWishlistCount());
    setWishlistIds(updated.map((item) => item.id));
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === "All" ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchSearch && matchCategory;
  });

  const suggestions =
    search.trim().length > 0 ? filteredProducts.slice(0, 5) : [];

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage)
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="pt-[175px] pb-10">
        <div className="px-4 sm:px-8 lg:px-14">
          <div className="max-w-[1820px] mx-auto flex flex-col gap-10">
            <section className="glass rounded-[34px] p-8">
              <p className="text-[#556B2F] font-medium mb-2">
                Korean Skincare Collection
              </p>

              <h1 className="dream-font text-[48px] sm:text-[64px] text-black mb-7">
                Shop Products
              </h1>

              <div className="relative">
                <div className="glass rounded-full p-2 flex items-center gap-2 w-full">
                  <Search size={20} className="text-[#556B2F] ml-3" />

                  <input
                    type="text"
                    placeholder="Search product, brand, category..."
                    value={search}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                      setShowSuggestions(true);
                    }}
                    className="bg-transparent outline-none flex-1 min-w-0 px-2 text-sm"
                  />
                </div>

                {showSuggestions && search.trim().length > 0 && (
                  <div className="absolute top-[115%] left-0 right-0 glass rounded-[28px] p-4 z-50">
                    {suggestions.length > 0 ? (
                      <div className="space-y-3">
                        {suggestions.map((item) => (
                          <Link
                            key={item.firebaseId || item.id}
                            href={`/product/${item.id}`}
                            className="glass-soft rounded-[22px] p-3 flex items-center gap-4 premium-hover"
                          >
                            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={safeImage(item.image)}
                                alt={item.name}
                                className="h-[50px] w-[50px] object-contain"
                              />
                            </div>

                            <div className="flex-1">
                              <h4 className="font-semibold text-black">
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {item.brand} • {item.category}
                              </p>
                            </div>

                            <p className="font-bold text-[#556B2F]">
                              ৳{item.price}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No product found 😕</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="glass rounded-[34px] p-6">
              <div className="flex items-center gap-3 mb-6">
                <SlidersHorizontal className="text-[#556B2F]" />
                <h2 className="text-2xl font-semibold text-black">Filters</h2>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full px-6 py-3 premium-hover ${
                      cat === selectedCategory
                        ? "bg-[#556B2F] text-white"
                        : "glass text-gray-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="glass rounded-[28px] p-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-gray-600">
                  {loading
                    ? "Loading products..."
                    : `Showing ${paginatedProducts.length} products`}
                </p>

                <select className="glass rounded-full px-5 py-3 outline-none bg-transparent">
                  <option>Sort by Latest</option>
                  <option>Price Low to High</option>
                  <option>Price High to Low</option>
                  <option>Best Selling</option>
                </select>
              </div>

              <div className="h-10" />

              {loading ? (
                <div className="glass rounded-[30px] p-10 text-center">
                  Loading products...
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="glass rounded-[30px] p-10 text-center">
                  No products found.
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                  {paginatedProducts.map((product, index) => {
                    const liked = wishlistIds.includes(product.id);

                    return (
                      <div
                        key={`${product.firebaseId || product.name}-${index}`}
                        className="glass rounded-[30px] p-5 premium-hover product-glow relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-4 relative z-20">
                          <span className="bg-[#556B2F] text-white text-xs px-3 py-1 rounded-full">
                            {product.sale}
                          </span>

                          <button
                            onClick={() => handleWishlist(product.id)}
                            className={`glass w-10 h-10 rounded-full flex items-center justify-center premium-hover ${
                              liked ? "text-red-500" : "text-[#556B2F]"
                            }`}
                          >
                            <Heart
                              size={19}
                              fill={liked ? "currentColor" : "none"}
                            />
                          </button>
                        </div>

                        <div className="group relative glass-soft rounded-[24px] h-[230px] flex items-center justify-center mb-5 overflow-hidden">
                          <img
                            src={safeImage(product.image)}
                            alt={product.name}
                            className="h-[175px] w-[175px] object-contain transition duration-500 group-hover:scale-110"
                          />

                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-3">
                            <Link
                              href={`/product/${product.id}`}
                              className="glass w-12 h-12 rounded-full flex items-center justify-center text-[#556B2F] premium-hover"
                            >
                              <Eye size={20} />
                            </Link>

                            <button
                              onClick={() => handleAddToCart(product.id)}
                              className="w-12 h-12 rounded-full bg-[#556B2F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(85,107,47,0.45)] active:scale-95 cursor-pointer"
                            >
                              <ShoppingBag size={20} />
                            </button>
                          </div>
                        </div>

                        <Link href={`/product/${product.id}`}>
                          <p className="text-[#556B2F] text-sm mb-2">
                            {product.category}
                          </p>

                          <h3 className="text-[17px] font-semibold text-black min-h-[52px] leading-6">
                            {product.name}
                          </h3>

                          <div className="flex items-center gap-2 mt-2 text-yellow-500">
                            <Star size={16} fill="currentColor" />

                            <span className="text-sm text-gray-600">
                              {product.rating > 0
                                ? `${product.rating} (${product.reviews})`
                                : "No Reviews Yet"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-[22px] font-bold text-[#556B2F] price-green">
                              ৳{product.price}
                            </span>

                            {product.oldPrice > product.price && (
                              <span className="text-gray-400 line-through text-sm">
                                ৳{product.oldPrice}
                              </span>
                            )}
                          </div>
                        </Link>

                        <div className="flex justify-end mt-5 relative z-30">
                          <button
                            onClick={() => handleAddToCart(product.id)}
                            className="w-12 h-12 rounded-full bg-[#556B2F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(85,107,47,0.45)] active:scale-95 cursor-pointer"
                          >
                            <ShoppingBag size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="h-20" />

              {!loading && paginatedProducts.length > 0 && (
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="glass w-12 h-12 rounded-full premium-hover disabled:opacity-40"
                  >
                    ←
                  </button>

                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`w-12 h-12 rounded-full premium-hover ${
                        currentPage === index + 1
                          ? "bg-[#556B2F] text-white"
                          : "glass text-gray-700"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="glass w-12 h-12 rounded-full premium-hover disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        <section className="mt-28 sm:mt-36 lg:mt-44">
          <Footer />
        </section>
      </div>
    </main>
  );
}