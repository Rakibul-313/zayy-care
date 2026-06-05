import { defaultTrustBadges } from "@/lib/design-system";
import TrustBadge from "@/components/ui/TrustBadge";

export default function FeatureBar() {
  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="glass mx-auto w-full max-w-[1820px] rounded-[30px] px-5 py-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {defaultTrustBadges.map((item) => (
            <TrustBadge
              key={item.title}
              icon={item.icon}
              title={item.title}
              text={item.text}
              className="lg:border-r lg:border-white/35 lg:last:border-r-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
