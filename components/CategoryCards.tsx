"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase/config";

type CategoryItem = {
  title: string;
  href: string;
  image: string;
};

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  return src;
}

export default function CategoryCards() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setCategories([
          {
            title: "All Products",
            href: "/shop",
            image: "/products/p1.png",
          },
        ]);
        return;
      }

      const categoryMap = new Map<string, CategoryItem>();

      Object.values(data).forEach((value: any) => {
        const category = String(value?.category || "").trim();

        if (!category) return;
        if (value?.deleted === true) return;
        if (value?.active === false) return;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            title: category,
            href: `/shop?category=${encodeURIComponent(category)}`,
            image: safeImage(value?.image || value?.imageUrl),
          });
        }
      });

      const finalCategories = Array.from(categoryMap.values());

      finalCategories.push({
        title: "All Products",
        href: "/shop",
        image: finalCategories[0]?.image || "/products/p1.png",
      });

      setCategories(finalCategories);
    });

    return () => unsubscribe();
  }, []);

  const visibleCategories = useMemo(() => categories.slice(0, 10), [categories]);

  return (
    <section className="w-full px-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[1820px]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dream-font text-[38px] leading-none text-[#142012] sm:text-[48px]">
            Shop by Category <span className="text-[#556B2F]">+</span>
          </h2>

          <Link
            href="/shop"
            className="flex items-center gap-2 text-[12px] font-bold text-[#0b3d2e] sm:text-sm"
          >
            View all
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f5f1e8]">
              ›
            </span>
          </Link>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex min-w-max items-start gap-5 sm:gap-7 lg:min-w-0 lg:justify-start">
            {visibleCategories.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex w-[86px] shrink-0 flex-col items-center text-center sm:w-[105px]"
              >
                <div className="h-[76px] w-[76px] overflow-hidden rounded-full bg-[#f5f1e8] shadow-[0_10px_28px_rgba(11,61,46,0.08)] transition group-hover:-translate-y-1 sm:h-[92px] sm:w-[92px]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <p className="mt-3 text-[11px] font-bold text-[#102015] sm:text-[13px]">
                  {item.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}