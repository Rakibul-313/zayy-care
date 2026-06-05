"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";
import {
  Search,
  Users,
  Mail,
  Phone,
  ShoppingBag,
  MapPin,
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
  updatedAt?: number;
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
  return new Date(value).toLocaleDateString();
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

      const loaded = Object.entries(data).map(([uid, value]: any) => ({
        uid,
        ...value,
      }));

      setUsers(loaded);
    });

    const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        return;
      }

      const loaded = Object.entries(data).map(([id, value]: any) => ({
        id,
        ...value,
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
        existing.address = existing.address || order.shippingAddress?.address || "";
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

  const filteredCustomers = customers.filter((customer) => {
    const text = `
      ${customer.name}
      ${customer.email}
      ${customer.phone}
      ${customer.address}
      ${customer.city}
      ${customer.area}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const returningCustomers = customers.filter(
    (customer) => customer.totalOrders > 1
  ).length;

  const totalSpent = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">Customers</h1>
            <p className="mt-2 text-gray-600">
              Realtime customer list from profiles and orders.
            </p>
          </div>

          <div className="rounded-2xl bg-[#556B2F]/10 px-5 py-3 font-bold text-[#556B2F]">
            {customers.length} Customers
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-4">
        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Users className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Total Customers</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {customers.length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <ShoppingBag className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Total Orders</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {orders.length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Users className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Returning</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {returningCustomers}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Wallet className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Customer Revenue</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {money(totalSpent)}
          </h2>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-5 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white/45 px-4 py-3">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search customer by name, email, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-gray-600">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead>
                <tr className="border-b border-black/10 text-gray-500">
                  <th className="pb-4">Customer</th>
                  <th className="pb-4">Contact</th>
                  <th className="pb-4">Address</th>
                  <th className="pb-4">Orders</th>
                  <th className="pb-4">Total Spent</th>
                  <th className="pb-4">Joined</th>
                  <th className="pb-4">Last Order</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.key} className="border-b border-black/5">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#556B2F] font-bold text-white">
                          {customer.name.slice(0, 1).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-[#172313]">
                            {customer.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {customer.uid || customer.key.slice(0, 14)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <Mail size={15} className="text-[#556B2F]" />
                          {customer.email || "No email"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={15} className="text-[#556B2F]" />
                          {customer.phone || "No phone"}
                        </p>
                      </div>
                    </td>

                    <td>
                      <div className="max-w-[280px] text-sm text-gray-600">
                        <p className="flex items-start gap-2">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-[#556B2F]"
                          />
                          {customer.address ||
                          customer.area ||
                          customer.city
                            ? `${customer.address}${
                                customer.area ? `, ${customer.area}` : ""
                              }${customer.city ? `, ${customer.city}` : ""}`
                            : "N/A"}
                        </p>
                      </div>
                    </td>

                    <td className="font-bold text-[#172313]">
                      {customer.totalOrders}
                    </td>

                    <td className="font-bold text-[#556B2F]">
                      {money(customer.totalSpent)}
                    </td>

                    <td>{dateText(customer.createdAt)}</td>

                    <td>{dateText(customer.lastOrder)}</td>
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