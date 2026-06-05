"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "@/firebase/config";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { ArrowLeft, Package, Truck, Wallet } from "lucide-react";

type Order = {
  id: string;
  orderNumber?: string;
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
  total?: number;
  status?: string;
  createdAt?: number;
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

export default function ProfileOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params.id);

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
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
        ...data,
      };

      const uidMatch = loaded.customer?.uid === uid;
      const emailMatch =
        email &&
        loaded.customer?.email?.toLowerCase() === email.toLowerCase();

      if (!uidMatch && !emailMatch) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setOrder(loaded);
      setLoading(false);
    });

    return () => unsubOrder();
  }, [uid, email, orderId]);

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <Navbar />
        <div className="pt-[180px] px-4">
          <div className="glass glass-premium mx-auto max-w-[700px] rounded-[34px] p-10 text-center">
            Loading order details...
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <Navbar />
        <div className="pt-[180px] px-4">
          <div className="glass glass-premium mx-auto max-w-[700px] rounded-[34px] p-10 text-center">
            <h1 className="text-3xl font-bold text-[#142012]">
              Order not found
            </h1>

            <Link
              href="/profile/orders"
              className="mt-6 inline-flex rounded-full bg-[#31571f] px-6 py-3 font-bold text-white"
            >
              Back to Orders
            </Link>
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
        <div className="mx-auto max-w-[1500px] space-y-8">
          <section className="glass glass-premium rounded-[40px] p-8">
            <Link
              href="/profile/orders"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/40 px-5 py-3 font-bold text-[#31571f]"
            >
              <ArrowLeft size={18} />
              Back to Orders
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#556B2F]">
                  Order Details
                </p>

                <h1 className="mt-2 text-4xl font-black text-[#142012]">
                  #{order.orderNumber || order.id}
                </h1>

                <p className="mt-3 text-gray-600">
                  Placed on {dateText(order.createdAt)}
                </p>
              </div>

              <span className="rounded-full bg-[#31571f] px-6 py-3 font-bold capitalize text-white">
                {order.status || "pending"}
              </span>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <div className="glass glass-premium rounded-[30px] p-7">
              <Package className="text-[#31571f]" />
              <h2 className="mt-4 text-xl font-bold text-[#142012]">
                Items
              </h2>
              <p className="mt-2 text-gray-600">
                {order.items?.length || 0} product(s)
              </p>
            </div>

            <div className="glass glass-premium rounded-[30px] p-7">
              <Truck className="text-[#31571f]" />
              <h2 className="mt-4 text-xl font-bold text-[#142012]">
                Delivery
              </h2>
              <p className="mt-2 text-gray-600">
                {order.shippingAddress?.city || "N/A"},{" "}
                {order.shippingAddress?.area || "N/A"}
              </p>
            </div>

            <div className="glass glass-premium rounded-[30px] p-7">
              <Wallet className="text-[#31571f]" />
              <h2 className="mt-4 text-xl font-bold text-[#142012]">
                Total
              </h2>
              <p className="mt-2 text-2xl font-black text-[#31571f]">
                {money(order.total)}
              </p>
            </div>
          </section>

          <section className="glass glass-premium rounded-[34px] p-8">
            <h2 className="text-2xl font-bold text-[#142012]">
              Ordered Products
            </h2>

            <div className="mt-6 space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/35 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/50">
                      <img
                        src={item.image || "/products/p1.png"}
                        alt={item.name || "Product"}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-[#142012]">
                        {item.name || "Product"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity || 1}
                      </p>
                    </div>
                  </div>

                  <p className="font-bold text-[#31571f]">
                    {money(item.itemTotal || Number(item.price || 0) * Number(item.quantity || 1))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="glass glass-premium rounded-[34px] p-8">
              <h2 className="text-2xl font-bold text-[#142012]">
                Shipping Address
              </h2>

              <div className="mt-5 space-y-2 text-gray-700">
                <p>{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.phone}</p>
                <p>
                  {order.shippingAddress?.address},{" "}
                  {order.shippingAddress?.area},{" "}
                  {order.shippingAddress?.city}
                </p>
                {order.shippingAddress?.note && (
                  <p>Note: {order.shippingAddress.note}</p>
                )}
              </div>
            </div>

            <div className="glass glass-premium rounded-[34px] p-8">
              <h2 className="text-2xl font-bold text-[#142012]">
                Payment Summary
              </h2>

              <div className="mt-5 space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <b>{money(order.subtotal)}</b>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <b>{Number(order.shipping || 0) === 0 ? "Free" : money(order.shipping)}</b>
                </div>

                <div className="flex justify-between">
                  <span>Discount</span>
                  <b>-{money(order.discountAmount)}</b>
                </div>

                <div className="h-px bg-black/10" />

                <div className="flex justify-between text-xl">
                  <span>Total</span>
                  <b className="text-[#31571f]">{money(order.total)}</b>
                </div>

                <p className="pt-3 text-sm capitalize">
                  Method: {order.payment?.method || "N/A"} / Status:{" "}
                  {order.payment?.status || "N/A"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}