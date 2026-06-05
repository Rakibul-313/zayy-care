"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";

type Brand = {
  id: string;
  name?: string;
  logo?: string;
  active?: boolean;
};

const fallbackBrands: Brand[] = [
  { id: "1", name: "Anua", logo: "/brands/anua.png", active: true },
  { id: "2", name: "COSRX", logo: "/brands/cosrx.png", active: true },
  { id: "3", name: "AXIS-Y", logo: "/brands/axis-y.png", active: true },
  {
    id: "4",
    name: "Beauty of Joseon",
    logo: "/brands/beauty-of-joseon.png",
    active: true,
  },
  { id: "5", name: "SKIN1004", logo: "/brands/skin1004.png", active: true },
  { id: "6", name: "iUNIK", logo: "/brands/iunik.png", active: true },
];

function safeLogo(logo?: string) {
  if (!logo || logo.trim() === "") return "/logo.png";

  let path = logo.trim();

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("public/")) {
    path = path.replace("public", "");
  }

  if (path.startsWith("/public/")) {
    path = path.replace("/public", "");
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return path;
}

export default function BrandStrip() {
  const [brands, setBrands] = useState<Brand[]>(fallbackBrands);

  useEffect(() => {
    const brandsRef = ref(database, "brands");

    const unsubscribe = onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setBrands(fallbackBrands);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          name: value.name || "Brand",
          logo: safeLogo(value.logo),
          active: value.active !== false,
        }))
        .filter((brand) => brand.active);

      setBrands(loaded.length > 0 ? loaded : fallbackBrands);
    });

    return () => unsubscribe();
  }, []);

  const loopBrands = [...brands, ...brands];

  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[1820px]">
        <div className="mb-4 flex items-center justify-center gap-3 text-center">
          <span className="text-[#556B2F]">+</span>
          <h2 className="dream-font text-[30px] leading-none text-[#142012]">
            Popular Brands
          </h2>
          <span className="text-[#556B2F]">+</span>
        </div>

        <div className="brand-marquee">
          <div className="brand-marquee-track">
            {loopBrands.map((brand, index) => (
              <Link
                key={`${brand.id}-${index}`}
                href="/brands"
                className="brand-track flex h-[86px] min-w-[190px] flex-col items-center justify-center rounded-2xl px-5 shadow-[0_14px_34px_rgba(31,43,20,0.12)] transition hover:-translate-y-1"
              >
                <div className="relative h-[34px] w-[132px]">
                  <Image
                    src={safeLogo(brand.logo)}
                    alt={brand.name || "Brand"}
                    fill
                    sizes="132px"
                    className="object-contain"
                  />
                </div>

                <p className="mt-2 text-center text-xs font-bold text-[#142012]">
                  {brand.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}