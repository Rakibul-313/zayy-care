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
  X,
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
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Subscribers", href: "/admin/subscribers", icon: Mail },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "User Notifications", href: "/admin/user-notifications", icon: Bell },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "General Settings", href: "/admin/settings/general", icon: Settings },
  { name: "Payment Settings", href: "/admin/settings", icon: Settings },
  { name: "Access", href: "/admin/access", icon: ShieldCheck },
];

type Order = {
  deleted?: boolean;
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

type Product = {
  stock?: number;
  lowStockLimit?: number;
  deleted?: boolean;
};

type Review = {
  approved?: boolean;
  deleted?: boolean;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [customerCountFromUsers, setCustomerCountFromUsers] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
        router.push("/shop");
        return;
      }

      setAdminProfile(data);
    });

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        return;
      }

      const activeOrders = Object.values(data).filter(
        (order: any) => order?.deleted !== true
      ) as Order[];

      setOrders(activeOrders);
    });

    const unsubProducts = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProductCount(0);
        setLowStockCount(0);
        return;
      }

      const products = (Object.values(data) as Product[]).filter(
        (product) => product.deleted !== true
      );

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

      const reviews = Object.values(data) as Review[];

      setPendingReviewCount(
        reviews.filter(
          (review) => review.approved === false && review.deleted !== true
        ).length
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

  const getBadge = (name: string) => {
    if (name === "Orders") return orderCount;
    if (name === "Inventory") return lowStockCount;
    if (name === "Reviews") return pendingReviewCount;
    if (name === "Messages") return messageCount;
    if (name === "Subscribers") return subscriberCount;
    if (name === "Notifications") return totalAlerts;
    return 0;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="ZAYY Care"
            width={220}
            height={90}
            priority
            className="h-auto w-[150px] brightness-0 invert"
          />
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-white/10 text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const badge = getBadge(link.name);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-[6px] px-4 py-3 text-sm font-bold transition-all duration-300 ${
                active
                  ? "bg-[#f5f1e8] text-[#003f2a]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span>{link.name}</span>

              {badge > 0 && (
                <span
                  className={`ml-auto rounded-[6px] px-2 py-0.5 text-xs font-black ${
                    active
                      ? "bg-[#003f2a] text-white"
                      : "bg-white/15 text-white"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-[6px] border border-white/10 bg-white/10 p-4">
          <p className="text-sm font-black">ZAYY Analytics</p>

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
            className="mt-4 flex w-full items-center justify-center rounded-[6px] bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/20"
          >
            View Reports →
          </Link>
        </div>
      </div>
    </div>
  );

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf7]">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] px-10 py-8 text-center shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
          <h2 className="text-2xl font-black text-[#102015]">
            Checking Access...
          </h2>
          <p className="mt-2 text-[#4f5f49]">Verifying admin permissions</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <div className="flex min-h-screen">
        <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[270px] overflow-hidden bg-[#003f2a] text-white shadow-[0_8px_24px_rgba(11,61,46,0.18)] lg:block">
          <SidebarContent />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/45"
            />

            <aside className="absolute bottom-0 left-0 top-0 w-[285px] overflow-hidden bg-[#003f2a] text-white shadow-[0_8px_24px_rgba(11,61,46,0.18)]">
              <SidebarContent />
            </aside>
          </div>
        )}

        <section className="min-h-screen w-full lg:pl-[270px]">
          <header className="sticky top-0 z-30 border-b border-[#0b3d2e]/10 bg-[#FCFCFA] px-4 py-4 shadow-[0_8px_24px_rgba(11,61,46,0.08)] sm:px-6">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#003f2a] lg:hidden"
                >
                  <Menu size={22} />
                </button>

                <div>
                  <h1 className="text-xl font-black text-[#102015]">
                    {adminLinks.find((link) => isActive(link.href))?.name ||
                      "Dashboard"}
                  </h1>

                  <p className="text-sm font-semibold text-[#4f5f49]">
                    Welcome back, {adminProfile?.name || "Admin"}
                  </p>
                </div>
              </div>

              <div className="hidden flex-1 justify-center md:flex">
                <div className="flex w-full max-w-[520px] items-center gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-3">
                  <input
                    type="text"
                    placeholder="Search for orders, customers, products..."
                    className="w-full bg-transparent text-sm text-[#102015] outline-none placeholder:text-[#4f5f49]"
                  />
                  <Search size={20} className="text-[#003f2a]" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/notifications"
                  className="relative hidden h-11 w-11 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#003f2a] transition-all duration-300 hover:-translate-y-1 sm:flex"
                >
                  <Bell size={20} />

                  {totalAlerts > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-[6px] bg-red-500 text-[10px] font-black text-white">
                      {totalAlerts}
                    </span>
                  )}
                </Link>

                <Link
                  href="/admin/messages"
                  className="relative hidden h-11 w-11 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#003f2a] transition-all duration-300 hover:-translate-y-1 sm:flex"
                >
                  <MessageSquare size={20} />

                  {messageCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-[6px] bg-red-500 text-[10px] font-black text-white">
                      {messageCount}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-3 rounded-[6px] bg-[#f5f1e8] px-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[6px] bg-[#003f2a] font-black text-white">
                    {(adminProfile?.name || adminProfile?.email || "A")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div className="hidden sm:block">
                    <p className="text-sm font-black text-[#102015]">
                      {adminProfile?.name || "Admin"}
                    </p>

                    <p className="text-xs capitalize text-[#4f5f49]">
                      {adminProfile?.role || "Protected Admin"}
                    </p>
                  </div>

                  <ChevronDown size={18} className="text-[#003f2a]" />
                </div>

                <button
                  onClick={handleLogout}
                  className="hidden h-11 w-11 items-center justify-center rounded-[6px] bg-red-100 text-red-600 transition-all duration-300 hover:-translate-y-1 sm:flex"
                  title="Logout"
                >
                  <LogOut size={19} />
                </button>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-[1500px] px-4 py-6 pb-10 sm:px-6">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}