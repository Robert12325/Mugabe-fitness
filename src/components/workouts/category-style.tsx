import type { CSSProperties, ReactNode } from "react";
import type { CategorySlug } from "@mugabe/fitness-content";

/**
 * Each category's accent and hero artwork. The accents are all warm golds
 * and coppers so the eight pages read as one family on black.
 *
 * The artwork is abstract on purpose: lines and shapes that suggest the
 * kind of training, never equipment or a person, so it can't be mistaken
 * for a demonstration and suits both the equipment and no-equipment modes.
 * It is decorative and hidden from screen readers.
 */
type CategoryStyle = { accent: string; art: (accent: string) => ReactNode };

const STYLES: Record<CategorySlug, CategoryStyle> = {
  // Pressing: broad bands pushing outward from a centre line.
  chest: {
    accent: "#e0b54a",
    art: (a) => (
      <>
        <line x1="200" y1="40" x2="200" y2="220" stroke={a} strokeOpacity="0.35" strokeWidth="2" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} opacity={1 - i * 0.2}>
            <path d={`M${170 - i * 34} ${70 + i * 6} Q${120 - i * 34} 130 ${170 - i * 34} ${190 - i * 6}`} stroke={a} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d={`M${230 + i * 34} ${70 + i * 6} Q${280 + i * 34} 130 ${230 + i * 34} ${190 - i * 6}`} stroke={a} strokeWidth="6" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </>
    ),
  },
  // Pulling: tall lines tapering into a V.
  back: {
    accent: "#c98a4b",
    art: (a) => (
      <>
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={200 + i * 30}
            y1="30"
            x2={200 + i * 9}
            y2="230"
            stroke={a}
            strokeOpacity={0.9 - Math.abs(i) * 0.17}
            strokeWidth={i === 0 ? 5 : 3}
            strokeLinecap="round"
          />
        ))}
      </>
    ),
  },
  // Three directions around one joint: front, side and rear.
  shoulders: {
    accent: "#d9c27e",
    art: (a) => (
      <>
        <circle cx="200" cy="130" r="26" fill={a} fillOpacity="0.9" />
        {[64, 98, 132].map((r, i) => (
          <path
            key={r}
            d={`M${200 - r} 130 A${r} ${r} 0 0 1 ${200 + r} 130`}
            stroke={a}
            strokeOpacity={0.85 - i * 0.22}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </>
    ),
  },
  // Bend and straighten: two opposing curves.
  "biceps-triceps": {
    accent: "#e8a55a",
    art: (a) => <ArmArt accent={a} />,
  },
  arms: {
    accent: "#e8a55a",
    art: (a) => <ArmArt accent={a} />,
  },
  // A broad, grounded base: columns on a heavy floor line.
  "legs-glutes": {
    accent: "#c7a43c",
    art: (a) => (
      <>
        <rect x="70" y="214" width="260" height="8" rx="4" fill={a} />
        {[120, 160, 240, 280].map((x, i) => (
          <rect key={x} x={x - 9} y={60 + (i % 2) * 24} width="18" height={154 - (i % 2) * 24} rx="9" fill={a} fillOpacity={i === 1 || i === 2 ? 0.95 : 0.45} />
        ))}
      </>
    ),
  },
  // Stability: still, concentric rings.
  "abs-core": {
    accent: "#eed89a",
    art: (a) => (
      <>
        {[20, 46, 72, 98].map((r, i) => (
          <circle key={r} cx="200" cy="130" r={r} stroke={a} strokeOpacity={0.95 - i * 0.22} strokeWidth={i === 0 ? 8 : 3} fill="none" />
        ))}
      </>
    ),
  },
  // Many parts moving at once: crossing diagonals.
  "full-body": {
    accent: "#dd8a3e",
    art: (a) => (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`a${i}`} x1={70 + i * 50} y1="220" x2={150 + i * 50} y2="40" stroke={a} strokeOpacity={0.35 + i * 0.13} strokeWidth="5" strokeLinecap="round" />
        ))}
        <circle cx="300" cy="62" r="14" fill={a} />
      </>
    ),
  },
  // Effort and recovery: a pulse line.
  "cardio-conditioning": {
    accent: "#f07a45",
    art: (a) => (
      <>
        <path
          d="M30 140 H120 L140 100 L162 190 L188 60 L212 200 L234 120 L250 140 H370"
          stroke={a}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="30" y1="140" x2="370" y2="140" stroke={a} strokeOpacity="0.2" strokeWidth="2" />
      </>
    ),
  },
};

function ArmArt({ accent }: { accent: string }) {
  return (
    <>
      <path d="M110 200 Q110 80 200 80" stroke={accent} strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M200 80 Q290 80 290 200" stroke={accent} strokeOpacity="0.45" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="200" cy="80" r="14" fill={accent} />
      <path d="M150 210 H250" stroke={accent} strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

export function categoryAccent(slug: CategorySlug) {
  return STYLES[slug].accent;
}

/** The category's accent as a CSS variable, for Tailwind's `var(--accent)` utilities. */
export function accentVars(slug: CategorySlug): CSSProperties {
  return { "--accent": STYLES[slug].accent } as CSSProperties;
}

/** The hero artwork. Decorative: hidden from screen readers. */
export function CategoryArt({ slug, className }: { slug: CategorySlug; className?: string }) {
  const { accent, art } = STYLES[slug];

  return (
    <svg viewBox="0 0 400 260" className={className} aria-hidden="true" focusable="false" data-testid="category-art">
      {art(accent)}
    </svg>
  );
}
