"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ScrollMemoryContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `scroll-position:${pathname}?${searchParams.toString()}`;

    const savedPosition = sessionStorage.getItem(key);

    if (savedPosition) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: Number(savedPosition),
          behavior: "auto",
        });
      });
    }

    const saveScrollPosition = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener("beforeunload", saveScrollPosition);

    return () => {
      saveScrollPosition();
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, [pathname, searchParams]);

  return null;
}

export default function ScrollMemory() {
  return (
    <Suspense fallback={null}>
      <ScrollMemoryContent />
    </Suspense>
  );
}