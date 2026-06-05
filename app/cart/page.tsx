"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  getCartItems,
  getCartCount,
  updateCartQuantity,
  removeFromCart,
} from "@/lib/cart";

import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

type CartProduct = ReturnType<typeof getCartItems>[number];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const loadCart = () => {
    setCartItems(getCartItems());
    setCartCount(getCartCount());
  };

  useEffect(() => {
    loadCart();

    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("storage", loadCart);
    };
  }, []);

  const handleIncrease = (id: number) => {
    updateCartQuantity(id, 1);
    loadCart();
  };

  const handleDecrease = (id: number) => {
    updateCartQuantity(id, -1);
    loadCart();
  };

  const handleRemove = (id: number) => {
    removeFromCart(id);
    loadCart();
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const shipping = subtotal >= 1500 || subtotal === 0 ? 0 : 120;
  const total = subtotal + shipping;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar cartCount={cartCount} />

      <div className="pt-[175px] pb-20 px-4 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1820px] space-y-8">
          <section className="glass rounded-[34px] p-8">
            <h1 className="dream-font text-5xl text-[#1f2a1f]">Cart</h1>
            <p className="mt-3 text-gray-600">
              Review your selected skincare products.
            </p>
          </section>

          {cartItems.length === 0 ? (
            <section className="glass rounded-[34px] p-12 text-center">
              <ShoppingBag className="mx-auto text-[#556B2F]" size={48} />

              <h2 className="mt-5 text-3xl font-bold text-[#1f2a1f]">
                Your cart is empty
              </h2>

              <Link
                href="/shop"
                className="mt-7 inline-flex rounded-full bg-[#556B2F] px-8 py-4 font-semibold text-white"
              >
                Continue Shopping
              </Link>
            </section>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
              <section className="space-y-5">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="glass flex flex-col gap-5 rounded-[34px] p-5 sm:flex-row sm:p-6"
                  >
                    <div className="relative h-[180px] w-full overflow-hidden rounded-[26px] bg-white/50 sm:w-[160px]">
                      <img
                        src={item.image && item.image.trim() !== "" ? item.image : "/products/p1.png"}
                        alt={item.name}
                        className="h-[120px] w-[120px] object-contain"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#556B2F]">
                          {item.category || "Korean Skincare"}
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-[#1f2a1f]">
                          {item.name}
                        </h2>

                        <p className="mt-4 text-3xl font-black text-[#556B2F]">
                          ৳{item.price}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="glass flex items-center gap-5 rounded-full px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item.id)}
                          >
                            <Minus size={18} />
                          </button>

                          <span className="font-bold">{item.quantity}</span>

                          <button
                            type="button"
                            onClick={() => handleIncrease(item.id)}
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="glass flex h-12 w-12 items-center justify-center rounded-full text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <aside className="glass h-fit rounded-[34px] p-8">
                <h2 className="dream-font text-3xl text-[#1f2a1f]">
                  Order Summary
                </h2>

                <div className="mt-8 space-y-5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-bold">৳{subtotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-bold">
                      {shipping === 0 ? "Free" : `৳${shipping}`}
                    </span>
                  </div>

                  <div className="h-px bg-black/10" />

                  <div className="flex justify-between text-xl font-black">
                    <span>Total</span>
                    <span className="text-[#556B2F]">৳{total}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-8 flex w-full items-center justify-center rounded-full bg-[#556B2F] py-5 text-lg font-bold text-white"
                >
                  Proceed to Checkout
                </Link>
              </aside>
            </div>
          )}

          <Footer />
        </div>
      </div>
    </main>
  );
}