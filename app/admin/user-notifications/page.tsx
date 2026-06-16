"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set, update } from "firebase/database";
import { Bell, Check, Search, Send, Trash2, Users } from "lucide-react";

import { database } from "@/firebase/config";

type UserItem = {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
};

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

const notificationTypes = ["default", "order", "offer", "system"] as const;

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

export default function AdminUserNotificationsPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [target, setTarget] = useState<"all" | "single">("all");
  const [selectedUid, setSelectedUid] = useState("");
  const [type, setType] =
    useState<NotificationItem["type"]>("default");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubUsers = onValue(ref(database, "users"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setUsers([]);
        return;
      }

      const loaded = Object.entries(data).map(([id, value]: any) => ({
        id,
        uid: value.uid || id,
        name: value.name || "ZAYY User",
        email: value.email || "",
        phone: value.phone || "",
      }));

      setUsers(loaded);
    });

    const unsubNotifications = onValue(ref(database, "notifications"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setNotifications([]);
        return;
      }

      const loaded: NotificationItem[] = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          ...value,
        }))
        .filter((item) => item.deleted !== true)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setNotifications(loaded);
    });

    return () => {
      unsubUsers();
      unsubNotifications();
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return notifications;

    return notifications.filter((item) =>
      `${item.title} ${item.message} ${item.type} ${item.uid}`
        .toLowerCase()
        .includes(q)
    );
  }, [notifications, search]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please enter title and message.");
      return;
    }

    if (target === "single" && !selectedUid) {
      alert("Please select a user.");
      return;
    }

    try {
      setSending(true);

      const notificationRef = push(ref(database, "notifications"));

      await set(notificationRef, {
        firebaseId: notificationRef.key,
        uid: target === "single" ? selectedUid : "",
        title: title.trim(),
        message: message.trim(),
        type: type || "default",
        read: false,
        deleted: false,
        createdAt: Date.now(),
      });

      alert("Notification sent successfully.");

      setTitle("");
      setMessage("");
      setSelectedUid("");
      setTarget("all");
      setType("default");
    } catch (error) {
      console.error(error);
      alert("Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("Delete this notification?");
    if (!ok) return;

    await update(ref(database, `notifications/${id}`), {
      deleted: true,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#102015]">
              User Notifications
            </h1>
            <p className="mt-2 text-[#4f5f49]">
              Send real-time notifications to all users or a specific user.
            </p>
          </div>

          <div className="flex h-12 items-center gap-2 rounded-[6px] bg-[#f5f1e8] px-4 font-black text-[#0b3d2e]">
            <Users size={18} />
            {users.length} Users
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#e9f6ed] text-[#0b3d2e]">
              <Send size={19} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#102015]">
                Send Notification
              </h2>
              <p className="text-sm text-[#4f5f49]">
                Customer profile notification page e instantly show hobe.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTarget("all")}
                className={`rounded-[6px] border px-4 py-3 text-sm font-black ${
                  target === "all"
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                    : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#0b3d2e]"
                }`}
              >
                Send to All Users
              </button>

              <button
                type="button"
                onClick={() => setTarget("single")}
                className={`rounded-[6px] border px-4 py-3 text-sm font-black ${
                  target === "single"
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                    : "border-[#0b3d2e]/10 bg-[#fafaf7] text-[#0b3d2e]"
                }`}
              >
                Send to Specific User
              </button>
            </div>

            {target === "single" && (
              <select
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                className="h-12 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm outline-none"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.uid || user.id} value={user.uid || user.id}>
                    {user.name} — {user.email || user.phone || user.uid}
                  </option>
                ))}
              </select>
            )}

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as NotificationItem["type"])
              }
              className="h-12 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm capitalize outline-none"
            >
              {notificationTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="h-12 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm outline-none"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              rows={6}
              className="w-full resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase text-white disabled:opacity-60"
            >
              <Send size={16} />
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#102015]">
                Sent Notifications
              </h2>
              <p className="text-sm text-[#4f5f49]">
                Latest sent notifications list.
              </p>
            </div>

            <div className="flex h-11 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-3">
              <Search size={16} className="text-[#0b3d2e]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-[180px] bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="rounded-[6px] bg-[#f5f1e8] p-8 text-center">
              <Bell className="mx-auto text-[#0b3d2e]" size={40} />
              <h3 className="mt-3 text-xl font-black text-[#102015]">
                No notifications
              </h3>
              <p className="mt-1 text-sm text-[#4f5f49]">
                Sent notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-[#102015]">
                          {item.title}
                        </h3>

                        <span className="rounded-[6px] bg-[#e9f6ed] px-2 py-1 text-[10px] font-black uppercase text-[#0b3d2e]">
                          {item.type || "default"}
                        </span>

                        <span className="rounded-[6px] bg-[#f5f1e8] px-2 py-1 text-[10px] font-black text-[#4f5f49]">
                          {item.uid ? "Single User" : "All Users"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-[#4f5f49]">
                        {item.message}
                      </p>

                      <p className="mt-2 text-xs font-bold text-[#6b7568]">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-red-50 text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
        <h2 className="mb-4 text-2xl font-black text-[#102015]">
          Quick Templates
        </h2>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Order Confirmed",
              message:
                "Your order has been confirmed. We will contact you soon for delivery.",
              type: "order",
            },
            {
              title: "New Offer Available",
              message:
                "A new ZAYY Care offer is now live. Visit the shop and grab your favorite skincare products.",
              type: "offer",
            },
            {
              title: "Welcome to ZAYY Care",
              message:
                "Thank you for joining ZAYY Care. Your skincare journey starts here.",
              type: "system",
            },
          ].map((template) => (
            <button
              key={template.title}
              type="button"
              onClick={() => {
                setTitle(template.title);
                setMessage(template.message);
                setType(template.type as NotificationItem["type"]);
              }}
              className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-4 text-left hover:bg-[#f5f1e8]"
            >
              <Check size={18} className="mb-2 text-[#0b3d2e]" />
              <h3 className="font-black text-[#102015]">{template.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#4f5f49]">
                {template.message}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}