"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";
import {
  ArrowLeft,
  Eye,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Wallet,
} from "lucide-react";

type Order = {
  id: string;
  orderNumber?: string;
  customer?: { uid?: string; name?: string; email?: string };
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
};

type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  area?: string;
  createdAt?: number;
};

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

function statusClass(status?: string) {
  if (status === "delivered") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "shipped") return "bg-purple-100 text-purple-700";
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  return "bg-orange-100 text-orange-700";
}

function makeDateKey(createdAt?: number) {
  const date = createdAt ? new Date(createdAt) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function getOrderId(order: Order) {
  if (order.orderNumber) return order.orderNumber;
  return `${makeDateKey(order.createdAt)}0001`;
}

export default function AdminCustomerDetailsPage() {
  const params = useParams();
  const customerId = String(params.id || "");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!customerId) return;

    const unsubUser = onValue(ref(database, `users/${customerId}`), (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setProfile({
          uid: customerId,
          ...(data as Omit<UserProfile, "uid">),
        });
      }
    });

    return () => unsubUser();
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Order, "id">),
        }))
        .filter((order) => {
          return (
            order.customer?.uid === customerId ||
            order.customer?.email === profile?.email ||
            order.shippingAddress?.phone === profile?.phone
          );
        })
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setOrders(loaded);
    });

    return () => unsubOrders();
  }, [customerId, profile?.email, profile?.phone]);

  const totalSpent = useMemo(() => {
    return orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [orders]);

  const lastOrder = orders[0];

  const displayName =
    profile?.name ||
    lastOrder?.shippingAddress?.fullName ||
    lastOrder?.customer?.name ||
    "Customer";

  const displayEmail =
    profile?.email || lastOrder?.customer?.email || "No email";

  const displayPhone =
    profile?.phone || lastOrder?.shippingAddress?.phone || "No phone";

  const displayAddress =
    profile?.address ||
    lastOrder?.shippingAddress?.address ||
    lastOrder?.shippingAddress?.area ||
    lastOrder?.shippingAddress?.city ||
    "No address";

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/customers"
            className="mb-4 inline-flex items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-black text-[#0b3d2e]"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>

          <h1 className="text-3xl font-black text-[#102015]">{displayName}</h1>

          <p className="mt-1 text-sm text-[#4f5f49]">
            Customer details and realtime order history.
          </p>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-black text-[#0b3d2e]">
          Realtime Customer
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} />
        <StatCard title="Total Spent" value={money(totalSpent)} icon={Wallet} />
        <StatCard
          title="Last Order"
          value={dateText(lastOrder?.createdAt)}
          icon={ShoppingBag}
        />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <h2 className="text-lg font-black text-[#102015]">Contact Info</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoBox icon={Mail} text={displayEmail} />
          <InfoBox icon={Phone} text={displayPhone} />
          <InfoBox icon={MapPin} text={displayAddress} />
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#102015]">Order History</h2>

          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {orders.length} orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-[#4f5f49]">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#0b3d2e]/10 text-[#263421]"
                  >
                    <td className="py-4 font-black text-[#102015]">
                      #{getOrderId(order)}
                    </td>

                    <td className="text-[#4f5f49]">
                      {dateText(order.createdAt)}
                    </td>

                    <td>
                      <span
                        className={`rounded-[6px] px-3 py-1 text-xs font-black capitalize ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "pending"}
                      </span>
                    </td>

                    <td className="font-black text-[#0b3d2e]">
                      {money(order.total)}
                    </td>

                    <td className="text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#4f5f49]">{title}</p>
          <h2 className="mt-3 text-2xl font-black text-[#102015]">{value}</h2>
          <p className="mt-2 text-xs font-black text-green-600">
            Realtime data
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#0b3d2e]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <p className="flex items-start gap-3 rounded-[6px] bg-[#fafaf7] p-4 font-bold text-[#263421]">
      <Icon size={18} className="mt-0.5 shrink-0 text-[#0b3d2e]" />
      <span>{text}</span>
    </p>
  );
}