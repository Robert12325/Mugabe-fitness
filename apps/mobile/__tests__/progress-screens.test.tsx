import { configure, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Alert } from "react-native";
import { localToday, addDays } from "@/lib/daily";

/**
 * The Progress tab and the log/edit screen, rendered from the app's real
 * routes, signed in, against a stand-in for the website's API. Nothing
 * here reaches a real server.
 */

jest.mock("@/config/env", () => ({
  apiConfig: { ok: true, baseUrl: "https://api.test" },
  readApiConfig: jest.fn(),
}));

const TOKEN = "Abc_def-1234567890abcdefghijklmnop";

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
  getItemAsync: jest.fn(async () => "Abc_def-1234567890abcdefghijklmnop"),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.setTimeout(60_000);
configure({ asyncUtilTimeout: 10_000 });

const TODAY = localToday();
const YESTERDAY = addDays(TODAY, -1);

const ACCOUNT = {
  user: { id: "u-1", name: "Asha Rao", email: "asha@example.com", phone: "9876543210", createdAt: "" },
  bookings: [],
  membership: { status: "trial", programName: "Mugabe Live", trialEndsAt: "", paidThrough: "", nextDueAt: "" },
};

const TARGETS = { caloriesKcal: 2000, proteinG: 140, waterMl: 3000, steps: 9000, weightGrams: 78000, waistMm: 850, updatedAt: "" };

type Day = Record<string, unknown> & { on: string };

/** A stand-in for the website's API, holding one client's log. */
function fakeServer({
  log = [] as Day[],
  weights = [] as { on: string; grams: number; note: string }[],
  daily = {} as { get?: number; post?: number; delete?: number },
} = {}) {
  const state = { log: [...log], weights: [...weights] };
  const requests: { method: string; url: string; body: unknown; auth: string }[] = [];

  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  const dailyBody = () => ({ log: state.log, progress: { goal: { targetGrams: 0, targetOn: "" }, entries: state.weights } });

  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    requests.push({ method, url, body, auth: headers.Authorization ?? "" });

    if (headers.Authorization !== `Bearer ${TOKEN}`) return reply(401, { error: "Please log in again." });

    if (url.endsWith("/api/account") && method === "GET") return reply(200, ACCOUNT);

    if (url.includes("/api/account/daily")) {
      const status = method === "GET" ? daily.get : method === "POST" ? daily.post : daily.delete;

      if (status === 403) return reply(403, { error: "Your access has expired. Renew your membership to continue." });
      if (status === 429) return reply(429, { error: "Too many changes. Please try again later." });
      if (status === 0) throw new TypeError("Network request failed");

      if (method === "GET") return reply(200, { ...dailyBody(), targets: TARGETS });

      if (method === "POST") {
        const { weightGrams, ...day } = body as Day & { weightGrams: number | null };
        state.log = [day, ...state.log.filter((entry) => entry.on !== day.on)];
        state.weights = state.weights.filter((entry) => entry.on !== day.on);
        if (typeof weightGrams === "number") state.weights.unshift({ on: day.on, grams: weightGrams, note: "" });
        return reply(200, dailyBody());
      }

      const on = new URL(url).searchParams.get("on");
      state.log = state.log.filter((entry) => entry.on !== on);
      state.weights = state.weights.filter((entry) => entry.on !== on);
      return reply(200, dailyBody());
    }

    return reply(404, { error: "Not found" });
  }) as typeof fetch;

  return { requests, state };
}

type Recorded = { method: string; url: string; body: unknown; auth: string };

const dailyRequests = (requests: Recorded[], method: string) =>
  requests.filter((request) => request.url.includes("/api/account/daily") && request.method === method);

const LOGGED_YESTERDAY: Day = {
  on: YESTERDAY,
  caloriesKcal: 1850,
  proteinG: 125,
  waterMl: 2500,
  steps: 8200,
  waistMm: 905,
  sleepMin: 450,
  workout: true,
  energy: 7,
  notes: "Poha and dal",
};

