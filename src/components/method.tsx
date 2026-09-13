"use client";

import Reveal from "@/components/motion/reveal";
import { useDB } from "@/lib/use-store";

export default function Method() {
  const steps = useDB().method;

  return (
    <section id="method" className="bg-black px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d4af37]">
            The Mugabe Method
          </p>

          <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
            Don&apos;t just
            <br />
            <span className="text-[#d4af37]">work out.</span>
            <br />
            Train with purpose.
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:mt-20 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 80} className="h-full">
            <div className="h-full bg-[#080808] p-7 transition hover:bg-[#101010] sm:p-8">
              <span className="text-xs font-bold text-[#d4af37]">
                {step.number}
              </span>

              <h3 className="mt-12 text-xl font-black uppercase text-white">
                {step.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/55">
                {step.text}
              </p>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}