// Browser checks for the workout pages and the navigation that leads to them.
//
// Drives a local Chrome or Edge in headless mode through the DevTools
// protocol (Node's built-in fetch and WebSocket; no dependencies), against a
// website you have already started locally:
//
//   npm run build && npx next start -p 3127
//   node scripts/check-workouts-ui.mjs
//
// Settings (environment variables, all optional):
//   BASE_URL        the running site            (default http://127.0.0.1:3127)
//   BROWSER_PATH    Chrome or Edge executable   (default: found automatically)
//   SCREENSHOT_DIR  save a PNG of each page there
//
// It never signs in. To check the signed-in header it writes a made-up
// session into a throwaway browser profile's storage, which the pages read
// for their labels; no server is asked about it.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:3127").replace(/\/$/, "");
const OUT = process.env.SCREENSHOT_DIR;
const DEBUG_PORT = 9333;

const SESSION_KEY = "mugabe-fitness:account";
const LANG_KEY = "mugabe-lang";
const HTML_LANG = { en: "en", hi: "hi", hinglish: "hi-Latn" };
// A short first name, and one long enough to hit the navbar's 9rem cap.
const NAMES = { short: "Asha", long: "Alexandria-Montgomery Okonkwo" };
const fakeSession = (name) => ({
  token: "ui-check-not-a-real-token",
  user: { id: "ui-check", name, email: "ui-check@example.com", phone: "", createdAt: "" },
});

function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  const found = candidates.find((candidate) => candidate && existsSync(candidate));
  if (!found) throw new Error("No Chrome or Edge found. Set BROWSER_PATH.");
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(task, timeoutMs = 20_000) {
  const until = Date.now() + timeoutMs;
  for (;;) {
    try {
      return await task();
    } catch (error) {
      if (Date.now() > until) throw error;
      await sleep(250);
    }
  }
}

/* ------------------------------------------------------------------ */
/* A minimal DevTools client                                           */
/* ------------------------------------------------------------------ */

