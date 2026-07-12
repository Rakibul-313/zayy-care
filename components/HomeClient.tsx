"use client";

import { motion } from "framer-motion";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureBar from "@/components/FeatureBar";
import CategoryCards from "@/components/CategoryCards";
import ProductSection from "@/components/ProductSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import FlashSaleSection from "@/components/FlashSaleSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BrandStrip from "@/components/BrandStrip";
import HomeShowcase from "@/components/HomeShowcase";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const sectionAnimation = {
  initial: {
    opacity: 0,
    y: 24,
  },
  whileInView: {
    opacity: 1,
    y: 0,
  },
  viewport: {
    once: true,
    amount: 0.15,
  },
  transition: {
    type: "spring" as const,
    stiffness: 80,
    damping: 20,
  },
};

function HomeClient() {
  return (
    <>
      <Navbar homePremium />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 80,
          damping: 20,
        }}
        className="min-h-screen bg-[#FAFAF7]"
      >
        <div className="space-y-10 pb-10 pt-[110px]">
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 80,
              damping: 20,
              delay: 0.1,
            }}
          >
            <Hero />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <FeatureBar />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <CategoryCards />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <ProductSection />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <FeaturedProducts />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <FlashSaleSection />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <TestimonialsSection />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <BrandStrip />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <HomeShowcase />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <NewsletterSection />
          </motion.section>

          <motion.section {...sectionAnimation}>
            <Footer />
          </motion.section>
        </div>
      </motion.main>
    </>
  );
}

export default HomeClient;