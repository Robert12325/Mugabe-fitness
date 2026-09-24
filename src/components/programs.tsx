"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Icon, { type IconName } from "@/components/icons";
import Reveal from "@/components/motion/reveal";
import Tilt from "@/components/motion/tilt";
import SectionPhoto from "@/components/section-photo";
import {
  getSession,
  getSessionOnServer,
  subscribeSession,
} from "@/lib/account-client";
import { chooseProgram } from "@/lib/chosen-plan";
import { DEFAULT_COACH_PHOTO, coachPhotoAt } from "@/lib/store";
import { byNumber } from "@/lib/order";
import { useDB } from "@/lib/use-store";

/** The promises above the cards. */
const PROMISES = [
  { icon: "dumbbell", top: "Stronger", bottom: "Everyday" },
  { icon: "chart", top: "Real", bottom: "Progress" },
  { icon: "bolt", top: "Discipline", bottom: "For life" },
] as const satisfies readonly {
  icon: IconName;
  top: string;
  bottom: string;
}[];

/**
 * A feature is free text the admin can edit, so its icon is matched on what
 * the line says and falls back to a tick. A new wording loses the specific
 * icon, never the row.
 */
const FEATURE_ICONS: [RegExp, IconName][] = [
  [/live|session/i, "video"],
  [/home/i, "home"],
  [/personal|individual|guidance/i, "user"],
  [/equipment/i, "dumbbell"],
  [/program|progress|performance/i, "chart"],
  [/coach|support/i, "shield"],
  [/time|slot|hour/i, "clock"],
];

function featureIcon(feature: string): IconName {
  return FEATURE_ICONS.find(([pattern]) => pattern.test(feature))?.[1] ?? "check";
}

