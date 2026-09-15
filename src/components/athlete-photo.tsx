"use client";

import Image from "next/image";
import { useState } from "react";

/** Drop your own photo in /public under this name to use it. */
const ATHLETE_PHOTO = "/athlete.jpg";
const FALLBACK_PHOTO = "/coach.jpg";

/**
 * The athlete photo used as artwork on the contact section and the log-in
 * page. Until /public/athlete.jpg exists, the coach photo stands in.
 *
 * Decorative, so it has no alt text; place it inside a positioned box.
 */
export default function AthletePhoto({
  sizes,
  className = "",
}: {
  sizes: string;
  className?: string;
}) {
  const [photo, setPhoto] = useState(ATHLETE_PHOTO);

  return (
    <Image
      src={photo}
      alt=""
      fill
      sizes={sizes}
      onError={() => setPhoto(FALLBACK_PHOTO)}
      className={`object-cover ${className}`}
    />
  );
}
