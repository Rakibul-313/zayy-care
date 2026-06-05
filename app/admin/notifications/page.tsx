"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Package,
  ShoppingBag,
  Star,
  Trash2,
  Users,
} from "lucide-react";

type Order = {
  id: string;
  status?: string;
  total?: number;
  createdAt?: number;
  customer?: {
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
  };
};

type Review = {
  id: string;
  productName?: string;
  customerName?: string;
  approved?: boolean;
  createdAt?: number;
};

type Product = {
  firebaseId: string;
  name?: string;
  stock?: number;
  lowStockLimit?: number;
};

type Subscriber = {
  id: string;
  email?: string;
  createdAt?: number;
};

type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  createdAt?: number;
};

type NotificationItem = {
  id: string;
  type: "order" | "review" | "stock" | "subscriber" | "customer";
  title: string;
  message: string;
  href: string;
  createdAt: number;
  priority: "high" | "medium" | "low";
};

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

export default function AdminNotificationsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      setOrders(
        data
          ? Object.entries(data).map(([id, value]: any) => ({
              id,
              ...value,
            }))
          : []
      );
    });

    const unsubReviews = onValue(ref(database, "reviews"), (snapshot) => {
      const data = snapshot.val();

      setReviews(
        data
          ? Object.entries(data).map(([id, value]: any) => ({
              id,
              ...value,
            }))
          : []
      );
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      setProducts(
        data
          ? Object.entries(data).map(([firebaseId, value]: any) => ({
              firebaseId,
              ...value,
            }))
          : []
      );
    });

    const unsubSubscribers = onValue(ref(database, "subscribers"), (snapshot) => {
      const data = snapshot.val();

      setSubscribers(
        data
          ? Object.entries(data).map(([id, value]: any) => ({
              id,
              ...value,
            }))
          : []
      );
    });

    const unsubUsers = onValue(ref(database, "users"), (snapshot) => {
      const data = snapshot.val();

      setUsers(
        data
          ? Object.entries(data).map(([uid, value]: any) => ({
              uid,
              ...value,
            }))
          : []
      );
    });

    return () => {
      unsubOrders();
      unsubReviews();
      unsubProducts();
      unsubSubscribers();
      unsubUsers();
    };
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    orders.forEach((order) => {
      const status = order.status || "pending";

      if (status === "pending") {
        items.push({
          id: `order-${order.id}`,
          type: "order",
          title: "New pending order",
          message: `${
            order.shippingAddress?.fullName ||
            order.customer?.name ||
            "Customer"
          } placed an order of ${money(order.total)}.`,
          href: `/admin/orders/${order.id}`,
          createdAt: order.createdAt || Date.now(),
          priority: "high",
        });
      }
    });

    reviews.forEach((review) => {
      if (review.approved === false) {
        items.push({
          id: `review-${review.id}`,
          type: "review",
          title: "Review waiting for approval",
          message: `${review.customerName || "Customer"} reviewed ${
            review.productName || "a product"
          }.`,
          href: "/admin/reviews",
          createdAt: review.createdAt || Date.now(),
          priority: "medium",
        });
      }
    });

    products.forEach((product) => {
      const stock = Number(product.stock || 0);
      const limit = Number(product.lowStockLimit || 5);

      if (stock <= 0) {
        items.push({
          id: `stock-out-${product.firebaseId}`,
          type: "stock",
          title: "Product out of stock",
          message: `${product.name || "Unnamed Product"} is out of stock.`,
          href: "/admin/inventory",
          createdAt: Date.now(),
          priority: "high",
        });
      } else if (stock <= limit) {
        items.push({
          id: `stock-low-${product.firebaseId}`,
          type: "stock",
          title: "Low stock alert",
          message: `${product.name || "Unnamed Product"} has only ${stock} left.`,
          href: "/admin/inventory",
          createdAt: Date.now(),
          priority: "medium",
        });
      }
    });

    subscribers.forEach((subscriber) => {
      const isRecent =
        subscriber.createdAt && Date.now() - subscriber.createdAt < 86400000;

      if (isRecent) {
        items.push({
          id: `subscriber-${subscriber.id}`,
          type: "subscriber",
          title: "New newsletter subscriber",
          message: `${subscriber.email || "Someone"} subscribed today.`,
          href: "/admin/subscribers",
          createdAt: subscriber.createdAt || Date.now(),
          priority: "low",
        });
      }
    });

    users.forEach((user) => {
      const isRecent = user.createdAt && Date.now() - user.createdAt < 86400000;

      if (isRecent) {
        items.push({
          id: `customer-${user.uid}`,
          type: "customer",
          title: "New customer account",
          message: `${user.name || user.email || "Customer"} joined today.`,
          href: "/admin/customers",
          createdAt: user.createdAt || Date.now(),
          priority: "low",
        });
      }
    });

    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, reviews, products, subscribers, users]);

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((item) => item.type === filter);

  const markOrderProcessing = async (orderId: string) => {
    await update(ref(database, `orders/${orderId}`), {
      status: "processing",
      updatedAt: Date.now(),
    });
  };

  const clearLowStockProduct = async (productId: string) => {
    await update(ref(database, `products/${productId}`), {
      lowStockLimit: 0,
      updatedAt: Date.now(),
    });
  };

  const typeIcon = (type: NotificationItem["type"]) => {
    if (type === "order") return ShoppingBag;
    if (type === "review") return Star;
    if (type === "stock") return AlertTriangle;
    if (type === "subscriber") return Mail;
    return Users;
  };

  const typeColor = (priority: NotificationItem["priority"]) => {
    if (priority === "high") return "bg-red-100 text-red-700";
    if (priority === "medium") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">
              Notifications
            </h1>
            <p className="mt-2 text-gray-600">
              Realtime alerts for orders, reviews, stock, subscribers and customers.
            </p>
          </div>

          <div className="rounded-2xl bg-[#556B2F]/10 px-5 py-3 font-bold text-[#556B2F]">
            {notifications.length} Active Alerts
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-5">
        {[
          ["all", "All", notifications.length, Bell],
          [
            "order",
            "Orders",
            notifications.filter((i) => i.type === "order").length,
            ShoppingBag,
          ],
          [
            "review",
            "Reviews",
            notifications.filter((i) => i.type === "review").length,
            MessageSquare,
          ],
          [
            "stock",
            "Stock",
            notifications.filter((i) => i.type === "stock").length,
            Package,
          ],
          [
            "subscriber",
            "Subscribers",
            notifications.filter((i) => i.type === "subscriber").length,
            Mail,
          ],
        ].map(([value, label, count, Icon]: any) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-[26px] border p-5 text-left shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl transition ${
              filter === value
                ? "border-[#556B2F]/40 bg-[#556B2F]/12"
                : "border-white/65 bg-white/36"
            }`}
          >
            <Icon className="text-[#556B2F]" size={28} />
            <p className="mt-4 text-sm text-gray-600">{label}</p>
            <h2 className="text-3xl font-black text-[#172313]">{count}</h2>
          </button>
        ))}
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {filteredNotifications.length === 0 ? (
          <div className="py-14 text-center text-gray-600">
            <CheckCircle2 className="mx-auto mb-4 text-[#556B2F]" size={44} />
            No active notifications.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNotifications.map((item) => {
              const Icon = typeIcon(item.type);

              const rawId = item.id.replace("order-", "").replace("stock-low-", "").replace("stock-out-", "");

              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-white/35 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${typeColor(
                        item.priority
                      )}`}
                    >
                      <Icon size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-[#172313]">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {dateText(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={item.href}
                      className="rounded-xl bg-[#556B2F] px-4 py-3 text-sm font-bold text-white"
                    >
                      View
                    </Link>

                    {item.type === "order" && (
                      <button
                        onClick={() => markOrderProcessing(rawId)}
                        className="rounded-xl bg-blue-100 px-4 py-3 text-sm font-bold text-blue-700"
                      >
                        Process
                      </button>
                    )}

                    {item.type === "stock" && (
                      <button
                        onClick={() => clearLowStockProduct(rawId)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}