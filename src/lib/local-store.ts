/**
 * A value kept in localStorage (or sessionStorage, for things that belong to
 * one tab's visit) and read through useSyncExternalStore.
 *
 * Snapshots must be referentially stable, so the parsed value is reused until
 * the stored string changes. When storage is blocked (private mode, disabled
 * site data) the value still lives in memory for the rest of the visit.
 */
export function createLocalStore<T>(
  key: string,
  parse: (raw: unknown) => T | null,
  area: "local" | "session" = "local",
) {
  const event = `mugabe-local-store:${key}`;

  // Read lazily: touching either storage can throw when it is blocked.
  const storage = () =>
    area === "session" ? window.sessionStorage : window.localStorage;

  let cachedRaw: string | null = null;
  let cached: T | null = null;
  let memory: T | null = null;

  function subscribe(onChange: () => void) {
    if (typeof window === "undefined") return () => {};

    // Another tab signed in, out, or changed the value.
    const cross = (storageEvent: StorageEvent) => {
      if (storageEvent.key === null || storageEvent.key === key) onChange();
    };

    window.addEventListener(event, onChange);
    window.addEventListener("storage", cross);

    return () => {
      window.removeEventListener(event, onChange);
      window.removeEventListener("storage", cross);
    };
  }

  function get(): T | null {
    if (typeof window === "undefined") return null;

    let raw: string | null;

    try {
      raw = storage().getItem(key);
    } catch {
      return memory;
    }

    if (raw !== cachedRaw) {
      cachedRaw = raw;

      try {
        cached = raw ? parse(JSON.parse(raw)) : null;
      } catch {
        cached = null;
      }
    }

    return cached ?? memory;
  }

  function getServer(): T | null {
    return null;
  }

  function set(value: T) {
    try {
      storage().setItem(key, JSON.stringify(value));
      memory = null;
    } catch {
      memory = value;
    }

    window.dispatchEvent(new Event(event));
  }

  function clear() {
    memory = null;

    try {
      storage().removeItem(key);
    } catch {
      // Nothing stored to remove.
    }

    window.dispatchEvent(new Event(event));
  }

  return { subscribe, get, getServer, set, clear };
}
