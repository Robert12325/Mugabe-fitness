"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoSources } from "@mugabe/fitness-content";
import Icon from "@/components/icons";
import { useT } from "@/lib/i18n";

type State = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

/**
 * A demonstration clip. Nothing is downloaded until the player is near the
 * screen (then only the poster) and the video itself only when the visitor
 * presses play. Silent, never autoplays, plays inline on phones, and keeps
 * the browser's own controls once it has started.
 */
export default function ExerciseVideo({
  sources,
  label,
  notice,
}: {
  sources: VideoSources;
  /** What the clip shows, for screen readers: usually the exercise name. */
  label: string;
  /** A line shown above the player, such as a "test footage" warning. */
  notice?: string;
}) {
  const t = useT();
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [state, setState] = useState<State>("idle");

  // Lazy: only load the poster once the player is close to the screen.
  useEffect(() => {
    const node = wrap.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const play = () => {
    const element = video.current;
    if (!element) return;
    setState("loading");
    if (state === "error") element.load();
    if (state === "ended") element.currentTime = 0;
    element.play().catch(() => setState("error"));
  };

  const started = state !== "idle";

  return (
    <figure className="mt-8" data-testid="exercise-video" data-state={state}>
      {notice && (
        <p data-testid="video-notice" className="mb-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
          {notice}
        </p>
      )}

      <div
        ref={wrap}
        className="relative mx-auto w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl border border-[#e0b54a]/30 bg-[#0b0a08]"
        style={{ aspectRatio: `${sources.width} / ${sources.height}` }}
      >
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          poster={near ? sources.poster : undefined}
          preload="none"
          muted
          playsInline
          controls={started && state !== "error"}
          aria-label={label}
          onWaiting={() => setState("loading")}
          onPlaying={() => setState("playing")}
          onPause={() => setState((current) => (current === "ended" || current === "error" ? current : "paused"))}
          onEnded={() => setState("ended")}
          onError={() => setState("error")}
        >
          {started && <source src={sources.src} type="video/mp4" />}
        </video>

        {(state === "idle" || state === "ended") && (
          <button
            type="button"
            onClick={play}
            data-testid={state === "ended" ? "video-replay" : "video-play"}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 text-white transition-colors hover:bg-black/25 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#e0b54a]"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e0b54a] text-black shadow-lg">
              {state === "ended" ? (
                <Icon name="cycle" className="h-7 w-7" />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden className="ml-1 h-7 w-7" fill="currentColor">
                  <path d="M8 5.5v13l10.5-6.5z" />
                </svg>
              )}
            </span>
            <span className="rounded-full bg-black/60 px-3 py-1 text-sm font-bold">
              {state === "ended" ? t("wk.video.replay") : t("wk.video.play")}
            </span>
          </button>
        )}

        {state === "loading" && (
          <p role="status" className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center">
            <span className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white">
              <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
              {t("wk.video.loading")}
            </span>
          </p>
        )}

        {state === "error" && (
          <div role="alert" data-testid="video-error" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
            <p className="text-sm text-white/85">{t("wk.video.error")}</p>
            <button
              type="button"
              onClick={play}
              className="rounded-full border border-[#e0b54a] px-4 py-2 text-sm font-bold text-[#f3c969] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0b54a]"
            >
              {t("wk.video.retry")}
            </button>
          </div>
        )}
      </div>
    </figure>
  );
}
