"use client";

import Reveal from "@/components/motion/reveal";
import WireCube from "@/components/motion/wire-cube";

const reasons = [
  {
    number: "01",
    title: "Personal Coaching",
    text: "Training built around the individual—not a generic routine copied from someone else.",
  },
  {
    number: "02",
    title: "Real Accountability",
    text: "Consistent coaching, guidance, and structure designed to keep you moving forward.",
  },
  {
    number: "03",
    title: "Measurable Progress",
    text: "Train with purpose, track your development, and build progress you can actually see.",
  },
];

export default function WhyMugabe() {
  return (
    <section className="relative isolate overflow-hidden border-t border-white/10 bg-[#080808] px-6 py-28 lg:px-8">
      {/* Ambient depth. Kept behind everything and inert. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] top-[10%] h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.07),transparent_65%)] pulse-glow" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="lg:flex lg:flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d4af37]">
              Why Mugabe Fitness
            </p>

            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
              Built for
              <br />
              <span className="text-white/40">serious people.</span>
            </h2>

            {/* Fills the column the heading leaves empty, and gives the
                section its own 3D object. */}
            <div className="mt-14 flex justify-center lg:mt-auto lg:justify-start lg:pt-16">
              <WireCube size={200} className="float-slow" />
            </div>
          </Reveal>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {reasons.map((reason, index) => (
              <Reveal key={reason.number} delay={index * 110}>
                <div className="group relative grid gap-x-5 gap-y-3 py-8 transition-colors duration-500 md:grid-cols-[70px_200px_1fr] md:items-start">
                  {/* Rail that draws itself in on hover. */}
                  <span
                    aria-hidden
                    className="absolute -left-4 top-0 hidden h-full w-px origin-top scale-y-0 bg-gradient-to-b from-[#d4af37] to-transparent transition-transform duration-500 group-hover:scale-y-100 md:block"
                  />

                  <span className="text-xs font-bold tracking-[0.25em] text-[#d4af37] transition-transform duration-500 group-hover:translate-x-1">
                    {reason.number}
                  </span>

                  <h3 className="text-lg font-black uppercase text-white transition-transform duration-500 group-hover:translate-x-1">
                    {reason.title}
                  </h3>

                  <p className="max-w-xl text-sm leading-7 text-white/55 transition-colors duration-500 group-hover:text-white/70">
                    {reason.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
