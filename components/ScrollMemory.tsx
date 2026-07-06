"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollMemory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const fullPath = `${pathname}?${searchParams.toString()}`;
    const key = `zayy-scroll:${fullPath}`;

    const restoreScroll = () => {
      const saved = sessionStorage.getItem(key);
      if (!saved) return;

      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo({
            top: Number(saved),
            left: 0,
            behavior: "auto",
          });
        }, 150);
      });
    };

    restoreScroll();

    const saveScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("beforeunload", saveScroll);

    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("beforeunload", saveScroll);
    };
  }, [pathname, searchParams]);

  return null;
}