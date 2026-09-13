import {
  DEFAULT_COACH_MEDIA,
  type CoachMedia,
} from "@/lib/coach-media";

export type MediaLoad =
  | { state: "online"; media: CoachMedia }
  | { state: "offline" }
  | { state: "error" };

const ENDPOINT = "/api/site/coach-media";

function toMedia(body: unknown): CoachMedia {
  if (!body || typeof body !== "object") return DEFAULT_COACH_MEDIA;

  const { mode, videoUrl } = body as Record<string, unknown>;

  return {
    mode: mode === "video" ? "video" : "photo",
    videoUrl: typeof videoUrl === "string" ? videoUrl : "",
  };
}

/**
 * `fresh` skips the CDN copy, so the admin sees what was just saved rather
 * than a response cached up to 30 seconds ago.
 */
export async function fetchCoachMedia({
  fresh = false,
}: { fresh?: boolean } = {}): Promise<MediaLoad> {
  try {
    const response = await fetch(
      fresh ? `${ENDPOINT}?fresh=${Date.now()}` : ENDPOINT,
      fresh ? { cache: "no-store" } : undefined,
    );

    if (response.status === 503) return { state: "offline" };
    if (!response.ok) return { state: "error" };

    return { state: "online", media: toMedia(await response.json()) };
  } catch {
    return { state: "error" };
  }
}

export type MediaSave =
  | { ok: true; media: CoachMedia }
  | { ok: false; message: string };

export async function saveCoachMedia(media: CoachMedia): Promise<MediaSave> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(media),
    });

    if (response.ok) {
      return { ok: true, media: toMedia(await response.json()) };
    }

    if (response.status === 401) {
      return {
        ok: false,
        message: "Your admin session expired. Lock, then sign in again.",
      };
    }

    let message = `Couldn't save (${response.status}).`;

    try {
      const body: unknown = await response.json();

      if (
        body &&
        typeof body === "object" &&
        typeof (body as { error?: unknown }).error === "string"
      ) {
        message = (body as { error: string }).error;
      }
    } catch {
      // Keep the generic message.
    }

    return { ok: false, message };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}
