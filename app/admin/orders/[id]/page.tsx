"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";

import { auth, database } from "@/firebase/config";
import { updateOrderStatusWithStock } from "@/lib/orderStock";
import { isAdminUser } from "@/lib/admin";

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
  orderNumber?: string;
  items?: OrderItem[];
  customer?: { uid?: string; name?: string; email?: string };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    area?: string;
    note?: string;
  };
  payment?: { method?: string; status?: string; trxId?: string };
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
  couponCode?: string;
  total?: number;
  status?: string;
  createdAt?: number;
  stockUpdated?: boolean;
};

const statuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
function statusClass(status?: string) {
  if (status === "delivered") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "shipped") return "bg-purple-100 text-purple-700";
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  return "bg-orange-100 text-orange-700";
}

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const allowed = await isAdminUser(user.uid);
      if (!allowed) router.push("/shop");
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onValue(ref(database, `orders/${id}`), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrder(null);
      } else {
        setOrder({ id, ...data });
      }

      setLoading(false);
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
      await updateOrderStatusWithStock(id, status as any);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update order.");
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
    } catch (error) {
      console.error(error);
      alert("Failed to update payment status.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center text-[#4f5f49]">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <h1 className="text-3xl font-black text-[#102015]">Order not found</h1>

        <Link
          href="/admin/orders"
          className="mt-6 inline-flex rounded-[6px] bg-[#0b3d2e] px-6 py-3 font-black text-white"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="mb-4 inline-flex items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-black text-[#0b3d2e]"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>

          <h1 className="text-3xl font-black text-[#102015]">
            Order #{getOrderId(order)}
          </h1>

          <p className="mt-1 text-sm text-[#4f5f49]">
            Placed on {dateText(order.createdAt)}
          </p>
        </div>

        <div
          className={`rounded-[6px] px-4 py-3 text-sm font-black capitalize ${statusClass(
            order.status
          )}`}
        >
          {saving ? "Updating..." : order.status || "pending"}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Items" value={itemCount || 0} icon={ShoppingBag} />
        <StatCard
          title="Payment"
          value={(order.payment?.method || "N/A").toUpperCase()}
          icon={CreditCard}
        />
        <StatCard title="Status" value={order.status || "pending"} icon={Package} />
        <StatCard title="Total" value={money(order.total)} icon={ShoppingBag} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <Card title="Ordered Products">
            <div className="mt-5 space-y-4">
              {order.items?.length ? (
                order.items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="grid gap-4 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-4 sm:grid-cols-[88px_1fr_auto] sm:items-center"
                  >
                    <div className="flex h-22 w-22 items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f1e8]">
                      <img
                        src={safeImage(item.image)}
                        alt={item.name || "Product"}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase text-[#0b3d2e]">
                        {item.category || "Korean Skincare"}
                      </p>

                      <h3 className="mt-1 text-lg font-black text-[#102015]">
                        {item.name || "Unnamed Product"}
                      </h3>

                      <p className="mt-2 text-sm font-bold text-[#4f5f49]">
                        Quantity: {item.quantity || 0} × {money(item.price)}
                      </p>
                    </div>

                    <p className="text-lg font-black text-[#0b3d2e]">
                      {money(
                        item.itemTotal ||
                          Number(item.price || 0) * Number(item.quantity || 0)
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-[6px] bg-[#fafaf7] p-5 text-sm text-[#4f5f49]">
                  No items found.
                </p>
              )}
            </div>
          </Card>

          <Card title="Update Order">
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-black text-[#102015]">
                  Order Status
                </span>

                <select
                  value={order.status || "pending"}
                  disabled={saving}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="h-12 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm font-black capitalize text-[#0b3d2e] outline-none disabled:opacity-60"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#102015]">
                  Payment Status
                </span>

                <select
                  value={order.payment?.status || "pending"}
                  disabled={saving}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  className="h-12 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm font-black capitalize text-[#0b3d2e] outline-none disabled:opacity-60"
                >
                  <option value="unpaid">unpaid</option>
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                  <option value="refunded">refunded</option>
                </select>
              </label>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Customer Info">
            <div className="mt-5 space-y-3 text-sm">
              <InfoLine
                icon={User}
                text={
                  order.shippingAddress?.fullName ||
                  order.customer?.name ||
                  "Customer"
                }
              />

              <InfoLine
                icon={Phone}
                text={order.shippingAddress?.phone || "No phone"}
              />

              <InfoLine
                icon={MapPin}
                text={
                  order.shippingAddress?.address ||
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
                    : "No address"
                }
              />
            </div>
          </Card>

          <Card title="Payment Info">
            <div className="mt-5 space-y-3 text-sm">
              <SummaryLine label="Method" value={order.payment?.method || "N/A"} />
              <SummaryLine label="Status" value={order.payment?.status || "pending"} />
              <SummaryLine label="TRX ID" value={order.payment?.trxId || "N/A"} />
            </div>
          </Card>

          <Card title="Summary">
            <div className="mt-5 space-y-4 text-sm">
              <SummaryLine label="Subtotal" value={money(order.subtotal)} />
              <SummaryLine
                label="Shipping"
                value={
                  Number(order.shipping || 0) === 0 ? "Free" : money(order.shipping)
                }
              />
              <SummaryLine label="Discount" value={`-${money(order.discountAmount)}`} />

              {order.couponCode && (
                <SummaryLine label="Coupon" value={order.couponCode} />
              )}

              <div className="h-px bg-[#0b3d2e]/10" />

              <div className="flex justify-between text-xl">
                <span className="font-black text-[#102015]">Total</span>
                <b className="text-[#0b3d2e]">{money(order.total)}</b>
              </div>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <h2 className="text-lg font-black text-[#102015]">{title}</h2>
      {children}
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
          <h2 className="mt-3 text-2xl font-black capitalize text-[#102015]">
            {value}
          </h2>
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

function InfoLine({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <p className="flex items-start gap-3 rounded-[6px] bg-[#fafaf7] p-4 font-bold text-[#263421]">
      <Icon size={18} className="mt-0.5 shrink-0 text-[#0b3d2e]" />
      <span>{text}</span>
    </p>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-[6px] bg-[#fafaf7] p-4">
      <span className="font-bold text-[#4f5f49]">{label}</span>
      <b className="capitalize text-[#102015]">{value}</b>
    </div>
  );
}