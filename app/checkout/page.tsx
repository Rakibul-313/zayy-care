"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set, update } from "firebase/database";

import { auth, database } from "@/firebase/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  getCartItems,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from "@/lib/cart";

import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  User,
  StickyNote,
} from "lucide-react";

type CartProduct = {
  id: number;
  name: string;
  image: string;
  category?: string;
  price: number;
  quantity: number;
  codAvailable?: boolean;
};

type PaymentMethod = "cod" | "bkash" | "nagad" | "bank";

type PaymentSettings = {
  codEnabled: boolean;
  bkashEnabled: boolean;
  nagadEnabled: boolean;
  bankEnabled: boolean;
  bkashNumber: string;
  nagadNumber: string;
  bankInfo: string;
};

const defaultSettings: PaymentSettings = {
  codEnabled: true,
  bkashEnabled: true,
  nagadEnabled: true,
  bankEnabled: false,
  bkashNumber: "",
  nagadNumber: "",
  bankInfo: "",
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [trxId, setTrxId] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

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

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setCartItems(getCartItems() as CartProduct[]);

    const unsubscribe = onValue(ref(database, "settings/payment"), (snapshot) => {
      const data = snapshot.val();
      if (data) setSettings({ ...defaultSettings, ...data });
    });

    return () => unsubscribe();
  }, []);

  const codAllowed =
    settings.codEnabled &&
    cartItems.every((item) => item.codAvailable !== false);

  useEffect(() => {
    if (paymentMethod === "cod" && !codAllowed) {
      if (settings.bkashEnabled) setPaymentMethod("bkash");
      else if (settings.nagadEnabled) setPaymentMethod("nagad");
      else if (settings.bankEnabled) setPaymentMethod("bank");
    }
  }, [codAllowed, paymentMethod, settings]);

  const loadCart = () => setCartItems(getCartItems() as CartProduct[]);

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
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shipping = subtotal >= 1500 ? 0 : 120;
  const discountAmount = couponDiscount;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const handleApplyCoupon = async () => {
    setError("");

    if (!couponCode.trim()) {
      setError("Please enter coupon code.");
      return;
    }

    onValue(
      ref(database, "coupons"),
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setError("Invalid coupon code.");
          return;
        }

        const coupon = Object.values(data).find(
          (item: any) =>
            item.code?.toUpperCase() === couponCode.toUpperCase().trim()
        ) as any;

        if (!coupon) {
          setError("Coupon not found.");
          return;
        }

        if (!coupon.active) {
          setError("Coupon is inactive.");
          return;
        }

        if (coupon.expiresAt && Date.now() > Number(coupon.expiresAt)) {
          setError("Coupon expired.");
          return;
        }

        if (
          coupon.maxUsage &&
          Number(coupon.usageCount || 0) >= Number(coupon.maxUsage)
        ) {
          setError("Coupon usage limit reached.");
          return;
        }

        if (subtotal < Number(coupon.minOrder || 0)) {
          setError(`Minimum order amount is ৳${coupon.minOrder}.`);
          return;
        }

        let discount = 0;

        if (coupon.type === "fixed") {
          discount = Math.min(Number(coupon.value || 0), subtotal);
        } else {
          discount = Math.round(subtotal * (Number(coupon.value || 0) / 100));
        }

        setCouponDiscount(discount);
        setCouponApplied(true);
        setCouponCode(coupon.code);
        setError("");

        alert("Coupon applied successfully.");
      },
      { onlyOnce: true }
    );
  };

  const generateOrderNumber = async () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const prefix = `${year}${month}${day}`;
  let count = 0;

    await new Promise<void>((resolve) => {
      onValue(
        ref(database, "orders"),
        (snapshot) => {
          const data = snapshot.val();

          if (data) {
            count = Object.values(data).filter((order: any) =>
              String(order.orderNumber || "").startsWith(prefix)
            ).length;
          }

          resolve();
        },
        { onlyOnce: true }
      );
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  };

  const handlePlaceOrder = async () => {
  setError("");

  if (cartItems.length === 0) {
    setError("Your cart is empty.");
    return;
  }

  if (
    !fullName.trim() ||
    !phone.trim() ||
    !city.trim() ||
    !area.trim() ||
    !address.trim()
  ) {
    setError("Please fill in your delivery information.");
    return;
  }

  if (paymentMethod === "cod" && !codAllowed) {
    setError("COD is not available. Please choose another payment method.");
    return;
  }

  if (paymentMethod !== "cod" && !trxId.trim()) {
    setError("Please enter your Transaction ID.");
    return;
  }

  try {
    setPlacingOrder(true);

    const orderNumber = await generateOrderNumber();

    await set(ref(database, `orders/${orderNumber}`), {
      orderNumber,

      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        codAvailable: item.codAvailable !== false,
        itemTotal: item.price * item.quantity,
      })),

      subtotal,
      shipping,
      discountAmount,
      couponCode: couponApplied ? couponCode : "",
      couponDiscount: couponApplied ? couponDiscount : 0,
      total,

      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" ? "unpaid" : "pending",
        trxId: paymentMethod === "cod" ? "" : trxId,
      },

      shippingAddress: {
        fullName,
        phone,
        city,
        area,
        address,
        note,
      },

      customer: {
        uid: auth.currentUser?.uid || "",
        email: auth.currentUser?.email || "",
        name: auth.currentUser?.displayName || fullName || "ZAYY User",
      },

      createdAt: Date.now(),
      status: "pending",
    });

    if (couponApplied) {
      onValue(
        ref(database, "coupons"),
        (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          const entry = Object.entries(data).find(
            ([, item]: any) =>
              item.code?.toUpperCase() === couponCode.toUpperCase()
          );

          if (!entry) return;

          const [couponId, coupon]: any = entry;

          update(ref(database, `coupons/${couponId}`), {
            usageCount: Number(coupon.usageCount || 0) + 1,
            updatedAt: Date.now(),
          });
        },
        { onlyOnce: true }
      );
    }

    clearCart();
    router.push(`/order-success?order=${orderNumber}`);
  } catch (error) {
    console.log(error);
    setError("Order failed. Please try again.");
  } finally {
    setPlacingOrder(false);
  }
};

  const paymentInfo =
    paymentMethod === "bkash"
      ? `Send Money to bKash: ${settings.bkashNumber || "Not set"}`
      : paymentMethod === "nagad"
      ? `Send Money to Nagad: ${settings.nagadNumber || "Not set"}`
      : paymentMethod === "bank"
      ? settings.bankInfo || "Bank information not set"
      : "";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar />

      <div className="pt-[175px] pb-20 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto space-y-10">
          <section className="glass rounded-[34px] p-8">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <div>
                <h1 className="text-4xl sm:text-5xl dream-font text-[#1f2a1f]">
                  Checkout
                </h1>
                <p className="text-gray-600 mt-3">
                  Complete your skincare order
                </p>
              </div>

              <Link
                href="/shop"
                className="glass px-6 py-3 rounded-full flex items-center gap-3 premium-hover"
              >
                <ArrowLeft size={18} />
                Continue Shopping
              </Link>
            </div>
          </section>

          <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-8">
            <section className="space-y-6">
              {cartItems.length === 0 ? (
                <div className="glass rounded-[34px] p-10 text-center">
                  <h2 className="text-3xl dream-font text-[#1f2a1f]">
                    Your cart is empty
                  </h2>

                  <Link
                    href="/shop"
                    className="inline-flex mt-6 bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover"
                  >
                    Go to Shop
                  </Link>
                </div>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="glass rounded-[34px] p-5 sm:p-6 flex flex-col sm:flex-row gap-6"
                    >
                      <div className="relative w-full sm:w-[180px] h-[220px] rounded-[28px] overflow-hidden bg-white/50">
                        <img
                          src={
                            item.image && item.image.trim() !== ""
                              ? item.image
                              : "/products/p1.png"
                          }
                          alt={item.name}
                          className="h-full w-full object-contain p-4"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-[#556B2F] mb-2">
                            {item.category || "Korean Skincare"}
                          </p>

                          <h2 className="text-2xl font-semibold text-[#1f2a1f]">
                            {item.name}
                          </h2>

                          <p className="text-[#556B2F] text-3xl font-bold mt-5">
                            ৳{item.price}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-8 flex-wrap gap-4">
                          <div className="glass rounded-full px-4 py-3 flex items-center gap-5">
                            <button
                              type="button"
                              onClick={() => handleDecrease(item.id)}
                            >
                              <Minus size={18} />
                            </button>

                            <span className="font-semibold">
                              {item.quantity}
                            </span>

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
                            className="glass w-12 h-12 rounded-full flex items-center justify-center text-red-500 premium-hover"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="glass rounded-[34px] p-6 sm:p-8">
                    <h2 className="text-3xl dream-font text-[#1f2a1f] mb-6">
                      Delivery Information
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
                        <User size={19} className="text-[#556B2F]" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
                        />
                      </div>

                      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
                        <Phone size={19} className="text-[#556B2F]" />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
                        />
                      </div>

                      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
                        <MapPin size={19} className="text-[#556B2F]" />
                        <input
                          type="text"
                          placeholder="City / District"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
                        />
                      </div>

                      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
                        <MapPin size={19} className="text-[#556B2F]" />
                        <input
                          type="text"
                          placeholder="Area / Thana"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
                        />
                      </div>

                      <div className="glass rounded-2xl px-5 py-4 flex items-start gap-3 sm:col-span-2">
                        <MapPin size={19} className="text-[#556B2F] mt-1" />
                        <textarea
                          placeholder="Full Address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={3}
                          className="bg-transparent outline-none flex-1 resize-none text-[#1f2a1f]"
                        />
                      </div>

                      <div className="glass rounded-2xl px-5 py-4 flex items-start gap-3 sm:col-span-2">
                        <StickyNote size={19} className="text-[#556B2F] mt-1" />
                        <textarea
                          placeholder="Order Note (optional)"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          className="bg-transparent outline-none flex-1 resize-none text-[#1f2a1f]"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>

            <aside className="space-y-6">
              <div className="glass rounded-[34px] p-8">
                <h2 className="text-3xl dream-font text-[#1f2a1f]">
                  Order Summary
                </h2>

                <div className="space-y-5 mt-8">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">৳{subtotal}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? "Free" : `৳${shipping}`}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-semibold text-green-600">
                        -৳{discountAmount}
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-black/10" />

                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-[#556B2F]">৳{total}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-[#1f2a1f] mb-3">
                    Coupon Code
                  </h3>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={couponCode}
                      disabled={couponApplied}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponApplied(false);
                        setCouponDiscount(0);
                      }}
                      placeholder="SAVE10"
                      className="flex-1 rounded-xl bg-white/60 px-4 py-3 outline-none disabled:opacity-70"
                    />

                    <button
                      type="button"
                      disabled={couponApplied}
                      onClick={handleApplyCoupon}
                      className="rounded-xl bg-[#556B2F] px-5 font-semibold text-white disabled:opacity-60"
                    >
                      {couponApplied ? "Applied" : "Apply"}
                    </button>
                  </div>

                  {couponApplied && (
                    <p className="mt-2 font-semibold text-green-600">
                      ৳{couponDiscount} Discount Applied
                    </p>
                  )}
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold text-[#1f2a1f] mb-4">
                    Payment Method
                  </h3>

                  <div className="grid gap-3">
                    {settings.codEnabled && (
                      <button
                        type="button"
                        disabled={!codAllowed}
                        onClick={() => setPaymentMethod("cod")}
                        className={`rounded-2xl px-5 py-4 text-left border transition ${
                          paymentMethod === "cod"
                            ? "bg-[#556B2F] text-white border-[#556B2F]"
                            : "glass text-[#1f2a1f] border-white/40"
                        } ${
                          !codAllowed ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Cash on Delivery
                      </button>
                    )}

                    {settings.bkashEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bkash")}
                        className={`rounded-2xl px-5 py-4 text-left border transition ${
                          paymentMethod === "bkash"
                            ? "bg-[#556B2F] text-white border-[#556B2F]"
                            : "glass text-[#1f2a1f] border-white/40"
                        }`}
                      >
                        bKash Payment
                      </button>
                    )}

                    {settings.nagadEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("nagad")}
                        className={`rounded-2xl px-5 py-4 text-left border transition ${
                          paymentMethod === "nagad"
                            ? "bg-[#556B2F] text-white border-[#556B2F]"
                            : "glass text-[#1f2a1f] border-white/40"
                        }`}
                      >
                        Nagad Payment
                      </button>
                    )}

                    {settings.bankEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bank")}
                        className={`rounded-2xl px-5 py-4 text-left border transition ${
                          paymentMethod === "bank"
                            ? "bg-[#556B2F] text-white border-[#556B2F]"
                            : "glass text-[#1f2a1f] border-white/40"
                        }`}
                      >
                        Bank Transfer
                      </button>
                    )}
                  </div>

                  {paymentMethod !== "cod" && (
                    <div className="mt-5 glass rounded-2xl p-5">
                      <p className="text-sm font-semibold text-[#1f2a1f] whitespace-pre-line">
                        {paymentInfo}
                      </p>

                      <input
                        type="text"
                        placeholder="Transaction ID"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="mt-4 w-full rounded-xl bg-white/60 px-4 py-3 outline-none"
                      />
                    </div>
                  )}
                </div>

                {error && <p className="text-red-500 text-sm mt-5">{error}</p>}

                <button
                  type="button"
                  disabled={cartItems.length === 0 || placingOrder}
                  onClick={handlePlaceOrder}
                  className="mt-8 w-full bg-[#556B2F] text-white rounded-full py-5 text-lg font-semibold premium-hover shadow-[0_20px_45px_rgba(85,107,47,0.25)] disabled:opacity-50"
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>
              </div>

              <div className="glass rounded-[34px] p-7 space-y-5">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="text-[#556B2F]" />
                  <div>
                    <h4 className="font-semibold">Authentic Products</h4>
                    <p className="text-sm text-gray-600">
                      100% original Korean skincare
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Truck className="text-[#556B2F]" />
                  <div>
                    <h4 className="font-semibold">Fast Delivery</h4>
                    <p className="text-sm text-gray-600">
                      Delivery all over Bangladesh
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <CreditCard className="text-[#556B2F]" />
                  <div>
                    <h4 className="font-semibold">Secure Payment</h4>
                    <p className="text-sm text-gray-600">
                      bKash, Nagad, Bank Transfer & COD
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <section className="mt-10 sm:mt-28 lg:mt-0">
        <Footer />
      </section>
    </main>
  );
}