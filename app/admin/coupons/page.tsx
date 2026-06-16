"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set, update } from "firebase/database";
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
  deleted?: boolean;
  deletedAt?: number;
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
  firebaseId?: string;
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

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function isExpired(value?: number | null) {
  if (!value) return false;
  return Date.now() > value;
}

function couponStatus(coupon: Coupon) {
  if (coupon.active === false) return "OFF";
  if (isExpired(coupon.expiresAt)) return "EXPIRED";
  if (coupon.maxUsage && Number(coupon.usageCount || 0) >= coupon.maxUsage) {
    return "LIMIT REACHED";
  }

  return "ACTIVE";
}

function statusClass(status: string) {
  if (status === "ACTIVE") return "bg-green-100 text-green-700";
  if (status === "EXPIRED") return "bg-red-100 text-red-700";
  if (status === "LIMIT REACHED") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
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
        .map(([id, item]) => {
          const coupon = item as Omit<Coupon, "id">;

          return {
            id,
            ...coupon,
            type: coupon.type || "percent",
            value: Number(coupon.value ?? coupon.discount ?? 0),
            usageCount: Number(coupon.usageCount || 0),
            maxUsage: Number(coupon.maxUsage || 0),
            minOrder: Number(coupon.minOrder || 0),
          };
        })
        .filter((coupon) => coupon.deleted !== true)
        .sort(
          (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
        );

      setCoupons(formatted);
    });

    return () => unsubscribe();
  }, []);

  const filteredCoupons = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return coupons;

    return coupons.filter((coupon) =>
      (coupon.code || "").toLowerCase().includes(keyword)
    );
  }, [coupons, search]);

  const stats = useMemo(() => {
    const activeCount = coupons.filter(
      (coupon) => couponStatus(coupon) === "ACTIVE"
    ).length;

    const expiredCount = coupons.filter(
      (coupon) => couponStatus(coupon) === "EXPIRED"
    ).length;

    const usedCount = coupons.reduce(
      (sum, item) => sum + Number(item.usageCount || 0),
      0
    );

    return {
      total: coupons.length,
      active: activeCount,
      expired: expiredCount,
      used: usedCount,
    };
  }, [coupons]);

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
        firebaseId: couponRef.key,
        ...couponData,
        active: true,
        usageCount: 0,
        deleted: false,
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

    await update(ref(database, `coupons/${coupon.id}`), {
      deleted: true,
      active: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#102015]">Coupons</h1>
          <p className="mt-1 text-sm text-[#4f5f49]">
            Dashboard › Coupons
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex h-11 items-center gap-2 rounded-[6px] bg-[#003f2a] px-5 text-sm font-black text-white"
        >
          <Plus size={17} />
          Add Coupon
        </button>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Coupons" value={stats.total} icon={BadgePercent} />
        <StatCard title="Active" value={stats.active} icon={Power} />
        <StatCard title="Expired" value={stats.expired} icon={CalendarDays} danger />
        <StatCard title="Used" value={stats.used} icon={BadgePercent} />
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="flex items-center gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3">
          <Search size={20} className="text-[#0b3d2e]" />

          <input
            type="text"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#4f5f49]"
          />
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#4f5f49]">
            Showing {filteredCoupons.length} of {coupons.length} coupons
          </p>
        </div>

        {filteredCoupons.length === 0 ? (
          <div className="py-12 text-center">
            <BadgePercent className="mx-auto text-[#0b3d2e]" size={48} />
            <h2 className="mt-4 text-2xl font-black text-[#102015]">
              No coupons found
            </h2>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b3d2e]/10 text-xs uppercase text-[#4f5f49]">
                  <th className="py-3">Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCoupons.map((coupon) => {
                  const status = couponStatus(coupon);

                  return (
                    <tr
                      key={coupon.id}
                      className="border-b border-[#0b3d2e]/10 text-[#263421]"
                    >
                      <td className="py-4">
                        <span className="rounded-[6px] bg-[#f5f1e8] px-4 py-2 font-black text-[#0b3d2e]">
                          {coupon.code}
                        </span>
                      </td>

                      <td className="font-black text-[#102015]">
                        {coupon.type === "fixed"
                          ? `${money(coupon.value)} OFF`
                          : `${coupon.value}% OFF`}
                      </td>

                      <td>{coupon.minOrder ? money(coupon.minOrder) : "None"}</td>

                      <td>
                        {coupon.usageCount || 0}
                        {coupon.maxUsage
                          ? ` / ${coupon.maxUsage}`
                          : " / Unlimited"}
                      </td>

                      <td>{dateText(coupon.expiresAt)}</td>

                      <td>
                        <button
                          onClick={() => toggleCoupon(coupon)}
                          className={`rounded-[6px] px-3 py-1 text-xs font-black ${statusClass(
                            status
                          )}`}
                        >
                          {status}
                        </button>
                      </td>

                      <td>
                        {coupon.createdAt ? dateText(coupon.createdAt) : "N/A"}
                      </td>

                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-yellow-50 text-yellow-700"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => deleteCoupon(coupon)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-red-50 text-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[620px] rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-[#102015]">
                {editingCoupon ? "Edit Coupon" : "Add Coupon"}
              </h2>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-white text-[#003f2a]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Coupon Code e.g. SAVE10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 uppercase outline-none sm:col-span-2"
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value as CouponType)}
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
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
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                type="number"
                placeholder="Minimum Order Amount"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                type="number"
                placeholder="Maximum Usage (0 = unlimited)"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none"
              />

              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white px-5 py-4 outline-none sm:col-span-2"
              />
            </div>

            <button
              onClick={handleSaveCoupon}
              className="mt-6 rounded-[6px] bg-[#003f2a] px-6 py-4 font-black text-white"
            >
              {editingCoupon ? "Update Coupon" : "Save Coupon"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  danger,
}: {
  title: string;
  value: string | number;
  icon: any;
  danger?: boolean;
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

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            danger ? "bg-red-50 text-red-600" : "bg-emerald-50 text-[#0b3d2e]"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}