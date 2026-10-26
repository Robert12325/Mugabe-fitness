import {
  MAX_COACH_NOTES,
  MAX_DAILY_ENTRIES,
  NO_TARGETS,
  isEmptyDay,
  normalizeCoachNotes,
  normalizeDailyLog,
  normalizeTargets,
  sortDays,
  type CoachNote,
  type DailyEntry,
  type DayInput,
  type Targets,
} from "@/lib/daily";
import { normalizeProgress, type Progress } from "@/lib/progress";
import { pipeline, redis } from "./redis";
import { getProgress, removeEntry, saveEntry } from "./progress";

/**
 * Three documents per client, beside their weigh-in log:
 *
 * - the daily log, which the client writes;
 * - the targets, which only the coach writes and the client reads;
 * - the coach's notes, which never leave the admin.
 *
 * Kept apart so each can carry its own permission, and so a client's
 * frequent saves never rewrite the coach's numbers.
 */

function dailyKey(userId: string) {
  return `mf:user:${userId}:daily`;
}

function targetsKey(userId: string) {
  return `mf:user:${userId}:targets`;
}

function notesKey(userId: string) {
  return `mf:user:${userId}:coach-notes`;
}

function progressKey(userId: string) {
  return `mf:user:${userId}:progress`;
}

/** For account deletion: the daily log, weigh-ins, targets and coach notes. */
export async function deleteTracking(userId: string) {
  await redis("DEL", dailyKey(userId), progressKey(userId), targetsKey(userId), notesKey(userId));
}

/** Unreadable is not the same as empty: refuse rather than let the next
 *  write replace something that might still be recoverable by hand. */
function parseStored(raw: unknown, label: string): unknown {
  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Stored ${label} is not valid JSON.`);
  }
}

/* ------------------------------------------------------------------ */
/* The client's daily log                                              */
/* ------------------------------------------------------------------ */

export async function getDailyLog(userId: string): Promise<DailyEntry[]> {
  return normalizeDailyLog(
    parseStored(await redis<unknown>("GET", dailyKey(userId)), "daily log"),
  );
}

async function setDailyLog(userId: string, log: DailyEntry[]) {
  await redis("SET", dailyKey(userId), JSON.stringify(log));

  return log;
}

export type DaySaved =
  | { ok: true; log: DailyEntry[]; progress: Progress }
  | { ok: false; error: string };

/**
 * Saves one day as the form sent it — it arrives filled in with what was
 * already logged, so replacing the day is what the client sees.
 *
 * A weight goes to the weigh-in log, keeping any note already on that
 * day's weigh-in. A day emptied of everything is removed.
 */
export async function saveDay(
  userId: string,
  { entry, weightGrams }: DayInput,
): Promise<DaySaved> {
  const [log, progress] = await Promise.all([
    getDailyLog(userId),
    getProgress(userId),
  ]);

  const isNewDay = !log.some((day) => day.on === entry.on);

  if (isNewDay && !isEmptyDay(entry) && log.length >= MAX_DAILY_ENTRIES) {
    return {
      ok: false,
      error: "Your log is full. Delete an older day first.",
    };
  }

  // The weight first: if the weigh-in log refuses it, nothing is half-saved.
  let nextProgress = progress;
  const weighIn = progress.entries.find((item) => item.on === entry.on);

  if (typeof weightGrams === "number") {
    const saved = await saveEntry(userId, {
      on: entry.on,
      grams: weightGrams,
      note: weighIn?.note ?? "",
    });

    if (!saved.ok) return saved;

    nextProgress = saved.progress;
  } else if (weightGrams === null && weighIn) {
    nextProgress = await removeEntry(userId, entry.on);
  }

  const rest = log.filter((day) => day.on !== entry.on);
  const next = isEmptyDay(entry) ? rest : sortDays([entry, ...rest]);

  return {
    ok: true,
    log: await setDailyLog(userId, next),
    progress: nextProgress,
  };
}

/** Removes the whole day: the log entry and that day's weigh-in. */
export async function removeDay(userId: string, on: string) {
  const log = await getDailyLog(userId);

  const [nextLog, progress] = await Promise.all([
    setDailyLog(
      userId,
      log.filter((day) => day.on !== on),
    ),
    removeEntry(userId, on),
  ]);

  return { log: nextLog, progress };
}

/* ------------------------------------------------------------------ */
/* The coach's targets and notes                                       */
/* ------------------------------------------------------------------ */

export async function getTargets(userId: string): Promise<Targets> {
  const raw = parseStored(
    await redis<unknown>("GET", targetsKey(userId)),
    "targets",
  );

  return raw ? normalizeTargets(raw) : NO_TARGETS;
}

export async function setTargets(userId: string, targets: Targets) {
  await redis("SET", targetsKey(userId), JSON.stringify(targets));

  return targets;
}

export async function getCoachNotes(userId: string): Promise<CoachNote[]> {
  return normalizeCoachNotes(
    parseStored(await redis<unknown>("GET", notesKey(userId)), "coach notes"),
  );
}

export async function addCoachNote(userId: string, text: string) {
  const notes = await getCoachNotes(userId);

  const next = [
    { id: crypto.randomUUID(), at: new Date().toISOString(), text },
    ...notes,
  ].slice(0, MAX_COACH_NOTES);

  await redis("SET", notesKey(userId), JSON.stringify(next));

  return next;
}

export async function removeCoachNote(userId: string, id: string) {
  const notes = await getCoachNotes(userId);
  const next = notes.filter((note) => note.id !== id);

  await redis("SET", notesKey(userId), JSON.stringify(next));

  return next;
}

/* ------------------------------------------------------------------ */
/* The coach's overview                                                */
/* ------------------------------------------------------------------ */

export type TrackingSnapshot = {
  /** The last two weeks of the log, newest first. */
  recent: DailyEntry[];
  lastWeighOn: string;
  targets: Targets;
};

/** A short read of many clients at once, for the coach's list. One bad
 *  document costs its own row, never the list. */
export async function trackingSnapshots(
  userIds: string[],
): Promise<Map<string, TrackingSnapshot>> {
  const snapshots = new Map<string, TrackingSnapshot>();

  if (userIds.length === 0) return snapshots;

  const results = await pipeline(
    userIds.flatMap((id) => [
      ["GET", dailyKey(id)],
      ["GET", progressKey(id)],
      ["GET", targetsKey(id)],
    ]),
  );

  userIds.forEach((id, index) => {
    const read = (offset: number, label: string) => {
      try {
        return parseStored(results[index * 3 + offset], label);
      } catch {
        console.error(`[tracking] unreadable ${label}`, id);
        return null;
      }
    };

    const log = normalizeDailyLog(read(0, "daily log"));
    const progress = normalizeProgress(read(1, "progress"));
    const targets = read(2, "targets");

    snapshots.set(id, {
      recent: log.slice(0, 14),
      lastWeighOn: progress.entries[0]?.on ?? "",
      targets: targets ? normalizeTargets(targets) : NO_TARGETS,
    });
  });

  return snapshots;
}
