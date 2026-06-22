"use client";

import { useEffect, useState, type ElementType } from "react";
import { onValue, ref, set } from "firebase/database";
import {
  Building2,
  CreditCard,
  MapPin,
  PackageCheck,
  Plus,
  Save,
  Smartphone,
  Trash2,
  Truck,
} from "lucide-react";
import { database } from "@/firebase/config";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber: string;
};

type PaymentSettings = {
  codEnabled: boolean;
  bkashEnabled: boolean;
  nagadEnabled: boolean;
  rocketEnabled: boolean;
  bankEnabled: boolean;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bankInfo: string;
  bankAccounts: BankAccount[];
};

type ShippingSettings = {
  enabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingMinAmount: number;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  noLimitMode: boolean;
};

const defaultPaymentSettings: PaymentSettings = {
  codEnabled: true,
  bkashEnabled: true,
  nagadEnabled: true,
  rocketEnabled: false,
  bankEnabled: false,
  bkashNumber: "",
  nagadNumber: "",
  rocketNumber: "",
  bankInfo: "",
  bankAccounts: [],
};

const defaultShippingSettings: ShippingSettings = {
  enabled: true,
  freeShippingEnabled: true,
  freeShippingMinAmount: 1500,
  insideDhakaCharge: 80,
  outsideDhakaCharge: 120,
  noLimitMode: false,
};

const emptyBankAccount = (): BankAccount => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  bankName: "",
  accountName: "",
  accountNumber: "",
  branch: "",
  routingNumber: "",
});

