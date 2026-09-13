"use client";

/**
 * A continuously scrolling strip of words.
 *
 * The item list is rendered twice and the track animates to -50%, which lands
 * the second copy exactly where the first started — so the loop has no seam.
 * The duplicate is aria-hidden so a screen reader hears the words once.
 */
export default function Marquee({
  items,
  seconds = 38,
  /** Slimmer, for the fixed header where vertical space is precious. */
  compact = false,
}: {
  items: string[];
  seconds?: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`marquee-host relative overflow-hidden border-white/10 ${
        compact ? "border-t py-2" : "border-y py-5"
      }`}
      style={{ ["--marquee-duration" as string]: `${seconds}s` }}
    >
      {/* Feathered edges so words enter and leave instead of being chopped. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent sm:w-20" />

      <div className="marquee-track">
        <Row items={items} compact={compact} />
        <Row items={items} compact={compact} ariaHidden />
      </div>
    </div>
  );
}

function Row({
  items,
  compact,
  ariaHidden,
}: {
  items: string[];
  compact?: boolean;
  ariaHidden?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center">
          <span
            className={`whitespace-nowrap font-black uppercase text-white/55 ${
              compact
                ? "px-5 text-[10px] tracking-[0.28em] sm:px-6 sm:text-[11px]"
                : "px-7 text-sm tracking-[0.3em] sm:text-base"
            }`}
          >
            {item}
          </span>

          <span
            className={`shrink-0 rotate-45 bg-[#d4af37]/50 ${
              compact ? "h-1 w-1" : "h-1.5 w-1.5"
            }`}
          />
        </span>
      ))}
    </div>
  );
}
