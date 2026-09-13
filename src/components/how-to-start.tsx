"use client";

import Reveal from "@/components/motion/reveal";

const steps = [
  {
    number: "01",
    title: "Send your details",
    text: "Fill in the form with your goals, your schedule, and where you are training from.",
  },
  {
    number: "02",
    title: "Talk it through",
    text: "We go over your experience, any injuries, and which program actually fits you.",
  },
  {
    number: "03",
    title: "Start training",
    text: "Your program begins, and the coaching and accountability start from day one.",
  },
];

export default function HowToStart() {
  return (
    <section
      id="start"
      className="border-t border-white/10 bg-black px-6 py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d4af37]">
            How To Start
          </p>

          <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
            Three steps.
            <br />
            <span className="text-white/40">That&apos;s it.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 90} className="h-full">
            <div className="group relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition duration-500 hover:border-[#d4af37]/40 lg:p-8">
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full border border-white/[0.04] transition duration-700 group-hover:scale-125" />

              <div className="relative">
                <span className="text-xs font-bold tracking-[0.3em] text-[#d4af37]">
                  {step.number}
                </span>

                <h3 className="mt-12 text-xl font-black uppercase text-white">
                  {step.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/55">
                  {step.text}
                </p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>

        <a
          href="#contact"
          className="mt-12 inline-block rounded-full bg-[#d4af37] px-7 py-4 text-sm font-black uppercase tracking-wider text-black transition hover:bg-white"
        >
          Start Training
        </a>
      </div>
    </section>
  );
}
