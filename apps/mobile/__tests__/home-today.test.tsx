import { configure, fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { tileColumns } from "@/components/QuickTiles";
import { localToday } from "@/lib/daily";

/**
 * Home's Today card: only what the member's own log says about today, with
 * Start workout and Log today. Rendered from the real routes, signed in,
 * against a stand-in for the website's API.
 */

jest.mock("@/config/env", () => ({
  apiConfig: { ok: true, baseUrl: "https://api.test" },
  readApiConfig: jest.fn(),
}));

const TOKEN = "Abc_def-1234567890abcdefghijklmnop";
let mockStoredToken: string | null = TOKEN;

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
  getItemAsync: jest.fn(async () => mockStoredToken),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.setTimeout(60_000);
configure({ asyncUtilTimeout: 10_000 });

const TODAY = localToday();
const ACCOUNT = {
  user: { id: "u-1", name: "Asha Rao", email: "asha@example.com", phone: "9876543210", createdAt: "" },
  bookings: [],
  membership: { status: "trial", programName: "Mugabe Live", trialEndsAt: "", paidThrough: "", nextDueAt: "" },
};
const TARGETS = { caloriesKcal: null, proteinG: null, waterMl: null, steps: null, weightGrams: null, waistMm: null, updatedAt: "" };

function fakeServer({ log = [] as Record<string, unknown>[], weights = [] as { on: string; grams: number; note: string }[], dailyStatus = 200 } = {}) {
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    if (headers.Authorization !== `Bearer ${TOKEN}`) return reply(401, { error: "Please log in again." });
    if (url.endsWith("/api/account")) return reply(200, ACCOUNT);
    if (url.includes("/api/account/daily")) {
      if (dailyStatus === 403) return reply(403, { error: "Your access has expired. Renew your membership to continue." });
      return reply(200, { log, targets: TARGETS, progress: { goal: { targetGrams: 0, targetOn: "" }, entries: weights } });
    }
    return reply(404, { error: "Not found" });
  }) as typeof fetch;
}

const day = (extra: Record<string, unknown>) => ({ on: TODAY, caloriesKcal: null, proteinG: null, waterMl: null, steps: 4000, waistMm: null, sleepMin: null, workout: null, energy: null, notes: "", ...extra });

beforeEach(() => {
  mockStoredToken = TOKEN;
});

describe("Home's Today card", () => {
  it("says today is logged and that they trained, from the log", async () => {
    fakeServer({ log: [day({ workout: true })], weights: [{ on: TODAY, grams: 80200, note: "" }] });

    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByTestId("home-today")).toBeTruthy();
    expect(screen.getByText("Today is logged")).toBeTruthy();
    expect(screen.getByText("You trained today")).toBeTruthy();
    expect(screen.getByText("Weighed in at 80.2 kg")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit today" })).toBeTruthy();
  });

  it("says when the log records no workout today", async () => {
    fakeServer({ log: [day({ workout: false })] });

    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByText("Logged as no workout today")).toBeTruthy();
  });

  it("says nothing is logged yet on an empty day, and never claims an assigned workout", async () => {
    fakeServer();

    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByText("Not logged yet")).toBeTruthy();
    expect(screen.getByText("Training not logged yet")).toBeTruthy();
    expect(screen.queryByText(/assigned|coach set|today's workout/i)).toBeNull();
  });

  it("opens today's log from Log today", async () => {
    fakeServer();

    await renderRouter("./src/app", { initialUrl: "/" });
    await fireEvent.press(await screen.findByTestId("today-log"));

    expect(screen).toHavePathname("/log-day");
    expect(screen).toHaveSearchParams({ on: TODAY });
  });

  it("opens today's existing log from Edit today", async () => {
    fakeServer({ log: [day({ workout: true })] });

    await renderRouter("./src/app", { initialUrl: "/" });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit today" }));

    expect(screen).toHavePathname("/log-day");
    expect(screen).toHaveSearchParams({ on: TODAY });
  });

  it("opens the workout library from Start workout", async () => {
    fakeServer();

    await renderRouter("./src/app", { initialUrl: "/" });
    await fireEvent.press(await screen.findByTestId("today-start-workout"));

    expect(screen).toHavePathname("/workouts");
  });

  it("isn't shown while tracking is locked", async () => {
    fakeServer({ dailyStatus: 403 });

    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByTestId("screen-home")).toBeTruthy();
    expect(await screen.findByTestId("card-welcome")).toBeTruthy();
    expect(screen.queryByTestId("home-today")).toBeNull();
  });

  it("isn't shown to a visitor who isn't signed in", async () => {
    mockStoredToken = null;
    fakeServer();

    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByTestId("home-sign-in")).toBeTruthy();
    expect(screen.queryByTestId("home-today")).toBeNull();
  });
});

describe("quick tiles on narrow screens", () => {
  it("go two by two below 370 pt or with large text, four across otherwise", () => {
    expect(tileColumns(340)).toBe(2);
    expect(tileColumns(360)).toBe(2);
    expect(tileColumns(369)).toBe(2);
    expect(tileColumns(375)).toBe(4);
    expect(tileColumns(393)).toBe(4);
    expect(tileColumns(430)).toBe(4);
    expect(tileColumns(393, 1.3)).toBe(2);
  });
});
