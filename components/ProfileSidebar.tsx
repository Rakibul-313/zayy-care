"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import {
  Bell,
  Heart,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";

import { auth, database } from "@/firebase/config";
import { getWishlistCount } from "@/lib/wishlist";

type UserProfile = {
  name?: string;
  email?: string;
};

type Order = {
  id: string;
  deleted?: boolean;
  customer?: {
    uid?: string;
    email?: string;
  };
  total?: number;
  status?: string;
};

function getMemberLevel(amount: number) {
  if (amount >= 50000) return "Premium Member";
  if (amount >= 20000) return "Diamond Member";
  if (amount >= 10000) return "Gold Member";
  if (amount >= 5000) return "Bronze Member";
  return "General Member";
}

export default function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<UserProfile>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    setWishlistCount(getWishlistCount());

    const updateWishlist = () => setWishlistCount(getWishlistCount());

    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      setUid(user.uid);
      setEmail(user.email || "");

      unsubProfile = onValue(ref(database, `users/${user.uid}`), (snapshot) => {
        const data = snapshot.val();

        setProfile({
          name: data?.name || user.displayName || "ZAYY User",
          email: data?.email || user.email || "",
        });
      });

      unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setOrders([]);
          return;
        }

        const loaded = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...(value as Omit<Order, "id">),
          }))
          .filter((order) => {
            if (order.deleted === true) return false;

            const uidMatch = order.customer?.uid === user.uid;
            const emailMatch =
              user.email &&
              order.customer?.email?.toLowerCase() ===
                user.email.toLowerCase();

            return uidMatch || emailMatch;
          });

        setOrders(loaded);
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubOrders) unsubOrders();
    };
  }, []);

  const totalSpent = useMemo(() => {
    return orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [orders]);

  const memberLevel = getMemberLevel(totalSpent);

  const userName = profile.name || "ZAYY User";
  const userEmail = profile.email || email || "";
  const initials = userName.slice(0, 2).toUpperCase();

  const menu = [
    {
      label: "My Profile",
      href: "/profile",
      icon: User,
      exact: true,
    },
    {
      label: "My Orders",
      href: "/profile/orders",
      icon: ShoppingBag,
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      icon: Heart,
      count: wishlistCount,
    },
    {
      label: "My Reviews",
      href: "/profile/reviews",
      icon: Star,
    },
    {
      label: "Skincare Routine",
      href: "/routine-builder",
      icon: Home,
    },
    {
      label: "Notifications",
      href: "/profile/notifications",
      icon: Bell,
    },
    {
      label: "Account Settings",
      href: "/profile/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <aside className="h-fit rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] lg:sticky lg:top-[120px]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0b3d2e] text-lg font-black text-white">
          {initials}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-[#102015]">
            {userName}
          </h2>

          <p className="truncate text-sm text-[#4f5f49]">{userEmail}</p>

          <p className="mt-1 text-sm font-black text-[#0b3d2e]">
            {memberLevel}
          </p>
        </div>
      </div>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-[6px] px-4 py-3 text-sm font-black transition ${
                active
                  ? "bg-[#f5f1e8] text-[#0b3d2e]"
                  : "text-[#263421] hover:bg-[#fafaf7] hover:text-[#0b3d2e]"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} />
                {item.label}
              </span>

              {typeof item.count === "number" && item.count > 0 && (
                <span className="rounded-full bg-[#0b3d2e] px-2 py-0.5 text-[10px] text-white">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 flex w-full items-center gap-3 rounded-[6px] px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
    </aside>
  );
}