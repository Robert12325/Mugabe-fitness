import type { MethodStep, Program, PublicSettings } from "@/lib/types";

const ENDPOINT = "/api/site/content";

export type ContentLoad =
  | {
      state: "online";
      /** false when nothing has been published yet. */
      initialized: boolean;
      programs: Program[];
      method: MethodStep[];
      settings: PublicSettings | null;
      /** One entry per slot: a URL when a photo is published, else "". */
      photos: string[];
    }
  | { state: "offline" }
  | { state: "unauthorized" }
  | { state: "error"; message: string };

/** `fresh` skips the CDN copy, for the dashboard. */
export async function fetchSiteContent({
  fresh = false,
}: { fresh?: boolean } = {}): Promise<ContentLoad> {
  try {
    const response = await fetch(
      fresh ? `${ENDPOINT}?fresh=${Date.now()}` : ENDPOINT,
      fresh ? { cache: "no-store" } : undefined,
    );

    if (response.status === 503) return { state: "offline" };
    if (response.status === 401) return { state: "unauthorized" };

    if (!response.ok) {
      return {
        state: "error",
        message: `Could not load the site content (${response.status}).`,
      };
    }

    const body = (await response.json()) as {
      initialized?: unknown;
      programs?: unknown;
      method?: unknown;
      settings?: unknown;
      photoSlots?: unknown;
    };

    return {
      state: "online",
      initialized: body.initialized === true,
      programs: Array.isArray(body.programs)
        ? (body.programs as Program[])
        : [],
      method: Array.isArray(body.method) ? (body.method as MethodStep[]) : [],
      settings:
        body.settings && typeof body.settings === "object"
          ? (body.settings as PublicSettings)
          : null,
      photos: Array.isArray(body.photoSlots)
        ? body.photoSlots.map((has, slot) =>
            has === true ? `/api/site/photo/${slot}` : "",
          )
        : [],
    };
  } catch {
    return { state: "error", message: "Could not reach the server." };
  }
}

export type ContentSave =
  | { ok: true }
  | { ok: false; unauthorized?: true; message: string };

export async function saveSiteContent(
  programs: Program[],
  method: MethodStep[],
  settings: PublicSettings,
): Promise<ContentSave> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programs, method, settings }),
    });

    if (response.ok) return { ok: true };

    if (response.status === 401) {
      return {
        ok: false,
        unauthorized: true,
        message: "Your admin session expired. Lock, then sign in again.",
      };
    }

    let message = `Changes could not be published (${response.status}).`;

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
