"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, remove } from "firebase/database";
import { database } from "@/firebase/config";
import { Mail, Search, Trash2, Users } from "lucide-react";

type Subscriber = {
  id: string;
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

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "subscribers"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setSubscribers([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          ...value,
        }))
        .sort(
          (a: Subscriber, b: Subscriber) =>
            Number(b.createdAt || 0) - Number(a.createdAt || 0)
        );

      setSubscribers(loaded);
    });

    return () => unsubscribe();
  }, []);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((subscriber) =>
      `${subscriber.email} ${subscriber.source}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [subscribers, search]);

  const todaySubscribers = subscribers.filter((subscriber) => {
    if (!subscriber.createdAt) return false;

    const today = new Date();
    const date = new Date(subscriber.createdAt);

    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  }).length;

  const deleteSubscriber = async (subscriber: Subscriber) => {
    const ok = confirm(`Delete subscriber ${subscriber.email}?`);
    if (!ok) return;

    await remove(ref(database, `subscribers/${subscriber.id}`));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h1 className="text-4xl font-bold text-[#172313]">Subscribers</h1>

        <p className="mt-2 text-gray-600">
          Manage newsletter and promotional email subscribers.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Users className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Total Subscribers</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {subscribers.length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Mail className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Today Joined</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {todaySubscribers}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Search className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Filtered Result</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {filteredSubscribers.length}
          </h2>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-5 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white/45 px-4 py-3">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search subscriber email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {filteredSubscribers.length === 0 ? (
          <div className="py-12 text-center text-gray-600">
            No subscribers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-black/10 text-gray-500">
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Source</th>
                  <th className="pb-4">Joined</th>
                  <th className="pb-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-black/5">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#556B2F] text-white">
                          <Mail size={18} />
                        </div>

                        <p className="font-bold text-[#172313]">
                          {subscriber.email || "No email"}
                        </p>
                      </div>
                    </td>

                    <td className="capitalize">
                      {subscriber.source || "website"}
                    </td>

                    <td>{dateText(subscriber.createdAt)}</td>

                    <td>
                      <button
                        onClick={() => deleteSubscriber(subscriber)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"
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
    </div>
  );
}