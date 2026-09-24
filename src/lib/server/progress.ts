import {
  EMPTY_PROGRESS,
  MAX_ENTRIES,
  MAX_NOTE,
  isValidDate,
  isValidWeight,
  normalizeGoal,
  normalizeProgress,
  withEntry,
  withoutEntry,
  type Progress,
  type ProgressGoal,
  type WeightEntry,
} from "@/lib/progress";
import { rateLimit, redis } from "./redis";

/**
 * One document per client, holding their goal and their weigh-ins.
 *
 * Capped at MAX_ENTRIES (~16 KB of JSON), so it stays a single cheap read
 * on a page that loads it on every visit.
 */

function key(userId: string) {
  return `mf:user:${userId}:progress`;
}

export async function getProgress(userId: string): Promise<Progress> {
  const raw = await redis<unknown>("GET", key(userId));

  if (typeof raw !== "string") return EMPTY_PROGRESS;

  try {
    return normalizeProgress(JSON.parse(raw));
  } catch {
    // Unreadable rather than absent. Returning empty would invite the next
    // write to overwrite a log that might still be recoverable by hand.
    throw new Error("Stored progress is not valid JSON.");
  }
}

async function setProgress(userId: string, progress: Progress) {
  await redis("SET", key(userId), JSON.stringify(progress));

  return progress;
}

/* ------------------------------------------------------------------ */
/* Validating what the browser sent                                    */
/* ------------------------------------------------------------------ */

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

export function parseGoal(input: unknown): Parsed<ProgressGoal> {
  const body = asObject(input);
  const targetGrams = body.targetGrams;

  // 0 clears the goal, which is how a client removes one they have met.
  if (targetGrams !== 0 && !isValidWeight(Number(targetGrams))) {
    return { ok: false, error: "Enter a target weight between 20 and 400 kg." };
  }

  const targetOn = typeof body.targetOn === "string" ? body.targetOn.trim() : "";

  // A deadline is the one date allowed to be in the future.
  if (targetOn && !/^\d{4}-\d{2}-\d{2}$/.test(targetOn)) {
    return { ok: false, error: "That target date is not a valid date." };
  }

  return {
    ok: true,
    value: normalizeGoal({ targetGrams: Number(targetGrams), targetOn }),
  };
}

export function parseEntry(input: unknown): Parsed<WeightEntry> {
  const body = asObject(input);
  const grams = Number(body.grams);

  if (!isValidWeight(grams)) {
    return { ok: false, error: "Enter a weight between 20 and 400 kg." };
  }

  const on = typeof body.on === "string" ? body.on.trim() : "";

  if (!isValidDate(on)) {
    return { ok: false, error: "Pick a date today or earlier." };
  }

  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (note.length > MAX_NOTE) {
    return { ok: false, error: "That note is too long." };
  }

  return { ok: true, value: { on, grams, note } };
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function saveGoal(userId: string, goal: ProgressGoal) {
  const current = await getProgress(userId);

  return setProgress(userId, { goal, entries: current.entries });
}

export type AddResult =
  | { ok: true; progress: Progress }
  | { ok: false; error: string };

export async function saveEntry(
  userId: string,
  entry: WeightEntry,
): Promise<AddResult> {
  const current = await getProgress(userId);
  const isNewDay = !current.entries.some((existing) => existing.on === entry.on);

  if (isNewDay && current.entries.length >= MAX_ENTRIES) {
    return {
      ok: false,
      error: "Your log is full. Delete an older weigh-in first.",
    };
  }

  return { ok: true, progress: await setProgress(userId, withEntry(current, entry)) };
}

export async function removeEntry(userId: string, on: string) {
  const current = await getProgress(userId);

  return setProgress(userId, withoutEntry(current, on));
}

/** Generous for real use, low enough that a loose script gets nowhere. */
export function allowProgressWrite(userId: string) {
  return rateLimit(`mf:rl:progress:${userId}`, 60, 60 * 60);
}
