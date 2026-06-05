"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { onValue, ref, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";

type OrderItem = {
  id?: number;
  name?: string;
  image?: string;
  category?: string;
  price?: number;
  quantity?: number;
  itemTotal?: number;
};

type Order = {
  id: string;
  items?: OrderItem[];
  customer?: {
    uid?: string;
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    area?: string;
    note?: string;
  };
  payment?: {
    method?: string;
    status?: string;
    trxId?: string;
  };
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
  couponCode?: string;
  total?: number;
  status?: string;
  createdAt?: number;
};

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onValue(ref(database, `orders/${id}`), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrder(null);
        return;
      }

      setOrder({
        id,
        ...data,
      });
    });

    return () => unsubscribe();
  }, [id]);

  const itemCount = useMemo(() => {
    return order?.items?.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [order]);

  const handleStatusChange = async (status: string) => {
    if (!id) return;

    try {
      setSaving(true);

      await update(ref(database, `orders/${id}`), {
        status,
        updatedAt: Date.now(),
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentStatusChange = async (paymentStatus: string) => {
    if (!id) return;

    try {
      setSaving(true);

      await update(ref(database, `orders/${id}/payment`), {
        ...(order?.payment || {}),
        status: paymentStatus,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!order) {
    return (
      <div className="rounded-[30px] border border-white/65 bg-white/36 p-10 text-center shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h1 className="text-3xl font-bold text-[#172313]">Order not found</h1>

        <Link
          href="/admin/orders"
          className="mt-6 inline-flex rounded-full bg-[#556B2F] px-6 py-3 font-bold text-white"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <Link
          href="/admin/orders"
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/45 px-5 py-3 font-bold text-[#556B2F]"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">
              Order #{order.id.slice(0, 10)}
            </h1>

            <p className="mt-2 text-gray-600">
              Placed on {dateText(order.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#556B2F]/10 px-5 py-3 font-bold capitalize text-[#556B2F]">
            {saving ? "Updating..." : order.status || "pending"}
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-4">
        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <ShoppingBag className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Items</p>
          <h2 className="text-3xl font-black text-[#172313]">{itemCount}</h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <CreditCard className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Payment</p>
          <h2 className="text-2xl font-black uppercase text-[#172313]">
            {order.payment?.method || "N/A"}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Package className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Status</p>
          <h2 className="text-2xl font-black capitalize text-[#172313]">
            {order.status || "pending"}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <ShoppingBag className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Total</p>
          <h2 className="text-3xl font-black text-[#556B2F]">
            {money(order.total)}
          </h2>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-6 text-2xl font-bold text-[#172313]">
              Ordered Products
            </h2>

            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex flex-col gap-4 rounded-[24px] bg-white/35 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/55">
                    <img
                      src={item.image || "/products/p1.png"}
                      alt={item.name || "Product"}
                      className="h-full w-full object-contain p-3"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#556B2F]">
                      {item.category || "Korean Skincare"}
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-[#172313]">
                      {item.name || "Unnamed Product"}
                    </h3>

                    <p className="mt-2 text-sm text-gray-600">
                      Quantity: {item.quantity || 0} × {money(item.price)}
                    </p>
                  </div>

                  <p className="text-lg font-black text-[#556B2F]">
                    {money(item.itemTotal || Number(item.price || 0) * Number(item.quantity || 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-6 text-2xl font-bold text-[#172313]">
              Update Order
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-3 font-bold text-[#172313]">Order Status</p>

                <select
                  value={order.status || "pending"}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full rounded-2xl bg-white/60 px-5 py-4 font-semibold capitalize outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-3 font-bold text-[#172313]">Payment Status</p>

                <select
                  value={order.payment?.status || "unpaid"}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  className="w-full rounded-2xl bg-white/60 px-5 py-4 font-semibold capitalize outline-none"
                >
                  <option value="unpaid">unpaid</option>
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                  <option value="refunded">refunded</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-6 text-2xl font-bold text-[#172313]">
              Customer Info
            </h2>

            <div className="space-y-4 text-sm">
              <p className="flex items-center gap-3 rounded-2xl bg-white/35 p-4">
                <User size={18} className="text-[#556B2F]" />
                <span>
                  {order.shippingAddress?.fullName ||
                    order.customer?.name ||
                    "Customer"}
                </span>
              </p>

              <p className="flex items-center gap-3 rounded-2xl bg-white/35 p-4">
                <Phone size={18} className="text-[#556B2F]" />
                <span>{order.shippingAddress?.phone || "No phone"}</span>
              </p>

              <p className="flex items-start gap-3 rounded-2xl bg-white/35 p-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#556B2F]" />
                <span>
                  {order.shippingAddress?.address ||
                  order.shippingAddress?.area ||
                  order.shippingAddress?.city
                    ? `${order.shippingAddress?.address || ""}${
                        order.shippingAddress?.area
                          ? `, ${order.shippingAddress.area}`
                          : ""
                      }${
                        order.shippingAddress?.city
                          ? `, ${order.shippingAddress.city}`
                          : ""
                      }`
                    : "No address"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-6 text-2xl font-bold text-[#172313]">
              Payment Info
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between rounded-2xl bg-white/35 p-4">
                <span>Method</span>
                <b className="uppercase">{order.payment?.method || "N/A"}</b>
              </div>

              <div className="flex justify-between rounded-2xl bg-white/35 p-4">
                <span>Status</span>
                <b className="capitalize">{order.payment?.status || "unpaid"}</b>
              </div>

              <div className="flex justify-between rounded-2xl bg-white/35 p-4">
                <span>TRX ID</span>
                <b>{order.payment?.trxId || "N/A"}</b>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-6 text-2xl font-bold text-[#172313]">
              Summary
            </h2>

            <div className="space-y-4 text-sm">
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

              {order.couponCode && (
                <div className="flex justify-between">
                  <span>Coupon</span>
                  <b>{order.couponCode}</b>
                </div>
              )}

              <div className="h-px bg-black/10" />

              <div className="flex justify-between text-xl">
                <span className="font-bold">Total</span>
                <b className="text-[#556B2F]">{money(order.total)}</b>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}