"use client";

import type { VideoSource } from "@/lib/coach-media";

/**
 * Plays a parsed video source, filling its positioned parent. YouTube and
 * Vimeo get their own player; a file gets the browser's player with the
 * coach photo as its cover image.
 */
export default function VideoFrame({
  source,
  title,
  poster,
  onError,
}: {
  source: VideoSource;
  title: string;
  poster?: string;
  onError?: () => void;
}) {
  if (source.kind === "file") {
    return (
      <video
        key={source.src}
        src={source.src}
        poster={poster}
        controls
        // Keeps iPhones from forcing the video fullscreen on play.
        playsInline
        // Loads length and first frame only; the video downloads on play.
        preload="metadata"
        onError={onError}
        aria-label={title}
        // `contain` so a landscape clip isn't cropped by the portrait box.
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
    );
  }

  return (
    <iframe
      key={source.embedUrl}
      src={source.embedUrl}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="absolute inset-0 h-full w-full border-0 bg-black"
    />
  );
}
