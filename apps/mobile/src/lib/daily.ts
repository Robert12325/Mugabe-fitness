/**
 * Daily tracking rules for the app.
 *
 * MIRRORS the website's `src/lib/daily.ts` and the weight helpers in
 * `src/lib/progress.ts` (repository root). The app can't import those files
 * — it has its own toolchain by design — so the rules are copied here and
 * pinned by `__tests__/daily-rules.test.ts`, which uses the same cases the
 * website's logic was tested with. If the website's rules change, change
 * these too. The server stays the final authority either way: anything it
 * refuses comes back as a 400 with its own message.
 *
 * Amounts are whole numbers in the smallest unit worth recording —
 * millilitres, millimetres, minutes, grams — and `null` means "not logged",
 * which is different from a logged 0.
 *
 * Dates are plain YYYY-MM-DD strings. Building a Date and calling
 * toISOString() would shift an evening entry in India to the previous day.
 */

/* ------------------------------------------------------------------ */
/* What the server stores and returns                                   */
/* ------------------------------------------------------------------ */

export type DailyEntry = {
  on: string;
  caloriesKcal: number | null;
  proteinG: number | null;
  waterMl: number | null;
  steps: number | null;
  waistMm: number | null;
  sleepMin: number | null;
  workout: boolean | null;
  energy: number | null;
  notes: string;
};

/** The coach's numbers. null = not set. Only ever what the coach typed. */
export type Targets = {
  caloriesKcal: number | null;
  proteinG: number | null;
  waterMl: number | null;
  steps: number | null;
  weightGrams: number | null;
  waistMm: number | null;
  updatedAt: string;
};

/** A weigh-in, from the website's weight log. */
export type WeightEntry = { on: string; grams: number; note: string };

export const NO_TARGETS: Targets = {
  caloriesKcal: null,
  proteinG: null,
  waterMl: null,
  steps: null,
  weightGrams: null,
  waistMm: null,
  updatedAt: "",
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

/** Same limits as the server's `parseDay`. */
export const LIMITS: Record<NumericField, { min: number; max: number }> = {
  caloriesKcal: { min: 0, max: 10_000 },
  proteinG: { min: 0, max: 1_000 },
  waterMl: { min: 0, max: 20_000 },
  steps: { min: 0, max: 200_000 },
  waistMm: { min: 300, max: 2_500 },
  sleepMin: { min: 0, max: 24 * 60 },
  energy: { min: 1, max: 10 },
};

const TARGET_LIMITS: Record<Exclude<keyof Targets, "updatedAt">, { min: number; max: number }> = {
  caloriesKcal: { min: 1, max: 10_000 },
  proteinG: { min: 1, max: 1_000 },
  waterMl: { min: 100, max: 20_000 },
  steps: { min: 1, max: 200_000 },
  weightGrams: { min: 20_000, max: 400_000 },
  waistMm: { min: 300, max: 2_500 },
};

export const MAX_NOTES = 500;
export const MIN_GRAMS = 20_000;
export const MAX_GRAMS = 400_000;

/** No weigh-in can predate the gym; the server refuses earlier dates. */
const EARLIEST = "2020-01-01";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------ */
/* Reading responses defensively                                        */
/* ------------------------------------------------------------------ */

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

/** null for "not logged"; undefined for anything that isn't a whole
 *  number in range. */
function readAmount(value: unknown, min: number, max: number): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;

  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined;
}

export function isEmptyDay(entry: Omit<DailyEntry, "on">) {
  return (
    NUMERIC_FIELDS.every((field) => entry[field] === null) &&
    entry.workout === null &&
    entry.notes === ""
  );
}

function normalizeDay(raw: unknown): DailyEntry | null {
  const body = asObject(raw);
  const on = typeof body.on === "string" ? body.on : "";

  if (!isRealDate(on)) return null;

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
    notes: typeof body.notes === "string" ? body.notes.slice(0, MAX_NOTES) : "",
  };

  for (const field of NUMERIC_FIELDS) {
    entry[field] = readAmount(body[field], LIMITS[field].min, LIMITS[field].max) ?? null;
  }

  return isEmptyDay(entry) ? null : entry;
}

/** Newest first, one per day (the first wins), unusable rows dropped. */
export function normalizeDailyLog(raw: unknown): DailyEntry[] {
  const byDate = new Map<string, DailyEntry>();

  for (const item of Array.isArray(raw) ? raw : []) {
    const entry = normalizeDay(item);
    if (entry && !byDate.has(entry.on)) byDate.set(entry.on, entry);
  }

  return [...byDate.values()].sort((a, b) => (a.on < b.on ? 1 : a.on > b.on ? -1 : 0));
}

export function normalizeTargets(raw: unknown): Targets {
  const body = asObject(raw);
  const targets: Targets = { ...NO_TARGETS };

  for (const field of Object.keys(TARGET_LIMITS) as (keyof typeof TARGET_LIMITS)[]) {
    const { min, max } = TARGET_LIMITS[field];
    targets[field] = readAmount(body[field], min, max) ?? null;
  }

  targets.updatedAt = typeof body.updatedAt === "string" ? body.updatedAt : "";

  return targets;
}

