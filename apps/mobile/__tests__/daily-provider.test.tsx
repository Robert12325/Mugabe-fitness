import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import type { Account, AccountApi } from "@/api/account";
import { failure } from "@/api/client";
import type { DailyApi, DailyLoad } from "@/api/daily";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import type { TokenStore } from "@/auth/token-store";
import { DailyProvider, useDaily } from "@/daily/DailyProvider";
import { NO_TARGETS, type DailyEntry } from "@/lib/daily";

/** The shared daily state: what each server answer does to the screen. */

const TOKEN = "Abc_def-1234567890abcdefghijklmnop";
const USER = { id: "u-1", name: "Asha Rao", email: "asha@example.com", phone: "9876543210", createdAt: "" };
const ACCOUNT: Account = {
  user: USER,
  membership: { status: "trial", programName: "Mugabe Live", trialEndsAt: "", paidThrough: "", nextDueAt: "" },
};

const DAY: DailyEntry = {
  on: "2026-10-19",
  caloriesKcal: 1850,
  proteinG: 125,
  waterMl: null,
  steps: null,
  waistMm: null,
  sleepMin: null,
  workout: true,
  energy: null,
  notes: "",
};

const LOADED: DailyLoad = {
  log: [DAY],
  weights: [{ on: "2026-10-19", grams: 84200, note: "" }],
  targets: { ...NO_TARGETS, caloriesKcal: 2000 },
};

function memoryStore(initial: string | null): TokenStore {
  let value = initial;
  return {
    get: async () => value,
    set: async (token) => {
      value = token;
    },
    clear: async () => {
      value = null;
    },
  };
}

function accountApi(getAccount: AccountApi["getAccount"] = async () => ({ ok: true, data: ACCOUNT })): AccountApi {
  return {
    register: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(async () => ({ ok: true as const, data: true as const })),
    getAccount: jest.fn(getAccount),
  } as unknown as AccountApi;
}

function dailyApi(overrides: Partial<DailyApi> = {}): jest.Mocked<DailyApi> {
  return {
    load: jest.fn(async () => ({ ok: true as const, data: LOADED })),
    save: jest.fn(async () => ({ ok: true as const, data: { log: [DAY], weights: LOADED.weights } })),
    remove: jest.fn(async () => ({ ok: true as const, data: { log: [], weights: [] } })),
    ...overrides,
  } as jest.Mocked<DailyApi>;
}

function setup(daily: DailyApi, account = accountApi(), store = memoryStore(TOKEN)) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider accountApi={account} tokenStore={store}>
      <DailyProvider dailyApi={daily}>{children}</DailyProvider>
    </AuthProvider>
  );

  return renderHook(() => ({ daily: useDaily(), auth: useAuth() }), { wrapper });
}

describe("loading", () => {
  it("loads the log once the session is confirmed", async () => {
    const daily = dailyApi();
    const { result } = await setup(daily);

    await waitFor(() => expect(result.current.daily.state.status).toBe("ready"));
    expect(daily.load).toHaveBeenCalledWith(TOKEN);
  });

  it("stays idle and loads nothing when signed out", async () => {
    const daily = dailyApi();
    const { result } = await setup(daily, accountApi(), memoryStore(null));

    await waitFor(() => expect(result.current.auth.state.status).toBe("signedOut"));
    expect(result.current.daily.state.status).toBe("idle");
    expect(daily.load).not.toHaveBeenCalled();
  });

  it("shows the locked state on 403, with the server's message", async () => {
    const daily = dailyApi({
      load: jest.fn(async () => failure("forbidden", 403, "Your access has expired. Renew your membership to continue.")),
    });
    const { result } = await setup(daily);

    await waitFor(() =>
      expect(result.current.daily.state).toEqual({
        status: "locked",
        message: "Your access has expired. Renew your membership to continue.",
      }),
    );
  });

  it("shows an error when offline, and recovers on retry", async () => {
    const load = jest.fn().mockResolvedValueOnce(failure("network")).mockResolvedValue({ ok: true, data: LOADED });
    const { result } = await setup(dailyApi({ load }));

    await waitFor(() => expect(result.current.daily.state.status).toBe("error"));

    await act(() => result.current.daily.refresh());
    expect(result.current.daily.state.status).toBe("ready");
  });

  it("keeps the last good log when a refresh fails", async () => {
    const load = jest.fn().mockResolvedValueOnce({ ok: true, data: LOADED }).mockResolvedValueOnce(failure("timeout"));
    const { result } = await setup(dailyApi({ load }));
    await waitFor(() => expect(result.current.daily.state.status).toBe("ready"));

    await act(() => result.current.daily.refresh());

    const state = result.current.daily.state;
    expect(state.status).toBe("ready");
    expect(state.status === "ready" && state.data.log).toEqual([DAY]);
    expect(state.status === "ready" && state.refreshFailure?.kind).toBe("timeout");
  });
});

