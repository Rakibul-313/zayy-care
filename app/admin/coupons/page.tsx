"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import {
  BadgePercent,
  CalendarDays,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";

type CouponType = "percent" | "fixed";

type Coupon = {
  id: string;
  code?: string;
  type?: CouponType;
  value?: number;
  discount?: number;
  minOrder?: number;
  maxUsage?: number;
  usageCount?: number;
  active?: boolean;
  expiresAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function dateInputValue(value?: number | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function dateText(value?: number | null) {
  if (!value) return "No expiry";
  return new Date(value).toLocaleDateString();
}

function isExpired(value?: number | null) {
  if (!value) return false;
  return Date.now() > value;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "coupons"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setCoupons([]);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, item]: any) => ({
          id,
          ...item,
          type: item.type || "percent",
          value: Number(item.value ?? item.discount ?? 0),
          usageCount: Number(item.usageCount || 0),
          maxUsage: Number(item.maxUsage || 0),
          minOrder: Number(item.minOrder || 0),
        }))
        .sort((a: Coupon, b: Coupon) => (b.createdAt || 0) - (a.createdAt || 0));

      setCoupons(formatted);
    });

    return () => unsubscribe();
  }, []);

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) =>
      (coupon.code || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [coupons, search]);

  const activeCount = coupons.filter(
    (coupon) => coupon.active !== false && !isExpired(coupon.expiresAt)
  ).length;

  const expiredCount = coupons.filter((coupon) =>
    isExpired(coupon.expiresAt)
  ).length;

  const resetForm = () => {
    setCode("");
    setType("percent");
    setValue("");
    setMinOrder("");
    setMaxUsage("");
    setExpiresAt("");
    setEditingCoupon(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code || "");
    setType(coupon.type || "percent");
    setValue(String(coupon.value ?? coupon.discount ?? ""));
    setMinOrder(String(coupon.minOrder || ""));
    setMaxUsage(String(coupon.maxUsage || ""));
    setExpiresAt(dateInputValue(coupon.expiresAt || null));
    setShowModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!code.trim() || !value.trim()) {
      alert("Coupon code and discount value are required.");
      return;
    }

    const couponCode = code.toUpperCase().trim();
    const discountValue = Number(value);
    const minOrderValue = Number(minOrder || 0);
    const maxUsageValue = Number(maxUsage || 0);

    if (discountValue <= 0) {
      alert("Discount value must be greater than 0.");
      return;
    }

    if (type === "percent" && discountValue > 100) {
      alert("Percentage discount cannot be more than 100.");
      return;
    }

    const couponData = {
      code: couponCode,
      type,
      value: discountValue,
      discount: type === "percent" ? discountValue : 0,
      minOrder: minOrderValue,
      maxUsage: maxUsageValue,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      updatedAt: Date.now(),
    };

    if (editingCoupon) {
      await update(ref(database, `coupons/${editingCoupon.id}`), couponData);
      alert("Coupon updated successfully.");
    } else {
      const couponRef = push(ref(database, "coupons"));

      await set(couponRef, {
        ...couponData,
        active: true,
        usageCount: 0,
        createdAt: Date.now(),
      });

      alert("Coupon added successfully.");
    }

    resetForm();
    setShowModal(false);
  };

  const toggleCoupon = async (coupon: Coupon) => {
    await update(ref(database, `coupons/${coupon.id}`), {
      active: coupon.active === false,
      updatedAt: Date.now(),
    });
  };

  const deleteCoupon = async (coupon: Coupon) => {
    const ok = confirm(`Delete coupon "${coupon.code}"?`);
    if (!ok) return;

    await remove(ref(database, `coupons/${coupon.id}`));
  };

  const couponStatus = (coupon: Coupon) => {
    if (coupon.active === false) return "OFF";
    if (isExpired(coupon.expiresAt)) return "EXPIRED";
    if (coupon.maxUsage && Number(coupon.usageCount || 0) >= coupon.maxUsage) {
      return "LIMIT REACHED";
    }
    return "ACTIVE";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">Coupons</h1>
            <p className="mt-2 text-gray-600">
              Create advanced discount coupons with usage limits and expiry.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-2xl bg-[#556B2F] px-5 py-3 font-semibold text-white"
          >
            <Plus size={18} />
            Add Coupon
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <BadgePercent className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Total Coupons</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {coupons.length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Power className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Active</p>
          <h2 className="text-3xl font-black text-[#172313]">{activeCount}</h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <CalendarDays className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Expired</p>
          <h2 className="text-3xl font-black text-[#172313]">{expiredCount}</h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <BadgePercent className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Used</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {coupons.reduce((sum, item) => sum + Number(item.usageCount || 0), 0)}
          </h2>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-5 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white/45 px-4 py-3">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {filteredCoupons.length === 0 ? (
          <div className="py-12 text-center">
            <BadgePercent className="mx-auto text-[#556B2F]" size={48} />
            <h2 className="mt-4 text-2xl font-bold text-[#172313]">
              No coupons found
            </h2>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-black/10 text-gray-500">
                  <th className="py-4">Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-black/5">
                    <td className="py-5">
                      <span className="rounded-full bg-[#556B2F]/12 px-4 py-2 font-black text-[#556B2F]">
                        {coupon.code}
                      </span>
                    </td>

                    <td className="font-bold">
                      {coupon.type === "fixed"
                        ? `${money(coupon.value)} OFF`
                        : `${coupon.value}% OFF`}
                    </td>

                    <td>{coupon.minOrder ? money(coupon.minOrder) : "None"}</td>

                    <td>
                      {coupon.usageCount || 0}
                      {coupon.maxUsage ? ` / ${coupon.maxUsage}` : " / Unlimited"}
                    </td>

                    <td>{dateText(coupon.expiresAt)}</td>

                    <td>
                      <button
                        onClick={() => toggleCoupon(coupon)}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          couponStatus(coupon) === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : couponStatus(coupon) === "EXPIRED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {couponStatus(coupon)}
                      </button>
                    </td>

                    <td>
                      {coupon.createdAt
                        ? new Date(coupon.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => deleteCoupon(coupon)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[620px] rounded-[32px] border border-white/60 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-[#172313]">
                {editingCoupon ? "Edit Coupon" : "Add Coupon"}
              </h2>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Coupon Code e.g. SAVE10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-5 py-4 uppercase outline-none sm:col-span-2"
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value as CouponType)}
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              >
                <option value="percent">Percentage Discount</option>
                <option value="fixed">Fixed Amount</option>
              </select>

              <input
                type="number"
                placeholder={
                  type === "percent"
                    ? "Discount Percentage e.g. 10"
                    : "Discount Amount e.g. 100"
                }
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                type="number"
                placeholder="Minimum Order Amount"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                type="number"
                placeholder="Maximum Usage (0 = unlimited)"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none sm:col-span-2"
              />
            </div>

            <button
              onClick={handleSaveCoupon}
              className="mt-6 rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white"
            >
              {editingCoupon ? "Update Coupon" : "Save Coupon"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}