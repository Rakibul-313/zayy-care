"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { database } from "@/firebase/config";

type OrderItem = {
  id?: number;
  name?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  id: string;
  customer?: { email?: string; name?: string };
  shippingAddress?: { phone?: string; city?: string; area?: string };
  payment?: { method?: string; status?: string };
  status?: string;
  total?: number;
  subtotal?: number;
  discountAmount?: number;
  shipping?: number;
  createdAt?: number;
  items?: OrderItem[];
};

type Product = {
  id: string;
  deleted?: boolean;
  name?: string;
  brand?: string;
  category?: string;
  price?: number;
  stock?: number;
};

type SalesPoint = {
  label: string;
  value: number;
  orders: number;
};

function money(value: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Math.round(value || 0))}`;
}

function dateKey(timestamp?: number) {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ordersLoaded = false;
    let productsLoaded = false;

    const checkLoading = () => {
      if (ordersLoaded && productsLoaded) {
        setLoading(false);
      }
    };

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        ordersLoaded = true;
        checkLoading();
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Order, "id">),
        }))
        .sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));

      setOrders(loaded);
      ordersLoaded = true;
      checkLoading();
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        productsLoaded = true;
        checkLoading();
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Product, "id">),
        }))
        .filter((product) => product.deleted !== true);

      setProducts(loaded);
      productsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const validOrders = useMemo(() => {
    return orders.filter((order) => order.status !== "cancelled");
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [validOrders]);

  const totalOrders = orders.length;

  const deliveredOrders = useMemo(() => {
    return orders.filter((order) => order.status === "delivered").length;
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((order) => (order.status || "pending") === "pending")
      .length;
  }, [orders]);

  const totalDiscount = useMemo(() => {
    return validOrders.reduce(
      (sum, order) => sum + Number(order.discountAmount || 0),
      0
    );
  }, [validOrders]);

  const averageOrderValue =
    validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  const uniqueCustomers = useMemo(() => {
    const set = new Set(
      orders
        .map((order) => order.customer?.email || order.shippingAddress?.phone)
        .filter(Boolean)
    );

    return set.size;
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();

    validOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = item.name || String(item.id || "Unknown Product");
        const existing = map.get(key);

        const qty = Number(item.quantity || 0);
        const revenue = Number(item.price || 0) * qty;

        if (existing) {
          existing.qty += qty;
          existing.revenue += revenue;
        } else {
          map.set(key, {
            name: key,
            qty,
            revenue,
          });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [validOrders]);

  const salesByDay = useMemo<SalesPoint[]>(() => {
    const map = new Map<string, SalesPoint>();

    validOrders.forEach((order) => {
      const key = dateKey(order.createdAt);
      const existing = map.get(key);

      if (existing) {
        existing.value += Number(order.total || 0);
        existing.orders += 1;
      } else {
        map.set(key, {
          label: key,
          value: Number(order.total || 0),
          orders: 1,
        });
      }
    });

    return Array.from(map.values()).slice(-7);
  }, [validOrders]);

  const lowStockProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          Number(product.stock || 0) <= 5 && Number(product.stock || 0) > 0
      )
      .slice(0, 8);
  }, [products]);

  const maxSales = Math.max(...salesByDay.map((item) => item.value), 1);
  const maxOrders = Math.max(...salesByDay.map((item) => item.orders), 1);

  const linePoints = useMemo(() => {
    if (salesByDay.length === 0) return "";

    return salesByDay
      .map((item, index) => {
        const x =
          salesByDay.length === 1
            ? 50
            : (index / (salesByDay.length - 1)) * 100;
        const y = 90 - (item.value / maxSales) * 70;

        return `${x},${y}`;
      })
      .join(" ");
  }, [salesByDay, maxSales]);

  const stats = [
    {
      title: "Total Sales",
      value: money(totalRevenue),
      icon: Wallet,
      note: "Non-cancelled orders",
      badge: "24.5%",
      badgeTone: "success",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      note: `${pendingOrders} pending`,
      badge: "18.2%",
      badgeTone: "success",
    },
    {
      title: "Total Customers",
      value: uniqueCustomers,
      icon: Users,
      note: "Unique email / phone",
      badge: "16.7%",
      badgeTone: "success",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Package,
      note: "Need processing",
      badge: "5.4%",
      badgeTone: "warning",
    },
  ];

  return (
    <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
        <h1 className="text-3xl font-black text-[#102015] sm:text-4xl">
          Reports
        </h1>
        <p className="mt-2 text-sm font-medium text-[#4f5f49]">
          Realtime sales, revenue, product and stock reports.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    {item.title}
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-[#102015]">
                    {item.value}
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[#4f5f49]">
                  <span
                    className={
                      item.badgeTone === "warning"
                        ? "font-black text-yellow-700"
                        : "font-black text-green-700"
                    }
                  >
                    ↑ {item.badge}
                  </span>{" "}
                  {item.note}
                </p>

                <svg viewBox="0 0 90 28" className="h-8 w-24">
                  <polyline
                    points="2,20 14,18 26,12 38,17 50,10 62,14 76,7 88,11"
                    fill="none"
                    stroke="#4a9b62"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-black text-[#102015]">Sales Overview</h2>

            <button
              type="button"
              className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-2 text-xs font-bold text-[#4f5f49]"
            >
              This Month
            </button>
          </div>

          <div className="mt-6 rounded-[6px] bg-white">
            {loading ? (
              <div className="flex h-[280px] items-center justify-center text-sm font-bold text-[#4f5f49]">
                Loading sales report...
              </div>
            ) : salesByDay.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm font-bold text-[#4f5f49]">
                No sales data yet.
              </div>
            ) : (
              <div className="relative h-[280px]">
                <div className="absolute inset-0 grid grid-rows-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="border-t border-dashed border-[#0b3d2e]/10"
                    />
                  ))}
                </div>

                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 top-4 h-[210px] w-full"
                >
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#4a9b62"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {salesByDay.map((item, index) => {
                    const x =
                      salesByDay.length === 1
                        ? 50
                        : (index / (salesByDay.length - 1)) * 100;
                    const y = 90 - (item.value / maxSales) * 70;

                    return (
                      <circle
                        key={item.label}
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill="#0b7a36"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 gap-2">
                  {salesByDay.map((item) => (
                    <div key={item.label} className="text-center">
                      <p className="text-xs font-bold text-[#4f5f49]">
                        {money(item.value)}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[#4f5f49]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-black text-[#102015]">Order Overview</h2>

            <button
              type="button"
              className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-2 text-xs font-bold text-[#4f5f49]"
            >
              This Month
            </button>
          </div>

          <div className="mt-6 rounded-[6px] bg-white">
            {loading ? (
              <div className="flex h-[280px] items-center justify-center text-sm font-bold text-[#4f5f49]">
                Loading order report...
              </div>
            ) : salesByDay.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm font-bold text-[#4f5f49]">
                No order data yet.
              </div>
            ) : (
              <div className="relative h-[280px]">
                <div className="absolute inset-0 grid grid-rows-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="border-t border-dashed border-[#0b3d2e]/10"
                    />
                  ))}
                </div>

                <div className="absolute inset-x-0 bottom-0 flex h-[245px] items-end justify-between gap-4 px-3">
                  {salesByDay.map((item) => {
                    const height = Math.max(18, (item.orders / maxOrders) * 78);

                    return (
                      <div
                        key={item.label}
                        className="flex flex-1 flex-col items-center justify-end"
                      >
                        <div
                          className="w-3 rounded-[6px] bg-[#0b3d2e] shadow-[0_8px_18px_rgba(11,61,46,0.16)]"
                          style={{ height: `${height}%` }}
                        />
                        <p className="mt-3 text-xs font-medium text-[#4f5f49]">
                          {item.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
          <h2 className="mb-5 font-black text-[#102015]">
            Top Selling Products
          </h2>

          {loading ? (
            <div className="rounded-[6px] bg-[#f5f1e8] p-8 text-center font-bold text-[#4f5f49]">
              Loading products...
            </div>
          ) : topProducts.length === 0 ? (
            <div className="rounded-[6px] bg-[#f5f1e8] p-8 text-center font-bold text-[#4f5f49]">
              No product sales yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[#0b3d2e]/10">
                    <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                      Product
                    </th>
                    <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                      Sold Qty
                    </th>
                    <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody className="text-[#263421]">
                  {topProducts.map((product) => (
                    <tr
                      key={product.name}
                      className="border-b border-[#0b3d2e]/10 last:border-b-0"
                    >
                      <td className="py-5 font-bold text-[#102015]">
                        {product.name}
                      </td>
                      <td className="py-5 font-bold text-[#263421]">
                        {product.qty}
                      </td>
                      <td className="py-5 font-bold text-[#0b3d2e]">
                        {money(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
          <h2 className="font-black text-[#102015]">Stock Alert</h2>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="rounded-[6px] bg-[#f5f1e8] p-5 text-sm font-bold text-[#4f5f49]">
                Loading stock report...
              </p>
            ) : lowStockProducts.length === 0 ? (
              <p className="rounded-[6px] bg-[#f5f1e8] p-5 text-sm font-bold text-[#4f5f49]">
                No low stock products.
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 rounded-[6px] bg-[#f5f1e8] px-4 py-3"
                >
                  <div>
                    <p className="font-bold text-[#102015]">
                      {product.name || "Unnamed Product"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#4f5f49]">
                      {product.brand || "No brand"} •{" "}
                      {product.category || "No category"}
                    </p>
                  </div>

                  <span className="rounded-[6px] bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    {product.stock || 0} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <BarChart3 className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Discount Given
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {money(totalDiscount)}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <TrendingUp className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Average Order Value
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {money(averageOrderValue)}
          </h2>
        </div>
      </section>
    </main>
  );
}