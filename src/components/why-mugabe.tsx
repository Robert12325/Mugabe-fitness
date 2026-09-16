"use client";

import Image from "next/image";
import { useState } from "react";
import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Icon, { type IconName } from "@/components/icons";
import Reveal from "@/components/motion/reveal";
import { coachPhotoSrc } from "@/lib/store";
import { useDB } from "@/lib/use-store";

const REASONS = [
  {
    number: "01",
    icon: "user",
    title: "Personal",
    accent: "Coaching",
    text: "Training built around the individual—not a generic routine copied from someone else.",
    /** Drop your own shot in /public under this name to use it. */
    photo: "/why-01.jpg",
  },
  {
    number: "02",
    icon: "target",
    title: "Real",
    accent: "Accountability",
    text: "Consistent coaching, guidance, and structure designed to keep you moving forward.",
    photo: "/why-02.jpg",
  },
  {
    number: "03",
    icon: "chart",
    title: "Measurable",
    accent: "Progress",
    text: "Train with purpose, track your development, and build progress you can actually see.",
    photo: "/why-03.jpg",
  },
] as const satisfies readonly {
  number: string;
  icon: IconName;
  title: string;
  accent: string;
  text: string;
  photo: string;
}[];

/** The figure standing beside the headline. */
const ATHLETE_PHOTO = "/why-athlete.png";

/** The framed portrait under the headline. */
const FIGURE_PHOTO = "/why-figure.jpg";

/** Each row's photo fades out towards the copy rather than ending on a
 *  hard vertical line. */
const ROW_PHOTO_FADE =
  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 34%, #000 74%)";

/** Fades the standing figure into the black around it. */
const ATHLETE_MASK =
  "radial-gradient(ellipse 74% 52% at 50% 42%, #000 48%, transparent 100%)";

