"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, update, remove } from "firebase/database";
import { auth, database } from "@/firebase/config";
import { updateOrderStatusWithStock } from "@/lib/orderStock";
import { isAdminUser } from "@/lib/admin";
import {
  Clock,
  Eye,
  PackageCheck,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

type Order = {
  id: string;
  deleted?: boolean;
  customer?: { name?: string; email?: string };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
    area?: string;
    address?: string;
    note?: string;
  };
  payment?: { method?: string; status?: string; trxId?: string };
  status?: string;
  total?: number;
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
  couponCode?: string;
  createdAt?: number;
  stockUpdated?: boolean;
  items?: {
    id?: string | number;
    productId?: string;
    firebaseId?: string;
    name?: string;
    price?: number;
    quantity?: number;
  }[];
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function dateText(value?: number) {
  if (!value) return "No date";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status?: string) {
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

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const allowed = await isAdminUser(user.uid);

      if (!allowed) {
        router.push("/shop");
        return;
      }

      unsubscribeOrders = onValue(ref(database, "orders"), (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const formattedOrders = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...(value as Omit<Order, "id">),
          }))
          .filter((order) => order.deleted !== true)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        setOrders(formattedOrders);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [router]);

  const orderDisplayIds = useMemo(() => {
    const map = new Map<string, string>();
    const dailyCount: Record<string, number> = {};

    const ascendingOrders = [...orders].sort(
      (a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)
    );

    ascendingOrders.forEach((order) => {
      const dateKey = makeDateKey(order.createdAt);
      dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1;
      const count = String(dailyCount[dateKey]).padStart(4, "0");
      map.set(order.id, `${dateKey}${count}`);
    });

    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase().replace("#", "");

    if (!query) return orders;

    return orders.filter((order) => {
      const displayId = orderDisplayIds.get(order.id)?.toLowerCase() || "";
      const firebaseId = order.id.toLowerCase();

      return displayId.includes(query) || firebaseId.includes(query);
    });
  }, [orders, orderDisplayIds, searchQuery]);

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      total: orders.length,
      pending: orders.filter((order) => (order.status || "pending") === "pending")
        .length,
      processing: orders.filter((order) => order.status === "processing").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      revenue: totalRevenue,
    };
  }, [orders]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatusWithStock(orderId, status);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update order.");
    } finally {
      setUpdatingId("");
    }
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    paymentStatus: string
  ) => {
    try {
      await update(ref(database, `orders/${orderId}/payment`), {
        status: paymentStatus,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to update payment status.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const ok = confirm("Are you sure you want to delete this order?");
    if (!ok) return;

    try {
      setDeletingId(orderId);
      await remove(ref(database, `orders/${orderId}`));
    } catch (error) {
      console.error(error);
      alert("Failed to delete order.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Orders</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">Dashboard › Orders</p>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-black text-[#0b3d2e]">
          Realtime Orders
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Orders" value={stats.total} icon={ShoppingBag} />
        <StatCard title="Pending Orders" value={stats.pending} icon={Clock} />
        <StatCard title="Delivered" value={stats.delivered} icon={PackageCheck} />
        <StatCard title="Total Revenue" value={money(stats.revenue)} icon={Truck} />
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SmallStatus title="Processing" value={stats.processing} />
        <SmallStatus title="Shipped" value={stats.shipped} />
        <SmallStatus title="Cancelled" value={stats.cancelled} danger />
        <SmallStatus title="Active Orders" value={stats.total - stats.cancelled} />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#4f5f49]">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            <p className="mt-1 text-xs font-medium text-[#4f5f49]">
              Search by Order ID like 202606210001
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4f5f49]"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID..."
              className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] py-3 pl-10 pr-4 text-sm font-bold text-[#102015] outline-none transition focus:border-[#0b3d2e] focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-[#4f5f49]">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag className="mx-auto text-[#003f2a]" size={44} />
            <h2 className="mt-4 text-2xl font-black text-[#102015]">
              No orders found
            </h2>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto text-[#003f2a]" size={44} />
            <h2 className="mt-4 text-2xl font-black text-[#102015]">
              No matching order found
            </h2>
            <p className="mt-2 text-sm text-[#4f5f49]">
              Try searching with full Order ID or Firebase key.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-left text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Order</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#0b3d2e]/10 text-[#263421]"
                  >
                    <td className="py-4">
                      <p className="font-black text-[#102015]">
                        #{orderDisplayIds.get(order.id) || order.id.slice(0, 8)}
                      </p>
                      <p className="mt-1 max-w-[160px] truncate text-xs text-[#4f5f49]">
                        Key: {order.id}
                      </p>
                    </td>

                    <td>
                      <p className="font-black text-[#102015]">
                        {order.shippingAddress?.fullName ||
                          order.customer?.name ||
                          "Customer"}
                      </p>
                      <p className="text-xs text-[#4f5f49]">
                        {order.customer?.email || "No email"}
                      </p>
                    </td>

                    <td className="font-bold text-[#0b3d2e]">
                      {order.shippingAddress?.phone || "No phone"}
                    </td>

                    <td>{order.items?.length || 0}</td>

                    <td className="font-black text-[#0b3d2e]">
                      {money(order.total)}
                    </td>

                    <td className="capitalize">
                      {order.payment?.method || "N/A"}
                    </td>

                    <td>
                      <select
                        value={order.status || "pending"}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className={`rounded-[6px] px-3 py-2 text-xs font-black capitalize outline-none disabled:opacity-60 ${statusBadgeClass(
                          order.status
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {updatingId === order.id && (
                        <p className="mt-1 text-[11px] font-bold text-[#0b3d2e]">
                          Updating...
                        </p>
                      )}
                    </td>

                    <td>
                      <select
                        value={order.payment?.status || "pending"}
                        onChange={(e) =>
                          handlePaymentStatusChange(order.id, e.target.value)
                        }
                        className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-3 py-2 text-xs font-black capitalize text-[#0b3d2e] outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>

                    <td className="text-[#4f5f49]">{dateText(order.createdAt)}</td>

                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]"
                        >
                          <Eye size={15} />
                        </Link>

                        <button
                          type="button"
                          disabled={deletingId === order.id}
                          onClick={() => handleDeleteOrder(order.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-red-50 text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
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
          <h2 className="mt-3 text-3xl font-black text-[#102015]">{value}</h2>
          <p className="mt-2 text-xs font-black text-green-600">Realtime data</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#0b3d2e]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SmallStatus({
  title,
  value,
  danger,
}: {
  title: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#102015]">{title}</p>
        {danger ? (
          <XCircle size={18} className="text-red-600" />
        ) : (
          <PackageCheck size={18} className="text-[#0b3d2e]" />
        )}
      </div>

      <p
        className={`mt-3 text-2xl font-black ${
          danger ? "text-red-600" : "text-[#0b3d2e]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}