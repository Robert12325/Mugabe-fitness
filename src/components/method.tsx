"use client";

import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Hexagon from "@/components/hexagon";
import Icon, { type IconName } from "@/components/icons";
import Reveal from "@/components/motion/reveal";
import SectionPhoto from "@/components/section-photo";
import { useT, type StringKey } from "@/lib/i18n";
import { DEFAULT_COACH_PHOTO, coachPhotoAt } from "@/lib/store";
import { byNumber } from "@/lib/order";
import { useDB } from "@/lib/use-store";

/**
 * The artwork for each step, keyed by the step's id rather than its
 * position — the copy is admin-editable, so a step can be retitled or
 * reordered and still keep the right icon and photo.
 *
 * Drop your own shots in /public under these names to use them.
 */
const STEP_ART: Record<
  string,
  { icon: IconName; cta: StringKey; photo: string; crop: string }
> = {
  assess: {
    icon: "target",
    cta: "method.cta.assess",
    photo: "/method-01.jpg",
    crop: "scale-[1.5] origin-[54%_10%]",
  },
  train: {
    icon: "dumbbell",
    cta: "method.cta.train",
    photo: "/method-02.jpg",
    crop: "scale-100 origin-center",
  },
  progress: {
    icon: "trend",
    cta: "method.cta.progress",
    photo: "/method-03.jpg",
    crop: "scale-[1.35] origin-[42%_62%]",
  },
  transform: {
    icon: "cycle",
    cta: "method.cta.transform",
    photo: "/method-04.jpg",
    crop: "scale-[1.2] origin-[62%_30%]",
  },
};

/** For a step the admin has added, which has no artwork of its own. */
const DEFAULT_ART = {
  icon: "bolt" as IconName,
  cta: "method.cta.default" as StringKey,
  photo: "",
  crop: "scale-[1.15] origin-center",
};

/** The figure above the cards. */
const METHOD_ATHLETE = "/method-athlete.jpg";

/** Each card's photo fades out towards the copy rather than ending on a
 *  hard vertical line. */
const CARD_PHOTO_FADE =
  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.22) 40%, #000 82%)";

/** Fades the figure into the black around it. */
const ATHLETE_MASK =
  "radial-gradient(ellipse 58% 44% at 50% 40%, #000 34%, transparent 100%)";

