"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onValue, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { auth, database } from "@/firebase/config";
import { isAdminUser } from "@/lib/admin";

import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  Download,
  Eye,
  Package,
  ShoppingBag,
  Star,
  Truck,
  Users,
  Clock,
} from "lucide-react";

type ReportType = "daily" | "monthly" | "yearly" | "lifetime";

type Order = {
  id: string;
  orderNumber?: string;
  customer?: { name?: string; email?: string };
  shippingAddress?: { fullName?: string; phone?: string };
  payment?: { method?: string; status?: string };
  status?: string;
  total?: number;
  createdAt?: number;
  items?: {
    id?: number;
    name?: string;
    image?: string;
    price?: number;
    quantity?: number;
    category?: string;
  }[];
};

type Product = {
  id: string;
  name?: string;
  image?: string;
  price?: number;
  stock?: number;
  lowStockLimit?: number;
  category?: string;
  deleted?: boolean;
  active?: boolean;
};

type Review = {
  id: string;
  rating?: number;
  approved?: boolean;
  deleted?: boolean;
  productName?: string;
  customerName?: string;
  createdAt?: number;
};

type Brand = {
  id: string;
  deleted?: boolean;
  active?: boolean;
};

type UserItem = {
  id: string;
  name?: string;
  email?: string;
  createdAt?: number;
};

function money(value: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;
}

