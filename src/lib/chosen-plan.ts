import { createLocalStore } from "@/lib/local-store";

/**
 * The plan a visitor picked on a program card, carried to the booking form —
 * by way of the log-in page when they aren't signed in yet.
 *
 * Kept in sessionStorage: it belongs to this tab's visit, so a choice that
 * was abandoned doesn't resurface days later.
 */
export type ChosenPlan = { programId: string };

function parseChosenPlan(raw: unknown): ChosenPlan | null {
  if (!raw || typeof raw !== "object") return null;

  const { programId } = raw as Record<string, unknown>;

  return typeof programId === "string" && programId ? { programId } : null;
}

const store = createLocalStore(
  "mugabe-fitness:chosen-plan",
  parseChosenPlan,
  "session",
);

export const subscribeChosenPlan = store.subscribe;
export const getChosenPlan = store.get;
export const getChosenPlanOnServer = store.getServer;
export const clearChosenPlan = store.clear;

export function chooseProgram(programId: string) {
  store.set({ programId });
}
