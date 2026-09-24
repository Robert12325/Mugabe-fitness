import {
  loadDB,
  publicSettings,
  replaceSiteContent,
  seedBuiltInPrograms,
  subscribe,
} from "@/lib/store";
import { fetchSiteContent, saveSiteContent } from "@/lib/site-content-client";

/**
 * Publishes the dashboard's programs and method steps so every visitor sees
 * them, not just the browser they were typed in.
 *
 * The panels keep calling the same store functions. This watches the store
 * and sends the whole (small) set a moment after the last edit.
 */

export type ContentSyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "offline" }
  | { status: "synced" }
  | { status: "saving" }
  | { status: "error"; message: string };

const IDLE: ContentSyncState = { status: "idle" };

let state: ContentSyncState = IDLE;
const listeners = new Set<() => void>();

function setState(next: ContentSyncState) {
  state = next;
  for (const listener of listeners) listener();
}

export function subscribeContentSync(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getContentSyncState() {
  return state;
}

export function getContentSyncServerState() {
  return IDLE;
}

const DEBOUNCE_MS = 800;

let published = "";
let generation = 0;
let unwatch: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight = false;
let again = false;
let onUnauthorized: () => void = () => {};

/** What the server is known to hold, as text, so "unchanged" is a compare. */
function signature() {
  const db = loadDB();

  return JSON.stringify({
    programs: db.programs,
    method: db.method,
    settings: publicSettings(db.settings),
  });
}

function watch() {
  unwatch?.();
  unwatch = subscribe(schedule);
}

function stopWatching() {
  unwatch?.();
  unwatch = null;

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);

  timer = setTimeout(() => {
    timer = null;
    void push();
  }, DEBOUNCE_MS);
}

async function push() {
  if (inflight) {
    again = true;
    return;
  }

  const current = signature();

  if (current === published) return;

  const gen = generation;
  inflight = true;
  setState({ status: "saving" });

  try {
    const db = loadDB();
    const result = await saveSiteContent(
      db.programs,
      db.method,
      publicSettings(db.settings),
    );

    if (gen !== generation) return;

    if (!result.ok) {
      if (result.unauthorized) {
        stopContentSync();
        onUnauthorized();
        return;
      }

      // The edit stays in the browser and goes out with the next change.
      setState({ status: "error", message: result.message });
      return;
    }

    published = current;
    setState({ status: "synced" });
  } finally {
    inflight = false;

    if (gen === generation && again) {
      again = false;
      schedule();
    }
  }
}

export async function startContentSync(handleUnauthorized: () => void) {
  onUnauthorized = handleUnauthorized;

  const gen = ++generation;

  stopWatching();
  inflight = false;
  again = false;
  setState({ status: "loading" });

  const result = await fetchSiteContent({ fresh: true });

  if (gen !== generation) return;

  if (result.state === "offline") {
    setState({ status: "offline" });
    return;
  }

  if (result.state === "unauthorized") {
    setState(IDLE);
    handleUnauthorized();
    return;
  }

  if (result.state === "error") {
    setState({ status: "error", message: result.message });
    return;
  }

  if (result.initialized) {
    // Published content wins, so a second device does not overwrite it.
    stopWatching();
    replaceSiteContent(
      result.programs,
      result.method,
      result.settings,
      result.photos,
    );
    published = signature();

    // Published content would otherwise hide programs added to the code
    // since it was last saved, so top it up here and publish the result.
    const seeded = seedBuiltInPrograms();

    watch();

    if (seeded) {
      await push();
    } else {
      setState({ status: "synced" });
    }

    return;
  }

  // Nothing published yet: this dashboard's content becomes the published set.
  published = "";
  seedBuiltInPrograms();
  watch();
  await push();
}

/** On returning to the tab: send anything pending, otherwise pull. */
export function refreshContentSync() {
  if (
    state.status === "idle" ||
    state.status === "offline" ||
    state.status === "loading"
  ) {
    return;
  }

  if (unwatch === null) {
    void startContentSync(onUnauthorized);
    return;
  }

  if (inflight || timer) return;

  if (signature() !== published) {
    void push();
    return;
  }

  const gen = generation;

  void fetchSiteContent({ fresh: true }).then((result) => {
    if (gen !== generation || inflight || timer) return;

    if (result.state === "online" && result.initialized) {
      if (signature() !== published) return;

      stopWatching();
      replaceSiteContent(
      result.programs,
      result.method,
      result.settings,
      result.photos,
    );
      published = signature();
      watch();
      setState({ status: "synced" });
    } else if (result.state === "unauthorized") {
      stopContentSync();
      onUnauthorized();
    }
  });
}

export function stopContentSync() {
  generation++;
  stopWatching();
  inflight = false;
  again = false;
  published = "";
  setState(IDLE);
}
