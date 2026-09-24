"use client";

import { useSyncExternalStore } from "react";
import Icon from "@/components/icons";
import { useT } from "@/lib/i18n";

/**
 * Offers to put the site on the phone home screen, where it opens full
 * screen with no browser bar.
 *
 * Android fires `beforeinstallprompt` and gives a real install dialog.
 * Safari never has, so iPhone users get the short manual instruction
 * instead — the only route Apple allows.
 *
 * Kept as a small external store rather than component state: the answer
 * depends on browser-only checks, and the server must always render nothing.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Offer =
  | { kind: "hidden" }
  | { kind: "ios" }
  | { kind: "android"; prompt: InstallEvent };

const DISMISSED_KEY = "mugabe-install-dismissed";
const HIDDEN: Offer = { kind: "hidden" };

let offer: Offer = HIDDEN;
let started = false;
const listeners = new Set<() => void>();

function set(next: Offer) {
  offer = next;
  for (const listener of listeners) listener();
}

function alreadyInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's own flag, set when launched from the home screen.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !/crios|fxios/i.test(window.navigator.userAgent)
  );
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "yes";
  } catch {
    // Storage blocked: offer it, and it simply returns next visit.
    return false;
  }
}

function start() {
  if (started) return;

  started = true;

  if (alreadyInstalled() || wasDismissed()) return;

  if (isIos()) {
    set({ kind: "ios" });
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser from showing its own mini bar, so the offer appears
    // in the site's styling instead.
    event.preventDefault();
    set({ kind: "android", prompt: event as InstallEvent });
  });

  window.addEventListener("appinstalled", () => set(HIDDEN));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();

  return () => {
    listeners.delete(listener);
  };
}

function dismiss() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "yes");
  } catch {
    // Nothing to remember it with; it offers again next visit.
  }

  set(HIDDEN);
}

async function install(prompt: InstallEvent) {
  await prompt.prompt();
  await prompt.userChoice;

  dismiss();
}

export default function InstallApp() {
  const t = useT();
  const current = useSyncExternalStore(
    subscribe,
    () => offer,
    () => HIDDEN,
  );

  if (current.kind === "hidden") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 font-[family-name:var(--font-display)] sm:px-6">
      <div className="mx-auto flex max-w-2xl items-center gap-4 rounded-2xl border border-[#e0b54a]/35 bg-[linear-gradient(180deg,rgba(22,20,16,0.97),rgba(8,8,8,0.98))] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e0b54a]/45 bg-[#e0b54a]/10 text-[#f5c518]">
          <Icon name="bolt" className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {t("install.title")}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/60">
            {current.kind === "ios" ? t("install.ios") : t("install.android")}
          </p>
        </div>

        {current.kind === "android" && (
          <button
            type="button"
            onClick={() => void install(current.prompt)}
            className="shrink-0 rounded-full bg-[#f5c518] px-5 py-2.5 text-xs font-bold text-black transition hover:bg-[#ffd84a]"
          >
            {t("install.action")}
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label={t("install.dismiss")}
          className="shrink-0 rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/60 transition hover:border-white/35 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
