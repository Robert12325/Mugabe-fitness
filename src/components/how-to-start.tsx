"use client";

import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Icon, { type IconName } from "@/components/icons";
import Reveal from "@/components/motion/reveal";
import SectionPhoto from "@/components/section-photo";
import { DEFAULT_COACH_PHOTO, coachPhotoAt } from "@/lib/store";
import { useDB } from "@/lib/use-store";

const STEPS = [
  {
    number: "01",
    icon: "clipboard",
    title: "Send your",
    accent: "details",
    text: "Fill in the form with your goals, your schedule, and where you are training from.",
    cta: "It takes 2 minutes",
    /** Each card crops the one photo differently, so the three don't repeat.
     *  `object-position` alone can't: cover leaves barely any crop room in a
     *  card this shape, so the zoom is what actually moves the frame. */
    crop: "scale-[1.6] origin-[56%_8%]",
  },
  {
    number: "02",
    icon: "chat",
    title: "Talk it",
    accent: "through",
    text: "We go over your experience, any injuries, and which program actually fits you.",
    cta: "Personal & direct",
    crop: "scale-100 origin-center",
  },
  {
    number: "03",
    icon: "dumbbell",
    title: "Start",
    accent: "training",
    text: "Your program begins, and the coaching and accountability start from day one.",
    cta: "Let's go",
    crop: "scale-[1.32] origin-[38%_66%]",
  },
] as const satisfies readonly {
  number: string;
  icon: IconName;
  title: string;
  accent: string;
  text: string;
  cta: string;
  crop: string;
}[];

/** The photo is artwork inside each card: it fades out towards the copy
 *  instead of ending on a hard vertical line. */
const CARD_PHOTO_FADE =
  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.22) 40%, #000 82%)";

/** Fades the header athlete into the black around it. The ellipse stays
 *  inside its box vertically, so the photo never ends on a hard line. */
const HEADER_PHOTO_MASK =
  "radial-gradient(ellipse 62% 44% at 52% 40%, #000 34%, transparent 100%)";

