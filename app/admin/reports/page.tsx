"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";
import {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

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
  name?: string;
  brand?: string;
  category?: string;
  price?: number;
  stock?: number;
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

  useEffect(() => {
    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]: any) => ({ id, ...value }))
        .sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));

      setOrders(loaded);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        return;
      }

      const loaded = Object.entries(data).map(([id, value]: any) => ({
        id,
        ...value,
      }));

      setProducts(loaded);
    });

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const validOrders = orders.filter((order) => order.status !== "cancelled");

  const totalRevenue = validOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const pendingOrders = orders.filter((order) => (order.status || "pending") === "pending").length;

  const totalDiscount = validOrders.reduce(
    (sum, order) => sum + Number(order.discountAmount || 0),
    0
  );

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
    const map = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();

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

  const salesByDay = useMemo(() => {
    const map = new Map<string, number>();

    validOrders.forEach((order) => {
      const key = dateKey(order.createdAt);
      map.set(key, (map.get(key) || 0) + Number(order.total || 0));
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .slice(0, 7)
      .reverse();
  }, [validOrders]);

  const lowStockProducts = products
    .filter((product) => Number(product.stock || 0) <= 5)
    .slice(0, 8);

  const maxSales = Math.max(...salesByDay.map((item) => item.value), 1);

  const stats = [
    {
      title: "Total Revenue",
      value: money(totalRevenue),
      icon: Wallet,
      note: "Non-cancelled orders",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      note: `${pendingOrders} pending`,
    },
    {
      title: "Delivered Orders",
      value: deliveredOrders,
      icon: Package,
      note: "Completed sales",
    },
    {
      title: "Customers",
      value: uniqueCustomers,
      icon: Users,
      note: "Unique email / phone",
    },
    {
      title: "Average Order",
      value: money(averageOrderValue),
      icon: TrendingUp,
      note: "AOV",
    },
    {
      title: "Discount Given",
      value: money(totalDiscount),
      icon: BarChart3,
      note: "Coupons / discounts",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h1 className="text-4xl font-bold text-[#172313]">Reports</h1>
        <p className="mt-2 text-gray-600">
          Realtime sales, revenue, product and stock reports.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/45 text-[#556B2F]">
                <Icon size={27} />
              </div>

              <p className="mt-5 text-sm text-gray-600">{item.title}</p>

              <h2 className="mt-2 text-3xl font-black text-[#172313]">
                {item.value}
              </h2>

              <p className="mt-2 text-xs text-gray-500">{item.note}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <h2 className="text-xl font-bold text-[#172313]">
            Sales by Recent Days
          </h2>

          <div className="mt-8 flex h-[280px] items-end gap-4 rounded-[26px] bg-white/25 p-5">
            {salesByDay.length === 0 ? (
              <p className="text-gray-600">No sales data yet.</p>
            ) : (
              salesByDay.map((item) => {
                const height = Math.max(18, (item.value / maxSales) * 100);

                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center">
                    <div className="mb-3 text-xs font-bold text-[#556B2F]">
                      {money(item.value)}
                    </div>

                    <div
                      className="w-full rounded-t-2xl bg-[#556B2F]/75 shadow-[0_15px_35px_rgba(85,107,47,0.18)]"
                      style={{ height: `${height}%` }}
                    />

                    <span className="mt-3 text-xs text-gray-500">
                      {item.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <h2 className="text-xl font-bold text-[#172313]">
            Stock Alert
          </h2>

          <div className="mt-6 space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="rounded-2xl bg-white/35 p-5 text-gray-600">
                No low stock products.
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl bg-white/35 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-[#172313]">
                      {product.name || "Unnamed Product"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.brand || "No brand"} • {product.category || "No category"}
                    </p>
                  </div>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    {product.stock || 0} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h2 className="mb-5 text-xl font-bold text-[#172313]">
          Top Selling Products
        </h2>

        {topProducts.length === 0 ? (
          <div className="rounded-2xl bg-white/35 p-8 text-center text-gray-600">
            No product sales yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-black/10 text-gray-500">
                  <th className="pb-4">Product</th>
                  <th className="pb-4">Sold Qty</th>
                  <th className="pb-4">Revenue</th>
                </tr>
              </thead>

              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.name} className="border-b border-black/5">
                    <td className="py-5 font-semibold text-[#172313]">
                      {product.name}
                    </td>
                    <td className="font-bold">{product.qty}</td>
                    <td className="font-bold text-[#556B2F]">
                      {money(product.revenue)}
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