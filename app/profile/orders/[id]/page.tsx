"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "@/firebase/config";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCartCount, addToCart, saveFirebaseProducts } from "@/lib/cart";
import { getWishlistCount, getWishlist, toggleWishlist } from "@/lib/wishlist";

import {
  Check,
  ChevronRight,
  Download,
  Heart,
  Headphones,
  MapPin,
  Package,
} from "lucide-react";

type Order = {
  id: string;
  orderNumber?: string;
  deleted?: boolean;
  customer?: {
    uid?: string;
    email?: string;
    name?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
    area?: string;
    address?: string;
    note?: string;
  };
  payment?: {
    method?: string;
    status?: string;
    trxId?: string;
  };
  items?: {
    id?: number;
    name?: string;
    image?: string;
    price?: number;
    quantity?: number;
    itemTotal?: number;
  }[];
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
  couponCode?: string;
  total?: number;
  status?: string;
  createdAt?: number;
};

type Product = {
  id: number;
  firebaseId?: string;
  name: string;
  image: string;
  category: string;
  price: number;
  oldPrice: number;
  stock?: number;
  deleted?: boolean;
  active?: boolean;
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function dateText(value?: number) {
  if (!value) return "N/A";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const image = src.trim();
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

const steps = ["placed", "processing", "shipped", "delivered"];

export default function ProfileOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params.id);

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
    setWishlist(getWishlist());

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
      setWishlist(getWishlist());
    };

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
      setEmail(user.email || "");
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!uid || !orderId) return;

    const unsubOrder = onValue(ref(database, `orders/${orderId}`), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrder(null);
        setLoading(false);
        return;
      }

      const loaded: Order = {
        id: orderId,
        ...(data as Omit<Order, "id">),
      };

      const uidMatch = loaded.customer?.uid === uid;
      const emailMatch =
        email && loaded.customer?.email?.toLowerCase() === email.toLowerCase();

      if (loaded.deleted === true || (!uidMatch && !emailMatch)) {
        setOrder(null);
      } else {
        setOrder(loaded);
      }

      setLoading(false);
    });

    return () => unsubOrder();
  }, [uid, email, orderId]);

  useEffect(() => {
    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        return;
      }

      const loaded: Product[] = Object.entries(data)
        .map(([firebaseId, value]: any, index) => ({
          firebaseId,
          id: Number(value.id || index + 1),
          name: value.name || "Unnamed Product",
          image: safeImage(value.image),
          category: value.category || "Korean Skincare",
          price: Number(value.price || 0),
          oldPrice: Number(value.oldPrice || value.price || 0),
          stock: Number(value.stock || 0),
          deleted: value.deleted,
          active: value.active,
        }))
        .filter((p) => p.deleted !== true && p.active !== false)
        .slice(0, 4);

      setProducts(loaded);

      saveFirebaseProducts(
        loaded.map((p) => ({
          id: p.id,
          firebaseId: p.firebaseId,
          name: p.name,
          image: p.image,
          category: p.category,
          price: p.price,
          oldPrice: p.oldPrice,
          stock: p.stock,
          quantity: 0,
        }))
      );
    });

    return () => unsubProducts();
  }, []);

  const activeStep = useMemo(() => {
    const status = (order?.status || "placed").toLowerCase();
    const index = steps.indexOf(status);
    return index === -1 ? 0 : index;
  }, [order]);

  const handleDownloadInvoice = () => {
    window.print();
  };

  const handleWishlist = (id: number) => {
    toggleWishlist(id);
    setWishlist(getWishlist());
    setWishlistCount(getWishlistCount());
  };

  const handleAddToCart = (id: number) => {
    addToCart(id);
    setCartCount(getCartCount());
  };

  if (loading) {
    return (
      <>
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />
        <main className="min-h-screen bg-[#fafaf7] px-4 pt-[140px]">
          <div className="mx-auto max-w-[800px] rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center text-[#4f5f49]">
            Loading order details...
          </div>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />
        <main className="min-h-screen bg-[#fafaf7] px-4 pt-[140px]">
          <div className="mx-auto max-w-[800px] rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center">
            <h1 className="text-3xl font-black text-[#102015]">
              Order not found
            </h1>

            <Link
              href="/profile/orders"
              className="mt-6 inline-flex h-11 items-center rounded-[6px] bg-[#0b3d2e] px-6 text-sm font-black uppercase text-white"
            >
              Back to Orders
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pt-[110px] pb-10 sm:px-8 lg:px-14 lg:pt-[125px]">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#4f5f49]">
              <Link href="/profile/orders">My Orders</Link>
              <ChevronRight size={15} />
              <span className="text-[#102015]">
                Order #{order.orderNumber || order.id.slice(0, 8)}
              </span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black text-[#0b3d2e] sm:text-4xl">
                    Order #{order.orderNumber || order.id.slice(0, 8)}
                  </h1>

                  <span className="rounded-[6px] bg-green-100 px-3 py-1 text-xs font-black capitalize text-green-700">
                    {order.status || "pending"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-[#4f5f49]">
                  Placed on {dateText(order.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="flex h-11 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/20 bg-white px-5 text-sm font-black text-[#0b3d2e]"
              >
                <Download size={16} />
                Download Invoice
              </button>
            </div>

            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
              <div className="relative grid gap-6 sm:grid-cols-4">
                {steps.map((step, index) => {
                  const done = index <= activeStep;

                  return (
                    <div key={step} className="relative text-center">
                      <div
                        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${
                          done
                            ? "bg-[#0b3d2e] text-white"
                            : "bg-[#f5f1e8] text-[#4f5f49]"
                        }`}
                      >
                        <Check size={16} />
                      </div>

                      <p className="mt-2 text-sm font-black capitalize text-[#102015]">
                        {step}
                      </p>

                      <p className="mt-1 text-xs text-[#4f5f49]">
                        {index === 0
                          ? dateText(order.createdAt).split(",")[0]
                          : "Updated"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <section className="space-y-6">
                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                  <h2 className="mb-5 text-xl font-black text-[#102015]">
                    Order Items
                  </h2>

                  <div className="space-y-4">
                    {order.items?.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex items-center justify-between gap-4 border-b border-[#0b3d2e]/10 pb-4 last:border-b-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-[6px] bg-[#f5f1e8]">
                            <img
                              src={safeImage(item.image)}
                              alt={item.name || "Product"}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          <div>
                            <h3 className="text-sm font-black text-[#102015]">
                              {item.name || "Product"}
                            </h3>
                            <p className="mt-1 text-xs text-[#4f5f49]">
                              Qty: {item.quantity || 1}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm font-black text-[#102015]">
                          {money(
                            item.itemTotal ||
                              Number(item.price || 0) *
                                Number(item.quantity || 1)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3 border-t border-[#0b3d2e]/10 pt-5 text-sm">
                    <PriceRow label="Subtotal" value={money(order.subtotal)} />
                    <PriceRow
                      label="Shipping"
                      value={
                        Number(order.shipping || 0) === 0
                          ? "Free"
                          : money(order.shipping)
                      }
                    />
                    <PriceRow
                      label={`Discount${
                        order.couponCode ? ` (${order.couponCode})` : ""
                      }`}
                      value={`-${money(order.discountAmount)}`}
                    />

                    <div className="flex justify-between text-xl font-black text-[#102015]">
                      <span>Total</span>
                      <span className="text-[#0b3d2e]">{money(order.total)}</span>
                    </div>
                  </div>
                </div>

                {products.length > 0 && (
                  <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                    <h2 className="mb-5 text-xl font-black text-[#102015]">
                      You May Also Like
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {products.map((product) => (
                        <div
                          key={product.firebaseId || product.id}
                          className="relative rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-3"
                        >
                          <button
                            type="button"
                            onClick={() => handleWishlist(product.id)}
                            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0b3d2e]"
                          >
                            <Heart
                              size={15}
                              fill={
                                wishlist.includes(product.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>

                          <Link href={`/product/${product.id}`}>
                            <div className="flex h-28 items-center justify-center rounded-[6px] bg-[#f5f1e8]">
                              <img
                                src={safeImage(product.image)}
                                alt={product.name}
                                className="h-full w-full object-contain p-3"
                              />
                            </div>

                            <h3 className="mt-3 line-clamp-2 text-sm font-black text-[#102015]">
                              {product.name}
                            </h3>

                            <p className="mt-1 text-sm font-black text-[#0b3d2e]">
                              {money(product.price)}
                            </p>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product.id)}
                            className="mt-3 h-9 w-full rounded-[6px] bg-[#0b3d2e] text-xs font-black uppercase text-white"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <aside className="space-y-6">
                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                  <h2 className="mb-5 text-xl font-black text-[#102015]">
                    Shipping Address
                  </h2>

                  <div className="flex gap-3 text-sm leading-7 text-[#4f5f49]">
                    <MapPin size={18} className="mt-1 text-[#0b3d2e]" />

                    <div>
                      <p className="font-black text-[#102015]">
                        {order.shippingAddress?.fullName || "N/A"}
                      </p>
                      <p>{order.shippingAddress?.address}</p>
                      <p>
                        {order.shippingAddress?.area},{" "}
                        {order.shippingAddress?.city}
                      </p>
                      <p>Phone: {order.shippingAddress?.phone || "N/A"}</p>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${order.shippingAddress?.address || ""}, ${
                        order.shippingAddress?.area || ""
                      }, ${order.shippingAddress?.city || ""}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 flex h-10 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-xs font-black text-[#0b3d2e]"
                  >
                    View on Map
                  </a>
                </div>

                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                  <h2 className="mb-5 text-xl font-black text-[#102015]">
                    Order Summary
                  </h2>

                  <div className="space-y-3 text-sm text-[#4f5f49]">
                    <InfoRow
                      label="Order Number"
                      value={`#${order.orderNumber || order.id.slice(0, 8)}`}
                    />
                    <InfoRow label="Order Date" value={dateText(order.createdAt)} />
                    <InfoRow
                      label="Payment Method"
                      value={order.payment?.method || "N/A"}
                    />
                    <InfoRow
                      label="Order Status"
                      value={order.status || "pending"}
                      badge
                    />
                  </div>
                </div>

                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f6ed] text-[#0b3d2e]">
                      <Headphones size={18} />
                    </div>

                    <div>
                      <h2 className="font-black text-[#102015]">Need Help?</h2>
                      <p className="mt-1 text-sm leading-6 text-[#4f5f49]">
                        If you have any questions about your order, please
                        contact our support team.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/contact"
                    className="mt-5 flex h-10 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-xs font-black text-[#0b3d2e]"
                  >
                    Contact Support
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#4f5f49]">{label}</span>
      <b className="text-[#102015]">{value}</b>
    </div>
  );
}

function InfoRow({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      {badge ? (
        <span className="rounded-[6px] bg-green-100 px-2 py-1 text-[10px] font-black capitalize text-green-700">
          {value}
        </span>
      ) : (
        <b className="text-right text-[#102015]">{value}</b>
      )}
    </div>
  );
}