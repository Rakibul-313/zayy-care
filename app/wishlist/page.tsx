"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { products } from "@/data/products";
import type { Product } from "@/data/products";
import { addToCart, getCartCount } from "@/lib/cart";
import {
  getWishlist,
  getWishlistCount,
  toggleWishlist,
} from "@/lib/wishlist";

import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowLeft,
  Star,
  Eye,
} from "lucide-react";

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const loadWishlist = () => {
    const wishlist = getWishlist();

    const items = wishlist
      .map((id) => products.find((product) => product.id === id))
      .filter((item): item is Product => item !== undefined);

    setWishlistItems(items);
    setWishlistCount(getWishlistCount());
    setCartCount(getCartCount());
  };

  useEffect(() => {
    queueMicrotask(loadWishlist);
  }, []);

  const handleRemove = (id: number) => {
    toggleWishlist(id);
    loadWishlist();
  };

  const handleAddToCart = (id: number) => {
    addToCart(id);
    setCartCount(getCartCount());
  };

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
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div>
                  <p className="text-[#556B2F] font-medium mb-2">
                    Your Favorite Products
                  </p>

                  <h1 className="dream-font text-[48px] sm:text-[64px] text-black">
                    Wishlist
                  </h1>
                </div>

                <Link
                  href="/shop"
                  className="glass rounded-full px-6 py-3 flex items-center gap-2 text-[#556B2F] premium-hover"
                >
                  <ArrowLeft size={20} />
                  Continue Shopping
                </Link>
              </div>
            </section>

            {wishlistItems.length === 0 ? (
              <section className="glass rounded-[34px] p-14 text-center">
                <Heart size={70} className="mx-auto text-[#556B2F] mb-5" />

                <h2 className="text-3xl font-bold mb-3">
                  Your wishlist is empty
                </h2>

                <p className="text-gray-600 mb-8">
                  Add your favorite skincare products here ❤️
                </p>

                <Link
                  href="/shop"
                  className="bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover inline-flex"
                >
                  Go to Shop
                </Link>
              </section>
            ) : (
              <section>
                <div className="glass rounded-[28px] p-4 flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-gray-600">
                    Showing {wishlistItems.length} wishlist products
                  </p>

                  <Link
                    href="/shop"
                    className="glass rounded-full px-5 py-3 text-[#556B2F] premium-hover"
                  >
                    Add More Products
                  </Link>
                </div>

                <div className="h-10" />

                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                  {wishlistItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="glass rounded-[30px] p-5 premium-hover product-glow relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4 relative z-20">
                        <span className="bg-[#556B2F] text-white text-xs px-3 py-1 rounded-full">
                          {item.sale}
                        </span>

                        <button
                          onClick={() => handleRemove(item.id)}
                          className="glass w-10 h-10 rounded-full flex items-center justify-center text-red-500 premium-hover"
                        >
                          <Heart size={19} fill="currentColor" />
                        </button>
                      </div>

                      <div className="group relative glass-soft rounded-[24px] h-[230px] flex items-center justify-center mb-5 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={175}
                          height={175}
                          className="object-contain transition duration-500 group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-3">
                          <Link
                            href={`/product/${item.id}`}
                            className="glass w-12 h-12 rounded-full flex items-center justify-center text-[#556B2F] premium-hover"
                          >
                            <Eye size={20} />
                          </Link>

                          <button
                            onClick={() => handleAddToCart(item.id)}
                            className="w-12 h-12 rounded-full bg-[#556B2F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(85,107,47,0.45)] active:scale-95 cursor-pointer"
                          >
                            <ShoppingBag size={20} />
                          </button>
                        </div>
                      </div>

                      <Link href={`/product/${item.id}`}>
                        <p className="text-[#556B2F] text-sm mb-2">
                          {item.category}
                        </p>

                        <h3 className="text-[17px] font-semibold text-black min-h-[52px] leading-6">
                          {item.name}
                        </h3>

                        <div className="flex items-center gap-2 mt-2 text-yellow-500">
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm text-gray-600">
                            {item.rating} ({item.reviews})
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[22px] font-bold text-[#556B2F] price-green">
                            ৳{item.price}
                          </span>

                          <span className="text-gray-400 line-through text-sm">
                            ৳{item.oldPrice}
                          </span>
                        </div>
                      </Link>

                      <div className="flex justify-end gap-3 mt-5 relative z-30">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="w-12 h-12 rounded-full glass text-red-500 flex items-center justify-center premium-hover"
                        >
                          <Trash2 size={19} />
                        </button>

                        <button
                          onClick={() => handleAddToCart(item.id)}
                          className="w-12 h-12 rounded-full bg-[#556B2F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(85,107,47,0.45)] active:scale-95 cursor-pointer"
                        >
                          <ShoppingBag size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <section className="mt-28 sm:mt-36 lg:mt-44">
          <Footer />
        </section>
      </div>
    </main>
  );
}
