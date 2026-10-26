import { createApiClient, type FetchLike } from "@/api/client";
import { createDailyApi, parseDailyData, parseDailyLoad } from "@/api/daily";

/** The daily API against a stand-in server: request shapes and how each
 *  server answer is classified. */

const TOKEN = "Abc_def-1234567890abcdefghijklmnop";
const config = { ok: true as const, baseUrl: "https://api.test" };

const SERVER_DAY = {
  on: "2026-10-19",
  caloriesKcal: 1850,
  proteinG: 125,
  waterMl: 2500,
  steps: 8200,
  waistMm: 905,
  sleepMin: 450,
  workout: true,
  energy: 7,
  notes: "oats",
};

const PROGRESS = { goal: { targetGrams: 0, targetOn: "" }, entries: [{ on: "2026-10-19", grams: 84200, note: "" }] };

function server(status: number, body: unknown) {
  const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(
    async () =>
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );

  return { fetchImpl, api: createDailyApi(createApiClient({ config, fetchImpl })) };
}

describe("daily API requests", () => {
  it("loads with GET /api/account/daily and the bearer token", async () => {
    const { fetchImpl, api } = server(200, {
      log: [SERVER_DAY],
      targets: { caloriesKcal: 2000, proteinG: null, waterMl: 3000, steps: 9000, weightGrams: 78000, waistMm: 850, updatedAt: "x" },
      progress: PROGRESS,
    });

    const result = await api.load(TOKEN);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.test/api/account/daily");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.log[0]).toEqual(SERVER_DAY);
    expect(result.ok && result.data.targets.caloriesKcal).toBe(2000);
    expect(result.ok && result.data.targets.proteinG).toBeNull();
    expect(result.ok && result.data.weights).toEqual([{ on: "2026-10-19", grams: 84200, note: "" }]);
  });

  it("saves with POST and the whole day, weight in grams", async () => {
    const { fetchImpl, api } = server(200, { log: [SERVER_DAY], progress: PROGRESS });

    await api.save(TOKEN, { ...SERVER_DAY, weightGrams: 84200 });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.test/api/account/daily");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ ...SERVER_DAY, weightGrams: 84200 });
  });

  it("sends weightGrams null to remove that day's weigh-in", async () => {
    const { fetchImpl, api } = server(200, { log: [], progress: { goal: {}, entries: [] } });

    await api.save(TOKEN, { ...SERVER_DAY, weightGrams: null });

    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body)).weightGrams).toBeNull();
  });

  it("deletes with DELETE ?on=", async () => {
    const { fetchImpl, api } = server(200, { log: [], progress: { goal: {}, entries: [] } });

    const result = await api.remove(TOKEN, "2026-10-19");

    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.test/api/account/daily?on=2026-10-19");
    expect(fetchImpl.mock.calls[0][1].method).toBe("DELETE");
    expect(result).toEqual({ ok: true, data: { log: [], weights: [] } });
  });
});

describe("classifying the server's answers", () => {
  it.each([
    [401, "unauthorized", "Please log in again."],
    [403, "forbidden", "Your access has expired. Renew your membership to continue."],
    [429, "rate-limited", "Too many changes. Please try again later."],
    [409, "conflict", "Your log is full. Delete an older day first."],
    [400, "invalid", "Enter a weight between 20 and 400 kg."],
    [503, "unavailable", "Daily tracking isn't available right now."],
    [500, "server", "That day couldn't be saved. Please try again."],
  ])("HTTP %i -> %s, keeping the server's message", async (status, kind, message) => {
    const { api } = server(status, { error: message });

    const result = await api.save(TOKEN, { ...SERVER_DAY, weightGrams: null });

    expect(result).toEqual({ ok: false, kind, status, message });
  });

  it("reports going offline without throwing", async () => {
    const fetchImpl: FetchLike = async () => {
      throw new TypeError("Network request failed");
    };
    const api = createDailyApi(createApiClient({ config, fetchImpl }));

    expect(await api.load(TOKEN)).toMatchObject({ ok: false, kind: "network" });
  });
});

describe("parsing", () => {
  it("treats a 200 without the expected arrays as unexpected, not an empty log", () => {
    expect(parseDailyData({})).toBeNull();
    expect(parseDailyData({ log: [] })).toBeNull();
    expect(parseDailyData({ log: "x", progress: { entries: [] } })).toBeNull();
    expect(parseDailyLoad({ log: [], progress: { entries: [] } })?.targets.caloriesKcal).toBeNull();
  });
});
