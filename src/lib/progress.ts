/**
 * A client's weight log and their goal.
 *
 * Shared by the server (to validate before saving) and the browser (to show
 * the same limits next to the field before sending).
 *
 * Weight is kept as whole grams, for the same reason money is kept as paise:
 * 0.1 + 0.2 is not 0.3 in floating point, and a weigh-in log adds up. Grams
 * also mean a reading like 72.4 kg survives a round trip exactly.
 *
 * Dates are plain YYYY-MM-DD strings. Building a Date and calling
 * toISOString() shifts the day backwards for anyone east of UTC, which
 * would file an evening weigh-in in India under yesterday.
 */

import { TODAY } from "@/lib/billing";

export type WeightEntry = {
  /** YYYY-MM-DD. One weigh-in per day: a second one replaces the first. */
  on: string;
  grams: number;
  note: string;
};

export type ProgressGoal = {
  /** 0 when the client has not set one yet. */
  targetGrams: number;
  /** YYYY-MM-DD, or "" for no deadline. */
  targetOn: string;
};

export type Progress = {
  goal: ProgressGoal;
  /** Newest first. */
  entries: WeightEntry[];
};

export const EMPTY_GOAL: ProgressGoal = { targetGrams: 0, targetOn: "" };

export const EMPTY_PROGRESS: Progress = { goal: EMPTY_GOAL, entries: [] };

/** Human weights. Outside this, it is a typo or a unit mix-up. */
export const MIN_GRAMS = 20_000;
export const MAX_GRAMS = 400_000;

export const MAX_ENTRIES = 400;
export const MAX_NOTE = 200;

/** No weigh-in can predate the gym; nothing can be logged in the future. */
const EARLIEST = "2020-01-01";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------ */
/* Reading and writing kilograms                                       */
/* ------------------------------------------------------------------ */

/** "72.4", "72,4", " 72.4 kg " -> 72400. 0 when it is not a weight. */
export function parseKg(input: string): number {
  const text = String(input).trim();

  // Checked before the strip below removes the sign along with the unit.
  if (text.startsWith("-")) return 0;

  const cleaned = text.replace(",", ".").replace(/[^0-9.]/g, "");

  if (!cleaned) return 0;

  const value = Number.parseFloat(cleaned);

  if (!Number.isFinite(value) || value <= 0) return 0;

  return Math.round(value * 1000);
}

/** 72400 -> "72.4". Trailing ".0" is dropped, so 72000 reads "72". */
export function formatKg(grams: number): string {
  if (!Number.isFinite(grams)) return "0";

  const kg = Math.round(grams) / 1000;

  return (Math.round(kg * 10) / 10).toString();
}

/** 1600 -> "+1.6", -1600 -> "-1.6", 0 -> "0". */
export function formatDeltaKg(grams: number): string {
  if (Math.abs(grams) < 50) return "0";

  return (grams > 0 ? "+" : "-") + formatKg(Math.abs(grams));
}

export function isValidWeight(grams: number) {
  return (
    Number.isInteger(grams) && grams >= MIN_GRAMS && grams <= MAX_GRAMS
  );
}

export function isValidDate(on: string, today = TODAY) {
  if (!ISO_DATE.test(on)) return false;

  // String comparison is date comparison for this format, and it needs no
  // Date object to go wrong in a timezone.
  return on >= EARLIEST && on <= today;
}

/* ------------------------------------------------------------------ */
/* Normalising what came back from storage                             */
/* ------------------------------------------------------------------ */

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : 0;
}

function readText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function normalizeEntry(raw: unknown): WeightEntry | null {
  const body = asObject(raw);
  const on = readText(body.on, 10);
  const grams = readNumber(body.grams);

  // A stored entry from the future would be a clock problem, not a typo,
  // so the ceiling here is the format alone.
  if (!ISO_DATE.test(on) || !isValidWeight(grams)) return null;

  return { on, grams, note: readText(body.note, MAX_NOTE) };
}

export function normalizeGoal(raw: unknown): ProgressGoal {
  const body = asObject(raw);
  const targetGrams = readNumber(body.targetGrams);
  const targetOn = readText(body.targetOn, 10);

  return {
    targetGrams: isValidWeight(targetGrams) ? targetGrams : 0,
    targetOn: ISO_DATE.test(targetOn) ? targetOn : "",
  };
}

/**
 * Newest first, one per day, capped.
 *
 * When a day appears twice the *first* one in the list wins, so a caller
 * puts the version it wants kept in front — which is what `withEntry` does
 * when a client weighs in again on a day they have already logged.
 */
