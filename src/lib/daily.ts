/**
 * The client's daily log — what they ate, drank, walked, slept and trained —
 * and the targets their coach set for it.
 *
 * Shared by the server (to validate before saving) and the browser (to show
 * the same limits next to the field before sending).
 *
 * Body weight is deliberately not here: it lives in the weigh-in log in
 * `progress.ts`, which the daily form writes to as well, so a client's
 * weight is only ever kept in one place.
 *
 * Every amount is a whole number in the smallest unit worth recording —
 * millilitres, millimetres, minutes — for the same reason money is kept in
 * paise. `null` means "not logged", which is different from a logged 0.
 *
 * Targets are only ever what the coach typed. Nothing here suggests, works
 * out or adjusts an intake — there are no defaults to fall back on.
 */

import { isValidDate, isValidWeight, type WeightEntry } from "@/lib/progress";

export type DailyEntry = {
  /** YYYY-MM-DD. One entry per day. */
  on: string;
  caloriesKcal: number | null;
  proteinG: number | null;
  waterMl: number | null;
  steps: number | null;
  waistMm: number | null;
  sleepMin: number | null;
  /** Did they train today? null when they haven't said. */
  workout: boolean | null;
  /** 1-10. */
  energy: number | null;
  notes: string;
};

export const NUMERIC_FIELDS = [
  "caloriesKcal",
  "proteinG",
  "waterMl",
  "steps",
  "waistMm",
  "sleepMin",
  "energy",
] as const;

export type NumericField = (typeof NUMERIC_FIELDS)[number];

/** What a person could plausibly log. Outside this it is a typo. */
export const LIMITS: Record<NumericField, { min: number; max: number }> = {
  caloriesKcal: { min: 0, max: 10_000 },
  proteinG: { min: 0, max: 1_000 },
  waterMl: { min: 0, max: 20_000 },
  steps: { min: 0, max: 200_000 },
  waistMm: { min: 300, max: 2_500 },
  sleepMin: { min: 0, max: 24 * 60 },
  energy: { min: 1, max: 10 },
};

export const MAX_NOTES = 500;
export const MAX_DAILY_ENTRIES = 400;

/** The coach's numbers for one client. null means "not set". */
export type Targets = {
  caloriesKcal: number | null;
  proteinG: number | null;
  waterMl: number | null;
  steps: number | null;
  weightGrams: number | null;
  waistMm: number | null;
  updatedAt: string;
};

export const TARGET_FIELDS = [
  "caloriesKcal",
  "proteinG",
  "waterMl",
  "steps",
  "weightGrams",
  "waistMm",
] as const;

export type TargetField = (typeof TARGET_FIELDS)[number];

const TARGET_LIMITS: Record<TargetField, { min: number; max: number }> = {
  caloriesKcal: { min: 1, max: 10_000 },
  proteinG: { min: 1, max: 1_000 },
  waterMl: { min: 100, max: 20_000 },
  steps: { min: 1, max: 200_000 },
  weightGrams: { min: 20_000, max: 400_000 },
  waistMm: { min: 300, max: 2_500 },
};

export const NO_TARGETS: Targets = {
  caloriesKcal: null,
  proteinG: null,
  waterMl: null,
  steps: null,
  weightGrams: null,
  waistMm: null,
  updatedAt: "",
};

/** The coach's private notes on a client. Never sent to the client. */
export type CoachNote = { id: string; at: string; text: string };

export const MAX_COACH_NOTE = 1_000;
export const MAX_COACH_NOTES = 200;

/* ------------------------------------------------------------------ */
/* Reading what was sent                                               */
/* ------------------------------------------------------------------ */

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

/** null for "not logged", undefined for something that isn't a valid
 *  whole number in range. */
function readAmount(
  value: unknown,
  min: number,
  max: number,
): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
    ? value
    : undefined;
}

const FIELD_ERROR: Record<NumericField, string> = {
  caloriesKcal: "Enter calories between 0 and 10,000 kcal.",
  proteinG: "Enter protein between 0 and 1,000 g.",
  waterMl: "Enter water between 0 and 20 litres.",
  steps: "Enter steps between 0 and 200,000.",
  waistMm: "Enter a waist measurement between 30 and 250 cm.",
  sleepMin: "Enter sleep between 0 and 24 hours.",
  energy: "Pick an energy level from 1 to 10.",
};

