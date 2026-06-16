"use client";

import { useEffect, useState, type ElementType } from "react";
import { onValue, ref, set } from "firebase/database";
import { Building2, CreditCard, Save, Smartphone, Truck } from "lucide-react";
import { database } from "@/firebase/config";

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
      } else {
        setSettings(defaultSettings);
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
      await set(ref(database, "settings/payment"), {
        ...settings,
        updatedAt: Date.now(),
      });
      alert("Payment settings saved");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save settings");
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
    icon: ElementType;
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center justify-between gap-4 rounded-[6px] border p-5 text-left shadow-[0_8px_24px_rgba(11,61,46,0.06)] transition ${
        checked
          ? "border-[#0b3d2e]/25 bg-[#f5f1e8]"
          : "border-[#0b3d2e]/10 bg-white hover:bg-[#f5f1e8]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] bg-white text-[#0b3d2e]">
          <Icon size={24} />
        </div>

        <div className="min-w-0">
          <h3 className="font-black text-[#102015]">{label}</h3>
          <p
            className={`mt-1 text-xs font-bold ${
              checked ? "text-green-700" : "text-red-700"
            }`}
          >
            {checked ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>

      <span
        className={`flex h-8 w-14 shrink-0 items-center rounded-[6px] p-1 transition ${
          checked ? "bg-[#003f2a]" : "bg-red-50"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-[6px] bg-white shadow-sm transition ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );

  return (
    <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
        <h1 className="text-3xl font-black text-[#102015] sm:text-4xl">
          Payment Settings
        </h1>

        <p className="mt-2 text-sm font-medium text-[#4f5f49]">
          Control checkout payment methods from admin panel.
        </p>
      </section>

      {loading ? (
        <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center font-bold text-[#4f5f49] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          Loading settings...
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2">
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

          <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
            <h2 className="mb-5 text-2xl font-black text-[#102015]">
              Payment Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                  bKash Number
                </label>
                <input
                  type="text"
                  placeholder="bKash Number"
                  value={settings.bkashNumber}
                  onChange={(e) => updateField("bkashNumber", e.target.value)}
                  className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49] focus:border-[#0b3d2e]/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                  Nagad Number
                </label>
                <input
                  type="text"
                  placeholder="Nagad Number"
                  value={settings.nagadNumber}
                  onChange={(e) => updateField("nagadNumber", e.target.value)}
                  className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49] focus:border-[#0b3d2e]/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                  Bank Transfer Information
                </label>
                <textarea
                  placeholder="Bank Transfer Information"
                  value={settings.bankInfo}
                  onChange={(e) => updateField("bankInfo", e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49] focus:border-[#0b3d2e]/30"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-6 flex items-center gap-2 rounded-[6px] bg-[#003f2a] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#062A18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </section>
        </>
      )}
    </main>
  );
}