export function sortEntries(entries: WeightEntry[]): WeightEntry[] {
  const byDate = new Map<string, WeightEntry>();

  for (const entry of entries) {
    if (!byDate.has(entry.on)) byDate.set(entry.on, entry);
  }

  return [...byDate.values()]
    .sort((a, b) => (a.on < b.on ? 1 : a.on > b.on ? -1 : 0))
    .slice(0, MAX_ENTRIES);
}

export function normalizeProgress(raw: unknown): Progress {
  const body = asObject(raw);

  const entries = (Array.isArray(body.entries) ? body.entries : [])
    .map(normalizeEntry)
    .filter((entry): entry is WeightEntry => entry !== null);

  return { goal: normalizeGoal(body.goal), entries: sortEntries(entries) };
}

/** Adds or replaces the weigh-in for that day. */
export function withEntry(
  progress: Progress,
  entry: WeightEntry,
): Progress {
  return {
    goal: progress.goal,
    entries: sortEntries([entry, ...progress.entries]),
  };
}

export function withoutEntry(progress: Progress, on: string): Progress {
  return {
    goal: progress.goal,
    entries: progress.entries.filter((entry) => entry.on !== on),
  };
}

/* ------------------------------------------------------------------ */
/* What the client sees                                                */
/* ------------------------------------------------------------------ */

export type ProgressStats = {
  /** The first weigh-in, and so where the journey is measured from. */
  startGrams: number;
  /** The latest weigh-in. */
  currentGrams: number;
  targetGrams: number;
  /** Current minus start. Negative means weight lost. */
  changeGrams: number;
  /** What is left to the target, as a distance: always 0 or more. */
  remainingGrams: number;
  /** 0-100 of the way from the start weight to the target. */
  percent: number;
  /** True once the target is reached or passed. */
  reached: boolean;
  /** Since the last weigh-in. Negative means down. */
  lastChangeGrams: number;
  entryCount: number;
  latestOn: string;
};

export function progressStats(progress: Progress): ProgressStats {
  const { entries, goal } = progress;

  // Entries are newest first, so the journey starts at the end of the list.
  const latest = entries[0];
  const previous = entries[1];
  const first = entries[entries.length - 1];

  const currentGrams = latest?.grams ?? 0;
  const startGrams = first?.grams ?? 0;
  const targetGrams = goal.targetGrams;

  const changeGrams = latest && first ? currentGrams - startGrams : 0;

  const lastChangeGrams =
    latest && previous ? currentGrams - previous.grams : 0;

  // The whole distance the client set out to cover, and how much of it is
  // behind them. Works the same whether the target is below the start
  // (cutting) or above it (gaining).
  const total = targetGrams && startGrams ? Math.abs(targetGrams - startGrams) : 0;
  const done = targetGrams && startGrams ? Math.abs(currentGrams - startGrams) : 0;

  const towardsTarget =
    targetGrams && startGrams
      ? Math.sign(targetGrams - startGrams) ===
        Math.sign(currentGrams - startGrams)
      : false;

  const remainingGrams =
    targetGrams && currentGrams ? Math.abs(targetGrams - currentGrams) : 0;

  const reached =
    Boolean(targetGrams && currentGrams) &&
    (targetGrams <= startGrams
      ? currentGrams <= targetGrams
      : currentGrams >= targetGrams);

  const percent = reached
    ? 100
    : total === 0 || !towardsTarget
      ? 0
      : Math.min(100, Math.round((done / total) * 100));

  return {
    startGrams,
    currentGrams,
    targetGrams,
    changeGrams,
    remainingGrams,
    percent,
    reached,
    lastChangeGrams,
    entryCount: entries.length,
    latestOn: latest?.on ?? "",
  };
}

/**
 * Points for the chart, oldest first, as percentages of the box.
 *
 * The y scale is padded so a flat run of near-identical weights does not
 * collapse onto a single line, and a one-point log sits in the middle
 * rather than on the floor.
 */
export function chartPoints(
  entries: WeightEntry[],
): { x: number; y: number; on: string; grams: number }[] {
  const ordered = [...entries].reverse();

  if (ordered.length === 0) return [];

  const weights = ordered.map((entry) => entry.grams);
  const low = Math.min(...weights);
  const high = Math.max(...weights);

  // At least a 2 kg window, so a stable week is a gentle line and not noise
  // amplified to fill the whole chart.
  const middle = (low + high) / 2;
  const span = Math.max(high - low, 2_000);
  const floor = middle - span / 2;

  return ordered.map((entry, index) => ({
    x: ordered.length === 1 ? 50 : (index / (ordered.length - 1)) * 100,
    y: 100 - ((entry.grams - floor) / span) * 100,
    on: entry.on,
    grams: entry.grams,
  }));
}
