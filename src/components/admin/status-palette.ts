import type { LeadStatus } from "@/lib/types";

/**
 * Status palette for the admin surface (#0b0b0b).
 *
 * `fill` is the validated set used for solid marks in the pipeline bar —
 * checked with the dataviz validator for the dark lightness band, CVD
 * separation (worst adjacent ΔE 8.0 deutan), the normal-vision floor
 * (ΔE 15.8) and >= 3:1 contrast. `archived` is deliberately neutral: it reads
 * as gray because "no longer active" is what gray means here.
 *
 * `text` is the brighter tint used for badge labels, each >= 7.8:1 against the
 * same surface. Status is always paired with its written label, never
 * signalled by colour alone.
 */
export const STATUS_PALETTE: Record<
  LeadStatus,
  { fill: string; text: string; badge: string }
> = {
  new: {
    fill: "#ad8b2b",
    text: "#e7c65c",
    badge: "border-[#e7c65c]/35 bg-[#ad8b2b]/15 text-[#e7c65c]",
  },
  contacted: {
    fill: "#5b86d6",
    text: "#8fb4f2",
    badge: "border-[#8fb4f2]/35 bg-[#5b86d6]/15 text-[#8fb4f2]",
  },
  enrolled: {
    fill: "#2ea55c",
    text: "#5cc98a",
    badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
  },
  archived: {
    fill: "#7d7d7d",
    text: "#a3a3a3",
    badge: "border-white/15 bg-white/5 text-[#a3a3a3]",
  },
};
