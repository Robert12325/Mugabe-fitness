import { addDays, rangeDates, workoutDays, type DailyEntry, type WeightEntry } from "@/lib/daily";

/**
 * Consecutive days with anything logged (a weigh-in alone counts), ending
 * today — or yesterday, so the streak isn't lost before today is logged.
 */
export function loggedStreak(log: DailyEntry[], weights: WeightEntry[], today: string): number {
  const logged = new Set([...log.map((entry) => entry.on), ...weights.map((entry) => entry.on)]);
  let day = logged.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (logged.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }

  return streak;
}

/** Days marked "workout done" in the last 7 days, today included. */
export function workoutsThisWeek(log: DailyEntry[], today: string): number {
  return workoutDays(log, rangeDates("week", today)).filter((day) => day.workout === true).length;
}

/** The most recent weigh-in, or null. */
export function latestWeight(weights: WeightEntry[]): WeightEntry | null {
  return weights.reduce<WeightEntry | null>((latest, entry) => (!latest || entry.on > latest.on ? entry : latest), null);
}