describe("Progress tab", () => {
  it("shows today against the coach's targets, the summary and the history", async () => {
    fakeServer({ log: [LOGGED_YESTERDAY], weights: [{ on: YESTERDAY, grams: 84200, note: "" }] });

    await renderRouter("./src/app", { initialUrl: "/progress" });

    expect(await screen.findByTestId("today-card")).toBeTruthy();
    expect(screen.getByLabelText("Calories: not logged of 2,000 kcal")).toBeTruthy();
    expect(screen.getByTestId("summary-card")).toBeTruthy();
    expect(screen.getByText("1 of 7 days logged")).toBeTruthy();
    expect(screen.getByTestId(`day-row-${YESTERDAY}`)).toBeTruthy();
    expect(screen.getByText("Dashed line: your coach's target, 78 kg")).toBeTruthy();
  });

  it("shows an empty history and a Log today button for a new client", async () => {
    fakeServer();

    await renderRouter("./src/app", { initialUrl: "/progress" });

    expect(await screen.findByTestId("history-empty")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Log today" })).toBeTruthy();
  });

  it("shows the locked state, with no form, when the server says 403", async () => {
    fakeServer({ daily: { get: 403 } });

    await renderRouter("./src/app", { initialUrl: "/progress" });

    expect(await screen.findByTestId("daily-locked")).toBeTruthy();
    expect(screen.getByText("Your access has expired. Renew your membership to continue.")).toBeTruthy();
    expect(screen.queryByTestId("log-today")).toBeNull();
  });

  it("shows an error when offline, and loads after Try again", async () => {
    const network: { get?: number } = { get: 0 };
    fakeServer({ log: [LOGGED_YESTERDAY], daily: network });

    await renderRouter("./src/app", { initialUrl: "/progress" });
    expect(await screen.findByTestId("daily-error")).toBeTruthy();

    network.get = undefined; // back online
    await fireEvent.press(screen.getByTestId("daily-retry"));

    expect(await screen.findByTestId("today-card")).toBeTruthy();
    expect(screen.getByTestId(`day-row-${YESTERDAY}`)).toBeTruthy();
  });
});

describe("Logging a day", () => {
  it("can't save an empty new day, then saves what was entered and shows it", async () => {
    const { requests } = fakeServer();
    await renderRouter("./src/app", { initialUrl: "/progress" });

    await fireEvent.press(await screen.findByTestId("log-today"));
    await waitFor(() => expect(screen).toHavePathname("/log-day"));

    expect(screen.getByTestId("save-day")).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId("field-caloriesKcal"), "1,900");
    await fireEvent.changeText(screen.getByTestId("field-water"), "2,5");
    await fireEvent.changeText(screen.getByTestId("field-weight"), "84.2");
    await fireEvent.press(screen.getByTestId("workout-yes"));
    await fireEvent.press(screen.getByTestId("energy-8"));
    await fireEvent.press(screen.getByTestId("save-day"));

    await waitFor(() => expect(screen).toHavePathname("/progress"));

    const posts = dailyRequests(requests, "POST");
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({
      on: TODAY,
      caloriesKcal: 1900,
      proteinG: null,
      waterMl: 2500,
      steps: null,
      waistMm: null,
      sleepMin: null,
      workout: true,
      energy: 8,
      notes: "",
      weightGrams: 84200,
    });
    expect(screen.getByLabelText("Calories: 1,900 of 2,000 kcal")).toBeTruthy();
    expect(screen.getByLabelText("Weight: 84.2 kg")).toBeTruthy();
  });

  it("shows field errors and sends nothing when the input is invalid", async () => {
    const { requests } = fakeServer();
    await renderRouter("./src/app", { initialUrl: `/log-day?on=${TODAY}` });

    await fireEvent.changeText(await screen.findByTestId("field-caloriesKcal"), "12000");
    await fireEvent.changeText(screen.getByTestId("field-weight"), "500");
    await fireEvent.press(screen.getByTestId("save-day"));

    expect(await screen.findByText("Calories: that number is out of range.")).toBeTruthy();
    expect(screen.getByText("Enter a weight between 20 and 400 kg.")).toBeTruthy();
    expect(dailyRequests(requests, "POST")).toHaveLength(0);
    expect(screen).toHavePathname("/log-day");
  });

  it("opens an existing day filled in, and clearing the weight removes the weigh-in", async () => {
    const { requests } = fakeServer({ log: [LOGGED_YESTERDAY], weights: [{ on: YESTERDAY, grams: 84200, note: "" }] });
    await renderRouter("./src/app", { initialUrl: "/progress" });

    await fireEvent.press(await screen.findByTestId(`day-row-${YESTERDAY}`));
    await waitFor(() => expect(screen).toHavePathname("/log-day"));

    expect(screen.getByTestId("field-caloriesKcal").props.value).toBe("1850");
    expect(screen.getByTestId("field-water").props.value).toBe("2.5");
    expect(screen.getByTestId("field-weight").props.value).toBe("84.2");
    expect(screen.getByTestId("field-notes").props.value).toBe("Poha and dal");

    await fireEvent.changeText(screen.getByTestId("field-weight"), "");
    await fireEvent.press(screen.getByTestId("save-day"));
    await waitFor(() => expect(screen).toHavePathname("/progress"));

    const body = dailyRequests(requests, "POST")[0].body as Record<string, unknown>;
    expect(body.on).toBe(YESTERDAY);
    expect(body.caloriesKcal).toBe(1850);
    expect(body.weightGrams).toBeNull();
  });

  it("keeps the form and shows the server's message on 429", async () => {
    fakeServer({ daily: { post: 429 } });
    await renderRouter("./src/app", { initialUrl: `/log-day?on=${TODAY}` });

    await fireEvent.changeText(await screen.findByTestId("field-steps"), "8000");
    await fireEvent.press(screen.getByTestId("save-day"));

    expect(await screen.findByText("Too many changes. Please try again later.")).toBeTruthy();
    expect(screen).toHavePathname("/log-day");
    expect(screen.getByTestId("field-steps").props.value).toBe("8000");
  });

  it("shows the locked notice if access lapses while saving (403)", async () => {
    fakeServer({ daily: { post: 403 } });
    await renderRouter("./src/app", { initialUrl: `/log-day?on=${TODAY}` });

    await fireEvent.changeText(await screen.findByTestId("field-steps"), "8000");
    await fireEvent.press(screen.getByTestId("save-day"));

    expect(await screen.findByTestId("daily-locked")).toBeTruthy();
  });

  it("deletes a day only after confirming", async () => {
    const { requests } = fakeServer({ log: [LOGGED_YESTERDAY] });
    const alert = jest.spyOn(Alert, "alert");
    await renderRouter("./src/app", { initialUrl: `/log-day?on=${YESTERDAY}` });

    await fireEvent.press(await screen.findByTestId("delete-day"));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(dailyRequests(requests, "DELETE")).toHaveLength(0);

    // Tap "Delete" in the confirmation.
    const buttons = alert.mock.calls[0][2] ?? [];
    await buttons.find((button) => button.text === "Delete")?.onPress?.();

    await waitFor(() => expect(dailyRequests(requests, "DELETE")).toHaveLength(1));
    expect(dailyRequests(requests, "DELETE")[0].url).toBe(`https://api.test/api/account/daily?on=${YESTERDAY}`);
    alert.mockRestore();
  });

  it("only ever sends the session token it has, and no user id", async () => {
    const { requests } = fakeServer();
    await renderRouter("./src/app", { initialUrl: `/log-day?on=${TODAY}` });

    await fireEvent.changeText(await screen.findByTestId("field-steps"), "100");
    await fireEvent.press(screen.getByTestId("save-day"));
    await waitFor(() => expect(dailyRequests(requests, "POST")).toHaveLength(1));

    for (const request of requests) expect(request.auth).toBe(`Bearer ${TOKEN}`);
    expect(JSON.stringify(dailyRequests(requests, "POST")[0].body)).not.toMatch(/userId|"id"/);
  });

  it("moves between days and won't go past today", async () => {
    fakeServer();
    await renderRouter("./src/app", { initialUrl: `/log-day?on=${TODAY}` });

    expect(await screen.findByTestId("day-next")).toBeDisabled();
    await fireEvent.press(screen.getByTestId("day-previous"));
    expect(screen.getByText("Yesterday")).toBeTruthy();
    expect(screen.getByTestId("day-next")).not.toBeDisabled();
  });
});
