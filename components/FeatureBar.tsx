"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Truck, ShieldCheck, RefreshCcw } from "lucide-react";
import { onValue, ref } from "firebase/database";

import { database } from "@/firebase/config";

type ShippingSettings = {
  enabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingMinAmount: number;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  noLimitMode: boolean;
};

const defaultShippingSettings: ShippingSettings = {
  enabled: true,
  freeShippingEnabled: true,
  freeShippingMinAmount: 1500,
  insideDhakaCharge: 80,
  outsideDhakaCharge: 120,
  noLimitMode: false,
};

const taka = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

function formatPrice(price?: number) {
  return `৳${taka.format(Number(price || 0))}`;
}

export default function FeatureBar() {
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings>(defaultShippingSettings);

  useEffect(() => {
    const shippingRef = ref(database, "settings/shipping");

    const unsubscribe = onValue(shippingRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setShippingSettings(defaultShippingSettings);
        return;
      }

      setShippingSettings({
        enabled:
          typeof data.enabled === "boolean"
            ? data.enabled
            : defaultShippingSettings.enabled,

        freeShippingEnabled:
          typeof data.freeShippingEnabled === "boolean"
            ? data.freeShippingEnabled
            : defaultShippingSettings.freeShippingEnabled,

        freeShippingMinAmount:
          Number(data.freeShippingMinAmount) ||
          defaultShippingSettings.freeShippingMinAmount,

        insideDhakaCharge:
          Number(data.insideDhakaCharge) ||
          defaultShippingSettings.insideDhakaCharge,

        outsideDhakaCharge:
          Number(data.outsideDhakaCharge) ||
          defaultShippingSettings.outsideDhakaCharge,

        noLimitMode:
          typeof data.noLimitMode === "boolean"
            ? data.noLimitMode
            : defaultShippingSettings.noLimitMode,
      });
    });

    return () => unsubscribe();
  }, []);

  const deliveryText = useMemo(() => {
    if (!shippingSettings.enabled) {
      return "Free for all orders";
    }

    if (
      shippingSettings.freeShippingEnabled &&
      !shippingSettings.noLimitMode
    ) {
      return `on orders over ${formatPrice(
        shippingSettings.freeShippingMinAmount
      )}`;
    }

    return `Dhaka ${formatPrice(
      shippingSettings.insideDhakaCharge
    )} / Outside ${formatPrice(shippingSettings.outsideDhakaCharge)}`;
  }, [shippingSettings]);

  const features = [
    { icon: Award, title: "100% Authentic", text: "Korean Products" },
    { icon: Truck, title: "Delivery Charge", text: deliveryText },
    { icon: ShieldCheck, title: "Secure Payment", text: "100% Safe Checkout" },
    { icon: RefreshCcw, title: "Easy Returns", text: "7 Day Returns" },
  ];

  return (
    <section className="w-full px-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-2 py-4 shadow-[0_12px_38px_rgba(5,35,20,0.28)]">
        <div className="grid w-full grid-cols-4 divide-x divide-white/10">
          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex min-w-0 flex-col items-center justify-center px-1 text-center sm:px-3"
              >
                <Icon className="mb-1 h-4 w-4 text-[#f5f1e8] sm:h-5 sm:w-5" />

                <h3 className="whitespace-nowrap text-[8px] font-semibold leading-tight text-white sm:text-[11px] lg:text-[13px]">
                  {item.title}
                </h3>

                <p className="mt-0.5 whitespace-nowrap text-[6px] leading-tight text-white/70 sm:text-[9px] lg:text-[11px]">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}