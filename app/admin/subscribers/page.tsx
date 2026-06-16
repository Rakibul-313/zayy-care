"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { Mail, Search, Trash2, Users } from "lucide-react";
import { database } from "@/firebase/config";

type Subscriber = {
  id: string;
  deleted?: boolean;
  active?: boolean;
  deletedAt?: number;
  email?: string;
  source?: string;
  createdAt?: number;
};

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "subscribers"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setSubscribers([]);
        setLoading(false);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<Subscriber, "id">),
        }))
        .filter((subscriber) => subscriber.deleted !== true)
        .sort(
          (a: Subscriber, b: Subscriber) =>
            Number(b.createdAt || 0) - Number(a.createdAt || 0)
        );

      setSubscribers(loaded);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSubscribers = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return subscribers;

    return subscribers.filter((subscriber) =>
      `${subscriber.email || ""} ${subscriber.source || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [subscribers, search]);

  const todaySubscribers = useMemo(() => {
    return subscribers.filter((subscriber) => {
      if (!subscriber.createdAt) return false;

      const today = new Date();
      const date = new Date(subscriber.createdAt);

      return (
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate()
      );
    }).length;
  }, [subscribers]);

  const activeSubscribers = useMemo(() => {
    return subscribers.filter((subscriber) => subscriber.active !== false)
      .length;
  }, [subscribers]);

  const deleteSubscriber = async (subscriber: Subscriber) => {
    const ok = confirm(`Delete subscriber ${subscriber.email || "No email"}?`);
    if (!ok) return;

    await update(ref(database, `subscribers/${subscriber.id}`), {
      deleted: true,
      active: false,
      deletedAt: Date.now(),
    });
  };

  return (
    <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
        <h1 className="text-3xl font-black text-[#102015] sm:text-4xl">
          Subscribers
        </h1>

        <p className="mt-2 text-sm font-medium text-[#4f5f49]">
          Manage newsletter and promotional email subscribers.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <Users className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Total Subscribers
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {subscribers.length}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <Mail className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Active Subscribers
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {activeSubscribers}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <Mail className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Today Joined
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {todaySubscribers}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <Search className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Filtered Result
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {filteredSubscribers.length}
          </h2>
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="flex items-center gap-3 rounded-[6px] bg-[#f5f1e8] px-4 py-3">
          <Search size={20} className="text-[#556B2F]" />
          <input
            type="text"
            placeholder="Search subscriber email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49]"
          />
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
        {loading ? (
          <div className="py-12 text-center font-bold text-[#4f5f49]">
            Loading subscribers...
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-12 text-center font-bold text-[#4f5f49]">
            No subscribers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10">
                  <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    Email
                  </th>
                  <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    Source
                  </th>
                  <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    Joined
                  </th>
                  <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    Status
                  </th>
                  <th className="pb-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="text-[#263421]">
                {filteredSubscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-[#0b3d2e]/10 last:border-b-0"
                  >
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#003f2a] text-white">
                          <Mail size={18} />
                        </div>

                        <p className="font-bold text-[#102015]">
                          {subscriber.email || "No email"}
                        </p>
                      </div>
                    </td>

                    <td className="py-5 font-medium capitalize text-[#263421]">
                      {subscriber.source || "website"}
                    </td>

                    <td className="py-5 font-medium text-[#263421]">
                      {dateText(subscriber.createdAt)}
                    </td>

                    <td className="py-5">
                      <span
                        className={`rounded-[6px] px-3 py-1 text-xs font-bold ${
                          subscriber.active === false
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {subscriber.active === false ? "Inactive" : "Active"}
                      </span>
                    </td>

                    <td className="py-5">
                      <button
                        type="button"
                        onClick={() => deleteSubscriber(subscriber)}
                        className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-red-50 text-red-700 transition hover:bg-red-100"
                        aria-label="Delete subscriber"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}