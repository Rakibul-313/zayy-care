"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Globe2,
  Truck,
  ShieldCheck,
  Headphones,
} from "lucide-react";
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

type FeatureItem = {
  icon: typeof Globe2;
  title: string;
  text: string;
};

const defaultShippingSettings: ShippingSettings = {
  enabled: true,
  freeShippingEnabled: true,
  freeShippingMinAmount: 1500,
  insideDhakaCharge: 80,
  outsideDhakaCharge: 120,
  noLimitMode: false,
};

const takaFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

function formatPrice(price?: number) {
  return `৳${takaFormatter.format(Number(price || 0))}`;
}

export default function FeatureBar() {
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings>(defaultShippingSettings);

  useEffect(() => {
    const shippingRef = ref(database, "settings/shipping");

    const unsubscribe = onValue(
      shippingRef,
      (snapshot) => {
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
      },
      () => {
        setShippingSettings(defaultShippingSettings);
      }
    );

    return () => unsubscribe();
  }, []);

  const deliveryFeature = useMemo<FeatureItem>(() => {
    if (!shippingSettings.enabled) {
      return {
        icon: Truck,
        title: "Free Delivery",
        text: "Available on all orders",
      };
    }

    if (
      shippingSettings.freeShippingEnabled &&
      !shippingSettings.noLimitMode
    ) {
      return {
        icon: Truck,
        title: "Free Delivery",
        text: `On orders over ${formatPrice(
          shippingSettings.freeShippingMinAmount
        )}`,
      };
    }

    if (
      shippingSettings.freeShippingEnabled &&
      shippingSettings.noLimitMode
    ) {
      return {
        icon: Truck,
        title: "Free Delivery",
        text: "Available on all orders",
      };
    }

    return {
      icon: Truck,
      title: "Nationwide Delivery",
      text: `Dhaka ${formatPrice(
        shippingSettings.insideDhakaCharge
      )} / Outside ${formatPrice(
        shippingSettings.outsideDhakaCharge
      )}`,
    };
  }, [shippingSettings]);

  const features: FeatureItem[] = [
    {
      icon: Globe2,
      title: "International Brands",
      text: "Global skincare collection",
    },
    deliveryFeature,
    {
      icon: ShieldCheck,
      title: "Secure Checkout",
      text: "Safe payment options",
    },
    {
      icon: Headphones,
      title: "Customer Support",
      text: "We are here to help",
    },
  ];

  return (
    <section
      aria-label="Store benefits"
      className="w-full px-4 sm:px-8 lg:px-14"
    >
      <div className="mx-auto w-full rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-2 py-4 shadow-[0_12px_38px_rgba(5,35,20,0.28)]">
        <div className="grid w-full grid-cols-4 divide-x divide-white/10">
          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex min-w-0 flex-col items-center justify-center px-1 text-center sm:px-3"
              >
                <Icon
                  aria-hidden="true"
                  className="mb-1 h-4 w-4 shrink-0 text-[#f5f1e8] sm:h-5 sm:w-5"
                />

                <h3 className="max-w-full whitespace-nowrap text-[8px] font-semibold leading-tight text-white sm:text-[11px] lg:text-[13px]">
                  {item.title}
                </h3>

                <p className="mt-0.5 max-w-full whitespace-nowrap text-[6px] leading-tight text-white/70 sm:text-[9px] lg:text-[11px]">
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