import { Heart, ShieldCheck, Truck } from "lucide-react";

const promoItems = [
  {
    icon: Truck,
    text: "Free Delivery on orders over ৳1,500",
  },
  {
    icon: ShieldCheck,
    text: "100% Authentic Korean Skincare",
  },
  {
    icon: Heart,
    text: "Loved by 10,000+ Customers",
  },
];

export default function TopBar() {
  return (
    <div className="hidden grid-cols-3 items-center gap-6 text-[15px] font-semibold text-white drop-shadow-[0_1px_8px_rgba(20,32,18,0.45)] lg:grid">
      {promoItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={item.text}
            className={`flex ${
              index === 0
                ? "justify-start"
                : index === 1
                  ? "justify-center"
                  : "justify-end"
            }`}
          >
            <span className="inline-flex h-7 min-w-[260px] items-center justify-center gap-2 rounded-full border border-white/25 bg-[#31571f]/18 px-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-xl">
              <Icon
                size={16}
                className="text-[#d9ff7a]"
                fill={index === 2 ? "currentColor" : "none"}
              />
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
