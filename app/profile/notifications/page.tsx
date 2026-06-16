"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import { auth, database } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

import { Bell, CheckCheck, Package, ShoppingBag, Sparkles } from "lucide-react";

type NotificationItem = {
  id: string;
  uid?: string;
  title?: string;
  message?: string;
  type?: "order" | "offer" | "system" | "default";
  read?: boolean;
  deleted?: boolean;
  createdAt?: number;
};

function formatDate(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getIcon(type?: string) {
  if (type === "order") return ShoppingBag;
  if (type === "offer") return Sparkles;
  if (type === "system") return Package;
  return Bell;
}

export default function NotificationsPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    };

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onValue(ref(database, "notifications"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const loaded: NotificationItem[] = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<NotificationItem, "id">),
        }))
        .filter((item) => {
          if (item.deleted === true) return false;
          return !item.uid || item.uid === "" || item.uid === uid;
        })
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setNotifications(loaded);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const markAsRead = async (id: string) => {
    await update(ref(database, `notifications/${id}`), {
      read: true,
      updatedAt: Date.now(),
    });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.read);

    await Promise.all(
      unread.map((item) =>
        update(ref(database, `notifications/${item.id}`), {
          read: true,
          updatedAt: Date.now(),
        })
      )
    );
  };

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pt-[110px] pb-10 sm:px-8 lg:px-14 lg:pt-[125px]">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                  Notifications
                </h1>

                <p className="mt-2 max-w-[520px] text-sm leading-6 text-[#4f5f49]">
                  View order updates, offers and account notifications.
                </p>
              </div>

              <button
                type="button"
                onClick={markAllAsRead}
                className="flex h-11 items-center gap-2 rounded-[6px] bg-[#0b3d2e] px-5 text-sm font-black uppercase text-white"
              >
                <CheckCheck size={16} />
                Mark All Read
              </button>
            </div>

            <div className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
              {loading ? (
                <div className="py-12 text-center text-[#4f5f49]">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto text-[#0b3d2e]" size={42} />
                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    No notifications
                  </h2>
                  <p className="mt-2 text-sm text-[#4f5f49]">
                    Your notifications will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item) => {
                    const Icon = getIcon(item.type);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className={`grid w-full grid-cols-[48px_1fr_170px] items-center gap-4 rounded-[6px] border p-4 text-left transition max-md:grid-cols-[44px_1fr] ${
                          item.read
                            ? "border-[#0b3d2e]/10 bg-[#fafaf7]"
                            : "border-[#0b3d2e]/20 bg-[#f5f1e8]"
                        }`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-white text-[#0b3d2e] max-md:h-11 max-md:w-11">
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-[#102015]">
                              {item.title || "Notification"}
                            </h3>

                            {!item.read && (
                              <span className="rounded-[6px] bg-[#0b3d2e] px-2 py-1 text-[10px] font-black text-white">
                                New
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm leading-6 text-[#4f5f49]">
                            {item.message || "No message"}
                          </p>
                        </div>

                        <p className="text-right text-xs font-bold text-[#6b7568] max-md:col-span-2 max-md:text-left">
                          {formatDate(item.createdAt)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}