import Icon, { type IconName } from "@/components/icons";

const FEATURES = [
  { icon: "dumbbell", top: "Better", bottom: "Fitness" },
  { icon: "brain", top: "Stronger", bottom: "Mindset" },
  { icon: "mountain", top: "Bigger", bottom: "Goals" },
  { icon: "crown", top: "Real", bottom: "Results" },
] as const satisfies readonly { icon: IconName; top: string; bottom: string }[];

/** The four gold promise badges, divided in a row (two by two on phones). */
export default function FeatureBadges({ className = "" }: { className?: string }) {
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
            {feature.top}
            <br />
            {feature.bottom}
          </span>
        </li>
      ))}
    </ul>
  );
}