export default function WhyMugabe() {
  const { settings } = useDB();
  const coach = coachPhotoSrc(settings);
  const tagline = settings.tagline.trim() || "Rise. Grind. Shine.";

  return (
    <section
      id="why"
      className="relative isolate overflow-hidden border-t border-white/10 bg-[#070707] px-5 py-24 font-[family-name:var(--font-display)] sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Ambient depth. Kept behind everything and inert. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="pulse-glow absolute -left-[10%] top-[10%] h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.08),transparent_65%)]" />
      </div>

      {/* The figure gets its own column of the page from xl up, which is why
          the content below is padded clear of it at that width. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[17rem] select-none xl:block 2xl:w-[21rem]"
      >
        <PhotoWithFallback
          src={ATHLETE_PHOTO}
          fallback={coach}
          sizes="21rem"
          mask={ATHLETE_MASK}
          className="object-cover object-[58%_26%] opacity-95 contrast-[1.15] grayscale"
        />

        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#070707] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-[#070707] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[#070707] to-transparent" />

        {/* "Stronger Together", brushed across the foot of the figure. */}
        <p className="absolute bottom-[6%] left-[6%] -rotate-[12deg] bg-[linear-gradient(90deg,#c98f28,#f3c969_55%,#fbe3a0)] bg-clip-text pr-3 font-[family-name:var(--font-script)] text-[2.1rem] leading-[0.95] text-transparent">
          Stronger
          <br />
          <span className="ml-6">Together</span>
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl xl:pl-[16rem] 2xl:pl-[20rem]">
        {/* The tagline, ruled off in the top corner. */}
        <p className="mb-10 hidden items-center justify-end gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518] lg:flex">
          <span aria-hidden className="h-px w-24 bg-gradient-to-r from-transparent to-[#e0b54a]" />
          {tagline}
        </p>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:gap-10 xl:gap-14">
          <Reveal className="lg:flex lg:flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518]">
              Why Mugabe Fitness
            </p>

            {/* Gradient text is only painted inside its own box, so each line
                is sized to the word rather than to the column. */}
            <h2 className="mt-5 text-[clamp(2.4rem,7.5vw,4.25rem)] font-black uppercase leading-[0.92] tracking-[-0.02em]">
              <span className="block w-max bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-transparent">
                Built for
              </span>

              <span className="block w-max bg-[linear-gradient(100deg,#e2a900,#f5c518_36%,#fff3b0_52%,#f5c518_66%,#c98f28)] bg-clip-text pr-[0.12em] italic text-transparent">
                Serious
              </span>

              <span className="block w-max bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-transparent">
                People.
              </span>
            </h2>

            <p className="mt-7 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/45">
              Discipline builds freedom.
            </p>

            <span
              aria-hidden
              className="mt-4 block h-0.5 w-16 bg-[linear-gradient(90deg,#f5c518,rgba(245,197,24,0.05))]"
            />

            {/* Fills the column the heading leaves empty. */}
            <div className="mt-12 flex justify-center lg:justify-start">
              <FramedFigure />
            </div>
          </Reveal>

          <div className="flex flex-col gap-5">
            {REASONS.map((reason, index) => (
              <Reveal key={reason.number} delay={index * 110}>
                <a
                  href="#contact"
                  className={`group flex items-center gap-5 p-4 transition duration-500 hover:border-[#f3c969]/60 sm:gap-6 sm:p-5 sm:pr-[44%] ${goldCardClass}`}
                >
                  <GoldCardGlow />

                  {/* The athlete, cut in on a diagonal down the row. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)] sm:block"
                  >
                    <PhotoWithFallback
                      src={reason.photo}
                      fallback={coach}
                      sizes="(min-width: 1024px) 28vw, 45vw"
                      mask={ROW_PHOTO_FADE}
                      className="scale-[1.25] object-cover object-[50%_16%] opacity-90 contrast-[1.2] grayscale transition duration-700 group-hover:opacity-100"
                    />
                  </div>

                  {/* The gold light running along that diagonal. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] bg-[linear-gradient(180deg,#f3c969,rgba(243,201,105,0.12))] [clip-path:polygon(20%_0,21.1%_0,1.1%_100%,0_100%)] sm:block"
                  />

                  <Hexagon className="flex h-[3.6rem] w-[3.1rem] shrink-0">
                    <span className="text-lg font-black tracking-tight text-[#f5c518]">
                      {reason.number}
                    </span>
                  </Hexagon>

                  <Hexagon className="hidden h-[3.6rem] w-[3.1rem] shrink-0 sm:flex">
                    <Icon name={reason.icon} className="h-5 w-5 text-[#f5c518]" />
                  </Hexagon>

                  <div className="relative min-w-0 flex-1">
                    <h3 className="text-lg font-black uppercase leading-[1.1] tracking-tight sm:text-xl">
                      <span className="text-white">{reason.title}</span>{" "}
                      <span className="text-[#f5c518]">{reason.accent}</span>
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {reason.text}
                    </p>
                  </div>

                  <span
                    aria-hidden
                    className="absolute right-5 top-1/2 hidden -translate-y-1/2 text-[#f5c518] transition-transform duration-500 group-hover:translate-x-1 sm:block"
                  >
                    <ChevronPair />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The hexagon plates the numbers and icons sit on. Drawn as SVG rather than
 * clipped, because a clip-path would cut a CSS border off at the edges.
 */
function Hexagon({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`relative items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 115"
        aria-hidden
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

/** The double chevron at the end of each row. */
function ChevronPair() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-6 w-6"
    >
      <path d="m5 6 6 6-6 6" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** The portrait under the headline, in a gold-lit frame. */
function FramedFigure() {
  return (
    <div className="float-slow relative h-[14rem] w-[14rem] shrink-0 sm:h-[17rem] sm:w-[17rem]">
      {/* Gold light spilling off two corners of the frame. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#e0b54a]/25 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#e0b54a]/20 blur-3xl"
      />

      <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] border border-[#e0b54a]/40 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),0_0_70px_-25px_rgba(224,181,74,0.4)]">
        <Image
          src={FIGURE_PHOTO}
          alt=""
          fill
          sizes="(min-width: 640px) 17rem, 14rem"
          className="object-cover object-[50%_35%] brightness-[0.72] contrast-[1.3] grayscale"
        />

        {/* Sinks the bright rooftop background into the section around it. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_64%_68%_at_50%_44%,transparent_16%,rgba(7,7,7,0.55)_62%,rgba(7,7,7,0.96)_100%)]"
        />
      </div>

      {/* Gold catching the frame's corners. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-tr-[1.5rem] border-r-2 border-t-2 border-[#f3c969] [mask-image:linear-gradient(225deg,#000_10%,transparent_65%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-20 w-20 rounded-bl-[1.5rem] border-b-2 border-l-2 border-[#f3c969] [mask-image:linear-gradient(45deg,#000_10%,transparent_65%)]"
      />
    </div>
  );
}

/**
 * A photo that falls back to the coach's own picture until its file exists,
 * so the section is never left with an empty frame.
 *
 * Decorative, so it has no alt text; place it inside a positioned box.
 */
function PhotoWithFallback({
  src,
  fallback,
  sizes,
  mask,
  className,
}: {
  src: string;
  fallback: string;
  sizes: string;
  mask: string;
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
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className={className}
    />
  );
}
