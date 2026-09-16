import type { ReactNode } from "react";

/**
 * The hexagon plate the method and reason steps sit their numbers and icons
 * on. Drawn as SVG rather than clipped, because a clip-path would cut a CSS
 * border off at the edges.
 *
 * The caller owns the display class (`flex`, `hidden sm:flex`, …): setting
 * one here would beat theirs, since the two have equal specificity.
 */
export default function Hexagon({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span className={`relative items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 115"
        aria-hidden
        focusable="false"
        className="absolute inset-0 h-full w-full"
      >
        <polygon
          points="50,3 96,30 96,85 50,112 4,85 4,30"
          fill="rgba(224,181,74,0.07)"
          stroke="#e0b54a"
          strokeOpacity="0.55"
          strokeWidth="3"
        />
      </svg>

      <span className="relative">{children}</span>
    </span>
  );
}
