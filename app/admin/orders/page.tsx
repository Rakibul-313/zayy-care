"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, update, remove } from "firebase/database";
import { auth, database } from "@/firebase/config";
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
  items?: {
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ordersRef = ref(database, "orders");

      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
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
          .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

        setOrders(formattedOrders);
        setLoading(false);
      });

      return () => unsubscribeOrders();
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleStatusChange = async (orderId: string, status: string) => {
    await update(ref(database, `orders/${orderId}`), {
      status,
    });
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

      <div className="pb-20 px-4 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1820px] space-y-8">
          <section className="glass rounded-[34px] p-8">
            <h1 className="dream-font text-4xl sm:text-5xl text-[#1f2a1f]">
              Admin Orders
            </h1>

            <p className="mt-3 text-gray-600">
              Manage customer orders, delivery info, payment and order status.
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

                      <h2 className="font-bold text-[#1f2a1f] break-all">
                        {order.id}
                      </h2>

                      <p className="mt-2 text-sm text-gray-600">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : "No date"}
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
                        {order.customer?.email}
                      </p>

                      <p className="mt-2 font-semibold text-[#556B2F]">
                        {order.shippingAddress?.phone}
                      </p>
                    </div>

                    <div className="rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Delivery Address
                      </h3>

                      <p>{order.shippingAddress?.address}</p>

                      <p className="text-sm text-gray-600">
                        {order.shippingAddress?.area},{" "}
                        {order.shippingAddress?.city}
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

                      {order.payment?.trxId && (
                        <p className="mt-1 text-sm text-gray-600">
                          Trx ID: {order.payment.trxId}
                        </p>
                      )}

                      <select
                        value={order.payment?.status || "pending"}
                        onChange={(e) =>
                          handlePaymentStatusChange(order.id, e.target.value)
                        }
                        className="mt-3 w-full rounded-xl bg-white/70 px-4 py-3 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>

                  {(order.couponCode || order.discountAmount) && (
                    <div className="mt-6 rounded-[24px] bg-white/30 p-5">
                      <h3 className="mb-3 font-bold text-[#1f2a1f]">
                        Coupon / Discount
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <p>
                          <span className="text-gray-500">Coupon:</span>{" "}
                          <b>{order.couponCode || "N/A"}</b>
                        </p>

                        <p>
                          <span className="text-gray-500">Discount:</span>{" "}
                          <b>{order.couponDiscount || 0}%</b>
                        </p>

                        <p>
                          <span className="text-gray-500">Saved:</span>{" "}
                          <b className="text-green-700">
                            ৳{order.discountAmount || 0}
                          </b>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 rounded-[24px] bg-white/30 p-5">
                    <h3 className="mb-4 font-bold text-[#1f2a1f]">Products</h3>

                    <div className="space-y-3">
                      {order.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-2xl bg-white/40 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>

                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </p>
                          </div>

                          <p className="font-bold text-[#556B2F]">
                            ৳{item.price}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Status</p>

                      <select
                        value={order.status || "pending"}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className="mt-2 rounded-xl bg-white/70 px-5 py-3 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-5 py-3 text-sm font-bold text-white capitalize ${statusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status || "pending"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                      >
                        <Trash2 size={16} />
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