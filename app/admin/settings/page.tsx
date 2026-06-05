"use client";

import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "@/firebase/config";
import { CreditCard, Save, Smartphone, Truck, Building2 } from "lucide-react";

type PaymentSettings = {
  codEnabled: boolean;
  bkashEnabled: boolean;
  nagadEnabled: boolean;
  bankEnabled: boolean;
  bkashNumber: string;
  nagadNumber: string;
  bankInfo: string;
};

const defaultSettings: PaymentSettings = {
  codEnabled: true,
  bkashEnabled: true,
  nagadEnabled: true,
  bankEnabled: false,
  bkashNumber: "",
  nagadNumber: "",
  bankInfo: "",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const settingsRef = ref(database, "settings/payment");

    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateField = <K extends keyof PaymentSettings>(
    key: K,
    value: PaymentSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await set(ref(database, "settings/payment"), settings);
      alert("Payment settings saved");
    } catch (error) {
      console.log(error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({
    label,
    icon: Icon,
    checked,
    onChange,
  }: {
    label: string;
    icon: any;
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center justify-between rounded-[24px] border p-5 transition ${
        checked
          ? "border-[#556B2F]/40 bg-[#556B2F]/12"
          : "border-white/60 bg-white/35"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/50 text-[#556B2F]">
          <Icon size={24} />
        </div>

        <div className="text-left">
          <h3 className="font-bold text-[#172313]">{label}</h3>
          <p className="text-sm text-gray-600">
            {checked ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>

      <span
        className={`flex h-8 w-14 items-center rounded-full p-1 transition ${
          checked ? "bg-[#556B2F]" : "bg-gray-300"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h1 className="text-4xl font-bold text-[#172313]">
          Payment Settings
        </h1>

        <p className="mt-2 text-gray-600">
          Control checkout payment methods from admin panel.
        </p>
      </section>

      {loading ? (
        <section className="rounded-[30px] border border-white/65 bg-white/36 p-10 text-center shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          Loading settings...
        </section>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2">
            <Toggle
              label="Cash on Delivery"
              icon={Truck}
              checked={settings.codEnabled}
              onChange={() => updateField("codEnabled", !settings.codEnabled)}
            />

            <Toggle
              label="bKash Payment"
              icon={Smartphone}
              checked={settings.bkashEnabled}
              onChange={() =>
                updateField("bkashEnabled", !settings.bkashEnabled)
              }
            />

            <Toggle
              label="Nagad Payment"
              icon={CreditCard}
              checked={settings.nagadEnabled}
              onChange={() =>
                updateField("nagadEnabled", !settings.nagadEnabled)
              }
            />

            <Toggle
              label="Bank Transfer"
              icon={Building2}
              checked={settings.bankEnabled}
              onChange={() => updateField("bankEnabled", !settings.bankEnabled)}
            />
          </section>

          <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-5 text-2xl font-bold text-[#172313]">
              Payment Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="bKash Number"
                value={settings.bkashNumber}
                onChange={(e) => updateField("bkashNumber", e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                type="text"
                placeholder="Nagad Number"
                value={settings.nagadNumber}
                onChange={(e) => updateField("nagadNumber", e.target.value)}
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <textarea
                placeholder="Bank Transfer Information"
                value={settings.bankInfo}
                onChange={(e) => updateField("bankInfo", e.target.value)}
                rows={5}
                className="resize-none rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none md:col-span-2"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-6 flex items-center gap-2 rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}