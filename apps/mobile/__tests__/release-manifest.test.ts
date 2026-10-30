// Reads the website's manifest files from disk, so this file uses Node's
// types (the app's tsconfig loads only Jest's).
/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { buildLabel, parseVersionCode } from "@/release/build-info";
import { distributionFor } from "@/release/distribution";
import { newVersionLink, PLAY_STORE_URL } from "@/release/links";
import { binaryStatus, loadReleaseManifest, parseReleaseManifest } from "@/release/manifest";

/**
 * Deciding, from the website's release manifest, whether this build is
 * current, has a newer version available, or must be replaced.
 */

const mockConfig: { ok: boolean; baseUrl?: string; problem?: string } = {
  ok: true,
  baseUrl: "https://mugabe-fitness.example",
};

jest.mock("@/config/env", () => ({
  get apiConfig() {
    return mockConfig;
  },
}));

const manifest = (overrides: { track?: string; apk?: object; play?: object } = {}) => ({
  schemaVersion: 1,
  track: overrides.track ?? "production",
  android: {
    apk: { minimumVersionCode: 0, latest: null, ...overrides.apk },
    play: { minimumVersionCode: 0, storeUrl: null, ...overrides.play },
  },
});

const apkInstall = distributionFor("production-apk");
const playInstall = distributionFor("production-play");
const stagingInstall = distributionFor("staging");

describe("distributionFor", () => {
  it("knows the three release channels", () => {
    expect(apkInstall).toEqual({ channel: "production-apk", track: "production", source: "apk" });
    expect(playInstall).toEqual({ channel: "production-play", track: "production", source: "play" });
    expect(stagingInstall).toEqual({ channel: "staging", track: "staging", source: "apk" });
  });

  it("treats anything else as a development build", () => {
    for (const channel of [null, undefined, "", "production", "preview", "constructor", "__proto__"]) {
      expect(distributionFor(channel)).toBeNull();
    }
  });
});

describe("parseReleaseManifest", () => {
  it("reads a valid manifest", () => {
    const parsed = parseReleaseManifest(
      manifest({ apk: { minimumVersionCode: 2, latest: { versionCode: 5 } }, play: { minimumVersionCode: 3 } }),
      "production",
    );
    expect(parsed).toEqual({
      track: "production",
      apk: { minimumVersionCode: 2, latestVersionCode: 5 },
      play: { minimumVersionCode: 3 },
    });
  });

  it("refuses the other track's manifest, so staging and production stay apart", () => {
    expect(parseReleaseManifest(manifest({ track: "staging" }), "production")).toBeNull();
    expect(parseReleaseManifest(manifest(), "staging")).toBeNull();
  });

  it("refuses anything malformed rather than guessing", () => {
    const bad: unknown[] = [
      null,
      "text",
      [],
      { ...manifest(), schemaVersion: 2 },
      manifest({ apk: { minimumVersionCode: -1 } }),
      manifest({ apk: { minimumVersionCode: 1.5 } }),
      manifest({ apk: { minimumVersionCode: "3" } }),
      manifest({ play: { minimumVersionCode: null } }),
      manifest({ apk: { latest: { versionCode: "9" } } }),
      manifest({ apk: { latest: undefined } }),
      { schemaVersion: 1, track: "production", android: { apk: { minimumVersionCode: 0, latest: null } } },
    ];
    for (const json of bad) expect(parseReleaseManifest(json, "production")).toBeNull();
  });
});

describe("binaryStatus", () => {
  const parsed = (overrides: Parameters<typeof manifest>[0]) => parseReleaseManifest(manifest(overrides), overrides?.track === "staging" ? "staging" : "production");

  it("asks for a new version only below the minimum for that install's source", () => {
    const m = parsed({ apk: { minimumVersionCode: 4 }, play: { minimumVersionCode: 2 } });

    expect(binaryStatus(m, apkInstall, 3)).toEqual({ kind: "required", minimumVersionCode: 4 });
    expect(binaryStatus(m, apkInstall, 4)).toEqual({ kind: "current" });
    expect(binaryStatus(m, playInstall, 3)).toEqual({ kind: "current" });
    expect(binaryStatus(m, playInstall, 1)).toEqual({ kind: "required", minimumVersionCode: 2 });
  });

  it("offers a newer APK to APK installs only; Google Play updates its own", () => {
    const m = parsed({ apk: { latest: { versionCode: 7 } } });

    expect(binaryStatus(m, apkInstall, 6)).toEqual({ kind: "available", latestVersionCode: 7 });
    expect(binaryStatus(m, apkInstall, 7)).toEqual({ kind: "current" });
    expect(binaryStatus(m, apkInstall, 8)).toEqual({ kind: "current" });
    expect(binaryStatus(m, playInstall, 6)).toEqual({ kind: "current" });
  });

  it("puts a required update ahead of an optional one", () => {
    const m = parsed({ apk: { minimumVersionCode: 5, latest: { versionCode: 7 } } });
    expect(binaryStatus(m, apkInstall, 4).kind).toBe("required");
  });

  it("says nothing without a manifest, a release build, a version, or the right track", () => {
    const m = parsed({ apk: { minimumVersionCode: 99 } });

    expect(binaryStatus(null, apkInstall, 1)).toEqual({ kind: "unknown" });
    expect(binaryStatus(m, null, 1)).toEqual({ kind: "unknown" });
    expect(binaryStatus(m, apkInstall, null)).toEqual({ kind: "unknown" });
    expect(binaryStatus(m, stagingInstall, 1)).toEqual({ kind: "unknown" });
  });
});

