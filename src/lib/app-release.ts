import production from "../../public/app-release/production.json";

/**
 * The official Android release, read from public/app-release/production.json
 * (the same file the app checks for new versions; apps/mobile/RELEASING.md
 * explains how it is filled in).
 *
 * The download page offers an APK only when every field checks out, and it
 * must be the production app: the staging app has a different package and
 * update channel and is refused here, as is anything not served over https
 * or without a checksum. Anything else means "not available yet".
 */

export const ANDROID_PACKAGE = "com.mugabefitness.app";
export const PRODUCTION_APK_CHANNEL = "production-apk";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

export type ApkRelease = {
  versionName: string;
  versionCode: number;
  url: string;
  sha256: string;
  /** SHA-256 of the signing certificate, to compare with Play Console's. */
  signingCertSha256: string;
  sizeBytes: number;
  /** YYYY-MM-DD */
  releasedAt: string;
  notes: string[];
};

export type AndroidRelease = { apk: ApkRelease | null; playStoreUrl: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPositiveInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

const isSha256 = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

function isApkUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.pathname.toLowerCase().endsWith(".apk");
  } catch {
    return false;
  }
}

export function readApkRelease(value: unknown): ApkRelease | null {
  if (!isRecord(value)) return null;

  const { versionName, versionCode, applicationId, channel, url, sha256, signingCertSha256, sizeBytes, releasedAt, notes } =
    value;

  const valid =
    typeof versionName === "string" &&
    /^\d+\.\d+\.\d+$/.test(versionName) &&
    isPositiveInt(versionCode) &&
    applicationId === ANDROID_PACKAGE &&
    channel === PRODUCTION_APK_CHANNEL &&
    isApkUrl(url) &&
    isSha256(sha256) &&
    isSha256(signingCertSha256) &&
    isPositiveInt(sizeBytes) &&
    typeof releasedAt === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(releasedAt) &&
    Array.isArray(notes) &&
    notes.every((note) => typeof note === "string");

  return valid
    ? { versionName, versionCode, url, sha256, signingCertSha256, sizeBytes, releasedAt, notes: notes as string[] }
    : null;
}

export function readAndroidRelease(manifest: unknown = production): AndroidRelease {
  const android = isRecord(manifest) && manifest.schemaVersion === 1 && manifest.track === "production"
    ? manifest.android
    : null;

  if (!isRecord(android)) return { apk: null, playStoreUrl: null };

  const apk = isRecord(android.apk) ? readApkRelease(android.apk.latest) : null;
  const storeUrl = isRecord(android.play) ? android.play.storeUrl : null;

  return {
    apk,
    // Exactly the production listing: a prefix match would also accept
    // "...id=com.mugabefitness.app.staging".
    playStoreUrl: storeUrl === PLAY_STORE_URL ? PLAY_STORE_URL : null,
  };
}