function pdfMoney(value: number) {
  return `BDT ${new Intl.NumberFormat("en-BD").format(value || 0)}`;
}

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>("monthly");

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
    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      const loaded: Order[] = data
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...(value as Omit<Order, "id">) }))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        : [];

      setOrders(loaded);
      setLoading(false);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      const loaded: Product[] = data
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...(value as Omit<Product, "id">) }))
            .filter((product) => product.deleted !== true)
        : [];

      setProducts(loaded);
    });

    const unsubReviews = onValue(ref(database, "reviews"), (snapshot) => {
      const data = snapshot.val();

      const loaded: Review[] = data
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...(value as Omit<Review, "id">) }))
            .filter((review) => review.deleted !== true)
        : [];

      setReviews(loaded);
    });

    const unsubBrands = onValue(ref(database, "brands"), (snapshot) => {
      const data = snapshot.val();

      const loaded: Brand[] = data
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...(value as Omit<Brand, "id">) }))
            .filter((brand) => brand.deleted !== true)
        : [];

      setBrands(loaded);
    });

    const unsubUsers = onValue(ref(database, "users"), (snapshot) => {
      const data = snapshot.val();

      const loaded: UserItem[] = data
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...(value as Omit<UserItem, "id">) }))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        : [];

      setUsers(loaded);
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubReviews();
      unsubBrands();
      unsubUsers();
    };
  }, []);

  const totalRevenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const totalOrders = orders.length;
  const totalCustomers = users.length;

  const pendingOrders = orders.filter(
    (order) => (order.status || "pending") === "pending"
  ).length;

  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const processingOrders = orders.filter((order) => order.status === "processing").length;
  const shippedOrders = orders.filter((order) => order.status === "shipped").length;
  const cancelledOrders = orders.filter((order) => order.status === "cancelled").length;

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

  const recentOrders = orders.slice(0, 5);
  const newCustomers = users.slice(0, 4);

  const lowStockProducts = products
    .filter((product) => {
      const stock = Number(product.stock || 0);
      const limit = Number(product.lowStockLimit || 5);
      return stock > 0 && stock <= limit;
    })
    .slice(0, 6);

  const outOfStockProducts = products
    .filter((product) => Number(product.stock || 0) <= 0)
    .slice(0, 6);

  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; image: string; sold: number; revenue: number }
    >();

    orders.forEach((order) => {
      if (order.status === "cancelled") return;

      order.items?.forEach((item) => {
        const key = String(item.id || item.name || "unknown");
        const old = map.get(key);

        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);

        map.set(key, {
          name: item.name || "Unnamed Product",
          image: safeImage(item.image),
          sold: (old?.sold || 0) + quantity,
          revenue: (old?.revenue || 0) + price * quantity,
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [orders]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();

    products.forEach((product) => {
      const category = product.category || "Other";
      map.set(category, (map.get(category) || 0) + 1);
    });

    return Array.from(map.entries()).slice(0, 5);
  }, [products]);

  const dailyBars = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));

      const key = date.toDateString();

      const count = orders.filter((order) => {
        if (!order.createdAt) return false;
        return new Date(order.createdAt).toDateString() === key;
      }).length;

      const revenue = orders
        .filter((order) => {
          if (!order.createdAt || order.status === "cancelled") return false;
          return new Date(order.createdAt).toDateString() === key;
        })
        .reduce((sum, order) => sum + Number(order.total || 0), 0);

      return {
        label: date.toLocaleDateString("en-US", { day: "2-digit" }),
        count,
        revenue,
      };
    });
  }, [orders]);

  const maxDaily = Math.max(...dailyBars.map((item) => item.count), 1);

  const getReportOrders = () => {
    const now = new Date();

    return orders.filter((order) => {
      if (!order.createdAt) return false;
      const date = new Date(order.createdAt);

      if (reportType === "daily") {
        return date.toDateString() === now.toDateString();
      }

      if (reportType === "monthly") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      if (reportType === "yearly") {
        return date.getFullYear() === now.getFullYear();
      }

      return true;
    });
  };

  const handleDownloadPDF = () => {
    const reportOrders = getReportOrders();

    const revenue = reportOrders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    const pending = reportOrders.filter(
      (order) => (order.status || "pending") === "pending"
    ).length;

    const delivered = reportOrders.filter(
      (order) => order.status === "delivered"
    ).length;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("ZAYY Care Admin Report", 14, 18);

    doc.setFontSize(10);
    doc.text(`Report Type: ${reportType.toUpperCase()}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    autoTable(doc, {
      startY: 44,
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", pdfMoney(revenue)],
        ["Total Orders", String(reportOrders.length)],
        ["Pending Orders", String(pending)],
        ["Delivered Orders", String(delivered)],
        ["Total Products", String(products.length)],
        ["Total Customers", String(users.length)],
        ["Total Reviews", String(reviews.length)],
        ["Average Rating", `${averageRating}/5`],
        ["Low Stock Products", String(lowStockProducts.length)],
        ["Out Of Stock Products", String(outOfStockProducts.length)],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [["Product", "Sold", "Revenue"]],
      body: topProducts.map((product) => [
        product.name,
        String(product.sold),
        pdfMoney(product.revenue),
      ]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [["Order ID", "Customer", "Date", "Amount", "Status"]],
      body: reportOrders.slice(0, 30).map((order) => [
        order.orderNumber || order.id.slice(0, 8),
        order.shippingAddress?.fullName || order.customer?.name || "Customer",
        dateText(order.createdAt),
        pdfMoney(Number(order.total || 0)),
        order.status || "pending",
      ]),
    });

    doc.save(`zayy-care-${reportType}-report.pdf`);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Welcome back, Admin! Here&apos;s what&apos;s happening with your
            store.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="h-11 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 text-sm font-black text-[#0b3d2e] outline-none"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex h-11 items-center gap-2 rounded-[6px] bg-[#0b3d2e] px-5 text-sm font-black uppercase text-white"
          >
            <Download size={16} />
            Download PDF
          </button>

          <div className="flex h-11 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 text-sm font-black text-[#0b3d2e]">
            <CalendarDays size={16} />
            Realtime
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={loading ? "..." : money(totalRevenue)}
          icon={BadgeDollarSign}
          trend="+ live"
          accent="green"
        />

        <StatCard
          title="Total Orders"
          value={loading ? "..." : totalOrders}
          icon={ShoppingBag}
          trend={`${deliveredOrders} delivered`}
          accent="blue"
        />

        <StatCard
          title="Total Customers"
          value={loading ? "..." : totalCustomers}
          icon={Users}
          trend="Realtime users"
          accent="mint"
        />

        <StatCard
          title="Pending Orders"
          value={loading ? "..." : pendingOrders}
          icon={Clock}
          trend="Need action"
          accent="orange"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card title="Sales Overview" rightText="Last 7 Days">
          <div className="mt-6 h-[260px] rounded-[6px] bg-[#fafaf7] p-5">
            <div className="flex h-full items-end gap-4">
              {dailyBars.map((item) => {
                const height = Math.max(8, (item.count / maxDaily) * 100);

                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center">
                    <div
                      className="w-full rounded-t-[6px] bg-[#0b3d2e]"
                      style={{ height: `${height}%` }}
                    />
                    <span className="mt-3 text-xs font-bold text-[#4f5f49]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card title="Order Overview" rightText="Status">
          <div className="mt-6 space-y-4">
            <ProgressRow label="Pending" value={pendingOrders} total={totalOrders} />
            <ProgressRow
              label="Processing"
              value={processingOrders}
              total={totalOrders}
            />
            <ProgressRow label="Shipped" value={shippedOrders} total={totalOrders} />
            <ProgressRow
              label="Delivered"
              value={deliveredOrders}
              total={totalOrders}
            />
            <ProgressRow
              label="Cancelled"
              value={cancelledOrders}
              total={totalOrders}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card
          title="Recent Orders"
          right={
            <Link href="/admin/orders" className="text-xs font-black text-[#0b3d2e]">
              View All Orders
            </Link>
          }
        >
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#4f5f49]">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#0b3d2e]/10">
                      <td className="py-4 font-black text-[#102015]">
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </td>

                      <td className="font-bold text-[#263421]">
                        {order.shippingAddress?.fullName ||
                          order.customer?.name ||
                          "Customer"}
                      </td>

                      <td className="text-[#4f5f49]">{dateText(order.createdAt)}</td>

                      <td className="font-black text-[#0b3d2e]">
                        {money(Number(order.total || 0))}
                      </td>

                      <td>
                        <span
                          className={`rounded-[6px] px-3 py-1 text-xs font-black capitalize ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status || "pending"}
                        </span>
                      </td>

                      <td className="text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Top Selling Products"
          right={
            <Link href="/admin/products" className="text-xs font-black text-[#0b3d2e]">
              View All Products
            </Link>
          }
        >
          <div className="mt-5 space-y-4">
            {topProducts.length === 0 ? (
              <p className="rounded-[6px] bg-[#fafaf7] p-5 text-sm text-[#4f5f49]">
                No product sales yet.
              </p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f1e8]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain p-1.5"
                    />
                  </div>

                  <div>
                    <p className="line-clamp-1 text-sm font-black text-[#102015]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#4f5f49]">Sold: {product.sold}</p>
                  </div>

                  <p className="text-sm font-black text-[#0b3d2e]">
                    {money(product.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[.9fr_.9fr_.8fr]">
        <Card title="Sales by Category">
          <div className="mt-5 space-y-3">
            {categoryData.length === 0 ? (
              <p className="text-sm text-[#4f5f49]">No category data.</p>
            ) : (
              categoryData.map(([category, count]) => (
                <ProgressRow
                  key={category}
                  label={category}
                  value={count}
                  total={Math.max(products.length, 1)}
                />
              ))
            )}
          </div>
        </Card>

        <Card
          title="New Customers"
          right={
            <Link href="/admin/customers" className="text-xs font-black text-[#0b3d2e]">
              View All
            </Link>
          }
        >
          <div className="mt-5 space-y-4">
            {newCustomers.length === 0 ? (
              <p className="text-sm text-[#4f5f49]">No customers found.</p>
            ) : (
              newCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="grid grid-cols-[38px_1fr] items-center gap-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b3d2e] text-xs font-black text-white">
                    {(customer.name || "ZA").slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <p className="font-black text-[#102015]">
                      {customer.name || "ZAYY User"}
                    </p>
                    <p className="text-xs text-[#4f5f49]">
                      {customer.email || "No email"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Store Statistics">
          <div className="mt-5 space-y-4">
            <StatLine icon={Package} label="Total Products" value={products.length} />
            <StatLine icon={Users} label="Total Customers" value={totalCustomers} />
            <StatLine icon={BarChart3} label="Total Brands" value={brands.length} />
            <StatLine icon={Star} label="Total Reviews" value={reviews.length} />
            <StatLine icon={Truck} label="Average Rating" value={`${averageRating}/5`} />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Low Stock Warning" rightText={`${lowStockProducts.length} Items`}>
          <AlertList
            emptyText="No low stock products."
            items={lowStockProducts.map((product) => ({
              title: product.name || "Unnamed Product",
              text: `Stock: ${Number(product.stock || 0)}`,
              href: "/admin/inventory",
            }))}
          />
        </Card>

        <Card
          title="Out Of Stock"
          rightText={`${outOfStockProducts.length} Items`}
        >
          <AlertList
            emptyText="No out of stock products."
            items={outOfStockProducts.map((product) => ({
              title: product.name || "Unnamed Product",
              text: "Stock: 0",
              href: "/admin/inventory",
            }))}
          />
        </Card>

        <Card title="Pending Reviews" rightText={`${pendingReviews.length} Reviews`}>
          <AlertList
            emptyText="No pending reviews."
            items={pendingReviews.slice(0, 6).map((review) => ({
              title: review.productName || "Product review",
              text: review.customerName || dateText(review.createdAt),
              href: "/admin/reviews",
            }))}
          />
        </Card>
      </section>
    </div>
  );
}

function Card({
  title,
  rightText,
  right,
  children,
}: {
  title: string;
  rightText?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-[#102015]">{title}</h2>

        {right ||
          (rightText && (
            <span className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-3 py-2 text-xs font-black text-[#0b3d2e]">
              {rightText}
            </span>
          ))}
      </div>

      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  accent,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  accent: "green" | "blue" | "mint" | "orange";
}) {
  const color =
    accent === "orange"
      ? "bg-orange-50 text-orange-600"
      : accent === "blue"
      ? "bg-blue-50 text-blue-600"
      : accent === "mint"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-green-50 text-green-600";

  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#4f5f49]">{title}</p>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[6px] ${color}`}
        >
          <Icon size={20} />
        </div>
      </div>

      <h2 className="mt-3 text-3xl font-black text-[#102015]">{value}</h2>

      <p className="mt-3 flex items-center gap-1 text-xs font-black text-green-600">
        <ArrowUpRight size={13} />
        {trend}
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent =
    total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-bold text-[#263421]">{label}</span>
        <span className="font-black text-[#0b3d2e]">{value}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#f5f1e8]">
        <div
          className="h-full rounded-full bg-[#0b3d2e]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatLine({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-3 text-sm font-bold text-[#4f5f49]">
        <Icon size={17} className="text-[#0b3d2e]" />
        {label}
      </span>

      <b className="text-[#102015]">{value}</b>
    </div>
  );
}

function AlertList({
  items,
  emptyText,
}: {
  items: { title: string; text: string; href: string }[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <p className="mt-5 rounded-[6px] bg-[#fafaf7] p-5 text-sm text-[#4f5f49]">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {items.map((item, index) => (
        <Link
          key={`${item.title}-${index}`}
          href={item.href}
          className="flex items-center gap-3 rounded-[6px] bg-[#fafaf7] p-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-orange-100 text-orange-600">
            <AlertTriangle size={16} />
          </div>

          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-black text-[#102015]">
              {item.title}
            </p>
            <p className="text-xs text-[#4f5f49]">{item.text}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}