describe("loadReleaseManifest", () => {
  afterEach(() => {
    mockConfig.ok = true;
    mockConfig.baseUrl = "https://mugabe-fitness.example";
  });

  const respond = (status: number, body: unknown) =>
    jest.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

  it("reads the track's file from the configured website, uncached", async () => {
    const fetchImpl = respond(200, manifest({ track: "staging", apk: { minimumVersionCode: 3 } }));

    await expect(loadReleaseManifest("staging", { fetchImpl })).resolves.toMatchObject({
      track: "staging",
      apk: { minimumVersionCode: 3 },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://mugabe-fitness.example/app-release/staging.json",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("returns null, never throws, when the check can't be made", async () => {
    await expect(loadReleaseManifest("production", { fetchImpl: respond(404, {}) })).resolves.toBeNull();
    await expect(loadReleaseManifest("production", { fetchImpl: respond(200, { nope: true }) })).resolves.toBeNull();
    await expect(
      loadReleaseManifest("production", { fetchImpl: jest.fn(async () => Promise.reject(new TypeError("offline"))) }),
    ).resolves.toBeNull();
    await expect(
      loadReleaseManifest("production", {
        fetchImpl: jest.fn(async () => new Response("<html>", { status: 200 })),
      }),
    ).resolves.toBeNull();
  });

  it("gives up after the timeout", async () => {
    const hang = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted")))),
    );
    await expect(loadReleaseManifest("production", { fetchImpl: hang, timeoutMs: 10 })).resolves.toBeNull();
  });

  it("doesn't fetch at all when the app has no website configured", async () => {
    mockConfig.ok = false;
    delete mockConfig.baseUrl;
    const fetchImpl = respond(200, manifest());

    await expect(loadReleaseManifest("production", { fetchImpl })).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("the website's published manifests", () => {
  // The files the website serves at /app-release/*.json.
  const read = (track: string) =>
    JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../public/app-release/${track}.json`), "utf8"));

  it.each(["production", "staging"] as const)("%s.json is valid for the app and for its own track only", (track) => {
    expect(parseReleaseManifest(read(track), track)).not.toBeNull();
    expect(parseReleaseManifest(read(track), track === "production" ? "staging" : "production")).toBeNull();
  });

  it("asks no installed build to update yet: there is no release to update to", () => {
    for (const track of ["production", "staging"] as const) {
      const parsed = parseReleaseManifest(read(track), track);
      expect(parsed?.apk.minimumVersionCode).toBe(0);
      expect(parsed?.play.minimumVersionCode).toBe(0);
      expect(parsed?.apk.latestVersionCode).toBeNull();
    }
  });
});

describe("newVersionLink", () => {
  it("sends APK installs to the website's download page and Play installs to Play", () => {
    expect(newVersionLink(apkInstall)).toEqual({ url: "https://mugabe-fitness.example/download", label: "Get the new version" });
    expect(newVersionLink(playInstall)).toEqual({ url: PLAY_STORE_URL, label: "Update on Google Play" });
    expect(PLAY_STORE_URL).toBe("https://play.google.com/store/apps/details?id=com.mugabefitness.app");
  });

  it("gives staging no link: the public download is a different app", () => {
    expect(newVersionLink(stagingInstall)).toBeNull();
    expect(newVersionLink(null)).toBeNull();
  });
});

describe("build information", () => {
  it("reads Android's versionCode only when it is a whole number", () => {
    expect(parseVersionCode("12")).toBe(12);
    for (const raw of [null, undefined, "", "1.2", "-3", "abc", "12345678901"]) expect(parseVersionCode(raw)).toBeNull();
  });

  it("labels the build so a tester can say exactly what they run", () => {
    expect(
      buildLabel({ versionName: "0.1.0", versionCode: 4, distribution: apkInstall, updateId: "1a2b3c4d-5e6f-4a1b-8c9d-0e1f2a3b4c5d" }),
    ).toBe("Version 0.1.0 (build 4) · Direct download · update 1a2b3c4d");
    expect(buildLabel({ versionName: "0.1.0", versionCode: 5, distribution: stagingInstall, updateId: null })).toBe(
      "Version 0.1.0 (build 5) · Staging · built-in code",
    );
    expect(buildLabel({ versionName: "0.1.0", versionCode: null, distribution: null, updateId: null })).toBe("Version 0.1.0");
    expect(buildLabel({ versionName: null, versionCode: null, distribution: null, updateId: null })).toBeNull();
  });
});
