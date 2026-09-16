"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Artwork inside a section, tried in order until one loads — a section's own
 * shot, then the site photo for its slot, then whatever is guaranteed to
 * ship. A section is never left with an empty frame while its photography is
 * still being shot.
 *
 * A single fallback is not enough: a slot's built-in file can be missing too,
 * and then the one retry is spent on another 404.
 *
 * Decorative, so it has no alt text; place it inside a positioned box.
 */
export default function SectionPhoto({
  sources,
  sizes,
  mask,
  className,
}: {
  /** Most specific first. Empty entries are skipped. */
  sources: string[];
  sizes: string;
  /** A CSS mask image, for fading the photo out towards the copy. */
  mask?: string;
  className: string;
}) {
  const candidates = sources.filter((source) => source.trim() !== "");

  // Tracking the failed sources themselves (rather than an index) means the
  // component recovers on its own when the list changes — an admin uploading
  // a photo replaces a source that had failed.
  const [failed, setFailed] = useState<string[]>([]);
  const photo = candidates.find((source) => !failed.includes(source));

  if (!photo) return null;

  return (
    <Image
      src={photo}
      alt=""
      fill
      sizes={sizes}
      // A file in /public goes through the optimizer; an uploaded data URL
      // or remote link can't without extra config.
      unoptimized={!photo.startsWith("/")}
      onError={() =>
        setFailed((seen) => (seen.includes(photo) ? seen : [...seen, photo]))
      }
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className={className}
    />
  );
}
