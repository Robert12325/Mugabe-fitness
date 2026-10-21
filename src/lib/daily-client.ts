import {
  NO_TARGETS,
  normalizeCoachNotes,
  normalizeDailyLog,
  normalizeTargets,
  type CoachNote,
  type DailyEntry,
  type Targets,
} from "@/lib/daily";
import { readError } from "@/lib/enquiries-client";
import type { MembershipStatus } from "@/lib/membership";
import {
  EMPTY_PROGRESS,
  normalizeProgress,
  type Progress,
} from "@/lib/progress";

/** The browser half of the daily log, for the client and for the coach. */

const OFFLINE = "You appear to be offline. Check your connection and try again.";

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

/* ------------------------------------------------------------------ */
/* The client                                                          */
/* ------------------------------------------------------------------ */

export type Tracking = {
  log: DailyEntry[];
  progress: Progress;
  targets: Targets;
};

export type TrackingLoad =
  | ({ state: "ok" } & Tracking)
  | { state: "locked" }
  | { state: "error" };

function readTracking(body: unknown): Tracking {
  const data = asObject(body);

  return {
    log: normalizeDailyLog(data.log),
    progress: data.progress ? normalizeProgress(data.progress) : EMPTY_PROGRESS,
    targets: data.targets ? normalizeTargets(data.targets) : NO_TARGETS,
  };
}

export async function fetchTracking(token: string): Promise<TrackingLoad> {
  try {
    const response = await fetch("/api/account/daily", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.status === 403) return { state: "locked" };
    if (!response.ok) return { state: "error" };

    return { state: "ok", ...readTracking(await response.json()) };
  } catch {
    return { state: "error" };
  }
}

/** A day as the form sends it: the log entry, plus that day's weight (null
 *  removes the weigh-in). */
export type DayPayload = DailyEntry & { weightGrams: number | null };

export type DaySave =
  | { ok: true; log: DailyEntry[]; progress: Progress }
  | { ok: false; message: string };

async function writeDay(
  token: string,
  init: RequestInit & { query?: string },
): Promise<DaySave> {
  let response: Response;

  try {
    response = await fetch("/api/account/daily" + (init.query ?? ""), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    return { ok: false, message: OFFLINE };
  }

  if (!response.ok) return { ok: false, message: await readError(response) };

  const body = asObject(await response.json().catch(() => null));

  return {
    ok: true,
    log: normalizeDailyLog(body.log),
    progress: body.progress ? normalizeProgress(body.progress) : EMPTY_PROGRESS,
  };
}

export function saveDay(token: string, day: DayPayload) {
  return writeDay(token, { method: "POST", body: JSON.stringify(day) });
}

export function deleteDay(token: string, on: string) {
  return writeDay(token, {
    method: "DELETE",
    query: `?on=${encodeURIComponent(on)}`,
  });
}

/* ------------------------------------------------------------------ */
/* The coach                                                           */
/* ------------------------------------------------------------------ */

export type ClientSnapshot = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: MembershipStatus;
  programName: string;
  recent: DailyEntry[];
  lastWeighOn: string;
  targets: Targets;
};

export type ClientsLoad =
  | { state: "online"; clients: ClientSnapshot[] }
  | { state: "offline" }
  | { state: "unauthorized" }
  | { state: "error" };

const STATUSES: MembershipStatus[] = ["none", "trial", "paid", "due", "expired"];

export async function loadClients(): Promise<ClientsLoad> {
  try {
    const response = await fetch("/api/admin/clients", { cache: "no-store" });

    if (response.status === 503) return { state: "offline" };
    if (response.status === 401) return { state: "unauthorized" };
    if (!response.ok) return { state: "error" };

    const body = asObject(await response.json());
    const text = (row: Record<string, unknown>, key: string) =>
      typeof row[key] === "string" ? (row[key] as string) : "";

    const clients = (Array.isArray(body.clients) ? body.clients : [])
      .map((raw): ClientSnapshot | null => {
        const row = asObject(raw);

        if (!text(row, "userId")) return null;

        return {
          userId: text(row, "userId"),
          name: text(row, "name"),
          email: text(row, "email"),
          phone: text(row, "phone"),
          status: STATUSES.includes(row.status as MembershipStatus)
            ? (row.status as MembershipStatus)
            : "none",
          programName: text(row, "programName"),
          recent: normalizeDailyLog(row.recent),
          lastWeighOn: text(row, "lastWeighOn"),
          targets: row.targets ? normalizeTargets(row.targets) : NO_TARGETS,
        };
      })
      .filter((row): row is ClientSnapshot => row !== null);

    return { state: "online", clients };
  } catch {
    return { state: "error" };
  }
}

export type ClientRecord = Tracking & { notes: CoachNote[] };

function clientUrl(userId: string, rest = "") {
  return `/api/admin/clients/${encodeURIComponent(userId)}${rest}`;
}

export async function loadClientRecord(
  userId: string,
): Promise<ClientRecord | null> {
  try {
    const response = await fetch(clientUrl(userId), { cache: "no-store" });

    if (!response.ok) return null;

    const body = await response.json();

    return {
      ...readTracking(body),
      notes: normalizeCoachNotes(asObject(body).notes),
    };
  } catch {
    return null;
  }
}

type Saved<T> = { ok: true; value: T } | { ok: false; message: string };

async function adminWrite<T>(
  url: string,
  init: RequestInit,
  read: (body: Record<string, unknown>) => T,
): Promise<Saved<T>> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }

  if (!response.ok) return { ok: false, message: await readError(response) };

  return { ok: true, value: read(asObject(await response.json().catch(() => null))) };
}

export function saveTargets(
  userId: string,
  targets: Omit<Targets, "updatedAt">,
) {
  return adminWrite(
    clientUrl(userId, "/targets"),
    { method: "PUT", body: JSON.stringify(targets) },
    (body) => normalizeTargets(body.targets),
  );
}

export function addNote(userId: string, text: string) {
  return adminWrite(
    clientUrl(userId, "/notes"),
    { method: "POST", body: JSON.stringify({ text }) },
    (body) => normalizeCoachNotes(body.notes),
  );
}

export function deleteNote(userId: string, id: string) {
  return adminWrite(
    clientUrl(userId, `/notes?id=${encodeURIComponent(id)}`),
    { method: "DELETE" },
    (body) => normalizeCoachNotes(body.notes),
  );
}
