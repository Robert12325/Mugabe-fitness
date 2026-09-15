/** The dark glass card with gold-lit corners, shared by the contact form
 *  and the log-in page. */
export const goldCardClass =
  "relative overflow-hidden rounded-[1.75rem] border border-[#e0b54a]/30 bg-[linear-gradient(180deg,rgba(22,20,16,0.92),rgba(8,8,8,0.96))] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),0_0_70px_-25px_rgba(224,181,74,0.35)] backdrop-blur-xl";

/**
 * Gold light catching two corners of the card. Render it first and put the
 * card's content in a `relative` wrapper after it, so the light sits behind.
 */
export function GoldCardGlow() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#e0b54a]/25 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#e0b54a]/20 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-tr-[1.75rem] border-r-2 border-t-2 border-[#f3c969] [mask-image:linear-gradient(225deg,#000_10%,transparent_65%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-bl-[1.75rem] border-b-2 border-l-2 border-[#f3c969] [mask-image:linear-gradient(45deg,#000_10%,transparent_65%)]"
      />
    </>
  );
}
