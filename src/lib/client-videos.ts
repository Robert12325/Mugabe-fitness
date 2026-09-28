/**
 * The client workout clips shown between the hero and the programs.
 *
 * These are links, not uploads: a phone clip is tens of megabytes, which
 * no database row should hold and no homepage should serve. A YouTube or
 * Vimeo link — or an .mp4 in /public — is played by the same VideoFrame
 * the coach section uses, and a pasted URL only ever reaches the frame as
 * an id pulled out of it.
 *
 * Shared by the server (to validate before saving) and the browser (to
 * show the same message next to the field).
 */

import { VIDEO_LINK_HELP, parseVideoUrl } from "@/lib/coach-media";

export type ClientVideo = {
  /** Stable across edits, so React keys and reordering behave. */
  id: string;
  title: string;
  url: string;
};

export const MAX_CLIENT_VIDEOS = 5;
export const MAX_VIDEO_TITLE = 80;

const ID = /^[A-Za-z0-9_-]{1,40}$/;

export function newVideoId() {
  // Enough for a handful of rows that never collide within one edit.
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyVideo(): ClientVideo {
  return { id: newVideoId(), title: "", url: "" };
}

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

/** What came back from storage: anything unusable is dropped, not thrown. */
export function normalizeClientVideos(raw: unknown): ClientVideo[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const videos: ClientVideo[] = [];

  for (const item of raw) {
    const body = asObject(item);
    const url = typeof body.url === "string" ? body.url.trim() : "";

    // A link that no longer parses would render an empty frame, so it is
    // left out rather than shown broken.
    if (!url || !parseVideoUrl(url)) continue;

    const rawId = typeof body.id === "string" ? body.id : "";
    const id = ID.test(rawId) && !seen.has(rawId) ? rawId : newVideoId();

    seen.add(id);

    videos.push({
      id,
      title:
        typeof body.title === "string"
          ? body.title.trim().slice(0, MAX_VIDEO_TITLE)
          : "",
      url,
    });

    if (videos.length === MAX_CLIENT_VIDEOS) break;
  }

  return videos;
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** What the admin sent: a bad row is an error, so nothing is silently lost. */
export function parseClientVideos(input: unknown): Parsed<ClientVideo[]> {
  const body = asObject(input);
  const rows = body.videos;

  if (!Array.isArray(rows)) return { ok: false, error: "Invalid request." };

  if (rows.length > MAX_CLIENT_VIDEOS) {
    return {
      ok: false,
      error: `Up to ${MAX_CLIENT_VIDEOS} videos can be shown.`,
    };
  }

  const seen = new Set<string>();
  const videos: ClientVideo[] = [];

  for (const [index, item] of rows.entries()) {
    const row = asObject(item);
    const url = typeof row.url === "string" ? row.url.trim() : "";
    const position = index + 1;

    if (!url) return { ok: false, error: `Video ${position} has no link.` };

    if (!parseVideoUrl(url)) {
      return { ok: false, error: `Video ${position}: ${VIDEO_LINK_HELP}` };
    }

    const title = typeof row.title === "string" ? row.title.trim() : "";

    if (title.length > MAX_VIDEO_TITLE) {
      return { ok: false, error: `Video ${position} has too long a title.` };
    }

    const rawId = typeof row.id === "string" ? row.id : "";
    const id = ID.test(rawId) && !seen.has(rawId) ? rawId : newVideoId();

    seen.add(id);
    videos.push({ id, title, url });
  }

  return { ok: true, value: videos };
}
