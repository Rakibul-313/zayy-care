"use client";

import { useEffect, useState } from "react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import { Plus, Pencil, Trash2, X, Tags } from "lucide-react";

type Brand = {
  id: string;
  name?: string;
  logo?: string;
  focus?: string;
  active?: boolean;
  createdAt?: number;
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [focus, setFocus] = useState("");

  useEffect(() => {
    const brandsRef = ref(database, "brands");

    const unsubscribe = onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBrands([]);
        return;
      }

      const formatted = Object.entries(data)
        .map(([id, value]: any) => ({ id, ...value }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setBrands(formatted);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setName("");
    setLogo("");
    setFocus("");
    setEditingBrand(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name || "");
    setLogo(brand.logo || "");
    setFocus(brand.focus || "");
    setShowModal(true);
  };

  const handleSaveBrand = async () => {
    if (!name.trim()) {
      alert("Brand name is required");
      return;
    }

    const brandData = {
      name: name.trim(),
      logo: logo.trim(),
      focus: focus.trim(),
      updatedAt: Date.now(),
    };

    if (editingBrand) {
      await update(ref(database, `brands/${editingBrand.id}`), brandData);
      alert("Brand updated");
    } else {
      const brandRef = push(ref(database, "brands"));

      await set(brandRef, {
        ...brandData,
        active: true,
        createdAt: Date.now(),
      });

      alert("Brand added");
    }

    resetForm();
    setShowModal(false);
  };

  const toggleBrand = async (brand: Brand) => {
    await update(ref(database, `brands/${brand.id}`), {
      active: brand.active === false ? true : false,
    });
  };

  const deleteBrand = async (brand: Brand) => {
    const ok = confirm(`Delete "${brand.name}"?`);
    if (!ok) return;

    await remove(ref(database, `brands/${brand.id}`));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">Brands</h1>
            <p className="mt-2 text-gray-600">
              Add, edit and manage skincare brands.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-2xl bg-[#556B2F] px-5 py-3 font-semibold text-white"
          >
            <Plus size={18} />
            Add Brand
          </button>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        {brands.length === 0 ? (
          <div className="py-12 text-center">
            <Tags className="mx-auto text-[#556B2F]" size={48} />
            <h2 className="mt-4 text-2xl font-bold text-[#172313]">
              No brands found
            </h2>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {brands.map((brand) => (
              <div key={brand.id} className="rounded-[26px] bg-white/35 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/60">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name || "Brand"}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <Tags className="text-[#556B2F]" />
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-[#172313]">
                        {brand.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {brand.focus || "No focus added"}
                      </p>

                      <button
                        onClick={() => toggleBrand(brand)}
                        className={`mt-3 rounded-full px-3 py-1 text-xs font-bold ${
                          brand.active === false
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {brand.active === false ? "OFF" : "ACTIVE"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(brand)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => deleteBrand(brand)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[560px] rounded-[32px] border border-white/60 bg-[#f5f1e8] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-[#172313]">
                {editingBrand ? "Edit Brand" : "Add Brand"}
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

            <div className="space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brand Name e.g. Anua"
                className="w-full rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="Logo URL e.g. /brands/anua.png"
                className="w-full rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Focus e.g. Calming care"
                className="w-full rounded-2xl bg-white/60 px-5 py-4 outline-none"
              />
            </div>

            <button
              onClick={handleSaveBrand}
              className="mt-6 rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white"
            >
              {editingBrand ? "Update Brand" : "Save Brand"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}