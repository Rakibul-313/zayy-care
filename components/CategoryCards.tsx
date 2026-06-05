import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  PackagePlus,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";

const cards = [
  {
    icon: Sparkles,
    title: "Skin Quiz",
    text: "Find your perfect skincare match",
    href: "/skin-quiz",
    image: null,
  },
  {
    icon: Leaf,
    title: "Shop by Concern",
    text: "Target your skin problem",
    href: "/shop",
    image: "/products/p1.png",
  },
  {
    icon: WandSparkles,
    title: "Routine Builder",
    text: "Build your perfect skincare routine",
    href: "/routine-builder",
    image: "/products/p3.png",
  },
  {
    icon: PackagePlus,
    title: "New Arrivals",
    text: "Discover the latest products",
    href: "/shop",
    image: "/products/p4.png",
  },
  {
    icon: Star,
    title: "Best Sellers",
    text: "Our customer favorite picks",
    href: "/shop",
    image: "/products/p2.png",
  },
];

export default function CategoryCards() {
  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[1820px] overflow-x-auto pb-1 scrollbar-hide">
        <div className="grid min-w-max grid-cols-5 gap-5 lg:min-w-0">
          {cards.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="glass group relative h-[174px] w-[265px] overflow-hidden rounded-[28px] p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(31,43,20,0.18)] lg:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
          

                <div className="relative z-10 flex h-full flex-col items-start">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/45 text-[#31571f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                    <Icon size={24} />
                  </span>

                  <h3 className="dream-font text-[28px] leading-none text-[#142012]">
                    {item.title}
                  </h3>

                  <p className="mt-3 max-w-[155px] text-sm leading-5 text-[#263421]">
                    {item.text}
                  </p>

                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-[#31571f]">
                    {item.title === "Skin Quiz" ? "Start Quiz" : "Shop Now"}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
