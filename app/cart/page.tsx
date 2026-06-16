"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Headphones,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  getCartItems,
  getCartCount,
  updateCartQuantity,
  removeFromCart,
} from "@/lib/cart";

import {
  getWishlistCount,
  toggleWishlist,
} from "@/lib/wishlist";

type CartProduct = ReturnType<typeof getCartItems>[number];

const taka = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });

function formatPrice(price?: number) {
  return `৳${taka.format(Number(price || 0))}`;
}

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const image = src.trim();
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const loadCart = () => {
    setCartItems(getCartItems());
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
  };

  useEffect(() => {
    loadCart();

    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("wishlistUpdated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("wishlistUpdated", loadCart);
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

  const handleMoveToWishlist = (id: number) => {
    toggleWishlist(id);
    removeFromCart(id);
    loadCart();
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const shipping = subtotal >= 1500 || subtotal === 0 ? 0 : 120;
  const total = subtotal + shipping;

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 70, damping: 20, mass: 0.9 }}
        className="min-h-screen bg-[#fafaf7]"
      >
        <section className="pt-[105px] lg:pt-[115px]">
          <div className="relative overflow-hidden bg-[#f5f1e8]">
            <div className="absolute inset-0 opacity-45 md:opacity-100">
              <Image
                src="/banners/shop-hero-desktop.png"
                alt="Cart hero"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/85 to-[#f5f1e8]/20" />

            <div className="mx-auto max-w-[1820px] px-4 py-10 sm:px-8 md:py-14 lg:px-14 lg:py-16">
              <div className="relative z-10 max-w-[560px]">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#263421]">
                  <Link href="/">Home</Link>
                  <span>›</span>
                  <span>Cart</span>
                </div>

                <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[64px]">
                  Your Cart{" "}
                  <span className="font-sans text-[24px] font-bold">
                    ({cartItems.length})
                  </span>
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] gap-7 lg:grid-cols-[1fr_360px]">
            <div>
              {cartItems.length === 0 ? (
                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
                  <ShoppingBag size={56} className="mx-auto mb-5 text-[#0b3d2e]" />

                  <h2 className="mb-3 text-2xl font-black text-[#102015]">
                    Your cart is empty
                  </h2>

                  <Link
                    href="/shop"
                    className="inline-flex rounded-[6px] bg-[#0b3d2e] px-7 py-3 text-sm font-black text-white"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[6px] border border-[#e8e3d7] bg-white">
                  <div className="hidden grid-cols-[1fr_150px_180px_150px] bg-[#f5f1e8] px-6 py-4 text-[11px] font-black uppercase tracking-wide text-[#102015] lg:grid">
                    <span>Product</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span className="text-right">Total</span>
                  </div>

                  <div className="divide-y divide-[#e8e3d7]">
                    {cartItems.map((item) => (
                      <article
                        key={item.id}
                        className="relative grid gap-4 p-4 lg:grid-cols-[1fr_150px_180px_150px] lg:items-center lg:px-6"
                      >
                        <div className="grid grid-cols-[96px_1fr] gap-4 lg:grid-cols-[120px_1fr]">
                          <Link
                            href={`/product/${item.id}`}
                            className="relative flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f1e8] lg:h-[105px] lg:w-[120px]"
                          >
                            <Image
                              src={safeImage(item.image)}
                              alt={item.name}
                              fill
                              sizes="120px"
                              className="object-contain p-3"
                            />
                          </Link>

                          <div className="pr-8 lg:pr-0">
                            <Link
                              href={`/product/${item.id}`}
                              className="line-clamp-2 text-[13px] font-black leading-5 text-[#102015] lg:text-[14px]"
                            >
                              {item.name}
                            </Link>

                            <p className="mt-2 text-[11px] font-semibold text-[#4f5f49]">
                              Size: 250ml
                            </p>

                            <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-[#4f5f49]">
                              <button
                                type="button"
                                onClick={() => handleRemove(item.id)}
                                className="hover:text-red-500"
                              >
                                Remove
                              </button>

                              <span className="h-3 w-px bg-[#0b3d2e]/20" />

                              <button
                                type="button"
                                onClick={() => handleMoveToWishlist(item.id)}
                                className="hover:text-[#0b3d2e]"
                              >
                                Move to Wishlist
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="hidden text-sm font-black text-[#102015] lg:block">
                          {formatPrice(item.price)}
                        </p>

                        <div className="flex items-center justify-between lg:block">
                          <p className="text-[16px] font-black text-[#102015] lg:hidden">
                            {formatPrice(item.price)}
                          </p>

                          <div className="flex w-fit items-center overflow-hidden rounded-[6px] border border-[#0b3d2e]/15 bg-white">
                            <button
                              type="button"
                              onClick={() => handleDecrease(item.id)}
                              className="flex h-8 w-9 items-center justify-center text-[#102015]"
                            >
                              <Minus size={13} />
                            </button>

                            <span className="flex h-8 min-w-9 items-center justify-center border-x border-[#0b3d2e]/10 text-xs font-black text-[#102015]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleIncrease(item.id)}
                              className="flex h-8 w-9 items-center justify-center text-[#102015]"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="text-right text-sm font-black text-[#102015]">
                          {formatPrice(
                            Number(item.price || 0) * Number(item.quantity || 0)
                          )}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[6px] text-[#102015] hover:bg-red-50 hover:text-red-500 lg:hidden"
                        >
                          <Trash2 size={16} />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_10px_28px_rgba(11,61,46,0.08)] lg:sticky lg:top-[120px]">
              <h2 className="text-xl font-black text-[#102015]">
                Order Summary
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4f5f49]">Subtotal</span>
                  <span className="font-black text-[#102015]">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#4f5f49]">Shipping</span>
                  <span className="font-black text-[#102015]">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>

                <div className="rounded-[6px] bg-[#f5f1e8] p-3 text-xs font-semibold text-[#4f5f49]">
                  Free delivery on orders over ৳1,500.
                </div>

                <div className="h-px bg-[#0b3d2e]/10" />

                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-[#0b3d2e]">{formatPrice(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout/shipping"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase text-white shadow-[0_8px_18px_rgba(11,61,46,0.20)]"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/shop"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-sm font-black text-[#0b3d2e] transition hover:bg-[#f5f1e8]"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] grid-cols-2 gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4 lg:grid-cols-5">
            {[
              [ShieldCheck, "100% Authentic", "Genuine Korean Products"],
              [Truck, "Free Delivery", "On orders over ৳1,500"],
              [ShoppingBag, "Secure Payment", "100% Safe Checkout"],
              [RefreshCcw, "Easy Returns", "Hassle-free returns"],
              [Headphones, "24/7 Support", "We’re here to help"],
            ].map(([Icon, title, text]: any) => (
              <div
                key={title}
                className="flex items-center gap-3 border-[#0b3d2e]/10 p-3 lg:border-r lg:last:border-r-0"
              >
                <Icon size={22} className="text-[#0b3d2e]" />
                <div>
                  <h4 className="text-sm font-black text-[#102015]">{title}</h4>
                  <p className="text-xs text-[#4f5f49]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}