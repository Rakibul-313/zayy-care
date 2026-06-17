"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref, update } from "firebase/database";
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
import { database } from "@/firebase/config";
import { updateOrderStatusWithStock } from "@/lib/orderStock";

type Order = {
  id: string;
  status?: string;
  total?: number;
  createdAt?: number;
  adminNotificationDeleted?: boolean;
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
  deleted?: boolean;
  productName?: string;
  customerName?: string;
  approved?: boolean;
  createdAt?: number;
  adminNotificationDeleted?: boolean;
};

type Product = {
  deleted?: boolean;
  firebaseId: string;
  name?: string;
  stock?: number;
  lowStockLimit?: number;
  adminNotificationDeleted?: boolean;
};

type Subscriber = {
  id: string;
  deleted?: boolean;
  email?: string;
  createdAt?: number;
  adminNotificationDeleted?: boolean;
};

type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  createdAt?: number;
  adminNotificationDeleted?: boolean;
};

type NotificationType = "order" | "review" | "stock" | "subscriber" | "customer";
type NotificationFilter = "all" | NotificationType;

type NotificationItem = {
  id: string;
  rawId: string;
  type: NotificationType;
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
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    let loadedOrders = false;
    let loadedReviews = false;
    let loadedProducts = false;
    let loadedSubscribers = false;
    let loadedUsers = false;

    const checkLoading = () => {
      if (
        loadedOrders &&
        loadedReviews &&
        loadedProducts &&
        loadedSubscribers &&
        loadedUsers
      ) {
        setLoading(false);
      }
    };

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      setOrders(
        data
          ? Object.entries(data)
              .map(([id, value]) => ({
                id,
                ...(value as Omit<Order, "id">),
              }))
              .sort(
                (a: Order, b: Order) =>
                  Number(b.createdAt || 0) - Number(a.createdAt || 0)
              )
          : []
      );

      loadedOrders = true;
      checkLoading();
    });

    const unsubReviews = onValue(ref(database, "reviews"), (snapshot) => {
      const data = snapshot.val();

      setReviews(
        data
          ? Object.entries(data)
              .map(([id, value]) => ({
                id,
                ...(value as Omit<Review, "id">),
              }))
              .filter((review) => review.deleted !== true)
              .sort(
                (a: Review, b: Review) =>
                  Number(b.createdAt || 0) - Number(a.createdAt || 0)
              )
          : []
      );

      loadedReviews = true;
      checkLoading();
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      setProducts(
        data
          ? Object.entries(data)
              .map(([firebaseId, value]) => ({
                firebaseId,
                ...(value as Omit<Product, "firebaseId">),
              }))
              .filter((product) => product.deleted !== true)
          : []
      );

      loadedProducts = true;
      checkLoading();
    });

    const unsubSubscribers = onValue(ref(database, "subscribers"), (snapshot) => {
      const data = snapshot.val();

      setSubscribers(
        data
          ? Object.entries(data)
              .map(([id, value]) => ({
                id,
                ...(value as Omit<Subscriber, "id">),
              }))
              .filter((subscriber) => subscriber.deleted !== true)
              .sort(
                (a: Subscriber, b: Subscriber) =>
                  Number(b.createdAt || 0) - Number(a.createdAt || 0)
              )
          : []
      );

      loadedSubscribers = true;
      checkLoading();
    });

    const unsubUsers = onValue(ref(database, "users"), (snapshot) => {
      const data = snapshot.val();

      setUsers(
        data
          ? Object.entries(data)
              .map(([uid, value]) => ({
                uid,
                ...(value as Omit<UserProfile, "uid">),
              }))
              .sort(
                (a: UserProfile, b: UserProfile) =>
                  Number(b.createdAt || 0) - Number(a.createdAt || 0)
              )
          : []
      );

      loadedUsers = true;
      checkLoading();
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

      if (status === "pending" && order.adminNotificationDeleted !== true) {
        items.push({
          id: `order-${order.id}`,
          rawId: order.id,
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
      if (
        review.approved === false &&
        review.adminNotificationDeleted !== true
      ) {
        items.push({
          id: `review-${review.id}`,
          rawId: review.id,
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
      if (product.adminNotificationDeleted === true) return;

      const stock = Number(product.stock || 0);
      const limit = Number(product.lowStockLimit || 5);

      if (stock <= 0) {
        items.push({
          id: `stock-out-${product.firebaseId}`,
          rawId: product.firebaseId,
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
          rawId: product.firebaseId,
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

      if (isRecent && subscriber.adminNotificationDeleted !== true) {
        items.push({
          id: `subscriber-${subscriber.id}`,
          rawId: subscriber.id,
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

      if (isRecent && user.adminNotificationDeleted !== true) {
        items.push({
          id: `customer-${user.uid}`,
          rawId: user.uid,
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

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((item) => item.type === filter);
  }, [filter, notifications]);

  const notificationStats = useMemo(() => {
    return {
      all: notifications.length,
      order: notifications.filter((item) => item.type === "order").length,
      review: notifications.filter((item) => item.type === "review").length,
      stock: notifications.filter((item) => item.type === "stock").length,
      subscriber: notifications.filter((item) => item.type === "subscriber")
        .length,
      customer: notifications.filter((item) => item.type === "customer").length,
    };
  }, [notifications]);

  const markOrderProcessing = async (orderId: string) => {
    await updateOrderStatusWithStock(orderId, "processing");
  };

  const deleteNotification = async (item: NotificationItem) => {
    const confirmDelete = confirm(`Delete "${item.title}" notification?`);
    if (!confirmDelete) return;

    try {
      setDeletingId(item.id);

      if (item.type === "order") {
        await update(ref(database, `orders/${item.rawId}`), {
          adminNotificationDeleted: true,
          adminNotificationDeletedAt: Date.now(),
        });
      }

      if (item.type === "review") {
        await update(ref(database, `reviews/${item.rawId}`), {
          adminNotificationDeleted: true,
          adminNotificationDeletedAt: Date.now(),
        });
      }

      if (item.type === "stock") {
        await update(ref(database, `products/${item.rawId}`), {
          adminNotificationDeleted: true,
          adminNotificationDeletedAt: Date.now(),
        });
      }

      if (item.type === "subscriber") {
        await update(ref(database, `subscribers/${item.rawId}`), {
          adminNotificationDeleted: true,
          adminNotificationDeletedAt: Date.now(),
        });
      }

      if (item.type === "customer") {
        await update(ref(database, `users/${item.rawId}`), {
          adminNotificationDeleted: true,
          adminNotificationDeletedAt: Date.now(),
        });
      }
    } finally {
      setDeletingId("");
    }
  };

  const typeIcon = (type: NotificationType) => {
    if (type === "order") return ShoppingBag;
    if (type === "review") return Star;
    if (type === "stock") return AlertTriangle;
    if (type === "subscriber") return Mail;
    return Users;
  };

  const priorityClassName = (priority: NotificationItem["priority"]) => {
    if (priority === "high") return "bg-red-50 text-red-700";
    if (priority === "medium") return "bg-yellow-50 text-yellow-700";
    return "bg-green-50 text-green-700";
  };

  const filterCards: {
    value: NotificationFilter;
    label: string;
    count: number;
    icon: typeof Bell;
  }[] = [
    {
      value: "all",
      label: "All Alerts",
      count: notificationStats.all,
      icon: Bell,
    },
    {
      value: "order",
      label: "Orders",
      count: notificationStats.order,
      icon: ShoppingBag,
    },
    {
      value: "review",
      label: "Reviews",
      count: notificationStats.review,
      icon: MessageSquare,
    },
    {
      value: "stock",
      label: "Stock",
      count: notificationStats.stock,
      icon: Package,
    },
    {
      value: "subscriber",
      label: "Subscribers",
      count: notificationStats.subscriber,
      icon: Mail,
    },
    {
      value: "customer",
      label: "Customers",
      count: notificationStats.customer,
      icon: Users,
    },
  ];

  return (
    <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#102015] sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-2 text-sm font-medium text-[#4f5f49]">
              Realtime alerts for orders, reviews, stock, subscribers and
              customers.
            </p>
          </div>

          <div className="rounded-[6px] bg-[#f5f1e8] px-5 py-3 text-sm font-bold text-[#0b3d2e]">
            {notifications.length} Active Alerts
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {filterCards.map((item) => {
          const Icon = item.icon;
          const isActive = filter === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-[6px] border p-5 text-left shadow-[0_8px_24px_rgba(11,61,46,0.06)] transition ${
                isActive
                  ? "border-[#0b3d2e]/25 bg-[#f5f1e8]"
                  : "border-[#0b3d2e]/10 bg-white hover:bg-[#f5f1e8]"
              }`}
            >
              <Icon className="text-[#556B2F]" size={28} />
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                {item.label}
              </p>
              <h2 className="mt-2 text-4xl font-black text-[#102015]">
                {item.count}
              </h2>
            </button>
          );
        })}
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
        {loading ? (
          <div className="py-14 text-center font-bold text-[#4f5f49]">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-14 text-center font-bold text-[#4f5f49]">
            <CheckCircle2 className="mx-auto mb-4 text-[#556B2F]" size={44} />
            No active notifications.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNotifications.map((item) => {
              const Icon = typeIcon(item.type);

              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] bg-[#f5f1e8] p-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] ${priorityClassName(
                        item.priority
                      )}`}
                    >
                      <Icon size={22} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-[#102015]">
                          {item.title}
                        </h3>

                        <span
                          className={`rounded-[6px] px-3 py-1 text-xs font-bold capitalize ${priorityClassName(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-medium text-[#263421]">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                        {dateText(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={item.href}
                      className="rounded-[6px] bg-[#003f2a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#062A18]"
                    >
                      View
                    </Link>

                    {item.type === "order" && (
                      <button
                        type="button"
                        onClick={() => markOrderProcessing(item.rawId)}
                        className="rounded-[6px] bg-green-50 px-4 py-3 text-sm font-bold text-green-700 transition hover:bg-green-100"
                      >
                        Process
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => deleteNotification(item)}
                      className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      aria-label="Delete notification"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}