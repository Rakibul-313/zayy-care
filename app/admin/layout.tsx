"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth, database } from "@/firebase/config";
import { isAdminUser } from "@/lib/admin";

import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Tags,
  BadgePercent,
  Star,
  ImageIcon,
  FileText,
  Settings,
  Search,
  Bell,
  MessageSquare,
  Menu,
  ChevronDown,
  BarChart3,
  ShieldCheck,
  LogOut,
  Boxes,
  Mail,
} from "lucide-react";

const adminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Brands", href: "/admin/brands", icon: Tags },
  { name: "Coupons", href: "/admin/coupons", icon: BadgePercent },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Banners", href: "/admin/banners", icon: ImageIcon },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Subscribers", href: "/admin/subscribers", icon: Mail },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "General Settings", href: "/admin/settings/general", icon: Settings },
  { name: "Payment Settings", href: "/admin/settings", icon: Settings },
  { name: "Access", href: "/admin/access", icon: ShieldCheck },
];

type Order = {
  customer?: { email?: string };
  shippingAddress?: { phone?: string };
  status?: string;
  total?: number;
};

type AdminProfile = {
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [uid, setUid] = useState("");
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [customerCountFromUsers, setCustomerCountFromUsers] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const allowed = await isAdminUser(user.uid);

      if (!allowed) {
        router.push("/");
        return;
      }

      setUid(user.uid);
      setCheckingAccess(false);
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (checkingAccess || !uid) return;

    const unsubAdmin = onValue(ref(database, `admins/${uid}`), (snapshot) => {
      const data = snapshot.val();

      if (!data || data.active === false) {
        router.push("/");
        return;
      }

      setAdminProfile(data);
    });

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();
      setOrders(data ? Object.values(data) : []);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProductCount(0);
        setLowStockCount(0);
        return;
      }

      const products = Object.values(data) as any[];

      setProductCount(products.length);

      setLowStockCount(
        products.filter((product) => {
          const stock = Number(product.stock || 0);
          const limit = Number(product.lowStockLimit || 5);
          return stock <= limit;
        }).length
      );
    });

    const unsubUsers = onValue(ref(database, "users"), (snapshot) => {
      const data = snapshot.val();
      setCustomerCountFromUsers(data ? Object.keys(data).length : 0);
    });

    const unsubMessages = onValue(ref(database, "messages"), (snapshot) => {
      const data = snapshot.val();
      setMessageCount(data ? Object.keys(data).length : 0);
    });

    const unsubSubscribers = onValue(ref(database, "subscribers"), (snapshot) => {
      const data = snapshot.val();
      setSubscriberCount(data ? Object.keys(data).length : 0);
    });

    const unsubReviews = onValue(ref(database, "reviews"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setPendingReviewCount(0);
        return;
      }

      const reviews = Object.values(data) as any[];

      setPendingReviewCount(
        reviews.filter((review) => review.approved === false).length
      );
    });

    return () => {
      unsubAdmin();
      unsubOrders();
      unsubProducts();
      unsubUsers();
      unsubMessages();
      unsubSubscribers();
      unsubReviews();
    };
  }, [checkingAccess, uid, router]);

  const orderCount = orders.length;

  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const customerCountFromOrders = useMemo(() => {
    const set = new Set(
      orders
        .map((order) => order.customer?.email || order.shippingAddress?.phone)
        .filter(Boolean)
    );

    return set.size;
  }, [orders]);

  const customerCount =
    customerCountFromUsers > 0 ? customerCountFromUsers : customerCountFromOrders;

  const pendingOrderCount = orders.filter(
    (order) => (order.status || "pending") === "pending"
  ).length;

  const totalAlerts = pendingOrderCount + pendingReviewCount + lowStockCount;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f1e8]">
        <div className="rounded-[28px] bg-white/50 px-10 py-8 text-center shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <h2 className="text-2xl font-bold text-[#172313]">
            Checking Access...
          </h2>
          <p className="mt-2 text-gray-600">Verifying admin permissions</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8]">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/80 backdrop-blur-[3px]" />

      <div className="flex min-h-screen p-3">
        <aside className="fixed left-3 top-3 bottom-3 z-40 hidden w-[270px] overflow-hidden rounded-[28px] bg-[#26391f]/85 text-white shadow-[0_30px_90px_rgba(31,43,20,0.28)] backdrop-blur-2xl lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />

          <div className="relative z-10 flex h-full flex-col">
            <div className="px-7 pt-7 pb-5">
              <Link href="/admin" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="ZAYY Care"
                  width={320}
                  height={180}
                  priority
                  className="brightness-0 invert"
                />
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                const badge =
                  link.name === "Orders"
                    ? orderCount
                    : link.name === "Inventory"
                    ? lowStockCount
                    : link.name === "Reviews"
                    ? pendingReviewCount
                    : link.name === "Subscribers"
                    ? subscriberCount
                    : link.name === "Notifications"
                    ? totalAlerts
                    : 0;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-white/22 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]"
                        : "text-white/82 hover:bg-white/12 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />
                    <span>{link.name}</span>

                    {badge > 0 && (
                      <span className="ml-auto rounded-full bg-white/25 px-2 py-0.5 text-xs">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="relative z-10 p-4">
              <div className="rounded-[24px] border border-white/20 bg-white/12 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
                <p className="text-sm font-bold">📊 ZAYY Analytics</p>

                <div className="mt-4 space-y-2 text-xs text-white/85">
                  <div className="flex items-center justify-between">
                    <span>Products</span>
                    <b>{productCount}</b>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Orders</span>
                    <b>{orderCount}</b>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Customers</span>
                    <b>{customerCount}</b>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Revenue</span>
                    <b>৳{revenue.toLocaleString("en-BD")}</b>
                  </div>
                </div>

                <Link
                  href="/admin/reports"
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-white/18 px-4 py-3 text-sm font-semibold hover:bg-white/25"
                >
                  View Reports →
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-h-screen w-full lg:pl-[285px]">
          <header className="sticky top-3 z-30 mx-auto mb-5 flex max-w-[1500px] items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-white/35 px-5 py-4 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/35 text-[#26391f] lg:hidden">
                <Menu size={22} />
              </button>

              <div>
                <h1 className="text-xl font-bold text-[#172313]">
                  {adminLinks.find((link) => isActive(link.href))?.name ||
                    "Dashboard"}
                </h1>

                <p className="text-sm text-[#52614d]">
                  Welcome back, {adminProfile?.name || "Admin"} 🍃
                </p>
              </div>
            </div>

            <div className="hidden flex-1 justify-center md:flex">
              <div className="flex w-full max-w-[520px] items-center gap-3 rounded-2xl border border-white/60 bg-white/45 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <input
                  type="text"
                  placeholder="Search for orders, customers, products..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
                />
                <Search size={20} className="text-[#26391f]" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/notifications"
                className="relative hidden h-11 w-11 items-center justify-center rounded-full bg-white/35 text-[#26391f] sm:flex"
              >
                <Bell size={20} />

                {totalAlerts > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {totalAlerts}
                  </span>
                )}
              </Link>

              <Link
                href="/admin/contact"
                className="relative hidden h-11 w-11 items-center justify-center rounded-full bg-white/35 text-[#26391f] sm:flex"
              >
                <MessageSquare size={20} />

                {messageCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {messageCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-3 rounded-2xl bg-white/35 px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#26391f] font-bold text-white">
                  {(adminProfile?.name || adminProfile?.email || "A")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>

                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-[#172313]">
                    {adminProfile?.name || "Admin"}
                  </p>

                  <p className="text-xs capitalize text-gray-600">
                    {adminProfile?.role || "Protected Admin"}
                  </p>
                </div>

                <ChevronDown size={18} />
              </div>

              <button
                onClick={handleLogout}
                className="hidden h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 sm:flex"
                title="Logout"
              >
                <LogOut size={19} />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] pb-10">{children}</div>
        </section>
      </div>
    </main>
  );
}