"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";

import {
  ShoppingBag,
  Package,
  Users,
  Clock,
  Eye,
  Plus,
  ImageIcon,
  BadgePercent,
  BarChart3,
  Star,
  Truck,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  TicketPercent,
  Bell,
  FileText,
} from "lucide-react";

type Order = {
  id: string;
  customer?: { name?: string; email?: string };
  shippingAddress?: { fullName?: string; phone?: string };
  payment?: { method?: string; status?: string };
  status?: string;
  total?: number;
  createdAt?: number;
};

type Product = {
  id: string;
  name?: string;
  price?: number;
  stock?: number;
  bestSeller?: boolean;
  featured?: boolean;
};

type Review = {
  id: string;
  rating?: number;
  approved?: boolean;
};

type Coupon = {
  id: string;
  code?: string;
  active?: boolean;
};

const quickActions = [
  { title: "Add Product", href: "/admin/products", icon: Plus },
  { title: "Add Banner", href: "/admin/banners", icon: ImageIcon },
  { title: "Create Coupon", href: "/admin/coupons", icon: BadgePercent },
  { title: "View Orders", href: "/admin/orders", icon: ShoppingBag },
  { title: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Inventory", href: "/admin/inventory", icon: Package },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Subscribers", href: "/admin/subscribers", icon: Users },
  { title: "Blog", href: "/admin/blog", icon: FileText },
];

function money(value: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;
}