const profile = mkdtempSync(path.join(tmpdir(), "mugabe-ui-check-"));
const browser = spawn(
  findBrowser(),
  [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    // Tabs opened over DevTools count as background tabs; without these,
    // Chrome slows their timers until the checks stall.
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const debugUrl = `http://127.0.0.1:${DEBUG_PORT}`;
await retry(async () => (await fetch(`${debugUrl}/json/version`)).json());

let lastId = 0;
const pending = new Map();
let page = null;

/**
 * A fresh tab for every visit, closing the previous one. The home page
 * carries video and large images; reloading it dozens of times in one tab
 * eventually stopped the tab answering.
 */
async function newPage() {
  if (page) {
    page.socket.close();
    await fetch(`${debugUrl}/json/close/${page.id}`).catch(() => undefined);
  }

  const target = await (await fetch(`${debugUrl}/json/new?about:blank`, { method: "PUT" })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method === "Page.javascriptDialogOpening") {
      // A dialog would freeze the page; note it and dismiss it.
      console.log(`  ! dialog on ${message.params.url}: ${message.params.message}`);
      send("Page.handleJavaScriptDialog", { accept: false }).catch(() => undefined);
    }
  };

  page = { id: target.id, socket };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.bringToFront");
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
}

/** One DevTools call. Fails after a time limit rather than hanging the run. */
function send(method, params = {}, timeoutMs = 30_000) {
  const id = ++lastId;
  page.socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`No answer to ${method} within ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
    pending.set(id, {
      resolve: (value) => (clearTimeout(timer), resolve(value)),
      reject: (error) => (clearTimeout(timer), reject(error)),
    });
  });
}

async function rawEvaluate(expression, timeoutMs) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, timeoutMs);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

let visits = 0;

/** Navigate, and wait until this new document's DOM is ready. */
async function open(pathname) {
  const marker = `ui-check=${++visits}`;
  const url = `${BASE}${pathname}${pathname.includes("?") ? "&" : "?"}${marker}`;
  await send("Page.navigate", { url });
  await retry(async () => {
    // Short questions, often: a tab that is switching to the site's own
    // browser process can drop one, and a long wait would stall the run.
    const ready = await rawEvaluate(
      `location.search.includes(${JSON.stringify(marker)}) && document.readyState !== "loading"`,
      3_000,
    );
    if (!ready) throw new Error(`${pathname} did not load`);
  }, 30_000);
}

/**
 * Open a page at a width, in a language, signed out (`signedIn: false`) or
 * signed in with a "short" or "long" name.
 */
let stalls = 0;
let lastVisit = null;

/**
 * Ask the page something. Each question stands alone, so if the tab has
 * stalled, the page is opened again in a fresh tab and asked again.
 */
async function evaluate(expression, timeoutMs) {
  try {
    return await rawEvaluate(expression, timeoutMs);
  } catch (error) {
    if (!/^No answer to /.test(error.message) || !lastVisit) throw error;
    stalls++;
    console.log(`  ! browser stalled on ${lastVisit[0]} (${error.message}); reopening it in a new tab`);
    await visit(...lastVisit);
    return rawEvaluate(expression, timeoutMs);
  }
}

async function visit(pathname, options) {
  lastVisit = [pathname, options];
  // A headless browser occasionally stops answering altogether (seen with
  // both Chrome and Edge on a blank tab, before any site code runs). Only
  // that is retried, in a fresh tab; a layout problem is never retried.
  for (let attempt = 1; ; attempt++) {
    try {
      return await visitOnce(pathname, options);
    } catch (error) {
      if (!/^No answer to /.test(error.message) || attempt === 3) throw error;
      stalls++;
      console.log(`  ! browser stalled opening ${pathname} (${error.message}); trying again in a new tab`);
    }
  }
}

async function visitOnce(pathname, { width, height = 900, lang = "en", signedIn = false }) {
  await newPage();
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });

  // Storage belongs to the site's origin, so load the page once, set the
  // visitor's state, then load it again as they would see it. Waiting for
  // the DOM rather than the load event: a missing image can hold that up.
  await open(pathname);

  await rawEvaluate(`(() => {
    localStorage.setItem(${JSON.stringify(LANG_KEY)}, ${JSON.stringify(lang)});
    ${
      signedIn
        ? `localStorage.setItem(${JSON.stringify(SESSION_KEY)}, ${JSON.stringify(
            JSON.stringify(fakeSession(NAMES[signedIn])),
          )});`
        : `localStorage.removeItem(${JSON.stringify(SESSION_KEY)});`
    }
  })()`);

  await open(pathname);

  // Language and session are applied once React has taken over the page
  // (it marks the DOM nodes it owns); wait for that, then for the language.
  await retry(async () => {
    const ready = await rawEvaluate(`(() => {
      const header = document.querySelector("header");
      const hydrated = !!header && Object.keys(header).some((key) => key.startsWith("__reactFiber"));
      return hydrated && document.documentElement.lang === ${JSON.stringify(HTML_LANG[lang])};
    })()`, 3_000);
    if (!ready) throw new Error(`Page never hydrated in ${lang}`);
  });
  // Fonts change widths, so give them up to 3 seconds, asking from here:
  // a promise or timer inside the page can be held up indefinitely.
  for (let i = 0; i < 12; i++) {
    if (await rawEvaluate('document.fonts.status === "loaded"', 3_000).catch(() => false)) break;
    await sleep(250);
  }
  await sleep(400);
}

async function screenshot(name) {
  if (!OUT) return;
  mkdirSync(OUT, { recursive: true });
  try {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data, "base64"));
  } catch (error) {
    // Screenshots are for people to look at; they never decide a check.
    console.log(`  ! no screenshot for ${name} (${error.message})`);
  }
}

/* ------------------------------------------------------------------ */
/* Measurements, run inside the page                                   */
/* ------------------------------------------------------------------ */

// The most lines any one piece of an element's text wraps onto. Measured
// per text node, so a deliberate two-line logo or an underline bar drawn
// under a link doesn't count as wrapping.
const LINES = `(element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let most = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const tops = [...range.getClientRects()].filter((r) => r.width > 0).map((r) => r.top).sort((a, b) => a - b);
    let lines = tops.length ? 1 : 0;
    for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] > 4) lines++;
    most = Math.max(most, lines);
  }
  return most;
}`;

const visible = `(element) => {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden";
}`;

/**
 * A bar of links: its groups and the space between them, and any link that
 * wraps, overlaps another, sits off the screen or is cut short. The site
 * hides horizontal overflow, so off-screen links don't widen the page;
 * they have to be looked for.
 */
async function measureBar(selector) {
  return evaluate(`(() => {
    const lines = ${LINES};
    const visible = ${visible};
    const bar = document.querySelector(${JSON.stringify(selector)});
    const groups = [...bar.children].filter(visible);
    const rects = groups.map((group) => group.getBoundingClientRect());
    const gaps = rects.slice(1).map((rect, i) => Math.round(rect.left - rects[i].right));
    const items = [...bar.querySelectorAll("a, button")].filter(visible);
    const itemRects = items.map((item) => item.getBoundingClientRect());
    let overlaps = 0;
    for (let i = 0; i < itemRects.length; i++)
      for (let j = i + 1; j < itemRects.length; j++) {
        const a = itemRects[i], b = itemRects[j];
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
          if (!items[i].contains(items[j]) && !items[j].contains(items[i])) overlaps++;
        }
      }
    const name = (item) => item.textContent.trim() || item.getAttribute("aria-label") || item.tagName;
    return {
      groups: groups.length,
      gaps,
      wrapped: items.filter((item) => lines(item) > 1).map(name),
      overlaps,
      offscreen: items
        .filter((item) => {
          const rect = item.getBoundingClientRect();
          return rect.left < -1 || rect.right > window.innerWidth + 1;
        })
        .map(name),
      // Text cut off with an ellipsis. The account link shortens a long name
      // on purpose ("max-w-[9rem] truncate"), so it doesn't count.
      truncated: items
        .filter(
          (item) =>
            item.getAttribute("href") !== "/account" &&
            getComputedStyle(item).textOverflow === "ellipsis" &&
            item.scrollWidth > item.clientWidth + 1,
        )
        .map(name),
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      barOverflow: bar.scrollWidth - bar.clientWidth,
      labels: items.map((item) => item.textContent.trim()).filter(Boolean),
    };
  })()`);
}

/* ------------------------------------------------------------------ */
/* The checks                                                          */
/* ------------------------------------------------------------------ */

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? `  (${detail})` : ""}`);
}