export default function Programs() {
  const db = useDB();
  const router = useRouter();
  const programs = byNumber(db.programs.filter((program) => program.active));

  const session = useSyncExternalStore(
    subscribeSession,
    getSession,
    getSessionOnServer,
  );

  /**
   * Choosing a plan needs an account. Signed in, the link scrolls to the
   * booking form, which picks the plan up. Otherwise the visitor logs in or
   * signs up first, and the account page sends them on to the form.
   */
  function choose(
    event: React.MouseEvent<HTMLAnchorElement>,
    programId: string,
  ) {
    chooseProgram(programId);

    if (getSession()) return;

    event.preventDefault();
    router.push("/account");
  }

  return (
    <section
      id="programs"
      className="relative isolate overflow-hidden border-t border-white/10 bg-[#080808] px-5 py-24 font-[family-name:var(--font-display)] sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Gold haze behind the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55rem_32rem_at_16%_10%,rgba(245,197,24,0.06),transparent_70%)]"
      />

      {/* The athlete beside the headline. Only from xl is there room for
          it without the last promise badge sitting on top of it — below
          that it takes a band of its own, further down. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 right-0 hidden h-[30rem] w-[26%] select-none xl:block"
      >
        <SectionPhoto
          sources={[coachPhotoAt(db.settings, 1), DEFAULT_COACH_PHOTO]}
          sizes="30vw"
          className="object-cover object-[50%_18%] opacity-70 contrast-[1.15] grayscale"
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_58%_at_50%_42%,transparent_20%,rgba(8,8,8,0.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#080808] to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#080808] to-transparent" />

        {/* "Better Stronger You", brushed beside the athlete. */}
        <p className="absolute right-3 top-[14%] hidden -rotate-[8deg] bg-[linear-gradient(90deg,#c98f28,#f3c969_55%,#fbe3a0)] bg-clip-text pr-3 text-right font-[family-name:var(--font-script)] text-[2.1rem] leading-[1.05] text-transparent xl:block">
          Better
          <br />
          <span className="mr-4">Stronger</span>
          <br />
          <span className="mr-10">You</span>
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
            <div className="lg:w-[52%] lg:shrink-0 xl:w-[48%]">
              <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518]">
                <span aria-hidden className="h-0.5 w-10 shrink-0 bg-[#f5c518]" />
                Choose Your Level
              </p>

              {/* Gradient text is only painted inside its own box, so each
                  line is sized to the word rather than to the column. */}
              <h2 className="mt-6 text-[clamp(2.1rem,6vw,3.4rem)] font-black uppercase leading-[0.92] tracking-[-0.02em]">
                <span className="block w-max bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-transparent">
                  Your training.
                </span>

                <span className="block w-max bg-[linear-gradient(100deg,#e2a900,#f5c518_36%,#fff3b0_52%,#f5c518_66%,#c98f28)] bg-clip-text pr-[0.12em] text-transparent">
                  Your level.
                </span>
              </h2>

              <p className="mt-7 max-w-lg text-sm leading-7 text-white/60">
                Two coaching experiences. One standard of commitment. Choose
                the level that matches your goals and start building the body,
                strength, and discipline you want.
              </p>
            </div>

            <ul className="grid grid-cols-3 gap-3 sm:gap-6 lg:mt-6 lg:min-w-0 lg:max-w-[24rem] lg:flex-1">
              {PROMISES.map((promise, index) => (
                <li
                  key={promise.top}
                  className={`flex flex-col items-center gap-3 px-1 text-center ${
                    index > 0 ? "border-l border-white/10" : ""
                  }`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e0b54a]/45 bg-[#e0b54a]/[0.07]">
                    <Icon
                      name={promise.icon}
                      className="h-6 w-6 text-[#f5c518]"
                    />
                  </span>

                  <span className="text-[11px] font-black uppercase leading-[1.5] tracking-[0.12em] text-white">
                    {promise.top}
                    <br />
                    <span className="font-bold text-white/45">
                      {promise.bottom}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Below xl the figure cannot sit beside the copy, so it gets a
            band rather than disappearing. */}
        <div className="relative mt-12 h-48 overflow-hidden rounded-[1.5rem] border border-[#e0b54a]/25 sm:h-56 xl:hidden">
          <SectionPhoto
            sources={[coachPhotoAt(db.settings, 1), DEFAULT_COACH_PHOTO]}
            sizes="100vw"
            className="object-cover object-[50%_28%] opacity-85 contrast-[1.15] grayscale"
          />

          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45),transparent_38%,rgba(0,0,0,0.75))]"
          />
        </div>

        <div className="mt-8 grid gap-5 lg:mt-10 lg:grid-cols-2 xl:mt-20">
          {programs.map((program, index) => {
            // "Mugabe Live" sets the second word apart, as the artwork does.
            const [lead, ...restOfName] = program.name.split(" ");
            const accent = restOfName.join(" ");

            return (
              <Reveal key={program.id} delay={index * 90} className="h-full">
                <Tilt className="h-full">
                  <article
                    className={`group flex h-full flex-col p-6 transition duration-500 sm:p-8 ${goldCardClass} ${
                      program.featured
                        ? "border-[#f3c969]/60 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),0_0_90px_-20px_rgba(224,181,74,0.55)]"
                        : "hover:border-[#e0b54a]/50"
                    }`}
                  >
                    <div className="tilt-glare" />
                    <GoldCardGlow />

                    <div className="relative flex flex-1 flex-col">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black tracking-[0.2em] text-white/70">
                          {program.number}
                        </span>

                        <span
                          aria-hidden
                          className="h-px w-10 bg-gradient-to-r from-[#e0b54a] to-transparent"
                        />

                        {program.featured && (
                          <span className="ml-auto flex items-center gap-2 rounded-full bg-[linear-gradient(100deg,#f5c518,#fff3b0_50%,#e2a900)] px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-black">
                            <Icon name="crown" solid className="h-3.5 w-3.5" />
                            Premium
                          </span>
                        )}
                      </div>

                      <div className="mt-6 flex items-start gap-4 sm:gap-5">
                        <span
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition duration-500 sm:h-16 sm:w-16 ${
                            program.featured
                              ? "border-[#f3c969]/70 bg-[#e0b54a]/15 text-[#f5c518]"
                              : "border-white/15 bg-white/[0.04] text-white"
                          }`}
                        >
                          <Icon
                            name={program.featured ? "crown" : "home"}
                            solid={program.featured}
                            className="h-7 w-7"
                          />
                        </span>

                        <div className="min-w-0">
                          <h3 className="text-[clamp(1.6rem,4.5vw,2.5rem)] font-black uppercase leading-[0.95] tracking-tight">
                            <span className="text-white">{lead}</span>{" "}
                            <span
                              className={
                                program.featured
                                  ? "italic text-[#f5c518]"
                                  : "italic text-white/55"
                              }
                            >
                              {accent}
                            </span>
                          </h3>

                          <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#f5c518]">
                            {program.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="mt-7 flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tight text-white">
                          {program.price}
                        </span>

                        <span className="text-sm text-white/50">
                          {program.period}
                        </span>
                      </div>

                      <p className="mt-5 max-w-lg text-sm leading-7 text-white/55">
                        {program.description}
                      </p>

                      <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6">
                        {program.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2.5 text-sm text-white/70"
                          >
                            <Icon
                              name={featureIcon(feature)}
                              className="h-[1.1rem] w-[1.1rem] text-[#f5c518]"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {program.slots.length > 0 && (
                        <div className="mt-6 border-t border-white/10 pt-6">
                          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                            Training slots
                          </p>

                          <ul className="flex flex-wrap gap-2">
                            {program.slots.map((slot) => (
                              <li
                                key={slot}
                                className={`rounded-full border px-3.5 py-2 text-xs font-bold tracking-wide ${
                                  program.featured
                                    ? "border-[#e0b54a]/40 bg-[#e0b54a]/10 text-[#f3c969]"
                                    : "border-white/15 bg-white/[0.03] text-white/70"
                                }`}
                              >
                                {slot}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <a
                        href="#contact"
                        onClick={(event) => choose(event, program.id)}
                        // mt-auto pins the call to action to the foot of the
                        // card, so the two cards line up whatever their copy.
                        className={`mt-auto flex items-center gap-4 rounded-full border px-5 py-4 text-xs font-black uppercase tracking-[0.14em] transition duration-500 ${
                          program.featured
                            ? "border-transparent bg-[linear-gradient(100deg,#f5c518,#ffd84a_50%,#e2a900)] text-black hover:brightness-110"
                            : "border-white/15 text-white hover:border-[#f3c969] hover:text-[#f5c518]"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                            program.featured
                              ? "border-black/25"
                              : "border-[#e0b54a]/50 text-[#f5c518]"
                          }`}
                        >
                          <Icon
                            name="arrowRight"
                            className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5"
                          />
                        </span>

                        Choose {program.name}
                      </a>

                      {!session && (
                        <p className="mt-3 text-center text-xs text-white/45">
                          You&apos;ll log in or create an account first.
                        </p>
                      )}
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