export default function HowToStart() {
  const { settings } = useDB();
  const photo = coachPhotoAt(settings, 0);

  return (
    <section
      id="start"
      className="relative isolate overflow-hidden border-t border-white/10 bg-black px-5 py-24 font-[family-name:var(--font-display)] sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Gold haze behind the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55rem_32rem_at_15%_12%,rgba(245,197,24,0.07),transparent_70%)]"
      />

      {/* The athlete alongside the headline, from large screens up. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-0 hidden h-[33rem] w-[34%] select-none lg:block xl:w-[38%]"
      >
        <SectionPhoto
          sources={[photo, DEFAULT_COACH_PHOTO]}
          sizes="42vw"
          mask={HEADER_PHOTO_MASK}
          className="object-cover object-[52%_14%] opacity-65 contrast-[1.15] grayscale"
        />

        {/* Without these the photo ends on a hard line where its mask meets
            the edge of the box. */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent" />

        {/* "Stronger Together", brushed beside the athlete. */}
        <p className="absolute bottom-[22%] right-2 hidden -rotate-[14deg] bg-[linear-gradient(90deg,#c98f28,#f3c969_55%,#fbe3a0)] bg-clip-text pr-3 text-right font-[family-name:var(--font-script)] text-[2.75rem] leading-[0.95] text-transparent xl:block">
          Stronger
          <br />
          <span className="mr-6">Together</span>
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518]">
            <span aria-hidden className="h-0.5 w-10 shrink-0 bg-[#f5c518]" />
            How To Start
          </p>

          <div className="mt-6 flex flex-col gap-7 sm:flex-row sm:items-end sm:gap-10">
            {/* Gradient text is only painted inside its own box, so each line
                is sized to the word rather than to the column. */}
            <h2 className="text-[clamp(2.5rem,8.5vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.02em]">
              <span className="block w-max bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-transparent">
                Three steps.
              </span>

              <span className="relative block w-max italic">
                <span className="bg-[linear-gradient(100deg,#e2a900,#f5c518_38%,#fff3b0_52%,#f5c518_64%,#c98f28)] bg-clip-text pr-[0.12em] text-transparent">
                  That&apos;s it.
                </span>

                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-[0.4rem] w-[92%] -skew-x-[20deg] rounded-full bg-[linear-gradient(90deg,#f5c518,rgba(245,197,24,0.05))]"
                />
              </span>
            </h2>

            <p className="text-[0.7rem] font-bold uppercase leading-[2.4] tracking-[0.24em] text-white/70 sm:border-l sm:border-white/15 sm:pb-2 sm:pl-8 sm:text-xs">
              Simple steps.
              <br />
              Real progress.
              <br />
              <span className="text-[#f5c518]">A stronger you.</span>
            </p>
          </div>
        </Reveal>

        {/* Below lg there is no room beside the headline, so the figure
            takes a band of its own rather than disappearing. */}
        <div className="relative mt-10 h-52 overflow-hidden rounded-[1.5rem] border border-[#e0b54a]/25 sm:h-64 lg:hidden">
          <SectionPhoto
            sources={[photo, DEFAULT_COACH_PHOTO]}
            sizes="100vw"
            className="object-cover object-[50%_20%] opacity-85 contrast-[1.15] grayscale"
          />

          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45),transparent_38%,rgba(0,0,0,0.75))]"
          />
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 lg:mt-20">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 90} className="h-full">
              <a
                href="#contact"
                className={`group flex h-full min-h-[20rem] flex-col p-6 transition duration-500 hover:border-[#f3c969]/60 sm:p-7 ${goldCardClass}`}
              >
                <GoldCardGlow />

                {/* The athlete, cut in on a diagonal down the card. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-[58%] [clip-path:polygon(26%_0,100%_0,100%_100%,0_100%)]"
                >
                  <SectionPhoto
                    sources={[
                      coachPhotoAt(settings, index + 1),
                      photo,
                      DEFAULT_COACH_PHOTO,
                    ]}
                    // Wider than the box it lands in, so the zoomed crops
                    // below still have pixels to work with.
                    sizes="(min-width: 768px) 40vw, 90vw"
                    mask={CARD_PHOTO_FADE}
                    className={`object-cover opacity-70 contrast-[1.2] grayscale transition duration-700 group-hover:opacity-90 ${step.crop}`}
                  />
                </div>

                {/* The gold light running along that diagonal. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-[58%] bg-[linear-gradient(180deg,#f3c969,rgba(243,201,105,0.1))] [clip-path:polygon(26%_0,27.1%_0,1.1%_100%,0_100%)]"
                />

                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e0b54a]/45 bg-[#e0b54a]/10 text-[#f5c518] transition duration-500 group-hover:border-[#f3c969] group-hover:bg-[#e0b54a]/20">
                      <Icon name={step.icon} className="h-6 w-6" />
                    </span>

                    <span className="text-[2.75rem] font-black leading-none tracking-tight text-white/[0.12]">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-8 text-2xl font-black uppercase leading-[0.95] tracking-tight">
                    <span className="block text-white">{step.title}</span>
                    <span className="block text-[#f5c518]">{step.accent}</span>
                  </h3>

                  <span
                    aria-hidden
                    className="mt-4 block h-0.5 w-12 bg-[#f5c518]"
                  />

                  <p className="mt-5 max-w-[15rem] text-sm leading-7 text-white/65">
                    {step.text}
                  </p>

                  <span className="mt-auto flex items-center gap-3 pt-8">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e0b54a]/50 text-[#f5c518] transition duration-500 group-hover:border-[#f3c969] group-hover:bg-[#f5c518] group-hover:text-black">
                      <Icon
                        name="arrowRight"
                        className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5"
                      />
                    </span>

                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#f5c518]">
                      {step.cta}
                    </span>
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