export default function Method() {
  const t = useT();
  const { method: savedMethod, settings } = useDB();
  const method = byNumber(savedMethod);
  const tagline = settings.tagline.trim() || "Rise. Grind. Shine.";

  return (
    <section
      id="method"
      className="relative isolate overflow-hidden bg-black px-5 py-24 font-[family-name:var(--font-display)] sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Gold haze behind the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55rem_32rem_at_18%_14%,rgba(245,197,24,0.07),transparent_70%)]"
      />

      {/* The figure between the headline and the tagline, from lg up. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-[20%] hidden h-[30rem] w-[32%] select-none lg:block xl:right-[24%] xl:w-[28%]"
      >
        <SectionPhoto
          sources={[
            METHOD_ATHLETE,
            coachPhotoAt(settings, 1),
            DEFAULT_COACH_PHOTO,
          ]}
          sizes="32vw"
          mask={ATHLETE_MASK}
          className="object-cover object-[50%_16%] opacity-70 contrast-[1.15] grayscale"
        />

        {/* Without these the photo ends on a hard line where its mask meets
            the edge of the box. */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518]">
                <span aria-hidden className="h-0.5 w-10 shrink-0 bg-[#f5c518]" />
                {t("method.eyebrow")}
              </p>

              {/* Gradient text is only painted inside its own box, so each
                  line is sized to the word rather than to the column. */}
              <h2 className="mt-6 font-black uppercase leading-[0.9] tracking-[-0.02em]">
                <span className="block w-max bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-[clamp(2.1rem,7vw,4rem)] italic text-transparent">
                  {t("method.h1")}
                </span>

                <span className="relative block w-max">
                  <span className="bg-[linear-gradient(100deg,#e2a900,#f5c518_36%,#fff3b0_52%,#f5c518_66%,#c98f28)] bg-clip-text pr-[0.12em] text-[clamp(2.7rem,9.5vw,5.5rem)] italic text-transparent">
                    {t("method.h2")}
                  </span>

                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-[0.4rem] w-[94%] -skew-x-[20deg] rounded-full bg-[linear-gradient(90deg,#f5c518,rgba(245,197,24,0.05))]"
                  />
                </span>

                <span className="mt-4 block w-max bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-[clamp(1.5rem,4.6vw,2.6rem)] text-transparent">
                  {t("method.h3")}
                </span>
              </h2>
            </div>

            {/* The tagline and signature, ruled off in the far corner. */}
            <div className="hidden shrink-0 text-right lg:block">
              <p className="flex items-center justify-end gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518]">
                <span
                  aria-hidden
                  className="h-px w-20 bg-gradient-to-r from-transparent to-[#e0b54a]"
                />
                {tagline}
              </p>

              <p className="mt-6 -rotate-[10deg] bg-[linear-gradient(90deg,#c98f28,#f3c969_55%,#fbe3a0)] bg-clip-text pr-3 font-[family-name:var(--font-script)] text-[2.4rem] leading-[0.95] text-transparent">
                {t("method.script")}
                <br />
                <span className="mr-6">{t("method.together")}</span>
              </p>
            </div>
          </div>
        </Reveal>

        {/* Below lg there is no room beside the headline, so the figure
            takes a band of its own rather than disappearing. */}
        <div className="relative mt-10 h-52 overflow-hidden rounded-[1.5rem] border border-[#e0b54a]/25 sm:h-64 lg:hidden">
          <SectionPhoto
            sources={[
              METHOD_ATHLETE,
              coachPhotoAt(settings, 1),
              DEFAULT_COACH_PHOTO,
            ]}
            sizes="100vw"
            className="object-cover object-[50%_22%] opacity-85 contrast-[1.15] grayscale"
          />

          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45),transparent_38%,rgba(0,0,0,0.75))]"
          />
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-20 xl:grid-cols-4">
          {method.map((step, index) => {
            const art = STEP_ART[step.id] ?? DEFAULT_ART;

            return (
              <Reveal key={step.id} delay={index * 80} className="h-full">
                <a
                  href="#contact"
                  className={`group flex h-full min-h-[19rem] flex-col p-6 transition duration-500 hover:border-[#f3c969]/60 ${goldCardClass}`}
                >
                  <GoldCardGlow />

                  {/* The athlete, cut in on a diagonal down the card. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-[52%] [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]"
                  >
                    <SectionPhoto
                      sources={[
                        art.photo,
                        coachPhotoAt(settings, index),
                        DEFAULT_COACH_PHOTO,
                      ]}
                      // Wider than the box it lands in, so the zoomed crops
                      // still have pixels to work with.
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
                      mask={CARD_PHOTO_FADE}
                      className={`object-cover opacity-70 contrast-[1.2] grayscale transition duration-700 group-hover:opacity-90 ${art.crop}`}
                    />
                  </div>

                  {/* The gold light running along that diagonal. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-[52%] bg-[linear-gradient(180deg,#f3c969,rgba(243,201,105,0.1))] [clip-path:polygon(24%_0,25.1%_0,1.1%_100%,0_100%)]"
                  />

                  <div className="relative flex flex-1 flex-col">
                    <div className="flex items-center gap-3">
                      <Hexagon className="flex h-[3.4rem] w-[2.9rem] shrink-0">
                        <span className="text-lg font-black tracking-tight text-[#f5c518]">
                          {step.number}
                        </span>
                      </Hexagon>

                      <Hexagon className="flex h-[3.4rem] w-[2.9rem] shrink-0">
                        <Icon name={art.icon} className="h-5 w-5 text-[#f5c518]" />
                      </Hexagon>
                    </div>

                    <h3 className="mt-8 text-2xl font-black uppercase leading-[0.95] tracking-tight text-white">
                      {step.title}
                    </h3>

                    <span
                      aria-hidden
                      className="mt-4 block h-0.5 w-12 bg-[#f5c518]"
                    />

                    <p className="mt-5 max-w-[13rem] text-sm leading-7 text-white/65">
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
                        {t(art.cta)}
                      </span>
                    </span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