const accountLink = () =>
  evaluate(`document.querySelector('[data-testid="workouts-account-link"]')?.textContent.trim() ?? null`);

/** Everything about a bar that should never happen, as one string. */
function faults(bar) {
  return [
    bar.wrapped.length && `wrapped: ${bar.wrapped.join(", ")}`,
    bar.overlaps && `${bar.overlaps} overlapping`,
    bar.offscreen.length && `off screen: ${bar.offscreen.join(", ")}`,
    bar.truncated.length && `cut short: ${bar.truncated.join(", ")}`,
    bar.pageOverflow > 0 && `page ${bar.pageOverflow}px too wide`,
  ]
    .filter(Boolean)
    .join("; ");
}

const NAV_STATE = `(() => {
  const visible = ${visible};
  const nav = document.querySelector("header nav");
  const button = nav.querySelector(":scope > button");
  return { groups: [...nav.children].filter(visible).length, button: visible(button) };
})()`;

/** Opens the menu and reports whether every item fits inside it. */
async function measureMenu() {
  // Opens the menu and waits, inside the page, until it stops growing (it
  // animates open), then measures: one self-contained question.
  return evaluate(`(async () => {
    const visible = ${visible};
    const panel = document.querySelector("header > div");
    document.querySelector("header nav > button").click();
    let last = -1;
    let steady = 0;
    for (let i = 0; i < 40 && steady < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const height = panel.getBoundingClientRect().height;
      steady = height > 0 && height === last ? steady + 1 : 0;
      last = height;
    }
    const items = [...panel.querySelectorAll("a, button")].filter(visible);
    const lastItem = items[items.length - 1].getBoundingClientRect();
    return {
      clipped: panel.scrollHeight - panel.clientHeight,
      lastInside: lastItem.bottom <= panel.getBoundingClientRect().bottom + 1,
      labels: items.map((item) => item.textContent.trim()).filter(Boolean),
    };
  })()`);
}

const LANGS = ["en", "hi", "hinglish"];
const WORKOUTS_LABEL = { en: "Workouts", hi: "वर्कआउट", hinglish: "Workouts" };
const VISITORS = [false, "short", "long"];
const who = (signedIn) => (signedIn ? `signed in (${signedIn} name)` : "signed out");

// The categories each mode has, as the shared catalogue defines them.
const CATEGORIES = {
  equipment: ["chest", "back", "shoulders", "biceps-triceps", "legs-glutes", "abs-core", "full-body", "cardio-conditioning"],
  "no-equipment": ["chest", "back", "shoulders", "arms", "legs-glutes", "abs-core", "full-body", "cardio-conditioning"],
};

