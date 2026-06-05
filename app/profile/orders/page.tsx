"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "@/firebase/config";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  customer?: {
    uid?: string;
    email?: string;
    name?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    area?: string;
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
  return new Date(value).toLocaleDateString();
}

export default function ProfileOrdersPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
        .map(([id, value]: any) => ({
          id,
          ...value,
        }))
        .filter((order: Order) => {
          const uidMatch = order.customer?.uid === uid;
          const emailMatch =
            email &&
            order.customer?.email?.toLowerCase() === email.toLowerCase();

          return uidMatch || emailMatch;
        })
        .sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));

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
        ${order.status}
        ${order.payment?.method}
        ${order.items?.map((item) => item.name).join(" ")}
      `.toLowerCase();

      const searchMatch = searchText.includes(search.toLowerCase());

      return tabMatch && searchMatch;
    });
  }, [orders, activeTab, search]);

  const totalSpent = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const deliveredCount = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <Navbar />
        <div className="pt-[180px] px-4">
          <div className="glass glass-premium mx-auto max-w-[700px] rounded-[34px] p-10 text-center">
            Loading your orders...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />
      <div className="page-glow" />

      <Navbar />

      <div className="pt-[170px] pb-12 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto space-y-8">
          <section className="glass glass-premium rounded-[40px] p-8 lg:p-10">
            <Link
              href="/profile"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/40 px-5 py-3 font-bold text-[#31571f]"
            >
              <ArrowLeft size={18} />
              Back to Profile
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-[#556B2F] font-bold uppercase tracking-[0.14em] text-sm">
                  Your ZAYY Care history
                </p>

                <h1 className="dream-font mt-2 text-[52px] leading-none text-[#142012] sm:text-[72px]">
                  My Orders
                </h1>

                <p className="mt-4 max-w-[720px] text-gray-600 leading-8">
                  Track your skincare orders, payment status and delivery progress.
                </p>
              </div>

              <Link
                href="/shop"
                className="rounded-full bg-[#31571f] px-8 py-4 font-bold text-white"
              >
                Continue Shopping
              </Link>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <div className="glass glass-premium rounded-[30px] p-7 text-center">
              <ShoppingBag className="mx-auto text-[#31571f]" size={34} />
              <h2 className="mt-4 text-3xl font-black text-[#142012]">
                {orders.length}
              </h2>
              <p className="text-gray-600">Total Orders</p>
            </div>

            <div className="glass glass-premium rounded-[30px] p-7 text-center">
              <Truck className="mx-auto text-[#31571f]" size={34} />
              <h2 className="mt-4 text-3xl font-black text-[#142012]">
                {deliveredCount}
              </h2>
              <p className="text-gray-600">Delivered</p>
            </div>

            <div className="glass glass-premium rounded-[30px] p-7 text-center">
              <Wallet className="mx-auto text-[#31571f]" size={34} />
              <h2 className="mt-4 text-3xl font-black text-[#142012]">
                {money(totalSpent)}
              </h2>
              <p className="text-gray-600">Total Spent</p>
            </div>
          </section>

          <section className="glass glass-premium rounded-[34px] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="glass-soft flex items-center gap-3 rounded-2xl px-5 py-4 lg:w-[420px]">
                <Search className="text-[#31571f]" size={20} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order, status, product..."
                  className="w-full bg-transparent outline-none text-[#142012]"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 rounded-full px-5 py-3 text-sm font-bold capitalize transition ${
                      activeTab === tab
                        ? "bg-[#31571f] text-white"
                        : "glass-soft text-[#31571f]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            {filteredOrders.length === 0 ? (
              <div className="glass glass-premium rounded-[34px] p-12 text-center">
                <Package className="mx-auto text-[#31571f]" size={42} />
                <h2 className="mt-4 text-2xl font-bold text-[#142012]">
                  No orders found
                </h2>
                <p className="mt-2 text-gray-600">
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
                    className="glass glass-premium rounded-[34px] p-6"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#556B2F]">
                          Order #{order.id.slice(0, 10)}
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-[#142012]">
                          {itemCount} item{itemCount > 1 ? "s" : ""} ordered
                        </h2>

                        <p className="mt-2 text-gray-600">
                          Placed on {dateText(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white/40 px-4 py-2 text-sm font-bold capitalize text-[#31571f]">
                          {status}
                        </span>

                        <span className="rounded-full bg-white/40 px-4 py-2 text-sm font-bold uppercase text-[#31571f]">
                          {order.payment?.method || "N/A"}
                        </span>

                        <span className="rounded-full bg-[#31571f] px-5 py-2 text-sm font-bold text-white">
                          {money(order.total)}
                        </span>

                        <Link
                          href={`/profile/orders/${order.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[#556B2F] px-5 py-2 text-sm font-bold text-white"
                        >
                          <Eye size={16} />
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
      </div>

      <Footer />
    </main>
  );
}