"use client";

import Image from "next/image";
import { useState } from "react";

/** Drop your own photo in /public under this name to use it here. */
const ATHLETE_PHOTO = "/athlete.jpg";
const FALLBACK_PHOTO = "/coach.jpg";

/**
 * The backdrop of the dark contact section: the athlete down the left edge,
 * gold light and slashes, a weight plate at the right edge, and the motto.
 *
 * Purely decorative — aria-hidden and pointer-events-none, so it never
 * intercepts a tap meant for the form.
 */
export default function ContactScene() {
  // Until /public/athlete.jpg exists, the coach photo stands in.
  const [photo, setPhoto] = useState(ATHLETE_PHOTO);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Warm light from above and from the lower right. */}
      <div className="absolute inset-0 bg-[radial-gradient(50rem_30rem_at_45%_0%,rgba(224,172,60,0.08),transparent_70%),radial-gradient(40rem_30rem_at_100%_100%,rgba(224,172,60,0.1),transparent_70%)]" />

      {/* The athlete: a faded band behind the heading on phones and
          tablets, a full-height strip down the left edge from xl. */}
      <div className="absolute left-0 top-0 h-[30rem] w-[85%] opacity-40 sm:h-[36rem] sm:w-[60%] xl:bottom-0 xl:h-auto xl:w-[26vw] xl:max-w-[30rem] xl:opacity-100">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 1280px) 26vw, 85vw"
          onError={() => setPhoto(FALLBACK_PHOTO)}
          className="object-cover object-[50%_15%] brightness-[0.72] contrast-125 grayscale"
        />

        {/* A warm rim light, then fades into the black on every side. */}
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_62%_32%,rgba(226,110,44,0.28),transparent_70%)] mix-blend-screen" />
        <div className="absolute inset-y-0 right-0 w-3/4 bg-gradient-to-r from-transparent to-[#050505]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-[#050505] to-transparent" />
      </div>

      {/* "Stronger Together", brushed across the foot of the photo. */}
      <div className="absolute bottom-[8%] left-[2%] hidden -rotate-[10deg] xl:block">
        <p className="bg-[linear-gradient(90deg,#e2472c,#f0a33c_55%,#f6d27a)] bg-clip-text pr-3 font-[family-name:var(--font-script)] text-[3.4rem] leading-[0.95] text-transparent">
          Stronger
          <br />
          <span className="ml-10">Together</span>
        </p>

        <svg viewBox="0 0 220 18" className="ml-8 mt-1 h-4 w-52">
          <defs>
            <linearGradient id="together-swoosh" x1="0" x2="1">
              <stop offset="0" stopColor="#e2472c" />
              <stop offset="1" stopColor="#f6d27a" />
            </linearGradient>
          </defs>
          <path
            d="M3 15C70 8 140 4 217 3"
            fill="none"
            stroke="url(#together-swoosh)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Gold slashes. */}
      <div className="absolute -right-40 top-20 h-4 w-[40rem] -rotate-[38deg] bg-gradient-to-r from-transparent via-[#b88420]/70 to-[#f6d27a]/90" />
      <div className="absolute -right-28 top-40 h-1.5 w-[32rem] -rotate-[38deg] bg-gradient-to-r from-transparent to-[#e0ac3c]/60" />
      <div className="absolute -right-24 bottom-16 h-3 w-[34rem] -rotate-[38deg] bg-gradient-to-r from-transparent via-[#b88420]/50 to-[#e0ac3c]/80" />

      {/* A weight plate catching the light at the right edge. */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-48 top-1/2 hidden h-[36rem] w-[36rem] -translate-y-1/2 xl:block"
      >
        <defs>
          <radialGradient id="plate-face" cx="40%" cy="40%" r="70%">
            <stop offset="0" stopColor="#2a2a2a" />
            <stop offset="0.6" stopColor="#141414" />
            <stop offset="1" stopColor="#060606" />
          </radialGradient>
          <linearGradient id="plate-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6d27a" />
            <stop offset="0.35" stopColor="#6b5220" stopOpacity="0.4" />
            <stop offset="0.7" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="1" stopColor="#e0ac3c" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="96" fill="url(#plate-face)" />
        <circle cx="100" cy="100" r="95" fill="none" stroke="url(#plate-rim)" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="6" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="#fff" strokeOpacity="0.05" strokeWidth="3" />
        <circle cx="100" cy="100" r="30" fill="#0a0a0a" stroke="url(#plate-rim)" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="14" fill="#030303" />
      </svg>

      {/* The motto, bottom right. */}
      <div className="absolute bottom-10 right-8 hidden xl:block 2xl:right-14">
        <p className="text-[11px] font-bold uppercase leading-[1.8] tracking-[0.35em] text-[#e0b54a]">
          Discipline
          <br />
          Builds
          <br />
          Freedom
        </p>

        <span className="mt-2 block h-px w-28 bg-gradient-to-r from-[#e0b54a] to-transparent" />
      </div>
    </div>
  );
}
