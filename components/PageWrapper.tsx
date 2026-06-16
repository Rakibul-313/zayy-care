"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{
        type: "spring",
        stiffness: 70,
        damping: 20,
        mass: 0.9,
      }}
    >
      {children}
    </motion.div>
  );
}