"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { get, onValue, push, ref, runTransaction, set } from "firebase/database";
import { ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";

import { auth, database } from "@/firebase/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  clearCart,
  getCartCount,
  getCartItems,
  saveFirebaseProducts,
} from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type CartProduct = ReturnType<typeof getCartItems>[number];

type ShippingInfo = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  address: string;
  note: string;
  shippingMethod: "standard" | "express";
  shipping: number;
};

type PaymentInfo = {
  paymentMethod: "cod" | "bkash" | "nagad" | "bank";
  trxId: string;
};

type CouponInfo = {
  couponCode: string;
  couponDiscount: number;
};

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

async function generateOrderNumber() {
  const now = new Date();
  const prefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}`;

  const snapshot = await get(ref(database, "orders"));
  const data = snapshot.val();

  let count = 0;
  if (data) {
    count = Object.values(data).filter((order: any) =>
      String(order.orderNumber || "").startsWith(prefix)
    ).length;
  }

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export default function CheckoutReviewPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [couponInfo, setCouponInfo] = useState<CouponInfo>({
    couponCode: "",
    couponDiscount: 0,
  });

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const loadCart = () => {
    setCartItems(getCartItems());
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
  };

  useEffect(() => {
    const savedShipping = localStorage.getItem("zayyCheckoutShipping");
    const savedPayment = localStorage.getItem("zayyCheckoutPayment");
    const savedCoupon = localStorage.getItem("zayyCheckoutCoupon");

    if (!savedShipping) {
      router.push("/checkout/shipping");
      return;
    }

    if (!savedPayment) {
      router.push("/checkout/payment");
      return;
    }

    setShippingInfo(JSON.parse(savedShipping));
    setPaymentInfo(JSON.parse(savedPayment));

    if (savedCoupon) {
      const parsed = JSON.parse(savedCoupon);
      setCouponInfo({
        couponCode: parsed.couponCode || "",
        couponDiscount: Number(parsed.couponDiscount || 0),
      });
    }

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

  const shipping = Number(shippingInfo?.shipping || 0);
  const discountAmount = Number(couponInfo.couponDiscount || 0);
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const handlePlaceOrder = async () => {
    setError("");

    if (!shippingInfo || !paymentInfo) {
      setError("Checkout information missing.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setPlacingOrder(true);

      const orderNumber = await generateOrderNumber();
      const orderRef = push(ref(database, "orders"));

      await set(orderRef, {
        firebaseId: orderRef.key,
        orderNumber,
        items: cartItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          category: item.category,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
          codAvailable: item.codAvailable !== false,
          itemTotal: Number(item.price || 0) * Number(item.quantity || 0),
        })),
        subtotal,
        shipping,
        discountAmount,
        couponCode: couponInfo.couponCode || "",
        couponDiscount: discountAmount,
        total,
        payment: {
          method: paymentInfo.paymentMethod,
          status: paymentInfo.paymentMethod === "cod" ? "unpaid" : "pending",
          trxId: paymentInfo.paymentMethod === "cod" ? "" : paymentInfo.trxId,
        },
        shippingAddress: {
          fullName: shippingInfo.fullName,
          phone: shippingInfo.phone,
          email: shippingInfo.email,
          city: shippingInfo.city,
          area: shippingInfo.area,
          address: shippingInfo.address,
          note: shippingInfo.note,
          shippingMethod: shippingInfo.shippingMethod,
        },
        customer: {
          uid: auth.currentUser?.uid || "",
          email: auth.currentUser?.email || shippingInfo.email || "",
          name:
            auth.currentUser?.displayName ||
            shippingInfo.fullName ||
            "ZAYY User",
        },
        createdAt: Date.now(),
        status: "pending",
      });

      if (couponInfo.couponCode) {
        const snapshot = await get(ref(database, "coupons"));
        const data = snapshot.val();

        if (data) {
          const entry = Object.entries(data).find(([, item]) => {
            const coupon = item as any;
            return (
              coupon.code?.toUpperCase() === couponInfo.couponCode.toUpperCase()
            );
          });

          if (entry) {
            const [couponId] = entry;
            await runTransaction(
              ref(database, `coupons/${couponId}/usageCount`),
              (current) => Number(current || 0) + 1
            );
          }
        }
      }

      await Promise.all(
        cartItems.map((item: any) => {
          if (!item.firebaseId) return Promise.resolve();

          return runTransaction(
            ref(database, `products/${item.firebaseId}/stock`),
            (current) => {
              if (current === null) return current;
              return Math.max(
                0,
                Number(current || 0) - Number(item.quantity || 0)
              );
            }
          );
        })
      ).catch(() => null);

      clearCart();
      localStorage.removeItem("zayyCheckoutShipping");
      localStorage.removeItem("zayyCheckoutPayment");
      localStorage.removeItem("zayyCheckoutCoupon");

      router.push(`/order-success?order=${orderNumber}`);
    } catch (err) {
      console.log(err);
      setError("Order failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
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
                alt="Checkout review"
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
                  Review Order
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
                          index === 2
                            ? "bg-[#0b3d2e] text-white"
                            : "bg-[#0b3d2e]/15 text-[#0b3d2e]"
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

              <div className="space-y-5">
                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-black text-[#102015]">
                      Shipping Details
                    </h2>
                    <Link
                      href="/checkout/shipping"
                      className="text-sm font-bold text-[#0b3d2e]"
                    >
                      Edit
                    </Link>
                  </div>

                  <div className="grid gap-3 text-sm text-[#4f5f49] sm:grid-cols-2">
                    <p>
                      <b className="text-[#102015]">Name:</b>{" "}
                      {shippingInfo?.fullName}
                    </p>
                    <p>
                      <b className="text-[#102015]">Phone:</b>{" "}
                      {shippingInfo?.phone}
                    </p>
                    <p>
                      <b className="text-[#102015]">Email:</b>{" "}
                      {shippingInfo?.email}
                    </p>
                    <p>
                      <b className="text-[#102015]">City:</b>{" "}
                      {shippingInfo?.city}
                    </p>
                    <p className="sm:col-span-2">
                      <b className="text-[#102015]">Address:</b>{" "}
                      {shippingInfo?.address}, {shippingInfo?.area}
                    </p>
                  </div>
                </div>

                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-black text-[#102015]">
                      Payment Details
                    </h2>
                    <Link
                      href="/checkout/payment"
                      className="text-sm font-bold text-[#0b3d2e]"
                    >
                      Edit
                    </Link>
                  </div>

                  <p className="text-sm font-bold uppercase text-[#102015]">
                    {paymentInfo?.paymentMethod}
                  </p>

                  {paymentInfo?.paymentMethod !== "cod" && (
                    <p className="mt-2 text-sm text-[#4f5f49]">
                      Transaction ID: {paymentInfo?.trxId}
                    </p>
                  )}

                  {couponInfo.couponCode && (
                    <p className="mt-3 text-sm font-bold text-green-600">
                      Coupon Applied: {couponInfo.couponCode} (
                      -{formatPrice(discountAmount)})
                    </p>
                  )}
                </div>

                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
                  <h2 className="mb-5 text-xl font-black text-[#102015]">
                    Order Items
                  </h2>

                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[76px_1fr_auto] gap-3 rounded-[6px] border border-[#0b3d2e]/10 p-3"
                      >
                        <div className="relative h-[76px] w-[76px] rounded-[6px] bg-[#f5f1e8]">
                          <Image
                            src={safeImage(item.image)}
                            alt={item.name}
                            fill
                            sizes="76px"
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
                          {formatPrice(
                            Number(item.price || 0) * Number(item.quantity || 0)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_10px_28px_rgba(11,61,46,0.08)] lg:sticky lg:top-[120px]">
              <h2 className="mb-5 text-xl font-black text-[#102015]">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4f5f49]">Subtotal</span>
                  <span className="font-black">{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#4f5f49]">Discount</span>
                    <span className="font-black text-green-600">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

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
                    Please review all details before placing order.
                  </p>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

              <button
                type="button"
                disabled={placingOrder || cartItems.length === 0}
                onClick={handlePlaceOrder}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase text-white disabled:opacity-50"
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
                {!placingOrder && <CheckCircle size={17} />}
              </button>

              <Link
                href="/checkout/payment"
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-sm font-black text-[#0b3d2e]"
              >
                <ArrowLeft size={16} />
                Back to Payment
              </Link>
            </aside>
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}