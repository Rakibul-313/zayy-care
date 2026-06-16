import { Award, Truck, ShieldCheck, RefreshCcw } from "lucide-react";

const features = [
  { icon: Award, title: "100% Authentic", text: "Korean Products" },
  { icon: Truck, title: "Free Delivery", text: "on orders over ৳1500" },
  { icon: ShieldCheck, title: "Secure Payment", text: "100% Safe Checkout" },
  { icon: RefreshCcw, title: "Easy Returns", text: "7 Day Returns" },
];

export default function FeatureBar() {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-2 py-4 shadow-[0_12px_38px_rgba(5,35,20,0.28)]">
        <div className="grid w-full grid-cols-4 divide-x divide-white/10">
          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex min-w-0 flex-col items-center justify-center px-1 text-center sm:px-3"
              >
                <Icon className="mb-1 h-4 w-4 text-[#f5f1e8] sm:h-5 sm:w-5" />

                <h3 className="whitespace-nowrap text-[8px] font-semibold leading-tight text-white sm:text-[11px] lg:text-[13px]">
                  {item.title}
                </h3>

                <p className="mt-0.5 whitespace-nowrap text-[6px] leading-tight text-white/70 sm:text-[9px] lg:text-[11px]">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}