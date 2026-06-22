"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

import { database } from "@/firebase/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getCartCount,
  getCartItems,
  saveFirebaseProducts,
} from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type CartProduct = ReturnType<typeof getCartItems>[number];

type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket" | "bank";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber: string;
};

type PaymentSettings = {
  codEnabled: boolean;
  bkashEnabled: boolean;
  nagadEnabled: boolean;
  rocketEnabled: boolean;
  bankEnabled: boolean;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bankInfo: string;
  bankAccounts: BankAccount[];
};

type CheckoutShipping = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  address: string;
  note: string;
  shippingArea?: "insideDhaka" | "outsideDhaka";
  shipping: number;
};

type Coupon = {
  code?: string;
  active?: boolean;
  expiresAt?: number;
  maxUsage?: number;
  usageCount?: number;
  minOrder?: number;
  type?: "fixed" | "percent";
  value?: number;
};

const defaultSettings: PaymentSettings = {
  codEnabled: true,
  bkashEnabled: true,
  nagadEnabled: true,
  rocketEnabled: false,
  bankEnabled: false,
  bkashNumber: "",
  nagadNumber: "",
  rocketNumber: "",
  bankInfo: "",
  bankAccounts: [],
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

export default function CheckoutPaymentPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [shippingInfo, setShippingInfo] = useState<CheckoutShipping | null>(
    null
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [trxId, setTrxId] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const [error, setError] = useState("");

  const loadCart = () => {
    setCartItems(getCartItems());
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
  };

  useEffect(() => {
    const savedShipping = localStorage.getItem("zayyCheckoutShipping");

    if (!savedShipping) {
      router.push("/checkout/shipping");
      return;
    }

    setShippingInfo(JSON.parse(savedShipping));

    const savedPayment = localStorage.getItem("zayyCheckoutPayment");
    if (savedPayment) {
      const parsed = JSON.parse(savedPayment);
      setPaymentMethod(parsed.paymentMethod || "cod");
      setTrxId(parsed.trxId || "");
      setSelectedBankId(parsed.selectedBankId || "");
    }

    const savedCoupon = localStorage.getItem("zayyCheckoutCoupon");
    if (savedCoupon) {
      const parsed = JSON.parse(savedCoupon);
      setCouponCode(parsed.couponCode || "");
      setCouponDiscount(Number(parsed.couponDiscount || 0));
      setCouponApplied(Number(parsed.couponDiscount || 0) > 0);
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
              slug: product.slug || "",
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

    const paymentUnsubscribe = onValue(
      ref(database, "settings/payment"),
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          const nextSettings = {
            ...defaultSettings,
            ...data,
            bankAccounts: Array.isArray(data.bankAccounts)
              ? data.bankAccounts
              : [],
          };

          setSettings(nextSettings);

          if (!selectedBankId && nextSettings.bankAccounts.length > 0) {
            setSelectedBankId(nextSettings.bankAccounts[0].id);
          }
        }
      }
    );

    const couponUnsubscribe = onValue(ref(database, "coupons"), (snapshot) => {
      const data = snapshot.val();
      setCoupons(data ? (Object.values(data) as Coupon[]) : []);
    });

    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      productsUnsubscribe();
      paymentUnsubscribe();
      couponUnsubscribe();
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("storage", loadCart);
    };
  }, [router, selectedBankId]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const shipping = Number(shippingInfo?.shipping || 0);
  const total = Math.max(0, subtotal + shipping - couponDiscount);

  const codAllowed =
    settings.codEnabled &&
    cartItems.every((item: any) => item.codAvailable !== false);

  useEffect(() => {
    if (paymentMethod === "cod" && !codAllowed) {
      if (settings.bkashEnabled) setPaymentMethod("bkash");
      else if (settings.nagadEnabled) setPaymentMethod("nagad");
      else if (settings.rocketEnabled) setPaymentMethod("rocket");
      else if (settings.bankEnabled) setPaymentMethod("bank");
    }
  }, [codAllowed, paymentMethod, settings]);

  const selectedBank = settings.bankAccounts.find(
    (account) => account.id === selectedBankId
  );

  const paymentInfo =
    paymentMethod === "bkash"
      ? `Send Money to bKash: ${settings.bkashNumber || "Not set"}`
      : paymentMethod === "nagad"
      ? `Send Money to Nagad: ${settings.nagadNumber || "Not set"}`
      : paymentMethod === "rocket"
      ? `Send Money to Rocket: ${settings.rocketNumber || "Not set"}`
      : paymentMethod === "bank"
      ? selectedBank
        ? `Bank Name: ${selectedBank.bankName || "Not set"}\nAccount Name: ${
            selectedBank.accountName || "Not set"
          }\nAccount Number: ${selectedBank.accountNumber || "Not set"}\nBranch: ${
            selectedBank.branch || "Not set"
          }\nRouting Number: ${selectedBank.routingNumber || "Not set"}`
        : settings.bankInfo || "Bank information not set"
      : "";

  const clearCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponApplied(false);
    localStorage.removeItem("zayyCheckoutCoupon");
  };

  const handleApplyCoupon = () => {
    setError("");

    const cleanCode = couponCode.trim().toUpperCase();

    if (!cleanCode) {
      setError("Please enter coupon code.");
      return;
    }

    const coupon = coupons.find(
      (item) => item.code?.trim().toUpperCase() === cleanCode
    );

    if (!coupon || !coupon.active) {
      setError("Invalid or inactive coupon code.");
      clearCoupon();
      setCouponCode(cleanCode);
      return;
    }

    if (coupon.expiresAt && Date.now() > Number(coupon.expiresAt)) {
      setError("Coupon expired.");
      clearCoupon();
      setCouponCode(cleanCode);
      return;
    }

    if (
      coupon.maxUsage &&
      Number(coupon.usageCount || 0) >= Number(coupon.maxUsage)
    ) {
      setError("Coupon usage limit reached.");
      clearCoupon();
      setCouponCode(cleanCode);
      return;
    }

    if (subtotal < Number(coupon.minOrder || 0)) {
      setError(`Minimum order amount is ${formatPrice(coupon.minOrder)}.`);
      clearCoupon();
      setCouponCode(cleanCode);
      return;
    }

    const discount =
      coupon.type === "fixed"
        ? Math.min(Number(coupon.value || 0), subtotal)
        : Math.round(subtotal * (Number(coupon.value || 0) / 100));

    setCouponDiscount(discount);
    setCouponApplied(true);
    setCouponCode(coupon.code || cleanCode);

    localStorage.setItem(
      "zayyCheckoutCoupon",
      JSON.stringify({
        couponCode: coupon.code || cleanCode,
        couponDiscount: discount,
      })
    );
  };

  const handleContinue = () => {
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (paymentMethod === "cod" && !codAllowed) {
      setError("COD is not available. Please choose another payment method.");
      return;
    }

    if (paymentMethod === "bank" && settings.bankAccounts.length > 0) {
      if (!selectedBankId) {
        setError("Please select a bank account.");
        return;
      }
    }

    if (paymentMethod !== "cod" && !trxId.trim()) {
      setError("Please enter your Transaction ID.");
      return;
    }

    localStorage.setItem(
      "zayyCheckoutPayment",
      JSON.stringify({
        paymentMethod,
        trxId: paymentMethod === "cod" ? "" : trxId,
        selectedBankId: paymentMethod === "bank" ? selectedBankId : "",
        selectedBank: paymentMethod === "bank" ? selectedBank || null : null,
      })
    );

    router.push("/checkout/review");
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
                alt="Checkout payment"
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
                          index === 1
                            ? "bg-[#0b3d2e] text-white"
                            : index < 1
                            ? "bg-[#0b3d2e]/15 text-[#0b3d2e]"
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
                <div className="mb-6 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-4">
                  <h3 className="mb-3 text-sm font-black uppercase text-[#102015]">
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
                        localStorage.removeItem("zayyCheckoutCoupon");
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm uppercase outline-none disabled:opacity-70"
                    />

                    {couponApplied ? (
                      <button
                        type="button"
                        onClick={clearCoupon}
                        className="rounded-[6px] border border-[#0b3d2e]/15 bg-white px-5 text-sm font-black uppercase text-[#0b3d2e]"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="rounded-[6px] bg-[#0b3d2e] px-5 text-sm font-black uppercase text-white"
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  {couponApplied && (
                    <p className="mt-2 text-sm font-bold text-green-600">
                      {formatPrice(couponDiscount)} discount applied.
                    </p>
                  )}
                </div>

                <h2 className="mb-5 text-xl font-black text-[#102015]">
                  Payment Method
                </h2>

                <div className="grid gap-3">
                  {settings.codEnabled && (
                    <button
                      type="button"
                      disabled={!codAllowed}
                      onClick={() => setPaymentMethod("cod")}
                      className={`rounded-[6px] border p-4 text-left transition ${
                        paymentMethod === "cod"
                          ? "border-[#0b3d2e] bg-[#f5f1e8]"
                          : "border-[#0b3d2e]/10 bg-white"
                      } ${
                        !codAllowed ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      <p className="font-black text-[#102015]">
                        Cash on Delivery
                      </p>
                      <p className="mt-1 text-sm text-[#4f5f49]">
                        Pay when your order arrives.
                      </p>
                    </button>
                  )}

                  {settings.bkashEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bkash")}
                      className={`rounded-[6px] border p-4 text-left transition ${
                        paymentMethod === "bkash"
                          ? "border-[#0b3d2e] bg-[#f5f1e8]"
                          : "border-[#0b3d2e]/10 bg-white"
                      }`}
                    >
                      <p className="font-black text-[#102015]">bKash Payment</p>
                      <p className="mt-1 text-sm text-[#4f5f49]">
                        Pay with bKash and enter Transaction ID.
                      </p>
                    </button>
                  )}

                  {settings.nagadEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("nagad")}
                      className={`rounded-[6px] border p-4 text-left transition ${
                        paymentMethod === "nagad"
                          ? "border-[#0b3d2e] bg-[#f5f1e8]"
                          : "border-[#0b3d2e]/10 bg-white"
                      }`}
                    >
                      <p className="font-black text-[#102015]">Nagad Payment</p>
                      <p className="mt-1 text-sm text-[#4f5f49]">
                        Pay with Nagad and enter Transaction ID.
                      </p>
                    </button>
                  )}

                  {settings.rocketEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("rocket")}
                      className={`rounded-[6px] border p-4 text-left transition ${
                        paymentMethod === "rocket"
                          ? "border-[#0b3d2e] bg-[#f5f1e8]"
                          : "border-[#0b3d2e]/10 bg-white"
                      }`}
                    >
                      <p className="font-black text-[#102015]">
                        Rocket Payment
                      </p>
                      <p className="mt-1 text-sm text-[#4f5f49]">
                        Pay with Rocket and enter Transaction ID.
                      </p>
                    </button>
                  )}

                  {settings.bankEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bank")}
                      className={`rounded-[6px] border p-4 text-left transition ${
                        paymentMethod === "bank"
                          ? "border-[#0b3d2e] bg-[#f5f1e8]"
                          : "border-[#0b3d2e]/10 bg-white"
                      }`}
                    >
                      <p className="font-black text-[#102015]">Bank Transfer</p>
                      <p className="mt-1 text-sm text-[#4f5f49]">
                        Pay with bank transfer.
                      </p>
                    </button>
                  )}
                </div>

                {paymentMethod !== "cod" && (
                  <div className="mt-5 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-4">
                    {paymentMethod === "bank" &&
                      settings.bankAccounts.length > 0 && (
                        <div className="mb-4">
                          <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#4f5f49]">
                            Select Bank Account
                          </label>

                          <select
                            value={selectedBankId}
                            onChange={(e) => setSelectedBankId(e.target.value)}
                            className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-bold outline-none"
                          >
                            {settings.bankAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.bankName || "Bank"} —{" "}
                                {account.accountNumber || "Account"}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                    <p className="whitespace-pre-line text-sm font-bold text-[#102015]">
                      {paymentInfo}
                    </p>

                    <input
                      type="text"
                      placeholder="Transaction ID *"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="mt-4 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>
                )}

                {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/checkout/shipping"
                    className="flex h-12 items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-7 text-sm font-black uppercase text-[#0b3d2e]"
                  >
                    <ArrowLeft size={16} />
                    Back to Shipping
                  </Link>

                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex h-12 items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] px-7 text-sm font-black uppercase text-white"
                  >
                    Review Order
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_10px_28px_rgba(11,61,46,0.08)] lg:sticky lg:top-[120px]">
              <div className="mb-5 flex items-center justify-between border-b border-[#0b3d2e]/10 pb-4">
                <h2 className="text-xl font-black text-[#102015]">
                  Order Summary
                </h2>

                <Link href="/cart" className="text-sm font-bold text-[#0b3d2e]">
                  Edit Cart
                </Link>
              </div>

              <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[70px_1fr_auto] gap-3"
                  >
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

                {couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#4f5f49]">Discount</span>
                    <span className="font-black text-green-600">
                      -{formatPrice(couponDiscount)}
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