export default function AdminSettingsPage() {
  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings>(defaultPaymentSettings);

  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings>(defaultShippingSettings);

  const [paymentLoading, setPaymentLoading] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);

  useEffect(() => {
    const paymentRef = ref(database, "settings/payment");

    const unsubscribe = onValue(paymentRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setPaymentSettings({
          ...defaultPaymentSettings,
          ...data,
          bankAccounts: Array.isArray(data.bankAccounts)
            ? data.bankAccounts
            : [],
        });
      } else {
        setPaymentSettings(defaultPaymentSettings);
      }

      setPaymentLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const shippingRef = ref(database, "settings/shipping");

    const unsubscribe = onValue(shippingRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setShippingSettings({
          ...defaultShippingSettings,
          ...data,
          freeShippingMinAmount:
            Number(data.freeShippingMinAmount) ||
            defaultShippingSettings.freeShippingMinAmount,
          insideDhakaCharge:
            Number(data.insideDhakaCharge) ||
            defaultShippingSettings.insideDhakaCharge,
          outsideDhakaCharge:
            Number(data.outsideDhakaCharge) ||
            defaultShippingSettings.outsideDhakaCharge,
        });
      } else {
        setShippingSettings(defaultShippingSettings);
      }

      setShippingLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updatePaymentField = <K extends keyof PaymentSettings>(
    key: K,
    value: PaymentSettings[K]
  ) => {
    setPaymentSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateShippingField = <K extends keyof ShippingSettings>(
    key: K,
    value: ShippingSettings[K]
  ) => {
    setShippingSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addBankAccount = () => {
    setPaymentSettings((prev) => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, emptyBankAccount()],
    }));
  };

  const removeBankAccount = (id: string) => {
    setPaymentSettings((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((account) => account.id !== id),
    }));
  };

  const updateBankAccount = (
    id: string,
    key: keyof BankAccount,
    value: string
  ) => {
    setPaymentSettings((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((account) =>
        account.id === id ? { ...account, [key]: value } : account
      ),
    }));
  };

  const handleSavePayment = async () => {
    try {
      setPaymentSaving(true);

      await set(ref(database, "settings/payment"), {
        ...paymentSettings,
        bankAccounts: paymentSettings.bankAccounts.map((account) => ({
          id: account.id,
          bankName: account.bankName.trim(),
          accountName: account.accountName.trim(),
          accountNumber: account.accountNumber.trim(),
          branch: account.branch.trim(),
          routingNumber: account.routingNumber.trim(),
        })),
        updatedAt: Date.now(),
      });

      alert("Payment settings saved");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleSaveShipping = async () => {
    try {
      setShippingSaving(true);

      await set(ref(database, "settings/shipping"), {
        enabled: Boolean(shippingSettings.enabled),
        freeShippingEnabled: Boolean(shippingSettings.freeShippingEnabled),
        freeShippingMinAmount: Number(shippingSettings.freeShippingMinAmount),
        insideDhakaCharge: Number(shippingSettings.insideDhakaCharge),
        outsideDhakaCharge: Number(shippingSettings.outsideDhakaCharge),
        noLimitMode: Boolean(shippingSettings.noLimitMode),
        updatedAt: Date.now(),
      });

      alert("Shipping settings saved");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setShippingSaving(false);
    }
  };

  const Toggle = ({
    label,
    icon: Icon,
    checked,
    onChange,
    description,
  }: {
    label: string;
    icon: ElementType;
    checked: boolean;
    onChange: () => void;
    description?: string;
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
          {description && (
            <p className="mt-1 text-xs font-semibold text-[#4f5f49]">
              {description}
            </p>
          )}
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

  const NumberInput = ({
    label,
    value,
    onChange,
    disabled,
    placeholder,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    placeholder?: string;
  }) => (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
        {label}
      </label>
      <input
        type="number"
        min={0}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49] focus:border-[#0b3d2e]/30 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );

  const TextInput = ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }) => (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49] focus:border-[#0b3d2e]/30"
      />
    </div>
  );

  const loading = paymentLoading || shippingLoading;

  return (
    <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
        <h1 className="text-3xl font-black text-[#102015] sm:text-4xl">
          Settings
        </h1>

        <p className="mt-2 text-sm font-medium text-[#4f5f49]">
          Control payment and delivery settings from admin panel.
        </p>
      </section>

      {loading ? (
        <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center font-bold text-[#4f5f49] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          Loading settings...
        </section>
      ) : (
        <>
          <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-black text-[#102015]">
                Shipping Settings
              </h2>
              <p className="mt-1 text-sm font-medium text-[#4f5f49]">
                Control Dhaka charge, Outside Dhaka charge, free delivery limit,
                and no limit mode.
              </p>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
              <Toggle
                label="Shipping System"
                icon={Truck}
                checked={shippingSettings.enabled}
                description="OFF হলে সব order free shipping হবে"
                onChange={() =>
                  updateShippingField("enabled", !shippingSettings.enabled)
                }
              />

              <Toggle
                label="Free Shipping"
                icon={PackageCheck}
                checked={shippingSettings.freeShippingEnabled}
                description="Limit cross করলে delivery free"
                onChange={() =>
                  updateShippingField(
                    "freeShippingEnabled",
                    !shippingSettings.freeShippingEnabled
                  )
                }
              />

              <Toggle
                label="No Limit Mode"
                icon={MapPin}
                checked={shippingSettings.noLimitMode}
                description="ON হলে free limit কাজ করবে না"
                onChange={() =>
                  updateShippingField(
                    "noLimitMode",
                    !shippingSettings.noLimitMode
                  )
                }
              />
            </section>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <NumberInput
                label="Free Shipping Limit"
                value={shippingSettings.freeShippingMinAmount}
                disabled={
                  !shippingSettings.enabled ||
                  !shippingSettings.freeShippingEnabled ||
                  shippingSettings.noLimitMode
                }
                placeholder="1500"
                onChange={(value) =>
                  updateShippingField("freeShippingMinAmount", value)
                }
              />

              <NumberInput
                label="Dhaka Delivery Charge"
                value={shippingSettings.insideDhakaCharge}
                disabled={!shippingSettings.enabled}
                placeholder="80"
                onChange={(value) =>
                  updateShippingField("insideDhakaCharge", value)
                }
              />

              <NumberInput
                label="Outside Dhaka Charge"
                value={shippingSettings.outsideDhakaCharge}
                disabled={!shippingSettings.enabled}
                placeholder="120"
                onChange={(value) =>
                  updateShippingField("outsideDhakaCharge", value)
                }
              />
            </div>

            <div className="mt-5 rounded-[6px] bg-[#f5f1e8] p-4 text-sm font-semibold text-[#4f5f49]">
              Current:{" "}
              {shippingSettings.enabled
                ? shippingSettings.noLimitMode ||
                  !shippingSettings.freeShippingEnabled
                  ? `No free shipping. Dhaka ৳${shippingSettings.insideDhakaCharge}, Outside Dhaka ৳${shippingSettings.outsideDhakaCharge}.`
                  : `Free shipping over ৳${shippingSettings.freeShippingMinAmount}. Dhaka ৳${shippingSettings.insideDhakaCharge}, Outside Dhaka ৳${shippingSettings.outsideDhakaCharge}.`
                : "Shipping system OFF. All orders will show free shipping."}
            </div>

            <button
              type="button"
              onClick={handleSaveShipping}
              disabled={shippingSaving}
              className="mt-6 flex items-center gap-2 rounded-[6px] bg-[#003f2a] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#062A18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {shippingSaving ? "Saving..." : "Save Shipping Settings"}
            </button>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Toggle
              label="Cash on Delivery"
              icon={Truck}
              checked={paymentSettings.codEnabled}
              onChange={() =>
                updatePaymentField("codEnabled", !paymentSettings.codEnabled)
              }
            />

            <Toggle
              label="bKash Payment"
              icon={Smartphone}
              checked={paymentSettings.bkashEnabled}
              onChange={() =>
                updatePaymentField(
                  "bkashEnabled",
                  !paymentSettings.bkashEnabled
                )
              }
            />

            <Toggle
              label="Nagad Payment"
              icon={CreditCard}
              checked={paymentSettings.nagadEnabled}
              onChange={() =>
                updatePaymentField(
                  "nagadEnabled",
                  !paymentSettings.nagadEnabled
                )
              }
            />

            <Toggle
              label="Rocket Payment"
              icon={Smartphone}
              checked={paymentSettings.rocketEnabled}
              onChange={() =>
                updatePaymentField(
                  "rocketEnabled",
                  !paymentSettings.rocketEnabled
                )
              }
            />

            <Toggle
              label="Bank Transfer"
              icon={Building2}
              checked={paymentSettings.bankEnabled}
              onChange={() =>
                updatePaymentField("bankEnabled", !paymentSettings.bankEnabled)
              }
            />
          </section>

          <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
            <h2 className="mb-5 text-2xl font-black text-[#102015]">
              Payment Information
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                label="bKash Number"
                placeholder="bKash Number"
                value={paymentSettings.bkashNumber}
                onChange={(value) => updatePaymentField("bkashNumber", value)}
              />

              <TextInput
                label="Nagad Number"
                placeholder="Nagad Number"
                value={paymentSettings.nagadNumber}
                onChange={(value) => updatePaymentField("nagadNumber", value)}
              />

              <TextInput
                label="Rocket Number"
                placeholder="Rocket Number"
                value={paymentSettings.rocketNumber}
                onChange={(value) => updatePaymentField("rocketNumber", value)}
              />
            </div>

            <div className="mt-7 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-[#102015]">
                  Bank Accounts
                </h3>
                <p className="mt-1 text-sm font-medium text-[#4f5f49]">
                  Add multiple bank accounts for bank transfer payment.
                </p>
              </div>

              <button
                type="button"
                onClick={addBankAccount}
                className="flex items-center gap-2 rounded-[6px] bg-[#f5f1e8] px-4 py-3 text-sm font-black text-[#0b3d2e] transition hover:bg-[#ece5d6]"
              >
                <Plus size={16} />
                Add Bank
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {paymentSettings.bankAccounts.length === 0 ? (
                <div className="rounded-[6px] border border-dashed border-[#0b3d2e]/20 bg-[#fafaf7] p-5 text-sm font-semibold text-[#4f5f49]">
                  No bank account added yet.
                </div>
              ) : (
                paymentSettings.bankAccounts.map((account, index) => (
                  <div
                    key={account.id}
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-black text-[#102015]">
                        Bank Account #{index + 1}
                      </h4>

                      <button
                        type="button"
                        onClick={() => removeBankAccount(account.id)}
                        className="flex items-center gap-2 rounded-[6px] bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        label="Bank Name"
                        placeholder="Example: Dutch-Bangla Bank"
                        value={account.bankName}
                        onChange={(value) =>
                          updateBankAccount(account.id, "bankName", value)
                        }
                      />

                      <TextInput
                        label="Account Name"
                        placeholder="Example: ZAYY Care"
                        value={account.accountName}
                        onChange={(value) =>
                          updateBankAccount(account.id, "accountName", value)
                        }
                      />

                      <TextInput
                        label="Account Number"
                        placeholder="Account Number"
                        value={account.accountNumber}
                        onChange={(value) =>
                          updateBankAccount(account.id, "accountNumber", value)
                        }
                      />

                      <TextInput
                        label="Branch"
                        placeholder="Branch Name"
                        value={account.branch}
                        onChange={(value) =>
                          updateBankAccount(account.id, "branch", value)
                        }
                      />

                      <div className="md:col-span-2">
                        <TextInput
                          label="Routing Number"
                          placeholder="Routing Number"
                          value={account.routingNumber}
                          onChange={(value) =>
                            updateBankAccount(account.id, "routingNumber", value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleSavePayment}
              disabled={paymentSaving}
              className="mt-6 flex items-center gap-2 rounded-[6px] bg-[#003f2a] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#062A18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {paymentSaving ? "Saving..." : "Save Payment Settings"}
            </button>
          </section>
        </>
      )}
    </main>
  );
}