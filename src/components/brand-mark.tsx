import { useId } from "react";

const TONES = {
  /** The admin's metallic gold. */
  gold: ["#f8df8a", "#d4af37", "#8c6a17"],
  /** The brighter yellow of the public site's header and hero. */
  yellow: ["#fff08a", "#f5c518", "#b98a00"],
} as const;

/** The "M" monogram. */
export default function BrandMark({
  className = "h-12 w-12",
  tone = "gold",
}: {
  className?: string;
  tone?: keyof typeof TONES;
}) {
  // useId can contain characters that break a url(#…) reference.
  const gradient = `mark-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  const [light, mid, dark] = TONES[tone];

  return (
    <svg viewBox="0 0 48 48" aria-hidden focusable="false" className={className}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>

      <path
        d="M4 41V9.6a1.6 1.6 0 0 1 2.6-1.3L24 21.6 41.4 8.3A1.6 1.6 0 0 1 44 9.6V41h-9V25l-9.6 7.4a2.3 2.3 0 0 1-2.8 0L13 25v16z"
        fill={`url(#${gradient})`}
      />

      <path
        d="M13 25 24 33.5 35 25"
        fill="none"
        stroke="#000"
        strokeOpacity="0.35"
        strokeWidth="1.4"
      />
    </svg>
  );
}