export type DayInput = {
  entry: DailyEntry;
  /**
   * The weigh-in for the same day: a weight to save, null to remove it, or
   * undefined to leave the weigh-in log alone.
   */
  weightGrams: number | null | undefined;
};

export function parseDay(input: unknown, today: string): Parsed<DayInput> {
  const body = asObject(input);
  const on = typeof body.on === "string" ? body.on.trim() : "";

  if (!isValidDate(on, today)) {
    return { ok: false, error: "Pick a date today or earlier." };
  }

  const entry: DailyEntry = {
    on,
    caloriesKcal: null,
    proteinG: null,
    waterMl: null,
    steps: null,
    waistMm: null,
    sleepMin: null,
    workout: null,
    energy: null,
    notes: "",
  };

  for (const field of NUMERIC_FIELDS) {
    const value = readAmount(body[field], LIMITS[field].min, LIMITS[field].max);

    if (value === undefined) return { ok: false, error: FIELD_ERROR[field] };

    entry[field] = value;
  }

  if (body.workout !== null && body.workout !== undefined) {
    if (typeof body.workout !== "boolean") {
      return { ok: false, error: "Say whether you trained today." };
    }

    entry.workout = body.workout;
  }

  if (body.notes !== undefined && typeof body.notes !== "string") {
    return { ok: false, error: "Notes must be text." };
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (notes.length > MAX_NOTES) {
    return { ok: false, error: "Those notes are too long." };
  }

  entry.notes = notes;

  let weightGrams: number | null | undefined;

  if ("weightGrams" in body) {
    if (body.weightGrams === null || body.weightGrams === "") {
      weightGrams = null;
    } else if (
      typeof body.weightGrams === "number" &&
      isValidWeight(body.weightGrams)
    ) {
      weightGrams = body.weightGrams;
    } else {
      return { ok: false, error: "Enter a weight between 20 and 400 kg." };
    }
  }

  return { ok: true, value: { entry, weightGrams } };
}

const TARGET_ERROR: Record<TargetField, string> = {
  caloriesKcal: "Calorie target must be between 1 and 10,000 kcal.",
  proteinG: "Protein target must be between 1 and 1,000 g.",
  waterMl: "Water target must be between 0.1 and 20 litres.",
  steps: "Step target must be between 1 and 200,000.",
  weightGrams: "Target weight must be between 20 and 400 kg.",
  waistMm: "Target waist must be between 30 and 250 cm.",
};

export function parseTargets(input: unknown): Parsed<Targets> {
  const body = asObject(input);
  const targets: Targets = { ...NO_TARGETS };

  for (const field of TARGET_FIELDS) {
    const { min, max } = TARGET_LIMITS[field];
    const value = readAmount(body[field], min, max);

    if (value === undefined) return { ok: false, error: TARGET_ERROR[field] };

    targets[field] = value;
  }

  targets.updatedAt = new Date().toISOString();

  return { ok: true, value: targets };
}

export function parseCoachNote(input: unknown): Parsed<string> {
  const text =
    typeof asObject(input).text === "string"
      ? (asObject(input).text as string).trim()
      : "";

  if (!text) return { ok: false, error: "Write a note first." };

  if (text.length > MAX_COACH_NOTE) {
    return { ok: false, error: "That note is too long." };
  }

  return { ok: true, value: text };
}

/* ------------------------------------------------------------------ */
/* Reading what was stored                                             */
/* ------------------------------------------------------------------ */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isEmptyDay(entry: DailyEntry) {
  return (
    NUMERIC_FIELDS.every((field) => entry[field] === null) &&
    entry.workout === null &&
    entry.notes === ""
  );
}

function normalizeDay(raw: unknown): DailyEntry | null {
  const body = asObject(raw);
  const on = typeof body.on === "string" ? body.on : "";

  if (!ISO_DATE.test(on)) return null;

  const entry: DailyEntry = {
    on,
    caloriesKcal: null,
    proteinG: null,
    waterMl: null,
    steps: null,
    waistMm: null,
    sleepMin: null,
    workout: typeof body.workout === "boolean" ? body.workout : null,
    energy: null,
    notes:
      typeof body.notes === "string" ? body.notes.slice(0, MAX_NOTES) : "",
  };

  // A stored value that no longer fits is dropped, not the whole day.
  for (const field of NUMERIC_FIELDS) {
    entry[field] =
      readAmount(body[field], LIMITS[field].min, LIMITS[field].max) ?? null;
  }

  return isEmptyDay(entry) ? null : entry;
}

/** Newest first, one per day — the first one in the list wins. */
export function sortDays(entries: DailyEntry[]): DailyEntry[] {
  const byDate = new Map<string, DailyEntry>();

  for (const entry of entries) {
    if (!byDate.has(entry.on)) byDate.set(entry.on, entry);
  }

  return [...byDate.values()]
    .sort((a, b) => (a.on < b.on ? 1 : a.on > b.on ? -1 : 0))
    .slice(0, MAX_DAILY_ENTRIES);
}

export function normalizeDailyLog(raw: unknown): DailyEntry[] {
  return sortDays(
    (Array.isArray(raw) ? raw : [])
      .map(normalizeDay)
      .filter((entry): entry is DailyEntry => entry !== null),
  );
}

export function normalizeTargets(raw: unknown): Targets {
  const body = asObject(raw);
  const targets: Targets = { ...NO_TARGETS };

  for (const field of TARGET_FIELDS) {
    const { min, max } = TARGET_LIMITS[field];
    targets[field] = readAmount(body[field], min, max) ?? null;
  }

  targets.updatedAt = typeof body.updatedAt === "string" ? body.updatedAt : "";

  return targets;
}

export function normalizeCoachNotes(raw: unknown): CoachNote[] {
  return (Array.isArray(raw) ? raw : [])
    .map((item) => {
      const body = asObject(item);

      return typeof body.id === "string" &&
        typeof body.at === "string" &&
        typeof body.text === "string"
        ? { id: body.id, at: body.at, text: body.text.slice(0, MAX_COACH_NOTE) }
        : null;
    })
    .filter((note): note is CoachNote => note !== null)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_COACH_NOTES);
}

