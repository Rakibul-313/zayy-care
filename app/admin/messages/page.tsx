"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, remove, update } from "firebase/database";
import { CheckCircle2, Mail, Phone, Search, Trash2 } from "lucide-react";
import { database } from "@/firebase/config";

type Message = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  createdAt?: number;
  read?: boolean;
};

function dateText(value?: number) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "messages"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          ...value,
        }))
        .sort(
          (a: Message, b: Message) =>
            Number(b.createdAt || 0) - Number(a.createdAt || 0)
        );

      setMessages(formatted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = messages.length;
    const read = messages.filter((item) => item.read).length;
    const unread = total - read;

    return {
      total,
      read,
      unread,
    };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return messages;

    return messages.filter((item) =>
      `${item.name || ""} ${item.email || ""} ${item.phone || ""} ${
        item.subject || ""
      } ${item.message || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [messages, search]);

  const handleMarkRead = async (id: string) => {
    await update(ref(database, `messages/${id}`), {
      read: true,
    });
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("Delete this message?");
    if (!ok) return;

    await remove(ref(database, `messages/${id}`));
  };

  return (
    <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
        <h1 className="text-3xl font-black text-[#102015] sm:text-4xl">
          Customer Messages
        </h1>
        <p className="mt-2 text-sm font-medium text-[#4f5f49]">
          View, search, mark as read and delete customer contact messages.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Total Messages
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {stats.total}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Unread Messages
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {stats.unread}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Read Messages
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {stats.read}
          </h2>
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="flex items-center gap-3 rounded-[6px] bg-[#f5f1e8] px-4 py-3">
          <Search size={20} className="text-[#556B2F]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, subject..."
            className="w-full bg-transparent text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49]"
          />
        </div>
      </section>

      {loading ? (
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center font-bold text-[#4f5f49] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          Loading messages...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center font-bold text-[#4f5f49] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          No messages found.
        </div>
      ) : (
        <section className="grid gap-5">
          {filteredMessages.map((item) => (
            <div
              key={item.id}
              className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#0b3d2e]/10 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black text-[#102015] sm:text-2xl">
                      {item.subject || "No Subject"}
                    </h2>

                    <span
                      className={`rounded-[6px] px-3 py-1 text-xs font-bold ${
                        item.read
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {item.read ? "Read" : "Unread"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-[#4f5f49]">
                    {dateText(item.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      className="flex items-center gap-2 rounded-[6px] bg-green-50 px-4 py-3 text-sm font-bold text-green-700 transition hover:bg-green-100"
                    >
                      <CheckCircle2 size={17} />
                      Mark Read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-2 rounded-[6px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[6px] bg-[#f5f1e8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    Name
                  </p>
                  <p className="mt-1 font-bold text-[#263421]">
                    {item.name || "N/A"}
                  </p>
                </div>

                <div className="rounded-[6px] bg-[#f5f1e8] p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    <Mail size={14} />
                    Email
                  </p>
                  <p className="mt-1 break-all font-bold text-[#263421]">
                    {item.email || "N/A"}
                  </p>
                </div>

                <div className="rounded-[6px] bg-[#f5f1e8] p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    <Phone size={14} />
                    Phone
                  </p>
                  <p className="mt-1 font-bold text-[#263421]">
                    {item.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[6px] bg-[#f5f1e8] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                  Message
                </p>
                <p className="mt-3 whitespace-pre-line leading-8 text-[#263421]">
                  {item.message || "No message"}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}