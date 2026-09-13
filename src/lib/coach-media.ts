/**
 * What the coach section shows beside the copy: the photo, or a video.
 *
 * Shared by the server (to validate before saving) and the browser (to
 * render). A link is only ever turned into an embed through the id pulled
 * out of it, so a pasted URL can never choose what gets loaded in the frame.
 */

export type VideoSource =
  | { kind: "youtube"; id: string; embedUrl: string }
  | { kind: "vimeo"; id: string; embedUrl: string }
  | { kind: "file"; src: string };

export type CoachMediaMode = "photo" | "video";

export type CoachMedia = { mode: CoachMediaMode; videoUrl: string };

export const DEFAULT_COACH_MEDIA: CoachMedia = { mode: "photo", videoUrl: "" };

export const MAX_VIDEO_URL = 500;

export const VIDEO_LINK_HELP =
  "Use a YouTube or Vimeo link, or a .mp4 / .webm file such as /coach.mp4.";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;
const VIMEO_HASH = /^[a-f0-9]{6,20}$/i;
const VIDEO_FILE = /\.(mp4|webm)$/i;
const SAFE_PATH = /^\/[A-Za-z0-9._/-]+$/;

function youtube(id: string): VideoSource {
  return {
    kind: "youtube",
    id,
    // The no-cookie domain doesn't set tracking cookies until play is pressed.
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,
  };
}

function vimeo(id: string, hash: string): VideoSource {
  return {
    kind: "vimeo",
    id,
    // `h` is the privacy hash that unlisted Vimeo videos need to play.
    embedUrl: `https://player.vimeo.com/video/${id}?dnt=1${hash ? `&h=${hash}` : ""}`,
  };
}

export function parseVideoUrl(input: string): VideoSource | null {
  const raw = input.trim();

  if (!raw || raw.length > MAX_VIDEO_URL) return null;

  // A file shipped in the project's public folder.
  if (raw.startsWith("/")) {
    if (
      raw.startsWith("//") ||
      raw.includes("..") ||
      !SAFE_PATH.test(raw) ||
      !VIDEO_FILE.test(raw)
    ) {
      return null;
    }

    return { kind: "file", src: raw };
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  // https only: an http video is blocked as mixed content on the live site.
  if (url.protocol !== "https:" || url.username || url.password) return null;

  const host = url.hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/^m\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    return parts.length === 1 && YOUTUBE_ID.test(parts[0])
      ? youtube(parts[0])
      : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch" && parts.length === 1) {
      const id = url.searchParams.get("v") ?? "";
      return YOUTUBE_ID.test(id) ? youtube(id) : null;
    }

    if (
      ["shorts", "embed", "live", "v"].includes(parts[0] ?? "") &&
      parts.length === 2 &&
      YOUTUBE_ID.test(parts[1])
    ) {
      return youtube(parts[1]);
    }

    return null;
  }

  if (host === "vimeo.com") {
    if (parts.length < 1 || parts.length > 2 || !VIMEO_ID.test(parts[0])) {
      return null;
    }

    const hash = parts[1] ?? url.searchParams.get("h") ?? "";

    return !hash || VIMEO_HASH.test(hash) ? vimeo(parts[0], hash) : null;
  }

  if (host === "player.vimeo.com") {
    if (parts.length !== 2 || parts[0] !== "video" || !VIMEO_ID.test(parts[1])) {
      return null;
    }

    const hash = url.searchParams.get("h") ?? "";

    return !hash || VIMEO_HASH.test(hash) ? vimeo(parts[1], hash) : null;
  }

  // A video file hosted elsewhere.
  if (VIDEO_FILE.test(url.pathname)) return { kind: "file", src: url.href };

  return null;
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseCoachMedia(input: unknown): Parsed<CoachMedia> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Invalid request." };
  }

  const body = input as Record<string, unknown>;

  if (body.mode !== "photo" && body.mode !== "video") {
    return { ok: false, error: "Choose photo or video." };
  }

  const rawUrl = body.videoUrl ?? "";

  if (typeof rawUrl !== "string" || rawUrl.length > MAX_VIDEO_URL) {
    return { ok: false, error: "That video link is too long." };
  }

  const videoUrl = rawUrl.trim();

  // A saved link is kept while showing the photo, so switching back to the
  // video is one click — but it still has to be a link that would play.
  if (videoUrl && !parseVideoUrl(videoUrl)) {
    return { ok: false, error: VIDEO_LINK_HELP };
  }

  if (body.mode === "video" && !videoUrl) {
    return { ok: false, error: "Paste a video link first." };
  }

  return { ok: true, value: { mode: body.mode, videoUrl } };
}
