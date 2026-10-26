import { latestWeight, loggedStreak, workoutsThisWeek } from "@/daily/stats";
import type { DailyEntry, WeightEntry } from "@/lib/daily";

/** The stats strip on Home and Progress: only counts of what was logged. */

const TODAY = "2026-10-19";

const day = (on: string, extra: Partial<DailyEntry> = {}): DailyEntry => ({
  on,
  caloriesKcal: null,
  proteinG: null,
  waterMl: null,
  steps: 1000,
  waistMm: null,
  sleepMin: null,
  workout: null,
  energy: null,
  notes: "",
  ...extra,
});
const weigh = (on: string, grams = 80000): WeightEntry => ({ on, grams, note: "" });

describe("logged streak", () => {
  it("counts back from today through consecutive logged days", () => {
    expect(loggedStreak([day("2026-10-19"), day("2026-10-18"), day("2026-10-17"), day("2026-10-15")], [], TODAY)).toBe(3);
  });

  it("keeps yesterday's streak until today is logged", () => {
    expect(loggedStreak([day("2026-10-18"), day("2026-10-17")], [], TODAY)).toBe(2);
  });

  it("counts a weigh-in alone, across a month boundary", () => {
    expect(loggedStreak([day("2026-10-01")], [weigh("2026-09-30"), weigh("2026-09-29")], "2026-10-01")).toBe(3);
  });

  it("is 0 with nothing recent", () => {
    expect(loggedStreak([day("2026-10-16")], [], TODAY)).toBe(0);
    expect(loggedStreak([], [], TODAY)).toBe(0);
  });
});

describe("workouts this week", () => {
  it("counts done workouts in the last 7 days only", () => {
    const log = [
      day("2026-10-19", { workout: true }),
      day("2026-10-17", { workout: false }),
      day("2026-10-13", { workout: true }),
      day("2026-10-12", { workout: true }), // 8 days ago
    ];
    expect(workoutsThisWeek(log, TODAY)).toBe(2);
  });
});

describe("latest weight", () => {
  it("picks the newest weigh-in, whatever the order", () => {
    expect(latestWeight([weigh("2026-10-10", 81000), weigh("2026-10-18", 80200), weigh("2026-10-01", 82000)])?.grams).toBe(80200);
    expect(latestWeight([])).toBeNull();
  });
});
