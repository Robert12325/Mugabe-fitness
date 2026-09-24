import { readError } from "@/lib/enquiries-client";
import {
  normalizeProgress,
  type Progress,
  type ProgressGoal,
  type WeightEntry,
} from "@/lib/progress";

/**
 * The browser half of the weight log. Every call carries the session token,
 * and the server decides whose log it is.
 */

export type ProgressLoad =
  | { state: "ok"; progress: Progress }
  | { state: "signed-out" }
  | { state: "offline" }
  | { state: "error" };

export type SaveResult =
  | { ok: true; progress: Progress }
  | { ok: false; message: string };

const OFFLINE = "You appear to be offline. Check your connection and try again.";

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function readProgress(body: unknown): Progress | null {
  if (!body || typeof body !== "object") return null;

  const { progress } = body as { progress?: unknown };

  return progress === undefined ? null : normalizeProgress(progress);
}

export async function fetchProgress(token: string): Promise<ProgressLoad> {
  try {
    const response = await fetch("/api/account/progress", {
      headers: auth(token),
      cache: "no-store",
    });

    if (response.status === 401) return { state: "signed-out" };
    if (response.status === 503) return { state: "offline" };
    if (!response.ok) return { state: "error" };

    const progress = readProgress(await response.json());

    return progress ? { state: "ok", progress } : { state: "error" };
  } catch {
    return { state: "error" };
  }
}

/** Shared by the three writes: they differ only in method, body and query. */
async function write(
  token: string,
  init: RequestInit & { query?: string },
): Promise<SaveResult> {
  let response: Response;

  try {
    response = await fetch("/api/account/progress" + (init.query ?? ""), {
      ...init,
      headers: {
        ...auth(token),
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    return { ok: false, message: OFFLINE };
  }

  if (!response.ok) return { ok: false, message: await readError(response) };

  const progress = readProgress(await response.json().catch(() => null));

  return progress
    ? { ok: true, progress }
    : { ok: false, message: "Unexpected response. Please try again." };
}

export function saveGoal(token: string, goal: ProgressGoal) {
  return write(token, { method: "PUT", body: JSON.stringify(goal) });
}

export function saveEntry(token: string, entry: WeightEntry) {
  return write(token, { method: "POST", body: JSON.stringify(entry) });
}

export function deleteEntry(token: string, on: string) {
  return write(token, {
    method: "DELETE",
    query: `?on=${encodeURIComponent(on)}`,
  });
}
