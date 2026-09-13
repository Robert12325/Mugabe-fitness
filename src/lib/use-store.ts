"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";

/**
 * Reads the localStorage-backed database.
 *
 * During SSR and the hydration pass this returns the seed defaults, then
 * React re-renders with the real stored value — which is what keeps the
 * markup free of hydration mismatches.
 */
export function useDB() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
