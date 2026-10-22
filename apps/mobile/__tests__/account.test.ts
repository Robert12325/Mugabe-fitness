import {
  checkCredentials,
  checkRegistration,
  createAccountApi,
  parseAccount,
  parseSession,
} from "@/api/account";
import type { ApiClient } from "@/api/client";

const TOKEN = "Abc_def-1234567890abcdefghijklmnop";
const USER = { id: "u-1", name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210", createdAt: "2026-10-01T00:00:00.000Z" };

/** Records the request the account API builds, and answers with `reply`. */
function recorder(reply: unknown) {
  const calls: Parameters<ApiClient>[0][] = [];
  const request = (async (options) => {
    calls.push(options);
    const data = options.parse(reply);
    return data === null ? { ok: false, kind: "unexpected", status: 200, message: "x" } : { ok: true, data };
  }) as ApiClient;

  return { calls, api: createAccountApi(request) };
}

describe("account contract (mirrors the website's API routes)", () => {
  it("registers with POST /api/account and a trimmed, lower-cased email", async () => {
    const { calls, api } = recorder({ user: USER, token: TOKEN });

    const result = await api.register({ name: " Asha Rao ", email: " Asha@Example.COM ", phone: " +91 98765 43210 ", password: " pass word " });

    expect(result).toEqual({ ok: true, data: { token: TOKEN, user: USER } });
    expect(calls[0]).toMatchObject({
      method: "POST",
      path: "/api/account",
      body: { name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210", password: " pass word " },
    });
    expect(calls[0].token).toBeUndefined();
  });

  it("logs in with POST /api/account/session", async () => {
    const { calls, api } = recorder({ user: USER, token: TOKEN });

    await api.logIn("ASHA@example.com", "secret-pass");

    expect(calls[0]).toMatchObject({
      method: "POST",
      path: "/api/account/session",
      body: { email: "asha@example.com", password: "secret-pass" },
    });
  });

  it("logs out with DELETE /api/account/session and the bearer token", async () => {
    const { calls, api } = recorder({ ok: true });

    await api.logOut(TOKEN);

    expect(calls[0]).toMatchObject({ method: "DELETE", path: "/api/account/session", token: TOKEN });
  });

  it("reads the account with GET /api/account and the bearer token", async () => {
    const { calls, api } = recorder({ user: USER, bookings: [], membership: { status: "trial", programName: "Mugabe Live", trialEndsAt: "2026-10-04T10:00:00.000Z" } });

    const result = await api.getAccount(TOKEN);

    expect(calls[0]).toMatchObject({ method: "GET", path: "/api/account", token: TOKEN });
    expect(result.ok && result.data.membership.status).toBe("trial");
  });

  it("never sends a malformed token to the server", async () => {
    const { calls, api } = recorder({});

    const result = await api.getAccount("not a token");

    expect(calls).toHaveLength(0);
    expect(result).toMatchObject({ ok: false, kind: "unauthorized" });
  });
});

describe("parsing server responses", () => {
  it("requires both a user and a token the server would accept back", () => {
    expect(parseSession({ user: USER, token: TOKEN })).toEqual({ token: TOKEN, user: USER });
    expect(parseSession({ user: USER })).toBeNull();
    expect(parseSession({ user: USER, token: "short" })).toBeNull();
    expect(parseSession({ token: TOKEN })).toBeNull();
  });

  it("reads an unknown membership status as none, never as access", () => {
    expect(parseAccount({ user: USER, membership: { status: "vip" } })?.membership.status).toBe("none");
    expect(parseAccount({ user: USER })?.membership.status).toBe("none");
  });
});

describe("input checks (same rules as src/lib/account.ts on the server)", () => {
  const valid = { name: "Asha", email: "asha@example.com", phone: "9876543210", password: "longenough" };

  it("passes valid details", () => {
    expect(checkRegistration(valid)).toEqual({});
  });

  it("flags each field the server would refuse", () => {
    expect(checkRegistration({ ...valid, name: "  " }).name).toBeDefined();
    expect(checkRegistration({ ...valid, name: "x".repeat(101) }).name).toBeDefined();
    expect(checkRegistration({ ...valid, email: "asha@" }).email).toBeDefined();
    expect(checkRegistration({ ...valid, phone: "12345" }).phone).toBeDefined();
    expect(checkRegistration({ ...valid, phone: "1".repeat(16) }).phone).toBeDefined();
    expect(checkRegistration({ ...valid, password: "short" }).password).toBeDefined();
  });

  it("needs an email and a password to sign in", () => {
    expect(checkCredentials("asha@example.com", "x")).toEqual({});
    expect(checkCredentials("", "x").email).toBeDefined();
    expect(checkCredentials("asha@example.com", "").password).toBeDefined();
  });
});
