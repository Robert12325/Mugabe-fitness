import {
  normalizeClientVideos,
  type ClientVideo,
} from "@/lib/client-videos";

const ENDPOINT = "/api/site/client-videos";

export type VideosLoad =
  | { state: "online"; videos: ClientVideo[] }
  | { state: "offline" }
  | { state: "error" };

function toVideos(body: unknown): ClientVideo[] {
  if (!body || typeof body !== "object") return [];

  return normalizeClientVideos((body as { videos?: unknown }).videos);
}

/**
 * `fresh` skips the CDN copy, so the admin sees what was just saved rather
 * than a response cached up to 30 seconds ago.
 */
export async function fetchClientVideos({
  fresh = false,
}: { fresh?: boolean } = {}): Promise<VideosLoad> {
  try {
    const response = await fetch(
      fresh ? `${ENDPOINT}?fresh=${Date.now()}` : ENDPOINT,
      fresh ? { cache: "no-store" } : undefined,
    );

    if (response.status === 503) return { state: "offline" };
    if (!response.ok) return { state: "error" };

    return { state: "online", videos: toVideos(await response.json()) };
  } catch {
    return { state: "error" };
  }
}

export type VideosSave =
  | { ok: true; videos: ClientVideo[] }
  | { ok: false; message: string };

export async function saveClientVideos(
  videos: ClientVideo[],
): Promise<VideosSave> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videos }),
    });

    if (response.ok) {
      return { ok: true, videos: toVideos(await response.json()) };
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
