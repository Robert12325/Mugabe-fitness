import type { ReactNode } from "react";

/**
 * The site's icon set: 24px grid, 1.8px strokes, drawn in currentColor so an
 * icon always takes the colour of the text around it. Inline rather than a
 * dependency — the site only needs a few dozen.
 *
 * A few have a `solid` form, used where the brand artwork fills them in.
 */

const GEAR =
  "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

/** Punched-out details on solid icons use the dark surface colour. */
const CUTOUT = "#0c0a06";

const ICONS = {
  home: () => (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  user: () => (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: () => (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18.5 14.2a6.5 6.5 0 0 1 3 5.8" />
    </>
  ),
  card: () => (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6.5 15h4" />
    </>
  ),
  calendar: () => (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4" />
      <path d="M16 2.5v4" />
    </>
  ),
  dumbbell: () => (
    <>
      <rect x="5" y="6" width="3" height="12" rx="1" />
      <rect x="16" y="6" width="3" height="12" rx="1" />
      <path d="M2.5 9.5v5" />
      <path d="M21.5 9.5v5" />
      <path d="M8 12h8" />
    </>
  ),
  gear: (solid: boolean) =>
    solid ? (
      <>
        <path d={GEAR} fill="currentColor" />
        <circle cx="12" cy="12" r="3" fill={CUTOUT} stroke={CUTOUT} />
      </>
    ) : (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d={GEAR} />
      </>
    ),
  eye: () => (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  lock: (solid: boolean) =>
    solid ? (
      <>
        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        <rect x="4.5" y="10.5" width="15" height="11" rx="2.5" fill="currentColor" />
        <circle cx="12" cy="16" r="1.7" fill={CUTOUT} stroke="none" />
      </>
    ) : (
      <>
        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        <rect x="4.5" y="10.5" width="15" height="11" rx="2.5" />
      </>
    ),
  tag: () => (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  crown: (solid: boolean) => (
    <>
      <path
        d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10.5H5L3 8z"
        fill={solid ? "currentColor" : "none"}
      />
      <path d="M5 21h14" />
    </>
  ),
  bolt: (solid: boolean) => (
    <path
      d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"
      fill={solid ? "currentColor" : "none"}
    />
  ),
  mail: () => (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 6.5 9 6.5 9-6.5" />
    </>
  ),
  phone: () => (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z" />
  ),
  shield: () => (
    <>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 9.4 8 10.5 4.6-1.1 8-5.5 8-10.5v-6l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  chart: () => (
    <>
      <path d="M3 3v18h18" />
      <path d="M8 17v-5" />
      <path d="M13 17V8" />
      <path d="M18 17v-9" />
    </>
  ),
  image: () => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  video: () => (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 10 6-3.5v11l-6-3.5" />
    </>
  ),
  qr: () => (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3z" />
      <path d="M20 14v.01" />
      <path d="M14 20.5h.01" />
      <path d="M17.5 17.5H21V21h-3.5z" />
    </>
  ),
  database: () => (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  plus: () => (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  rupee: () => (
    <>
      <path d="M6 4h12" />
      <path d="M6 9h12" />
      <path d="M6 4h3.5a5 5 0 0 1 0 10H6l8 7" />
    </>
  ),
  trend: () => (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  check: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  clock: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alert: () => (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  target: () => (
    <>
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4" />
      <path d="m11 13 9-9" />
      <path d="M16.5 3.5H20v3.5" />
    </>
  ),
  chat: () => (
    <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />
  ),
  send: () => (
    <>
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </>
  ),
  brain: () => (
    <>
      <path d="M12 5a3 3 0 0 0-5.8-1A3.5 3.5 0 0 0 4 9.5a3.5 3.5 0 0 0 .6 5.9A3.5 3.5 0 0 0 9 20a3 3 0 0 0 3-2z" />
      <path d="M12 5a3 3 0 0 1 5.8-1A3.5 3.5 0 0 1 20 9.5a3.5 3.5 0 0 1-.6 5.9A3.5 3.5 0 0 1 15 20a3 3 0 0 1-3-2" />
      <path d="M12 5v13" />
    </>
  ),
  mountain: () => (
    <>
      <path d="m2 20 7.5-12 4.5 7 2.5-3.5L22 20z" />
      <path d="m7.4 11.4 2.1 1.6 2-1.6" />
    </>
  ),
  arrowRight: () => (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  chevronDown: () => <path d="m6 9 6 6 6-6" />,
} satisfies Record<string, (solid: boolean) => ReactNode>;

export type IconName = keyof typeof ICONS;

export default function Icon({
  name,
  solid = false,
  className = "h-5 w-5",
}: {
  name: IconName;
  solid?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {ICONS[name](solid)}
    </svg>
  );
}
