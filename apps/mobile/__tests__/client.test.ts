import { createApiClient, type FetchLike } from "@/api/client";

const config = { ok: true as const, baseUrl: "https://api.test" };

function respond(status: number, body: unknown): FetchLike {
  return jest.fn(async () =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

const asObject = (json: unknown) =>
  json && typeof json === "object" ? (json as Record<string, unknown>) : null;

describe("createApiClient", () => {
  it("sends JSON with the bearer token and returns parsed data", async () => {
    const fetchImpl = respond(200, { hello: "world" });
    const request = createApiClient({ config, fetchImpl });

    const result = await request({
      method: "POST",
      path: "/api/thing",
      token: "tok_abcdefghijklmnopqrstuvwxyz",
      body: { a: 1 },
      parse: asObject,
    });

    expect(result).toEqual({ ok: true, data: { hello: "world" } });

    const [url, init] = (fetchImpl as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.test/api/thing");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok_abcdefghijklmnopqrstuvwxyz");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("never sends an Authorization header without a token", async () => {
    const fetchImpl = respond(200, {});
    await createApiClient({ config, fetchImpl })({ method: "GET", path: "/x", parse: asObject });

    expect((fetchImpl as jest.Mock).mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it.each([
    [400, "invalid"],
    [401, "unauthorized"],
    [409, "conflict"],
    [429, "rate-limited"],
    [503, "unavailable"],
    [500, "server"],
    [404, "unexpected"],
  ])("classifies HTTP %i as %s and keeps the server's message", async (status, kind) => {
    const request = createApiClient({ config, fetchImpl: respond(status, { error: "From the server." }) });
    const result = await request({ method: "GET", path: "/x", parse: asObject });

    expect(result).toEqual({ ok: false, kind, status, message: "From the server." });
  });

  it("falls back to a friendly message when the error body isn't JSON", async () => {
    const fetchImpl: FetchLike = async () => new Response("<html>oops</html>", { status: 502 });
    const result = await createApiClient({ config, fetchImpl })({ method: "GET", path: "/x", parse: asObject });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.kind).toBe("server");
    expect(!result.ok && result.message).toMatch(/went wrong/);
  });

  it("reports a network failure without throwing", async () => {
    const fetchImpl: FetchLike = async () => {
      throw new TypeError("Network request failed");
    };
    const result = await createApiClient({ config, fetchImpl })({ method: "GET", path: "/x", parse: asObject });

    expect(result).toMatchObject({ ok: false, kind: "network", status: 0 });
  });

  it("gives up after the timeout and says so", async () => {
    // A server that never answers, but honours the abort signal.
    const fetchImpl: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });

    const result = await createApiClient({ config, fetchImpl, defaultTimeoutMs: 20 })({
      method: "GET",
      path: "/x",
      parse: asObject,
    });

    expect(result).toMatchObject({ ok: false, kind: "timeout" });
  });

  it("treats a 2xx with the wrong shape as unexpected, not success", async () => {
    const request = createApiClient({ config, fetchImpl: respond(200, { nope: true }) });
    const result = await request({ method: "GET", path: "/x", parse: () => null });

    expect(result).toMatchObject({ ok: false, kind: "unexpected" });
  });

  it("makes no request at all when the app isn't configured", async () => {
    const fetchImpl = respond(200, {});
    const request = createApiClient({
      config: { ok: false, problem: "EXPO_PUBLIC_API_URL is not set." },
      fetchImpl,
    });

    const result = await request({ method: "GET", path: "/x", parse: asObject });

    expect(result).toMatchObject({ ok: false, kind: "config", message: "EXPO_PUBLIC_API_URL is not set." });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
