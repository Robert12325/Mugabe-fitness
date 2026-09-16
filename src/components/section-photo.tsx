"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Artwork inside a section, falling back to the coach's own picture until
 * its own file exists — so a section is never left with an empty frame
 * while its photography is still being shot.
 *
 * Decorative, so it has no alt text; place it inside a positioned box.
 */
export default function SectionPhoto({
  src,
  fallback,
  sizes,
  mask,
  className,
}: {
  src: string;
  fallback: string;
  sizes: string;
  /** A CSS mask image, for fading the photo out towards the copy. */
  mask?: string;
  className: string;
}) {
  // Remembering which src failed (rather than a boolean) resets on its own
  // when the photo changes.
  const [failedSrc, setFailedSrc] = useState("");
  const photo = failedSrc === src ? fallback : src;

  return (
    <Image
      src={photo}
      alt=""
      fill
      sizes={sizes}
      // A file in /public goes through the optimizer; an uploaded data URL
      // or remote link can't without extra config.
      unoptimized={!photo.startsWith("/")}
      onError={() => setFailedSrc(src)}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className={className}
    />
  );
}
