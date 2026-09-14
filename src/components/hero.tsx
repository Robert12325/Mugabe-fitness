"use client";

import Image from "next/image";
import { useState } from "react";
import Reveal from "@/components/motion/reveal";
import { coachPhotoSrc } from "@/lib/store";
import { useDB } from "@/lib/use-store";

const FEATURES = [
  { icon: "dumbbell", top: "Personalized", bottom: "Coaching" },
  { icon: "target", top: "Real", bottom: "Results" },
  { icon: "bolt", top: "Sustainable", bottom: "Progress" },
  { icon: "peak", top: "Stronger", bottom: "You" },
] as const;

type FeatureIconName = (typeof FEATURES)[number]["icon"];

/** Fades the photo out towards its edges, so the yellow "M" behind it shows
 *  around the athlete instead of stopping at a hard rectangle. */
const PHOTO_MASK =
  "radial-gradient(ellipse 62% 76% at 56% 42%, #000 48%, transparent 100%)";

export default function Hero() {
  const { settings } = useDB();
  const photo = coachPhotoSrc(settings);
  const tagline = settings.tagline.trim() || "Rise. Grind. Shine.";

  // Remembering which src failed (rather than a boolean) resets on its own
  // when the photo changes.
  const [failedSrc, setFailedSrc] = useState("");
  const [loadedSrc, setLoadedSrc] = useState("");

  // The photo and the "M" behind it fade in together once the photo is
  // ready, so a slow first load never shows a lone yellow shape. If the
  // photo fails, the shape still appears on its own.
  const photoReady = loadedSrc === photo;
  const showShape = photoReady || failedSrc === photo;

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-black font-[family-name:var(--font-display)] lg:flex lg:min-h-[max(100svh,46rem)] lg:items-center"
    >
      {/* Faint gym haze behind the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_18%_35%,rgba(255,255,255,0.05),transparent_70%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-16 lg:pt-32">
        <Reveal className="lg:max-w-[34rem] xl:max-w-[44rem]">
          <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518] sm:text-sm">
            <span aria-hidden className="h-0.5 w-10 shrink-0 bg-[#f5c518] sm:w-14" />
            {tagline}
          </p>

          <h1 className="mt-6 text-[clamp(2.6rem,11.5vw,6.25rem)] font-black uppercase italic leading-[0.92] tracking-[-0.02em] sm:mt-7 xl:text-[7.25rem]">
            <span className="block text-white">Become</span>

            {/* Sized to the word, not the column: gradient text is only
                painted inside its own box, so a word wider than the column
                would otherwise vanish past the edge. The right padding keeps
                the slanted last letter from being clipped. */}
            <span className="block w-max whitespace-nowrap bg-[linear-gradient(100deg,#f5c518_0%,#ffd84a_42%,#fff3b0_50%,#f5c518_58%,#e2a900_100%)] bg-clip-text pr-[0.1em] text-transparent">
              Stronger.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:mt-8 sm:text-lg sm:leading-8 lg:max-w-md xl:max-w-xl">
            Personal coaching built to help you train with purpose, build
            strength, transform your physique, and become the strongest
            version of yourself.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <a
              href="#programs"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#f5c518] px-7 py-4 text-sm font-extrabold uppercase tracking-[0.03em] text-black shadow-[0_14px_36px_-14px_rgba(245,197,24,0.65)] transition hover:bg-[#ffd84a] sm:px-8"
            >
              Start Your Transformation
              <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>

            <a
              href="#method"
              className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/30 px-7 py-4 text-sm font-extrabold uppercase tracking-[0.03em] text-white transition hover:border-[#f5c518] hover:text-[#f5c518] sm:px-8"
            >
              Discover The Method
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black transition group-hover:bg-[#f5c518]">
                <svg viewBox="0 0 24 24" aria-hidden className="ml-0.5 h-3.5 w-3.5">
                  <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                </svg>
              </span>
            </a>
          </div>

          {/* One divided row where there's room; two columns on phones, and
              on small laptops where the photo shares the width. */}
          <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-6 sm:mt-14 md:grid-cols-4 md:gap-0 lg:grid-cols-2 lg:gap-x-4 lg:gap-y-6 xl:grid-cols-4 xl:gap-0">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.top}
                className={`flex items-center gap-3 md:pr-4 ${
                  index > 0
                    ? "md:border-l md:border-white/15 md:pl-5 lg:border-l-0 lg:pl-0 xl:border-l xl:pl-5"
                    : ""
                }`}
              >
                <FeatureIcon
                  name={feature.icon}
                  className="h-7 w-7 shrink-0 text-[#f5c518] sm:h-8 sm:w-8"
                />

                <span className="text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.14em] text-white/70">
                  {feature.top}
                  <br />
                  {feature.bottom}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* Below the copy on phones and tablets; the right half from lg. */}
      <div className="relative mt-6 h-[26rem] sm:h-[34rem] lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-auto lg:w-[46%] xl:w-[52%]">
        <svg
          viewBox="0 0 100 100"
          aria-hidden
          className={`absolute bottom-[6%] right-[-8%] aspect-square h-[80%] transition-opacity duration-700 lg:bottom-[14%] lg:right-[-4%] lg:h-[68%] xl:bottom-[8%] xl:h-[78%] ${
            showShape ? "opacity-100" : "opacity-0"
          }`}
        >
          <defs>
            <linearGradient id="hero-m" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe066" />
              <stop offset="0.55" stopColor="#f5c518" />
              <stop offset="1" stopColor="#c99700" />
            </linearGradient>
          </defs>

          <polygon
            points="0,100 21,100 35,47 50,80 65,47 79,100 100,100 71,3 50,47 29,3"
            fill="url(#hero-m)"
          />
        </svg>

        {failedSrc !== photo && (
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              photoReady ? "opacity-100" : "opacity-0"
            }`}
            style={{ maskImage: PHOTO_MASK, WebkitMaskImage: PHOTO_MASK }}
          >
            <Image
              src={photo}
              alt="Your coach at Mugabe Fitness"
              fill
              // Above the fold: load it straight away instead of lazily.
              // (`priority` is deprecated as of Next 16.)
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1280px) 52vw, (min-width: 1024px) 46vw, 100vw"
              // A file in /public goes through the optimizer; an uploaded
              // data URL or remote link can't without extra config.
              unoptimized={!photo.startsWith("/")}
              onLoad={() => setLoadedSrc(photo)}
              // A cached image can finish loading before hydration, when
              // there is no load event left to hear.
              ref={(img) => {
                if (img?.complete && img.naturalWidth > 0) setLoadedSrc(photo);
              }}
              onError={() => setFailedSrc(photo)}
              className="object-cover object-[55%_22%] contrast-[1.12] grayscale"
            />
          </div>
        )}

        {/* A streak of gym light across the top. */}
        <div
          aria-hidden
          className="absolute right-[4%] top-[9%] h-2.5 w-56 -rotate-[22deg] rounded-full bg-gradient-to-r from-transparent via-[#ffe27a] to-transparent opacity-80 blur-[1.5px] sm:w-72"
        />

        {/* Blend into the copy on large screens, and into the page above and
            below — without these the photo ends on a hard line. */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 hidden w-1/4 bg-gradient-to-r from-black to-transparent lg:block"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent"
        />
      </div>
    </section>
  );
}

function ArrowIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function FeatureIcon({
  name,
  className,
}: {
  name: FeatureIconName;
  className: string;
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
      className={className}
    >
      {name === "dumbbell" && (
        <>
          <rect x="5" y="6" width="3" height="12" rx="1" />
          <rect x="16" y="6" width="3" height="12" rx="1" />
          <path d="M2.5 9.5v5" />
          <path d="M21.5 9.5v5" />
          <path d="M8 12h8" />
        </>
      )}

      {name === "target" && (
        <>
          <circle cx="11" cy="13" r="8" />
          <circle cx="11" cy="13" r="4" />
          <path d="m11 13 9-9" />
          <path d="M16.5 3.5H20v3.5" />
        </>
      )}

      {name === "bolt" && <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />}

      {name === "peak" && (
        <>
          <path d="m2 20 7.5-12 4.5 7 2.5-3.5L22 20z" />
          <path d="m7.4 11.4 2.1 1.6 2-1.6" />
        </>
      )}
    </svg>
  );
}