/** The weigh-ins out of the website's `progress` document, newest first. */
export function normalizeWeights(rawProgress: unknown): WeightEntry[] {
  const entries = asObject(rawProgress).entries;
  const byDate = new Map<string, WeightEntry>();

  for (const item of Array.isArray(entries) ? entries : []) {
    const body = asObject(item);
    const on = typeof body.on === "string" ? body.on : "";
    const grams = typeof body.grams === "number" ? Math.round(body.grams) : 0;

    if (isRealDate(on) && isValidWeight(grams) && !byDate.has(on)) {
      byDate.set(on, { on, grams, note: typeof body.note === "string" ? body.note : "" });
    }
  }

  return [...byDate.values()].sort((a, b) => (a.on < b.on ? 1 : a.on > b.on ? -1 : 0));
}

/* ------------------------------------------------------------------ */
/* Units on screen (same rules as the website's form)                  */
/* ------------------------------------------------------------------ */

/** null for an empty box, NaN for something that isn't a number. A comma
 *  is read as a decimal point. */
export function readDecimal(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");

  if (!trimmed) return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return Number.NaN;

  return Number.parseFloat(trimmed);
}

/** "2.5" litres -> 2500 ml. */
export function toUnits(text: string, scale: number): number | null {
  const value = readDecimal(text);

  if (value === null) return null;
  if (Number.isNaN(value)) return Number.NaN;

  return Math.round(value * scale);
}

/** 2500 ml -> "2.5", dropping a trailing ".0". */
export function fromUnits(value: number | null, scale: number): string {
  if (value === null) return "";

  return (Math.round((value / scale) * 10) / 10).toString();
}

export function formatCount(value: number) {
  return Math.round(value).toLocaleString("en-IN");
}

/** "72", "72.4", "72,4", "72.4 kg", "72KG". Up to 3 decimals (grams). */
const KG_INPUT = /^(\d{1,3})(?:[.,](\d{1,3}))?(?:\s*kg)?$/i;

/**
 * "72.4", "72,4", " 72.4 kg " -> 72400. 0 when it is not a weight: stray
 * characters, a second decimal point or a sign are refused, never
 * stripped, so a typo can't be saved as a different weight.
 */
export function parseKg(input: string): number {
  const match = KG_INPUT.exec(String(input).trim());
  if (!match) return 0;

  // Whole numbers only: no floating-point rounding.
  const grams = Number(match[1]) * 1000 + Number((match[2] ?? "").padEnd(3, "0"));
  return grams > 0 ? grams : 0;
}

/** 72400 -> "72.4"; 72000 -> "72". */
export function formatKg(grams: number): string {
  if (!Number.isFinite(grams)) return "0";

  const kg = Math.round(grams) / 1000;

  return (Math.round(kg * 10) / 10).toString();
}

/** 1600 -> "+1.6", -1600 -> "-1.6", under 50 g -> "0". */
export function formatDeltaKg(grams: number): string {
  if (Math.abs(grams) < 50) return "0";

  return (grams > 0 ? "+" : "-") + formatKg(Math.abs(grams));
}

export function isValidWeight(grams: number) {
  return Number.isInteger(grams) && grams >= MIN_GRAMS && grams <= MAX_GRAMS;
}

