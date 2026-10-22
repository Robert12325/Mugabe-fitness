import { readApiConfig } from "@/config/env";

describe("readApiConfig", () => {
  it("accepts the production https origin and drops a trailing slash", () => {
    expect(readApiConfig("https://mugabe-fitness.vercel.app/", false)).toEqual({
      ok: true,
      baseUrl: "https://mugabe-fitness.vercel.app",
    });
  });

  it("refuses a missing value instead of falling back to production", () => {
    const result = readApiConfig(undefined, true);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.problem).toMatch(/EXPO_PUBLIC_API_URL is not set/);
  });

  it("refuses something that isn't a URL", () => {
    expect(readApiConfig("mugabe-fitness", true).ok).toBe(false);
  });

  it("allows plain http only for a local backend in development", () => {
    expect(readApiConfig("http://192.168.1.10:3000", true).ok).toBe(true);
    expect(readApiConfig("http://10.0.2.2:3000", true).ok).toBe(true);
    expect(readApiConfig("http://localhost:3000", true).ok).toBe(true);

    // Not in a release build, and never for a public host.
    expect(readApiConfig("http://192.168.1.10:3000", false).ok).toBe(false);
    expect(readApiConfig("http://mugabe-fitness.vercel.app", true).ok).toBe(false);
  });

  it("refuses credentials, queries or fragments in the URL", () => {
    expect(readApiConfig("https://user:pass@example.com", false).ok).toBe(false);
    expect(readApiConfig("https://example.com/?key=secret", false).ok).toBe(false);
    expect(readApiConfig("https://example.com/#x", false).ok).toBe(false);
  });
});
