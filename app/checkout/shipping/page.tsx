"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { auth, database } from "@/firebase/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getCartItems,
  getCartCount,
  saveFirebaseProducts,
} from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type CartProduct = ReturnType<typeof getCartItems>[number];

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const image = src.trim();
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

function formatPrice(price?: number) {
  return `৳${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number(price || 0))}`;
}

export default function CheckoutShippingPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );
  const [error, setError] = useState("");

  const loadCart = () => {
    setCartItems(getCartItems());
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
  };

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");

      onValue(
        ref(database, `users/${user.uid}`),
        (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          setFullName(data.name || user.displayName || "");
          setPhone(data.phone || "");
          setCity(data.city || "");
          setArea(data.area || "");
          setAddress(data.address || "");
        },
        { onlyOnce: true }
      );
    });

    const productsUnsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const firebaseProducts = Object.entries(data)
          .map(([firebaseId, value], index) => {
            const product = value as any;

            return {
              firebaseId,
              id: Number(product.id || index + 1),
              name: product.name || "Unnamed Product",
              image: safeImage(product.image),
              category: product.category || "Korean Skincare",
              price: Number(product.price || 0),
              oldPrice: Number(product.oldPrice || product.price || 0),
              stock: Number(product.stock || 0),
              quantity: 0,
              codAvailable: product.codAvailable !== false,
              deleted: product.deleted,
              active: product.active,
            };
          })
          .filter(
            (product) => product.deleted !== true && product.active !== false
          );

        saveFirebaseProducts(firebaseProducts);
      }

      loadCart();
    });

    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      authUnsubscribe();
      productsUnsubscribe();
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("storage", loadCart);
    };
  }, [router]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const shipping = shippingMethod === "express" ? 120 : subtotal >= 1500 ? 0 : 120;
  const total = subtotal + shipping;

  const handleContinue = () => {
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !city.trim() ||
      !area.trim() ||
      !address.trim()
    ) {
      setError("Please fill in all required shipping information.");
      return;
    }

    localStorage.setItem(
      "zayyCheckoutShipping",
      JSON.stringify({
        fullName,
        phone,
        email,
        city,
        area,
        address,
        note,
        shippingMethod,
        shipping,
      })
    );

    router.push("/checkout/payment");
  };

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
                alt="Checkout shipping"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/85 to-[#f5f1e8]/20" />

            <div className="mx-auto max-w-[1820px] px-4 py-10 sm:px-8 md:py-14 lg:px-14 lg:py-16">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#263421]">
                  <Link href="/">Home</Link>
                  <span>›</span>
                  <span>Checkout</span>
                </div>

                <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[64px]">
                  Checkout
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-7 flex items-center gap-4">
                {["Shipping", "Payment", "Review & Place Order"].map(
                  (label, index) => (
                    <div key={label} className="flex flex-1 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-[6px] text-sm font-black ${
                          index === 0
                            ? "bg-[#0b3d2e] text-white"
                            : "bg-[#e7e7e2] text-[#6b7568]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="hidden text-sm font-bold text-[#102015] sm:block">
                        {label}
                      </span>
                      {index < 2 && (
                        <span className="h-px flex-1 bg-[#0b3d2e]/10" />
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
                <h2 className="mb-5 text-xl font-black text-[#102015]">
                  Shipping Information
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
                  />

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
                  />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none sm:col-span-2"
                  />

                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City / District *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
                  />

                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Area / Thana *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
                  />

                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full Address *"
                    rows={3}
                    className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none sm:col-span-2"
                  />

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Order Note (optional)"
                    rows={2}
                    className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none sm:col-span-2"
                  />
                </div>

                <h2 className="mb-4 mt-8 text-xl font-black text-[#102015]">
                  Shipping Method
                </h2>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => setShippingMethod("standard")}
                    className={`rounded-[6px] border p-4 text-left ${
                      shippingMethod === "standard"
                        ? "border-[#0b3d2e] bg-[#f5f1e8]"
                        : "border-[#0b3d2e]/10 bg-white"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-black text-[#102015]">
                          Standard Shipping
                        </p>
                        <p className="text-sm text-[#4f5f49]">
                          Free shipping on orders over ৳1,500
                        </p>
                      </div>
                      <p className="font-black text-[#0b3d2e]">
                        {subtotal >= 1500 ? "Free" : "৳120"}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingMethod("express")}
                    className={`rounded-[6px] border p-4 text-left ${
                      shippingMethod === "express"
                        ? "border-[#0b3d2e] bg-[#f5f1e8]"
                        : "border-[#0b3d2e]/10 bg-white"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-black text-[#102015]">
                          Express Shipping
                        </p>
                        <p className="text-sm text-[#4f5f49]">
                          Get your order faster
                        </p>
                      </div>
                      <p className="font-black text-[#0b3d2e]">৳120</p>
                    </div>
                  </button>
                </div>

                {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

                <button
                  type="button"
                  onClick={handleContinue}
                  className="mt-6 flex h-12 items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] px-7 text-sm font-black uppercase text-white"
                >
                  Continue to Payment
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <aside className="h-fit rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_10px_28px_rgba(11,61,46,0.08)] lg:sticky lg:top-[120px]">
              <div className="mb-5 flex items-center justify-between border-b border-[#0b3d2e]/10 pb-4">
                <h2 className="text-xl font-black text-[#102015]">
                  Order Summary
                </h2>
                <Link
                  href="/cart"
                  className="text-sm font-bold text-[#0b3d2e]"
                >
                  Edit Cart
                </Link>
              </div>

              <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[70px_1fr_auto] gap-3">
                    <div className="relative h-[70px] w-[70px] rounded-[6px] bg-[#f5f1e8]">
                      <Image
                        src={safeImage(item.image)}
                        alt={item.name}
                        fill
                        sizes="70px"
                        className="object-contain p-2"
                      />
                    </div>

                    <div>
                      <p className="line-clamp-2 text-sm font-black text-[#102015]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#4f5f49]">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-black text-[#102015]">
                      {formatPrice(Number(item.price) * Number(item.quantity))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-[#0b3d2e]/10 pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4f5f49]">Subtotal</span>
                  <span className="font-black">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#4f5f49]">Shipping</span>
                  <span className="font-black">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>

                <div className="h-px bg-[#0b3d2e]/10" />

                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-[#0b3d2e]">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3 rounded-[6px] bg-[#f5f1e8] p-4">
                <ShieldCheck className="text-[#0b3d2e]" size={22} />
                <div>
                  <h4 className="text-sm font-black text-[#102015]">
                    Secure Checkout
                  </h4>
                  <p className="text-xs text-[#4f5f49]">
                    Your information is safe and secure.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}