/** A real calendar day: "2026-02-31" and "2026-13-01" are not. */
export function isRealDate(on: string) {
  if (!ISO_DATE.test(on)) return false;

  const [year, month, day] = on.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidDate(on: string, today: string) {
  return isRealDate(on) && on >= EARLIEST && on <= today;
}

/** The phone's own calendar date — never via toISOString. */
export function localToday(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

/* ------------------------------------------------------------------ */
/* Days                                                                */
/* ------------------------------------------------------------------ */

export function addDays(on: string, days: number): string {
  const [year, month, day] = on.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
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

  return Array.from({ length: count }, (_, index) => addDays(today, index - (count - 1)));
}

/* ------------------------------------------------------------------ */
/* Summaries                                                           */
/* ------------------------------------------------------------------ */

export type Change = { from: number; to: number } | null;

export type Summary = {
  daysLogged: number;
  caloriesKcal: number | null;
  proteinG: number | null;
  waterMl: number | null;
  steps: number | null;
  sleepMin: number | null;
  energy: number | null;
  workoutsDone: number;
  workoutsAnswered: number;
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

export function summarize(log: DailyEntry[], weights: WeightEntry[], from: string, to: string): Summary {
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

/** Points for a trend, oldest first, within the range. */
export function series(points: { on: string; value: number | null }[], from: string, to: string) {
  return points
    .filter(
      (point): point is { on: string; value: number } =>
        point.value !== null && point.on >= from && point.on <= to,
    )
    .sort((a, b) => a.on.localeCompare(b.on));
}

/* ------------------------------------------------------------------ */
/* The log form                                                        */
/* ------------------------------------------------------------------ */

/** What the form holds: text exactly as typed, plus the two choices. */
export type DayForm = {
  caloriesKcal: string;
  proteinG: string;
  water: string;
  steps: string;
  weight: string;
  waist: string;
  sleep: string;
  workout: boolean | null;
  energy: number | null;
  notes: string;
};

export type FormField = keyof Omit<DayForm, "workout" | "energy">;

/** The day as the API wants it: the entry, plus that day's weight. A
 *  weight of null removes that day's weigh-in. */
export type DayPayload = DailyEntry & { weightGrams: number | null };

/** How each text box maps onto what is stored. */
export const FORM_BOXES: {
  key: FormField & keyof DayForm;
  field: NumericField | "weight";
  label: string;
  unit: string;
  scale: number;
  decimal: boolean;
}[] = [
  { key: "caloriesKcal", field: "caloriesKcal", label: "Calories", unit: "kcal", scale: 1, decimal: false },
  { key: "proteinG", field: "proteinG", label: "Protein", unit: "g", scale: 1, decimal: false },
  { key: "water", field: "waterMl", label: "Water", unit: "litres", scale: 1000, decimal: true },
  { key: "steps", field: "steps", label: "Steps", unit: "", scale: 1, decimal: false },
  { key: "weight", field: "weight", label: "Weight", unit: "kg", scale: 1000, decimal: true },
  { key: "waist", field: "waistMm", label: "Waist", unit: "cm", scale: 10, decimal: true },
  { key: "sleep", field: "sleepMin", label: "Sleep", unit: "hours", scale: 60, decimal: true },
];

export const EMPTY_FORM: DayForm = {
  caloriesKcal: "",
  proteinG: "",
  water: "",
  steps: "",
  weight: "",
  waist: "",
  sleep: "",
  workout: null,
  energy: null,
  notes: "",
};

/** The form opened on a day: what was logged, so saving updates it. */
export function formFromDay(entry: DailyEntry | null, weightGrams: number | null): DayForm {
  return {
    caloriesKcal: entry?.caloriesKcal != null ? String(entry.caloriesKcal) : "",
    proteinG: entry?.proteinG != null ? String(entry.proteinG) : "",
    water: fromUnits(entry?.waterMl ?? null, 1000),
    steps: entry?.steps != null ? String(entry.steps) : "",
    weight: weightGrams !== null ? formatKg(weightGrams) : "",
    waist: fromUnits(entry?.waistMm ?? null, 10),
    sleep: fromUnits(entry?.sleepMin ?? null, 60),
    workout: entry?.workout ?? null,
    energy: entry?.energy ?? null,
    notes: entry?.notes ?? "",
  };
}

export type FormCheck =
  | { ok: true; payload: DayPayload }
  | { ok: false; errors: Partial<Record<FormField | "date", string>> };

/**
 * Turns the form into the API payload, refusing exactly what the server's
 * `parseDay` refuses. "2,5" litres is a decimal comma; "1,850" kcal is a
 * thousands separator, dropped in whole-number boxes.
 */
export function checkDayForm(form: DayForm, on: string, today: string): FormCheck {
  const errors: Partial<Record<FormField | "date", string>> = {};

  if (!isValidDate(on, today)) errors.date = "Pick a date today or earlier.";

  const values: Partial<Record<NumericField, number | null>> = {};
  let weightGrams: number | null = null;

  for (const box of FORM_BOXES) {
    const text = form[box.key];

    if (box.field === "weight") {
      if (!text.trim()) continue;

      weightGrams = parseKg(text);
      if (!weightGrams) errors.weight = "Weight: enter a number, like 72.4.";
      else if (!isValidWeight(weightGrams)) errors.weight = "Enter a weight between 20 and 400 kg.";
      continue;
    }

    const value = box.decimal
      ? toUnits(text, box.scale)
      : toUnits(text.replace(/[,\s]/g, ""), box.scale);

    if (value !== null && Number.isNaN(value)) {
      errors[box.key] = `${box.label}: enter a number.`;
      continue;
    }

    const { min, max } = LIMITS[box.field];

    if (value !== null && (value < min || value > max)) {
      errors[box.key] = `${box.label}: that number is out of range.`;
      continue;
    }

    values[box.field] = value;
  }

  // Energy comes only from the 1-10 buttons, so it can't be out of range.

  const notes = form.notes.trim();

  if (notes.length > MAX_NOTES) errors.notes = "Those notes are too long.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      on,
      caloriesKcal: values.caloriesKcal ?? null,
      proteinG: values.proteinG ?? null,
      waterMl: values.waterMl ?? null,
      steps: values.steps ?? null,
      waistMm: values.waistMm ?? null,
      sleepMin: values.sleepMin ?? null,
      workout: form.workout,
      energy: form.energy,
      notes,
      weightGrams,
    },
  };
}

/** Saving a day with nothing in it removes it on the server. */
export function isEmptyPayload(payload: DayPayload) {
  return isEmptyDay(payload) && payload.weightGrams === null;
}
