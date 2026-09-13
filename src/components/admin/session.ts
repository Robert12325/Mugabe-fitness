const KEY = "mugabe-admin-unlocked";
const EVENT = "mugabe-admin-lock-change";

/**
 * The unlock flag lives in sessionStorage, so it is read through
 * useSyncExternalStore rather than an effect: that keeps the server pass and
 * the hydration pass agreeing on `false`, then swaps in the real value.
 */
export function subscribeUnlock(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(EVENT, onChange);

  return () => window.removeEventListener(EVENT, onChange);
}

export function getUnlocked() {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(KEY) === "yes";
  } catch {
    // Storage blocked — treat as locked.
    return false;
  }
}

export function getUnlockedOnServer() {
  return false;
}

export function setUnlocked(value: boolean) {
  try {
    if (value) {
      window.sessionStorage.setItem(KEY, "yes");
    } else {
      window.sessionStorage.removeItem(KEY);
    }
  } catch {
    // Non-fatal: the unlock just will not survive a reload.
  }

  window.dispatchEvent(new Event(EVENT));
}

/**
 * Captured once when this module first loads in the browser. Relative stats
 * ("last 7 days") are measured against it so nothing calls an impure clock
 * during render.
 */
export const SESSION_START = Date.now();
