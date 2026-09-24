"use client";

import Icon, { type IconName } from "@/components/icons";
import { useT, type StringKey } from "@/lib/i18n";

const FEATURES = [
  { icon: "dumbbell", top: "badge.b1.top", bottom: "badge.b1.bottom" },
  { icon: "brain", top: "badge.b2.top", bottom: "badge.b2.bottom" },
  { icon: "mountain", top: "badge.b3.top", bottom: "badge.b3.bottom" },
  { icon: "crown", top: "badge.b4.top", bottom: "badge.b4.bottom" },
] as const satisfies readonly {
  icon: IconName;
  top: StringKey;
  bottom: StringKey;
}[];

/** The four gold promise badges, divided in a row (two by two on phones). */
export default function FeatureBadges({
  className = "",
}: {
  className?: string;
}) {
  const t = useT();

  return (
    <ul
      className={`grid grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-y-0 ${className}`}
    >
      {FEATURES.map((feature, index) => (
        <li
          key={feature.top}
          className={`flex flex-col items-center gap-3 px-2 text-center ${
            index > 0 ? "sm:border-l sm:border-white/10" : ""
          }`}
        >
          <Icon name={feature.icon} className="h-7 w-7 text-[#e0b54a]" />

          <span className="text-[10px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-white/80">
            {t(feature.top)}
            <br />
            {t(feature.bottom)}
          </span>
        </li>
      ))}
    </ul>
  );
}