function statusClass(status?: string) {
  if (status === "delivered") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "shipped") return "bg-purple-100 text-purple-700";
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  return "bg-yellow-100 text-yellow-700";
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      const formatted = data
        ? Object.entries(data)
            .map(([id, value]: any) => ({ id, ...value }))
            .sort(
              (a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0)
            )
        : [];

      setOrders(formatted);
      setLoading(false);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      setProducts(
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

    const unsubCoupons = onValue(ref(database, "coupons"), (snapshot) => {
      const data = snapshot.val();

      setCoupons(
        data
          ? Object.entries(data).map(([id, value]: any) => ({
              id,
              ...value,
            }))
          : []
      );
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubReviews();
      unsubCoupons();
    };
  }, []);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => (order.status || "pending") === "pending"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "processing"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "cancelled"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const uniqueCustomers = useMemo(() => {
    const set = new Set(
      orders.map((order) => order.customer?.email || order.shippingAddress?.phone)
    );

    return Array.from(set).filter(Boolean).length;
  }, [orders]);

  const approvedReviews = reviews.filter((review) => review.approved !== false);
  const pendingReviews = reviews.filter((review) => review.approved === false);

  const averageRating =
    approvedReviews.length > 0
      ? (
          approvedReviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
          ) / approvedReviews.length
        ).toFixed(1)
      : "0.0";

  const activeCoupons = coupons.filter((coupon) => coupon.active).length;

  const recentOrders = orders.slice(0, 5);

  const featuredProducts = products
    .filter((product) => product.featured || product.bestSeller)
    .slice(0, 5);

  const stats = [
    {
      title: "Total Revenue",
      value: money(totalRevenue),
      icon: ShoppingBag,
      text: "All non-cancelled orders",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: Package,
      text: "Realtime Firebase orders",
    },
    {
      title: "Customers",
      value: uniqueCustomers,
      icon: Users,
      text: "Unique email / phone",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
      text: "Need confirmation",
    },
    {
      title: "Total Products",
      value: products.length,
      icon: Star,
      text: "Products in admin panel",
    },
    {
      title: "Reviews",
      value: reviews.length,
      icon: MessageSquare,
      text: `${pendingReviews.length} pending`,
    },
    {
      title: "Average Rating",
      value: averageRating,
      icon: CheckCircle2,
      text: "Approved reviews only",
    },
    {
      title: "Active Coupons",
      value: activeCoupons,
      icon: TicketPercent,
      text: `${coupons.length} total coupons`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/45 text-[#556B2F]">
                  <Icon size={26} />
                </div>

                <span className="rounded-full bg-[#556B2F]/10 px-3 py-1 text-xs font-bold text-[#556B2F]">
                  Live
                </span>
              </div>

              <p className="mt-6 text-sm text-gray-600">{item.title}</p>

              <h2 className="mt-2 text-3xl font-black text-[#172313]">
                {loading ? "..." : item.value}
              </h2>

              <p className="mt-2 text-xs text-gray-500">{item.text}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#172313]">
              Order Analytics
            </h2>

            <span className="rounded-full bg-white/45 px-4 py-2 text-sm font-bold text-[#556B2F]">
              Realtime
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/35 p-5">
              <CheckCircle2 className="text-green-600" />
              <p className="mt-3 text-sm text-gray-600">Delivered</p>
              <h3 className="text-3xl font-black text-[#172313]">
                {deliveredOrders}
              </h3>
            </div>

            <div className="rounded-[24px] bg-white/35 p-5">
              <RefreshCcw className="text-blue-600" />
              <p className="mt-3 text-sm text-gray-600">Processing</p>
              <h3 className="text-3xl font-black text-[#172313]">
                {processingOrders}
              </h3>
            </div>

            <div className="rounded-[24px] bg-white/35 p-5">
              <XCircle className="text-red-600" />
              <p className="mt-3 text-sm text-gray-600">Cancelled</p>
              <h3 className="text-3xl font-black text-[#172313]">
                {cancelledOrders}
              </h3>
            </div>
          </div>

          <div className="mt-8 h-[260px] rounded-[26px] bg-white/25 p-5">
            <div className="flex h-full items-end gap-4">
              {[
                pendingOrders || 1,
                processingOrders || 1,
                deliveredOrders || 1,
                cancelledOrders || 1,
                totalOrders || 1,
              ].map((value, index) => {
                const max = Math.max(totalOrders, 1);
                const height = Math.max(18, (value / max) * 100);

                return (
                  <div key={index} className="flex flex-1 flex-col items-center">
                    <div
                      className="w-full rounded-t-2xl bg-[#556B2F]/70 shadow-[0_15px_35px_rgba(85,107,47,0.18)]"
                      style={{ height: `${height}%` }}
                    />

                    <span className="mt-3 text-xs text-gray-500">
                      {
                        ["Pending", "Processing", "Delivered", "Cancelled", "All"][
                          index
                        ]
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <h2 className="text-xl font-bold text-[#172313]">Order Status</h2>

          <div className="mt-8 flex items-center justify-center">
            <div className="flex h-[210px] w-[210px] items-center justify-center rounded-full border-[28px] border-[#556B2F] bg-white/45 shadow-[0_20px_50px_rgba(31,43,20,0.12)]">
              <div className="text-center">
                <p className="text-3xl font-black text-[#172313]">
                  {totalOrders}
                </p>

                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {[
              ["Pending", pendingOrders],
              ["Processing", processingOrders],
              ["Delivered", deliveredOrders],
              ["Cancelled", cancelledOrders],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600">{label}</span>
                <span className="font-bold text-[#556B2F]">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#172313]">Recent Orders</h2>

            <Link
              href="/admin/orders"
              className="text-sm font-bold text-[#556B2F]"
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-2xl bg-white/35 p-8 text-center text-gray-600">
              No recent orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-gray-500">
                    <th className="py-3">Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-black/5">
                      <td className="py-4 font-semibold">
                        {order.id.slice(0, 10)}...
                      </td>

                      <td>
                        {order.shippingAddress?.fullName ||
                          order.customer?.name ||
                          "Customer"}
                      </td>

                      <td className="font-bold text-[#556B2F]">
                        {money(order.total || 0)}
                      </td>

                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status || "pending"}
                        </span>
                      </td>

                      <td className="capitalize">
                        {order.payment?.method || "N/A"}
                      </td>

                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/45"
                        >
                          <Eye size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#172313]">
                Featured Products
              </h2>

              <Link
                href="/admin/products"
                className="text-sm font-bold text-[#556B2F]"
              >
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {featuredProducts.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No featured or best seller products yet.
                </p>
              ) : (
                featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl bg-white/35 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-[#172313]">
                        {product.name || "Unnamed Product"}
                      </p>

                      <p className="text-xs text-gray-500">
                        Stock: {product.stock || 0}
                      </p>
                    </div>

                    <p className="font-bold text-[#556B2F]">
                      {money(product.price || 0)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-5 text-xl font-bold text-[#172313]">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="rounded-[22px] bg-white/35 p-5 text-center transition hover:-translate-y-1 hover:bg-white/50"
                  >
                    <Icon className="mx-auto text-[#556B2F]" size={28} />

                    <p className="mt-3 text-sm font-bold text-[#172313]">
                      {action.title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/45 text-[#556B2F]">
                <Truck size={26} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Active Coupons</p>

                <h2 className="text-3xl font-black text-[#172313]">
                  {activeCoupons}
                </h2>

                <p className="mt-1 text-xs text-[#556B2F]">
                  {coupons.length} total coupons
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}