/* ------------------------------------------------------------------ */
/* Units on screen                                                     */
/* ------------------------------------------------------------------ */

/**
 * What a typed number means: null for an empty box, NaN for something that
 * isn't a number, otherwise the value. A comma is read as a decimal point.
 */
export function readDecimal(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");

  if (!trimmed) return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return Number.NaN;

  return Number.parseFloat(trimmed);
}

/** Scales a typed number into stored units: "2.5" litres -> 2500 ml. */
export function toUnits(text: string, scale: number): number | null {
  const value = readDecimal(text);

  if (value === null) return null;
  if (Number.isNaN(value)) return Number.NaN;

  return Math.round(value * scale);
}

/** Back the other way, dropping a trailing ".0": 2500 ml -> "2.5". */
export function fromUnits(value: number | null, scale: number): string {
  if (value === null) return "";

  return (Math.round((value / scale) * 10) / 10).toString();
}

export function formatCount(value: number) {
  return Math.round(value).toLocaleString("en-IN");
}

/* ------------------------------------------------------------------ */
/* Days                                                                */
/* ------------------------------------------------------------------ */

/** Shifts a YYYY-MM-DD by whole days, with no timezone involved. */
export function addDays(on: string, days: number): string {
  const [year, month, day] = on.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  const parse = (value: string) => {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };

  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

export type Range = "week" | "month";

export const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30 };

/** The days of a range, oldest first, ending today. */
export function rangeDates(range: Range, today: string): string[] {
  const count = RANGE_DAYS[range];

  return Array.from({ length: count }, (_, index) =>
    addDays(today, index - (count - 1)),
  );
}

/* ------------------------------------------------------------------ */
/* Summaries                                                           */
/* ------------------------------------------------------------------ */

