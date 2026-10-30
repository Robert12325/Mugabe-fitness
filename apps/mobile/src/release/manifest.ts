import { websiteUrl } from "@/config/website";
import type { Distribution, Track } from "./distribution";

/**
 * The release manifest: a small JSON file on the website, one per track
 * (public/app-release/production.json and staging.json in the website
 * repo), that says which Android builds are current.
 *
 * It only ever *announces* builds. The app never downloads or installs
 * anything from it: it sends people to the website's download page or to
 * Google Play, which do that. Over-the-air updates are separate (EAS
 * Update, via expo-updates) and need no manifest.
 *
 * Anything malformed, for the wrong track or unreachable is treated as "no
 * information", so a bad file or a dead connection can never lock anyone
 * out of the app.
 */

export type ReleaseManifest = {
  track: Track;
  apk: { minimumVersionCode: number; latestVersionCode: number | null };
  play: { minimumVersionCode: number };
};

export type BinaryStatus =
  /** Nothing to say: no manifest, unknown build, or not a release build. */
  | { kind: "unknown" }
  | { kind: "current" }
  /** A newer APK is on the download page; optional. */
  | { kind: "available"; latestVersionCode: number }
  /** This build is below the minimum: the app asks for a new version first. */
  | { kind: "required"; minimumVersionCode: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isVersionCode = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** The parts of the manifest the app acts on, or null if it isn't valid. */
export function parseReleaseManifest(json: unknown, track: Track): ReleaseManifest | null {
  if (!isRecord(json) || json.schemaVersion !== 1 || json.track !== track) return null;

  const android = json.android;
  if (!isRecord(android) || !isRecord(android.apk) || !isRecord(android.play)) return null;

  const { apk, play } = android;
  if (!isVersionCode(apk.minimumVersionCode) || !isVersionCode(play.minimumVersionCode)) return null;

  let latestVersionCode: number | null = null;

  if (apk.latest !== null) {
    if (!isRecord(apk.latest) || !isVersionCode(apk.latest.versionCode)) return null;
    latestVersionCode = apk.latest.versionCode;
  }

  return {
    track,
    apk: { minimumVersionCode: apk.minimumVersionCode, latestVersionCode },
    play: { minimumVersionCode: play.minimumVersionCode },
  };
}

/** What the manifest means for the build that is running. */
export function binaryStatus(
  manifest: ReleaseManifest | null,
  distribution: Distribution | null,
  versionCode: number | null,
): BinaryStatus {
  if (!manifest || !distribution || versionCode === null || manifest.track !== distribution.track) {
    return { kind: "unknown" };
  }

  const minimum =
    distribution.source === "play" ? manifest.play.minimumVersionCode : manifest.apk.minimumVersionCode;

  if (versionCode < minimum) return { kind: "required", minimumVersionCode: minimum };

  // Google Play updates its own installs, so only APK installs are told
  // about a newer APK.
  const latest = distribution.source === "apk" ? manifest.apk.latestVersionCode : null;

  if (latest !== null && latest > versionCode) return { kind: "available", latestVersionCode: latest };

  return { kind: "current" };
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Fetches and parses one track's manifest. Never throws: failures are null. */
export async function loadReleaseManifest(
  track: Track,
  {
    fetchImpl = (url, init) => fetch(url, init),
    timeoutMs = 8_000,
  }: { fetchImpl?: FetchLike; timeoutMs?: number } = {},
): Promise<ReleaseManifest | null> {
  const url = websiteUrl(`/app-release/${track}.json`);
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) return null;

    return parseReleaseManifest(await response.json(), track);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
