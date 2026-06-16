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

  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  if (path.startsWith("public/")) path = path.replace("public", "");
  if (path.startsWith("/public/")) path = path.replace("/public", "");
  if (!path.startsWith("/")) path = `/${path}`;

  return path;
}

export default function BrandStrip() {
  const [brands, setBrands] = useState<Brand[]>(fallbackBrands);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "brands"), (snapshot) => {
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
      <div className="mx-auto w-full max-w-[1820px] ">
        <div className="mb-5 flex items-center justify-center gap-3 text-center">
          <span className="text-[#556B2F]">+</span>
          <h2 className="dream-font text-[36px] leading-none text-[#142012] sm:text-[48px]">
            Popular Brands
          </h2>
          <span className="text-[#556B2F]">+</span>
        </div>

        <div className="brand-marquee ">
          <div className="brand-marquee-track ">
            {loopBrands.map((brand, index) => (
              <Link
                key={`${brand.id}-${index}`}
                href="/brands"
                aria-label={brand.name || "Brand"}
                className="brand-track flex h-[64px] min-w-[170px] items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 shadow-[0_8px_24px_rgba(11,61,46,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(11,61,46,0.12)]"
              >
                <div className="relative h-[34px] w-[130px] ">
                  <Image
                    src={safeLogo(brand.logo)}
                    alt={brand.name || "Brand"}
                    fill
                    sizes="130px"
                    className="object-contain"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}