describe("a 401 from the daily API", () => {
  it("asks the server about the session, which signs out only if it really ended", async () => {
    // The account check succeeds at launch, then reports the session gone.
    const getAccount = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, data: ACCOUNT })
      .mockResolvedValue(failure("unauthorized", 401));
    const daily = dailyApi({ load: jest.fn(async () => failure("unauthorized", 401)) });
    const { result } = await setup(daily, accountApi(getAccount));

    await waitFor(() => expect(result.current.auth.state).toEqual({ status: "signedOut", notice: "expired" }));
    expect(result.current.daily.state.status).toBe("idle");
  });
});

describe("saving and deleting", () => {
  it("shows the server's reply after a save, keeping the coach's targets", async () => {
    const saved: DailyEntry = { ...DAY, caloriesKcal: 1900 };
    const daily = dailyApi({
      save: jest.fn(async () => ({ ok: true as const, data: { log: [saved], weights: [] } })),
    });
    const { result } = await setup(daily);
    await waitFor(() => expect(result.current.daily.state.status).toBe("ready"));

    let outcome;
    await act(async () => {
      outcome = await result.current.daily.save({ ...saved, weightGrams: null });
    });

    expect(outcome).toEqual({ ok: true });
    const state = result.current.daily.state;
    expect(state.status === "ready" && state.data.log).toEqual([saved]);
    expect(state.status === "ready" && state.data.weights).toEqual([]);
    expect(state.status === "ready" && state.data.targets.caloriesKcal).toBe(2000);
  });

  it("returns a rate-limit failure to the form and changes nothing", async () => {
    const daily = dailyApi({
      save: jest.fn(async () => failure("rate-limited", 429, "Too many changes. Please try again later.")),
    });
    const { result } = await setup(daily);
    await waitFor(() => expect(result.current.daily.state.status).toBe("ready"));

    let outcome;
    await act(async () => {
      outcome = await result.current.daily.save({ ...DAY, weightGrams: null });
    });

    expect(outcome).toMatchObject({ ok: false, failure: { kind: "rate-limited", message: "Too many changes. Please try again later." } });
    const state = result.current.daily.state;
    expect(state.status === "ready" && state.data.log).toEqual([DAY]);
  });

  it("switches to locked when a save gets 403", async () => {
    const daily = dailyApi({
      save: jest.fn(async () => failure("forbidden", 403, "Your access has expired. Renew your membership to continue.")),
    });
    const { result } = await setup(daily);
    await waitFor(() => expect(result.current.daily.state.status).toBe("ready"));

    await act(async () => {
      await result.current.daily.save({ ...DAY, weightGrams: null });
    });

    expect(result.current.daily.state.status).toBe("locked");
  });

  it("removes a day and shows what the server returned", async () => {
    const daily = dailyApi();
    const { result } = await setup(daily);
    await waitFor(() => expect(result.current.daily.state.status).toBe("ready"));

    await act(async () => {
      await result.current.daily.remove("2026-10-19");
    });

    expect(daily.remove).toHaveBeenCalledWith(TOKEN, "2026-10-19");
    const state = result.current.daily.state;
    expect(state.status === "ready" && state.data.log).toEqual([]);
  });

  it("clears the log from the screen on sign-out", async () => {
    const { result } = await setup(dailyApi());
    await waitFor(() => expect(result.current.daily.state.status).toBe("ready"));

    await act(() => result.current.auth.signOut());

    expect(result.current.daily.state.status).toBe("idle");
  });
});
