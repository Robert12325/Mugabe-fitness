"use client";

import { useEffect, useState } from "react";
import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Icon from "@/components/icons";
import Reveal from "@/components/motion/reveal";
import VideoFrame from "@/components/video-frame";
import { type ClientVideo } from "@/lib/client-videos";
import { fetchClientVideos } from "@/lib/client-videos-client";
import { parseVideoUrl } from "@/lib/coach-media";
import { useT } from "@/lib/i18n";

/**
 * Client workout clips, between the hero and the programs.
 *
 * Nothing is embedded until it is asked for. Five YouTube players mounted
 * on load would pull megabytes and open five third-party connections on a
 * page most visitors scroll straight past, so each card is a poster with a
 * play button and the frame appears on the click.
 *
 * The whole section is absent until the coach adds a link, rather than
 * standing there empty.
 */
export default function ClientResults() {
  const t = useT();
  const [videos, setVideos] = useState<ClientVideo[]>([]);
  const [playing, setPlaying] = useState("");

  useEffect(() => {
    let active = true;

    fetchClientVideos().then((result) => {
      if (active && result.state === "online") setVideos(result.videos);
    });

    return () => {
      active = false;
    };
  }, []);

  if (videos.length === 0) return null;

  return (
    <section
      id="results"
      className="relative isolate overflow-hidden border-t border-white/10 bg-black px-5 py-24 font-[family-name:var(--font-display)] sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Gold haze behind the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55rem_32rem_at_80%_10%,rgba(245,197,24,0.07),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.32em] text-[#f5c518]">
                <span aria-hidden className="h-0.5 w-10 shrink-0 bg-[#f5c518]" />
                {t("results.eyebrow")}
              </p>

              {/* Gradient text is only painted inside its own box, so each
                  line is sized to the word rather than to the column. */}
              <h2 className="mt-6 text-[clamp(2.2rem,7vw,4rem)] font-black uppercase leading-[0.92] tracking-[-0.02em]">
                <span className="block w-max bg-[linear-gradient(180deg,#ffffff_35%,#b9b9b9)] bg-clip-text text-transparent">
                  {t("results.h1")}
                </span>

                <span className="block w-max bg-[linear-gradient(100deg,#e2a900,#f5c518_36%,#fff3b0_52%,#f5c518_66%,#c98f28)] bg-clip-text pr-[0.12em] italic text-transparent">
                  {t("results.h2")}
                </span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
                {t("results.lede")}
              </p>
            </div>

            <p
              aria-hidden
              className="hidden -rotate-[8deg] bg-[linear-gradient(90deg,#c98f28,#f3c969_55%,#fbe3a0)] bg-clip-text pr-3 text-right font-[family-name:var(--font-script)] text-[2.6rem] leading-[0.95] text-transparent lg:block"
            >
              {t("results.script")}
              <br />
              <span className="mr-6">{t("results.script2")}</span>
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {videos.map((video, index) => (
            <Reveal key={video.id} delay={index * 80} className="h-full">
              <VideoCard
                video={video}
                playing={playing === video.id}
                onPlay={() => setPlaying(video.id)}
                onClose={() => setPlaying("")}
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VideoCard({
  video,
  playing,
  onPlay,
  onClose,
}: {
  video: ClientVideo;
  playing: boolean;
  onPlay: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const source = parseVideoUrl(video.url);
  const title = video.title || t("results.untitled");

  // A link that stopped parsing since it was saved shows nothing rather
  // than an empty player.
  if (!source) return null;

  return (
    <li className={`group h-full overflow-hidden p-0 ${goldCardClass}`}>
      <GoldCardGlow />

      {/* 4:5 suits a phone clip without making a landscape one tiny. */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[1.75rem] bg-black">
        {playing ? (
          <>
            <VideoFrame source={source} title={title} />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white/80 backdrop-blur transition hover:border-white hover:text-white"
              aria-label={t("results.close")}
            >
              ✕
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_38%,rgba(224,181,74,0.16),transparent_62%)] transition hover:bg-[radial-gradient(circle_at_50%_38%,rgba(224,181,74,0.26),transparent_62%)]"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5c518] text-black shadow-[0_14px_36px_-12px_rgba(245,197,24,0.7)] transition group-hover:scale-105">
              <svg viewBox="0 0 24 24" aria-hidden className="ml-1 h-7 w-7">
                <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
              </svg>
            </span>

            <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/70">
              {t("results.play")}
            </span>
          </button>
        )}
      </div>

      <div className="relative flex items-center gap-3 px-5 py-4">
        <Icon name="video" className="h-4 w-4 shrink-0 text-[#f5c518]" />

        <p className="min-w-0 flex-1 break-words text-sm font-bold text-white">
          {title}
        </p>
      </div>
    </li>
  );
}