// Text that exists only in draft exercises. None of it may reach a visitor:
// not on a page, and not in any script the page loads.
const DRAFT_MARKERS = [
  'review:"draft"',
  "review: \"draft\"",
  "Lie on the bench with your eyes under the bar",
  "maximum user weight covers your body weight",
  "keeping your elbows tucked close to your sides",
  // Notes for the coach travel with drafts and must stay behind with them.
  "coachReview",
  "Recommended for removal",
  "Removed from the proposed catalogue",
  // The catalogue checks run at build time only; their messages stay behind too.
  "its review notes say nothing",
];

const status = async (pathname) => (await fetch(BASE + pathname, { redirect: "manual" })).status;

/** Every script a page loads, as text. */
async function pageScripts(pathname) {
  const html = await (await fetch(BASE + pathname)).text();
  const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  const scripts = await Promise.all(sources.map(async (src) => (await fetch(new URL(src, BASE))).text()));
  return [html, ...scripts];
}

try {
  console.log(`Checking ${BASE}\n`);

  // --- Addresses: what exists, and what must not -------------------------
  for (const [mode, slugs] of Object.entries(CATEGORIES)) {
    const codes = await Promise.all(slugs.map((slug) => status(`/workouts/${mode}/${slug}`)));
    check(`${mode}: all 8 category pages open`, codes.every((code) => code === 200), codes.join(" "));
  }
  for (const [label, pathname] of [
    ["a category from the other mode", "/workouts/no-equipment/biceps-triceps"],
    ["a category from the other mode", "/workouts/equipment/arms"],
    ["an unknown category", "/workouts/equipment/neck"],
    ["a category under an unknown mode", "/workouts/bodyweight/chest"],
    ["a draft exercise", "/workouts/no-equipment/exercises/push-up"],
    ["a draft exercise", "/workouts/no-equipment/exercises/pull-up"],
    ["a draft exercise", "/workouts/equipment/exercises/barbell-bench-press"],
    ["a draft exercise", "/workouts/equipment/exercises/pull-up"],
    ["an exercise under the other mode", "/workouts/no-equipment/exercises/chin-up"],
    ["a withdrawn exercise", "/workouts/no-equipment/exercises/inverted-table-row"],
    ["a draft exercise", "/workouts/no-equipment/exercises/close-grip-push-up"],
    ["an exercise under the other mode", "/workouts/equipment/exercises/push-up"],
    ["an unknown exercise", "/workouts/equipment/exercises/nope"],
  ]) {
    const code = await status(pathname);
    check(`404 for ${label}: ${pathname}`, code === 404, String(code));
  }

  // --- Drafts never reach the browser --------------------------------------
  for (const pathname of ["/", "/workouts", "/workouts/equipment", "/workouts/no-equipment/back", "/account"]) {
    const texts = await pageScripts(pathname);
    const leaks = DRAFT_MARKERS.filter((marker) => texts.some((text) => text.includes(marker)));
    check(
      `no draft content in ${pathname} or the ${texts.length - 1} scripts it loads`,
      leaks.length === 0,
      leaks.join(" | "),
    );
  }

  // --- Category pages ------------------------------------------------------
  for (const lang of LANGS) {
    await visit("/workouts/no-equipment/back", { width: 390, height: 844, lang });
    const page = await evaluate(`(() => ({
      empty: !!document.querySelector('[data-testid="exercises-empty"]'),
      list: !!document.querySelector('[data-testid="exercise-list"]'),
      heading: document.querySelector("h1")?.textContent.trim(),
      text: document.body.innerText,
    }))()`);
    check(
      `category page ${lang}: says nothing is published yet, and shows no exercise`,
      page.empty && !page.list && !page.text.includes("Pull-up") && !page.text.includes("Inverted table row"),
      page.heading,
    );
    if (lang === "en") await screenshot("category-no-equipment-back-390");
    if (lang === "hi") await screenshot("category-no-equipment-back-390-hi");
  }

  await visit("/workouts/equipment", { width: 1280 });
  const tiles = await evaluate(`[...document.querySelectorAll('a[data-testid^="category-"]')].map((a) => a.getAttribute("href"))`);
  check(
    "mode page: every category tile links to its own page",
    JSON.stringify(tiles) === JSON.stringify(CATEGORIES.equipment.map((slug) => `/workouts/equipment/${slug}`)),
    `${tiles.length} links`,
  );
  await screenshot("mode-equipment-1280");

  await visit("/workouts/equipment/biceps-triceps", { width: 1280 });
  const bar = await measureBar("main > header");
  check("category page header: whole and on screen", !faults(bar), faults(bar));
  check('category page header: signed out shows "Log in"', (await accountLink()) === "Log in", await accountLink());
  await screenshot("category-equipment-biceps-1280");

  // --- The workouts header's account link -------------------------------
  await visit("/workouts", { width: 1280 });
  check('workouts header: signed out shows "Log in"', (await accountLink()) === "Log in", await accountLink());
  await screenshot("workouts-1280-signed-out");

  await visit("/workouts", { width: 1280, signedIn: "short" });
  check('workouts header: signed in shows "My account"', (await accountLink()) === "My account", await accountLink());

  await visit("/workouts/equipment", { width: 390, height: 844 });
  check('mode page header on a phone: signed out shows "Log in"', (await accountLink()) === "Log in", await accountLink());

  await visit("/workouts", { width: 1280, lang: "hi" });
  check("workouts header: signed out, in Hindi", (await accountLink()) === "लॉग इन", await accountLink());

  await visit("/workouts", { width: 1280, lang: "hinglish", signedIn: "short" });
  check("workouts header: signed in, in Hinglish", (await accountLink()) === "Mera account", await accountLink());

  // --- Home page: the menu button up to 1279px ----------------------------
  for (const width of [1024, 1100, 1279]) {
    for (const lang of LANGS) {
      await visit("/", { width, lang, signedIn: "long" });
      const state = await evaluate(NAV_STATE);
      const menu = await measureMenu();
      check(
        `home ${width}px ${lang}: menu button instead of the full bar, every menu item fits`,
        state.button &&
          state.groups === 2 &&
          menu.clipped <= 0 &&
          menu.lastInside &&
          menu.labels.includes(WORKOUTS_LABEL[lang]),
        `${state.groups} visible groups, ${menu.labels.length} menu items${
          menu.clipped > 0 ? `, ${menu.clipped}px clipped` : ""
        }`,
      );
      if (width === 1024 && lang === "en") await screenshot("home-1024-menu-open");
    }
  }

  // --- Home page: the full bar from 1280px --------------------------------
  for (const width of [1280, 1366, 1440, 1536, 1920]) {
    for (const lang of LANGS) {
      for (const signedIn of VISITORS) {
        await visit("/", { width, lang, signedIn });
        const bar = await measureBar("header nav");
        const problems = faults(bar);
        check(
          `navbar ${width}px ${lang} ${who(signedIn)}: full bar, groups ≥24px apart, every link whole and on screen`,
          bar.groups === 3 && Math.min(...bar.gaps) >= 24 && !problems,
          `gaps ${bar.gaps.join("/")}px${problems ? `; ${problems}` : ""}`,
        );
        if (width === 1280 && !signedIn) await screenshot(`home-navbar-1280-${lang}`);
      }
    }
  }

  await visit("/", { width: 1280 });
  const desktopLinks = (await measureBar("header nav")).labels;
  check("navbar: Workouts link on desktop", desktopLinks.includes("Workouts"), desktopLinks.join(" | "));

  // --- Home page menu on a phone ----------------------------------------
  for (const lang of LANGS) {
    await visit("/", { width: 390, height: 844, lang });
    const menu = await measureMenu();
    check(
      `phone menu ${lang}: every item fits, Workouts included`,
      menu.clipped <= 0 && menu.lastInside && menu.labels.includes(WORKOUTS_LABEL[lang]),
      `${menu.labels.length} items${menu.clipped > 0 ? `, ${menu.clipped}px clipped` : ""}`,
    );
    if (lang === "en") await screenshot("home-menu-390");
  }

  // --- Workouts header, phone to desktop --------------------------------
  for (const width of [320, 390, 640, 768, 1024, 1280]) {
    for (const lang of LANGS) {
      for (const signedIn of [false, "short"]) {
        await visit("/workouts", { width, height: 844, lang, signedIn });
        const bar = await measureBar("main > header");
        const problems = faults(bar);
        check(`workouts header ${width}px ${lang} ${who(signedIn)}: every control whole and on screen`, !problems, problems);
      }
    }
  }
  await visit("/workouts", { width: 390, height: 844 });
  await screenshot("workouts-390");
  await visit("/workouts/no-equipment", { width: 390, height: 844 });
  await screenshot("workouts-no-equipment-390");
} finally {
  page?.socket.close();
  browser.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // The browser can hold files for a moment on Windows; it's a temp folder.
  }
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length} of ${results.length} checks pass`);
if (stalls) console.log(`(the browser stalled ${stalls} time${stalls === 1 ? "" : "s"}; those visits were retried)`);
process.exit(failed.length ? 1 : 0);
