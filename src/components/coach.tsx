"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Hexagon from "@/components/hexagon";
import Icon, { type IconName } from "@/components/icons";
import Reveal from "@/components/motion/reveal";
import VideoFrame from "@/components/video-frame";
import { parseVideoUrl, type CoachMedia } from "@/lib/coach-media";
import { fetchCoachMedia } from "@/lib/coach-media-client";
import { coachPhotoSrc } from "@/lib/store";
import { useDB } from "@/lib/use-store";

const PILLARS = [
  {
    number: "01",
    icon: "clipboard",
    title: "Coaching, not workouts",
    text: "Every session has a reason behind it. You always know what you are doing and why.",
  },
  {
    number: "02",
    icon: "shield",
    title: "Standards over shortcuts",
    text: "Technique first, load second. Progress that holds up is progress worth building.",
  },
  {
    number: "03",
    icon: "users",
    title: "In it with you",
    text: "The same discipline asked of you is the standard the coaching is held to.",
  },
] as const satisfies readonly {
  number: string;
  icon: IconName;
  title: string;
  text: string;
}[];

export default function Coach() {
  const { settings } = useDB();
  const photo = coachPhotoSrc(settings);

  // Remembering which src failed (rather than a boolean) resets on its own
  // when the photo changes, with no effect needed.
  const [failedSrc, setFailedSrc] = useState("");
  const showPhoto = failedSrc !== photo;

  // Photo or video is a site-wide choice stored on the server. Until it
  // arrives — or if the database isn't reachable — the photo shows.
  const [media, setMedia] = useState<CoachMedia | null>(null);
  const [failedVideo, setFailedVideo] = useState("");

  useEffect(() => {
    let active = true;

    fetchCoachMedia().then((result) => {
      if (active && result.state === "online") setMedia(result.media);
    });

    return () => {
      active = false;
    };
  }, []);

  const video = media?.mode === "video" ? parseVideoUrl(media.videoUrl) : null;
  const videoKey = video
    ? video.kind === "file"
      ? video.src
      : video.embedUrl
    : "";
  const showVideo = video !== null && failedVideo !== videoKey;

  return (
    <section
      id="coach"
      className="relative isolate overflow-hidden border-t border-white/10 bg-[#080808] px-5 py-24 font-[family-name:var(--font-display)] sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Gold haze behind the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55rem_32rem_at_18%_14%,rgba(245,197,24,0.06),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-14">
          <Reveal>
            <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518]">
              <span aria-hidden className="h-0.5 w-10 shrink-0 bg-[#f5c518]" />
              Your Coach
            </p>

            {/* Gradient text is only painted inside its own box, so each
                line is sized to its own width rather than to the column.
                `max-w-full` caps that: these lines are long enough to be
                wider than a phone, and a max-content box that wide drags the
                whole grid track out with it. */}
            <h2 className="mt-6 text-[clamp(1.85rem,5.6vw,3.5rem)] font-black uppercase leading-[0.92] tracking-[-0.02em]">
              <span className="block w-max max-w-full bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-transparent">
                Built by someone
              </span>

              <span className="relative block w-max max-w-full">
                <span className="bg-[linear-gradient(100deg,#e2a900,#f5c518_36%,#fff3b0_52%,#f5c518_66%,#c98f28)] bg-clip-text pr-[0.12em] italic text-transparent">
                  Who lives the work.
                </span>

                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-[0.4rem] w-[94%] -skew-x-[20deg] rounded-full bg-[linear-gradient(90deg,#f5c518,rgba(245,197,24,0.05))]"
                />
              </span>
            </h2>

            <p className="mt-8 max-w-xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">
              Mugabe Fitness combines strength training, discipline, coaching,
              and a commitment to continuous improvement. The goal isn&apos;t
              simply to exercise. It&apos;s to build a stronger version of you.
            </p>

            <a
              href="#contact"
              className="group mt-10 inline-flex items-center gap-4 rounded-full border border-white/15 py-3 pl-3 pr-7 text-xs font-black uppercase tracking-[0.14em] text-white transition duration-500 hover:border-[#f3c969] hover:text-[#f5c518]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e0b54a]/50 text-[#f5c518] transition duration-500 group-hover:border-[#f3c969] group-hover:bg-[#f5c518] group-hover:text-black">
                <Icon
                  name="arrowRight"
                  className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5"
                />
              </span>

              Work with me
            </a>
          </Reveal>

          <Reveal delay={120}>
            <div
              className={`relative aspect-[4/5] w-full max-w-xl overflow-hidden lg:max-w-none ${goldCardClass}`}
            >
              <GoldCardGlow />

              {showVideo && video ? (
                <VideoFrame
                  source={video}
                  title="Meet your coach at Mugabe Fitness"
                  poster={showPhoto ? photo : undefined}
                  onError={() => setFailedVideo(videoKey)}
                />
              ) : showPhoto ? (
                <>
                  <Image
                    src={photo}
                    alt="The coach mid-workout at Mugabe Fitness"
                    fill
                    // Roughly half the 80rem container from lg, full width
                    // below.
                    sizes="(min-width: 1024px) 40rem, 100vw"
                    // A file shipped in /public goes through the optimizer, so
                    // a phone downloads a phone-sized image. Uploaded data URLs
                    // and remote links can't be optimized without extra config.
                    unoptimized={!photo.startsWith("/")}
                    onError={() => setFailedSrc(photo)}
                    className="object-cover object-top contrast-[1.1] grayscale"
                  />

                  {/* Settles the photo into the same dark, gold-lit world as
                      the rest of the page. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"
                  />

                  {/* "Stronger Together", brushed across the foot. */}
                  <p className="absolute bottom-[6%] left-[7%] -rotate-[10deg] bg-[linear-gradient(90deg,#c98f28,#f3c969_55%,#fbe3a0)] bg-clip-text pr-3 font-[family-name:var(--font-script)] text-[2.2rem] leading-[0.95] text-transparent sm:text-[2.8rem]">
                    Stronger
                    <br />
                    <span className="ml-8">Together</span>
                  </p>
                </>
              ) : (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(224,181,74,0.12),transparent_60%)]" />

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
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 lg:mt-20">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.number} delay={index * 90} className="h-full">
              <article
                className={`flex h-full flex-col p-6 sm:p-7 ${goldCardClass}`}
              >
                <GoldCardGlow />

                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-center gap-3">
                    <Hexagon className="flex h-[3.4rem] w-[2.9rem] shrink-0">
                      <span className="text-lg font-black tracking-tight text-[#f5c518]">
                        {pillar.number}
                      </span>
                    </Hexagon>

                    <Hexagon className="flex h-[3.4rem] w-[2.9rem] shrink-0">
                      <Icon name={pillar.icon} className="h-5 w-5 text-[#f5c518]" />
                    </Hexagon>
                  </div>

                  <h3 className="mt-7 text-lg font-black uppercase leading-[1.1] tracking-tight text-white">
                    {pillar.title}
                  </h3>

                  <span
                    aria-hidden
                    className="mt-4 block h-0.5 w-12 bg-[#f5c518]"
                  />

                  <p className="mt-5 text-sm leading-7 text-white/60">
                    {pillar.text}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
