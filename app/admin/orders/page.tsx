"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, update, remove } from "firebase/database";
import { auth, database } from "@/firebase/config";
import { updateOrderStatusWithStock } from "@/lib/orderStock";
import { Trash2 } from "lucide-react";

type Order = {
  id: string;
  customer?: {
    name?: string;
    email?: string;
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
  status?: string;
  total?: number;
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
  couponCode?: string;
  couponDiscount?: number;
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

function statusBadgeClass(status?: string) {
  if (status === "delivered") return "bg-green-600";
  if (status === "cancelled") return "bg-red-600";
  if (status === "processing") return "bg-blue-600";
  if (status === "shipped") return "bg-purple-600";
  if (status === "confirmed") return "bg-emerald-600";
  return "bg-[#556B2F]";
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
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
          .map(([id, value]: any) => ({
            id,
            ...value,
          }))
          .sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));

        setOrders(formattedOrders);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [router]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatusWithStock(orderId, status);
    } catch (error: any) {
      console.log(error);
      alert(error.message || "Failed to update order status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    paymentStatus: string
  ) => {
    await update(ref(database, `orders/${orderId}/payment`), {
      status: paymentStatus,
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    const ok = confirm("Are you sure you want to delete this order?");
    if (!ok) return;

    await remove(ref(database, `orders/${orderId}`));
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <div className="px-4 pb-20 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1820px] space-y-8">
          <section className="glass rounded-[34px] p-8">
            <h1 className="dream-font text-4xl text-[#1f2a1f] sm:text-5xl">
              Admin Orders
            </h1>
            <p className="mt-3 text-gray-600">
              Manage customer orders, payment and stock-safe order status.
            </p>
          </section>

          {loading ? (
            <div className="glass rounded-[34px] p-10 text-center">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="glass rounded-[34px] p-10 text-center">
              No orders found.
            </div>
          ) : (
            <section className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="glass rounded-[34px] p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-5 border-b border-black/10 pb-5">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <h2 className="break-all font-bold text-[#1f2a1f]">
                        {order.id}
                      </h2>
                      <p className="mt-2 text-sm text-gray-600">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : "No date"}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-[#556B2F]">
                        Stock: {order.stockUpdated ? "Updated" : "Not updated"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-3xl font-bold text-[#556B2F]">
                        ৳{order.total || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div className="rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Customer
                      </h3>
                      <p>
                        {order.shippingAddress?.fullName ||
                          order.customer?.name ||
                          "Customer"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.customer?.email || "No email"}
                      </p>
                      <p className="mt-2 font-semibold text-[#556B2F]">
                        {order.shippingAddress?.phone || "No phone"}
                      </p>
                    </div>

                    <div className="rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Delivery Address
                      </h3>
                      <p>{order.shippingAddress?.address || "No address"}</p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress?.area || ""},{" "}
                        {order.shippingAddress?.city || ""}
                      </p>
                      {order.shippingAddress?.note && (
                        <p className="mt-2 text-sm text-gray-700">
                          Note: {order.shippingAddress.note}
                        </p>
                      )}
                    </div>

                    <div className="rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Payment
                      </h3>
                      <p className="capitalize">
                        Method: {order.payment?.method || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status: {order.payment?.status || "pending"}
                      </p>
                      {order.payment?.trxId && (
                        <p className="mt-1 text-sm">TRX: {order.payment.trxId}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] bg-white/30 p-5">
                    <h3 className="mb-4 font-bold text-[#1f2a1f]">Items</h3>

                    <div className="space-y-3">
                      {order.items?.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex flex-wrap justify-between gap-3 border-b border-black/5 pb-3"
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              Product Key:{" "}
                              {item.firebaseId || item.productId || item.id || "N/A"}
                            </p>
                          </div>
                          <p>
                            ৳{item.price || 0} × {item.quantity || 1}
                          </p>
                        </div>
                      )) || <p>No items found.</p>}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div className="rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Order Summary
                      </h3>
                      <p>Subtotal: ৳{order.subtotal || 0}</p>
                      <p>Shipping: ৳{order.shipping || 0}</p>
                      <p>Discount: ৳{order.discountAmount || 0}</p>
                      {order.couponCode && <p>Coupon: {order.couponCode}</p>}
                      <p className="mt-2 text-xl font-bold text-[#556B2F]">
                        Total: ৳{order.total || 0}
                      </p>
                    </div>

                    <div className="rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Order Status
                      </h3>

                      <span
                        className={`mb-4 inline-block rounded-full px-4 py-2 text-sm font-bold text-white ${statusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status || "pending"}
                      </span>

                      <select
                        value={order.status || "pending"}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className="w-full rounded-2xl bg-white/70 px-4 py-3 outline-none disabled:opacity-60"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {updatingId === order.id && (
                        <p className="mt-2 text-xs text-[#556B2F]">
                          Updating stock & status...
                        </p>
                      )}
                    </div>

                    <div className="rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Payment Status
                      </h3>

                      <select
                        value={order.payment?.status || "pending"}
                        onChange={(e) =>
                          handlePaymentStatusChange(order.id, e.target.value)
                        }
                        className="w-full rounded-2xl bg-white/70 px-4 py-3 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>

                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-100 px-4 py-3 font-semibold text-red-700"
                      >
                        <Trash2 size={18} />
                        Delete Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}