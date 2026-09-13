"use client";

import Reveal from "@/components/motion/reveal";
import Tilt from "@/components/motion/tilt";
import { useDB } from "@/lib/use-store";

export default function Programs() {
  const db = useDB();
  const programs = db.programs.filter((program) => program.active);

  return (
    <section
      id="programs"
      className="relative overflow-hidden bg-[#080808] px-6 py-28 lg:px-8"
    >
      <div className="absolute left-1/2 top-0 h-px w-full max-w-7xl -translate-x-1/2 bg-white/10" />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d4af37]">
              Choose Your Level
            </p>

            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
              Your training.
              <br />
              <span className="text-white/40">Your level.</span>
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-white/55 lg:justify-self-end">
            Two coaching experiences. One standard of commitment. Choose the
            level that matches your goals and start building the body,
            strength, and discipline you want.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:mt-16 lg:grid-cols-2">
          {programs.map((program, index) => (
            <Reveal key={program.id} delay={index * 90}>
            <Tilt className="h-full">
            <article
              className={`group relative h-full overflow-hidden rounded-[2rem] border p-8 transition duration-500 sm:p-10 ${
                program.featured
                  ? "border-[#d4af37]/50 bg-[#d4af37]/[0.055] hover:border-[#d4af37]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25"
              }`}
            >
              <div className="tilt-glare" />

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/[0.04] transition duration-700 group-hover:scale-125" />

              {program.featured && (
                <div className="absolute right-7 top-7 rounded-full bg-[#d4af37] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-black">
                  Premium
                </div>
              )}

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.3em] text-white/55">
                    {program.number}
                  </span>
                </div>

                <h3 className="mt-12 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                  {program.name}
                </h3>

                <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                  {program.subtitle}
                </p>

                <div className="mt-10 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {program.price}
                  </span>

                  <span className="text-sm text-white/55">
                    {program.period}
                  </span>
                </div>

                <p className="mt-6 max-w-lg text-sm leading-7 text-white/50">
                  {program.description}
                </p>

                <div className="mt-8 border-t border-white/10 pt-7">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white/55">
                    What&apos;s included
                  </p>

                  <ul className="grid gap-3 sm:grid-cols-2">
                    {program.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm text-white/65"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/40 text-[10px] text-[#d4af37]">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {program.slots.length > 0 && (
                  <div className="mt-8 border-t border-white/10 pt-7">
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white/55">
                      Training slots
                    </p>

                    <ul className="flex flex-wrap gap-2">
                      {program.slots.map((slot) => (
                        <li
                          key={slot}
                          className={`rounded-full border px-3.5 py-2 text-xs font-bold tracking-wide ${
                            program.featured
                              ? "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]"
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
                  className={`mt-10 flex items-center justify-center gap-3 rounded-full px-6 py-4 text-xs font-black uppercase tracking-[0.12em] transition ${
                    program.featured
                      ? "bg-[#d4af37] text-black hover:bg-white"
                      : "border border-white/15 text-white hover:border-[#d4af37] hover:text-[#d4af37]"
                  }`}
                >
                  Choose {program.name}
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </div>
            </article>
            </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}