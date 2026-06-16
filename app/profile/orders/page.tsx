"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "@/firebase/config";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

import {
  ArrowLeft,
  Eye,
  Package,
  Search,
  ShoppingBag,
  Truck,
  Wallet,
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
  total?: number;
  status?: string;
  createdAt?: number;
  payment?: {
    method?: string;
    status?: string;
  };
  items?: {
    name?: string;
    quantity?: number;
  }[];
};

const tabs = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function ProfileOrdersPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
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
    if (!uid) return;

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Order, "id">),
        }))
        .filter((order) => {
          if (order.deleted === true) return false;

          const uidMatch = order.customer?.uid === uid;
          const emailMatch =
            email &&
            order.customer?.email?.toLowerCase() === email.toLowerCase();

          return uidMatch || emailMatch;
        })
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setOrders(loaded);
      setLoading(false);
    });

    return () => unsubOrders();
  }, [uid, email]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = order.status || "pending";
      const tabMatch = activeTab === "all" || status === activeTab;

      const searchText = `
        ${order.id}
        ${order.orderNumber}
        ${order.status}
        ${order.payment?.method}
        ${order.items?.map((item) => item.name).join(" ")}
      `.toLowerCase();

      return tabMatch && searchText.includes(search.toLowerCase());
    });
  }, [orders, activeTab, search]);

  const totalSpent = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const deliveredCount = orders.filter((order) => order.status === "delivered").length;

  if (loading) {
    return (
      <>
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />
        <main className="min-h-screen bg-[#fafaf7] px-4 pt-[140px]">
          <div className="mx-auto max-w-[800px] rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center text-[#4f5f49]">
            Loading your orders...
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
            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
              <Link
                href="/profile"
                className="mb-5 inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 text-sm font-black text-[#0b3d2e]"
              >
                <ArrowLeft size={16} />
                Back to Profile
              </Link>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                    My Orders
                  </h1>

                  <p className="mt-2 text-sm text-[#4f5f49]">
                    Track your skincare orders, payment status and delivery progress.
                  </p>
                </div>

                <Link
                  href="/shop"
                  className="flex h-11 items-center justify-center rounded-[6px] bg-[#0b3d2e] px-6 text-sm font-black uppercase text-white"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard icon={ShoppingBag} value={orders.length} text="Total Orders" />
              <StatCard icon={Truck} value={deliveredCount} text="Delivered" />
              <StatCard icon={Wallet} value={money(totalSpent)} text="Total Spent" />
            </div>

            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex h-12 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 lg:w-[420px]">
                  <Search className="text-[#0b3d2e]" size={18} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search order, status, product..."
                    className="w-full bg-transparent text-sm text-[#102015] outline-none placeholder:text-[#7c8777]"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 rounded-[6px] px-4 py-3 text-xs font-black capitalize transition ${
                        activeTab === tab
                          ? "bg-[#0b3d2e] text-white"
                          : "border border-[#0b3d2e]/10 bg-[#fafaf7] text-[#0b3d2e]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-12 text-center shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                  <Package className="mx-auto text-[#0b3d2e]" size={42} />

                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    No orders found
                  </h2>

                  <p className="mt-2 text-sm text-[#4f5f49]">
                    Your matching orders will appear here.
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const status = order.status || "pending";

                  const itemCount =
                    order.items?.reduce(
                      (sum, item) => sum + Number(item.quantity || 0),
                      0
                    ) || 0;

                  return (
                    <article
                      key={order.id}
                      className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
                            <ShoppingBag size={22} />
                          </div>

                          <div>
                            <p className="text-sm font-black text-[#0b3d2e]">
                              Order #{order.orderNumber || order.id.slice(0, 10)}
                            </p>

                            <h2 className="mt-1 text-xl font-black text-[#102015]">
                              {itemCount} item{itemCount > 1 ? "s" : ""} ordered
                            </h2>

                            <p className="mt-1 text-sm text-[#4f5f49]">
                              Placed on {dateText(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-[6px] bg-[#f5f1e8] px-4 py-2 text-xs font-black capitalize text-[#0b3d2e]">
                            {status}
                          </span>

                          <span className="rounded-[6px] bg-[#f5f1e8] px-4 py-2 text-xs font-black uppercase text-[#0b3d2e]">
                            {order.payment?.method || "N/A"}
                          </span>

                          <span className="rounded-[6px] bg-[#0b3d2e] px-5 py-2 text-xs font-black text-white">
                            {money(order.total)}
                          </span>

                          <Link
                            href={`/profile/orders/${order.id}`}
                            className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 text-xs font-black text-[#0b3d2e]"
                          >
                            <Eye size={15} />
                            View Details
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

function StatCard({
  icon: Icon,
  value,
  text,
}: {
  icon: any;
  value: string | number;
  text: string;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 text-center shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <Icon className="mx-auto text-[#0b3d2e]" size={30} />
      <h2 className="mt-3 text-2xl font-black text-[#102015]">{value}</h2>
      <p className="mt-1 text-sm text-[#4f5f49]">{text}</p>
    </div>
  );
}