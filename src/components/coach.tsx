"use client";

import Image from "next/image";
import { useDB } from "@/lib/use-store";

const pillars = [
  {
    title: "Coaching, not workouts",
    text: "Every session has a reason behind it. You always know what you are doing and why.",
  },
  {
    title: "Standards over shortcuts",
    text: "Technique first, load second. Progress that holds up is progress worth building.",
  },
  {
    title: "In it with you",
    text: "The same discipline asked of you is the standard the coaching is held to.",
  },
];

export default function Coach() {
  const { settings } = useDB();
  const photo = settings.coachPhoto.trim();

  return (
    <section
      id="coach"
      className="border-t border-white/10 bg-[#080808] px-6 py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d4af37]">
              Your Coach
            </p>

            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
              Built by someone
              <br />
              <span className="text-white/40">who lives the work.</span>
            </h2>

            <p className="mt-8 max-w-xl text-base leading-8 text-white/50">
              Mugabe Fitness combines strength training, discipline, coaching,
              and a commitment to continuous improvement. The goal isn&apos;t
              simply to exercise. It&apos;s to build a stronger version of you.
            </p>

            <a
              href="#contact"
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/15 px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Work with me
              <span>→</span>
            </a>
          </div>

          <div className="relative aspect-[4/5] w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] lg:max-w-none">
            {photo ? (
              <>
                <Image
                  src={photo}
                  alt="The coach mid-workout at Mugabe Fitness"
                  fill
                  // Roughly half the 80rem container from lg, full width below.
                  sizes="(min-width: 1024px) 40rem, 100vw"
                  // The source may be an uploaded data URL or a remote link,
                  // neither of which the optimizer can take without extra
                  // config. Uploads are already downscaled on the way in.
                  unoptimized
                  className="object-cover object-top"
                />

                {/* Settles the photo into the same dark, gold-lit world as
                    the rest of the page. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.10),transparent_60%)]" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/25">
                    Coach photo
                  </span>

                  <span className="text-[11px] leading-6 text-white/20">
                    Add one from Admin → Settings
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="bg-[#0b0b0b] p-6 lg:p-8">
              <h3 className="text-base font-black uppercase tracking-wide text-white">
                {pillar.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-white/55">
                {pillar.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
