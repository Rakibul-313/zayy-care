"use client";

import { useEffect } from "react";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureBar from "@/components/FeatureBar";
import CategoryCards from "@/components/CategoryCards";
import ProductSection from "@/components/ProductSection";
import BrandStrip from "@/components/BrandStrip";
import HomeShowcase from "@/components/HomeShowcase";
import Footer from "@/components/Footer";
import FeaturedProducts from "@/components/FeaturedProducts";
import TestimonialsSection from "@/components/TestimonialsSection";
import NewsletterSection from "@/components/NewsletterSection";


export default function Home() {
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.15 }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/nature-bg.png')",
        }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/60 backdrop-blur-[2px]" />

      <div className="relative z-10">
        <Navbar homePremium />

        <div className="pt-[160px] pb-10 space-y-8">
          <section className="reveal">
            <Hero />
          </section>

          <section className="reveal">
            <FeatureBar />
          </section>

          <section className="reveal">
            <CategoryCards />
          </section>

          <section className="reveal">
            <ProductSection />
          </section>

          <section className="reveal">
              <FeaturedProducts />
          </section>



          <section className="reveal">
            <TestimonialsSection />
          </section>

          <section className="reveal">
            <BrandStrip />
          </section>

          <section className="reveal ">
            <HomeShowcase />
          </section>

          <NewsletterSection />

          <section className="reveal">
            <Footer />
          </section>
        </div>
      </div>
    </main>
  );
}