export type Change = { from: number; to: number } | null;

export type Summary = {
  daysLogged: number;
  /** Averages over the days that logged that value. null if none did. */
  caloriesKcal: number | null;
  proteinG: number | null;
  waterMl: number | null;
  steps: number | null;
  sleepMin: number | null;
  energy: number | null;
  workoutsDone: number;
  /** Days on which they said whether they trained. */
  workoutsAnswered: number;
  /** First and last weigh-in inside the range. */
  weight: Change;
  waist: Change;
};

function average(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);

  return present.length === 0
    ? null
    : present.reduce((sum, value) => sum + value, 0) / present.length;
}

function change(points: { on: string; value: number }[]): Change {
  if (points.length === 0) return null;

  const ordered = [...points].sort((a, b) => a.on.localeCompare(b.on));

  return { from: ordered[0].value, to: ordered[ordered.length - 1].value };
}

export function summarize(
  log: DailyEntry[],
  weights: WeightEntry[],
  from: string,
  to: string,
): Summary {
  const days = log.filter((entry) => entry.on >= from && entry.on <= to);
  const inRange = weights.filter((entry) => entry.on >= from && entry.on <= to);

  return {
    daysLogged: days.length,
    caloriesKcal: average(days.map((day) => day.caloriesKcal)),
    proteinG: average(days.map((day) => day.proteinG)),
    waterMl: average(days.map((day) => day.waterMl)),
    steps: average(days.map((day) => day.steps)),
    sleepMin: average(days.map((day) => day.sleepMin)),
    energy: average(days.map((day) => day.energy)),
    workoutsDone: days.filter((day) => day.workout === true).length,
    workoutsAnswered: days.filter((day) => day.workout !== null).length,
    weight: change(inRange.map((entry) => ({ on: entry.on, value: entry.grams }))),
    waist: change(
      days
        .filter((day) => day.waistMm !== null)
        .map((day) => ({ on: day.on, value: day.waistMm as number })),
    ),
  };
}

/** One cell per day of the range: trained, skipped, or not said. */
export function workoutDays(log: DailyEntry[], dates: string[]) {
  const byDate = new Map(log.map((entry) => [entry.on, entry.workout]));

  return dates.map((on) => ({ on, workout: byDate.get(on) ?? null }));
}

/** Points for a line chart, oldest first, within the range. */
export function series(
  points: { on: string; value: number | null }[],
  from: string,
  to: string,
) {
  return points
    .filter(
      (point): point is { on: string; value: number } =>
        point.value !== null && point.on >= from && point.on <= to,
    )
    .sort((a, b) => a.on.localeCompare(b.on));
}

/* ------------------------------------------------------------------ */
/* What the coach should look at                                       */
/* ------------------------------------------------------------------ */

/** No log or weigh-in for this many days counts as gone quiet. */
export const STALE_AFTER_DAYS = 3;

/** This many "didn't train" days in the last week is worth a word. */
export const MISSED_WORKOUTS_ALERT = 3;

export type Attention = {
  /** The latest day with anything logged, or "". */
  lastUpdateOn: string;
  /** null when nothing was ever logged. */
  daysSinceUpdate: number | null;
  missedWorkouts: number;
  stale: boolean;
  missing: boolean;
};

export function attention(
  log: DailyEntry[],
  lastWeighOn: string,
  today: string,
): Attention {
  const lastLogOn = log[0]?.on ?? "";
  const lastUpdateOn = lastLogOn > lastWeighOn ? lastLogOn : lastWeighOn;
  const daysSinceUpdate = lastUpdateOn ? daysBetween(lastUpdateOn, today) : null;

  const weekStart = addDays(today, -6);
  const missedWorkouts = log.filter(
    (entry) => entry.on >= weekStart && entry.on <= today && entry.workout === false,
  ).length;

  return {
    lastUpdateOn,
    daysSinceUpdate,
    missedWorkouts,
    stale: daysSinceUpdate === null || daysSinceUpdate >= STALE_AFTER_DAYS,
    missing: missedWorkouts >= MISSED_WORKOUTS_ALERT,
  };
}
