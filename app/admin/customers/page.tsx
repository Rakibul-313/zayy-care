"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";
import Link from "next/link";

import {
  Mail,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  area?: string;
  createdAt?: number;
};

type Order = {
  id: string;
  customer?: {
    uid?: string;
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    area?: string;
  };
  total?: number;
  status?: string;
  createdAt?: number;
};

type Customer = {
  key: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: number;
  createdAt: number;
};

function money(value: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;
}

function dateText(value?: number) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubUsers = onValue(ref(database, "users"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setUsers([]);
        return;
      }

      const loaded = Object.entries(data).map(([uid, value]) => ({
        uid,
        ...(value as Omit<UserProfile, "uid">),
      }));

      setUsers(loaded);
    });

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        return;
      }

      const loaded = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<Order, "id">),
      }));

      setOrders(loaded);
    });

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();

    users.forEach((user) => {
      const key = user.uid || user.email || user.phone || crypto.randomUUID();

      map.set(key, {
        key,
        uid: user.uid,
        name: user.name || "Customer",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        area: user.area || "",
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: 0,
        createdAt: user.createdAt || 0,
      });
    });

    orders.forEach((order) => {
      const uid = order.customer?.uid || "";
      const email = order.customer?.email || "";
      const phone = order.shippingAddress?.phone || "";

      const existingKey =
        uid ||
        Array.from(map.values()).find(
          (customer) =>
            (email && customer.email?.toLowerCase() === email.toLowerCase()) ||
            (phone && customer.phone === phone)
        )?.key ||
        email ||
        phone ||
        order.id;

      const existing = map.get(existingKey);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent +=
          order.status === "cancelled" ? 0 : Number(order.total || 0);
        existing.lastOrder = Math.max(existing.lastOrder, order.createdAt || 0);

        existing.name =
          existing.name !== "Customer"
            ? existing.name
            : order.shippingAddress?.fullName ||
              order.customer?.name ||
              "Customer";

        existing.email = existing.email || email;
        existing.phone = existing.phone || phone;
        existing.address =
          existing.address || order.shippingAddress?.address || "";
        existing.city = existing.city || order.shippingAddress?.city || "";
        existing.area = existing.area || order.shippingAddress?.area || "";
      } else {
        map.set(existingKey, {
          key: existingKey,
          uid,
          name:
            order.shippingAddress?.fullName ||
            order.customer?.name ||
            "Customer",
          email,
          phone,
          address: order.shippingAddress?.address || "",
          city: order.shippingAddress?.city || "",
          area: order.shippingAddress?.area || "",
          totalOrders: 1,
          totalSpent:
            order.status === "cancelled" ? 0 : Number(order.total || 0),
          lastOrder: order.createdAt || 0,
          createdAt: 0,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => (b.lastOrder || b.createdAt) - (a.lastOrder || a.createdAt)
    );
  }, [users, orders]);

  const filteredCustomers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return customers;

    return customers.filter((customer) => {
      const text = `
        ${customer.name}
        ${customer.email}
        ${customer.phone}
        ${customer.address}
        ${customer.city}
        ${customer.area}
      `.toLowerCase();

      return text.includes(keyword);
    });
  }, [customers, search]);

  const returningCustomers = customers.filter(
    (customer) => customer.totalOrders > 1
  ).length;

  const totalSpent = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Customers</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Dashboard › Customers
          </p>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-black text-[#0b3d2e]">
          {customers.length} Customers
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Customers" value={customers.length} icon={Users} />
        <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} />
        <StatCard title="Returning" value={returningCustomers} icon={Users} />
        <StatCard title="Customer Revenue" value={money(totalSpent)} icon={Wallet} />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="flex items-center gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3">
          <Search size={20} className="text-[#0b3d2e]" />

          <input
            type="text"
            placeholder="Search customer by name, email, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#4f5f49]"
          />
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-[#4f5f49]">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Customer</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                  <th>Last Order</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.key}
                    className="border-b border-[#0b3d2e]/10 text-[#263421]"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0b3d2e] text-sm font-black text-white">
                          {customer.name.slice(0, 1).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-black text-[#102015]">
                            {customer.name}
                          </p>
                          <p className="mt-1 max-w-[180px] truncate text-xs font-bold text-[#4f5f49]">
                            ID: {customer.uid || customer.key.slice(0, 14)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <Mail size={15} className="text-[#0b3d2e]" />
                          {customer.email || "No email"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={15} className="text-[#0b3d2e]" />
                          {customer.phone || "No phone"}
                        </p>
                      </div>
                    </td>

                    <td>
                      <div className="max-w-[280px] text-sm text-[#4f5f49]">
                        <p className="flex items-start gap-2">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-[#0b3d2e]"
                          />
                          {customer.address || customer.area || customer.city
                            ? `${customer.address}${
                                customer.area ? `, ${customer.area}` : ""
                              }${customer.city ? `, ${customer.city}` : ""}`
                            : "N/A"}
                        </p>
                      </div>
                    </td>

                    <td className="font-black text-[#102015]">
                      {customer.totalOrders}
                    </td>

                    <td className="font-black text-[#0b3d2e]">
                      {money(customer.totalSpent)}
                    </td>

                    <td className="text-[#4f5f49]">
                      {dateText(customer.createdAt)}
                    </td>

                    <td className="text-[#4f5f49]">
                      {dateText(customer.lastOrder)}
                    </td>

                    <td className="text-right">
                      <Link
                        href={`/admin/customers/${customer.uid || customer.key}`}
                        className="inline-flex rounded-[6px] bg-[#0b3d2e] px-4 py-2 text-sm font-black text-white"
                      >
                        View Details
                      </Link>
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

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#4f5f49]">{title}</p>
          <h2 className="mt-3 text-3xl font-black text-[#102015]">{value}</h2>
          <p className="mt-2 text-xs font-black text-green-600">
            Realtime data
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#0b3d2e]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}