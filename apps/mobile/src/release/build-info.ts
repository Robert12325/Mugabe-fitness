import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { DISTRIBUTION_LABEL, distributionFor, type Distribution } from "./distribution";

/**
 * What is installed and running, from the native build itself and from
 * expo-updates, never from Constants.expoConfig (an update republished from
 * staging carries staging's copy of that; see app.config.ts).
 */
export type BuildInfo = {
  /** "0.1.0": the version people see. */
  versionName: string | null;
  /** Android's versionCode, the number that orders builds. */
  versionCode: number | null;
  distribution: Distribution | null;
  /** The running over-the-air update, or null for the code built into the app. */
  updateId: string | null;
};

/** Android reports the versionCode as a string; only whole numbers count. */
export function parseVersionCode(raw: string | null | undefined): number | null {
  return raw && /^\d{1,10}$/.test(raw) ? Number(raw) : null;
}

export function readBuildInfo(): BuildInfo {
  // Only Android builds are distributed so far; the web version updates
  // with the website and iOS has no builds yet.
  const android = Platform.OS === "android";

  return {
    // The web version has no native version, so it shows the config's.
    versionName: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null,
    versionCode: android ? parseVersionCode(Application.nativeBuildVersion) : null,
    distribution: android && Updates.isEnabled ? distributionFor(Updates.channel) : null,
    updateId: Updates.isEnabled && !Updates.isEmbeddedLaunch ? Updates.updateId : null,
  };
}

/**
 * "Version 0.1.0 (build 4) · Direct download · update 1a2b3c4d", so a tester
 * can tell exactly what they are running.
 */
export function buildLabel(info: BuildInfo): string | null {
  if (!info.versionName) return null;

  const parts = [`Version ${info.versionName}${info.versionCode !== null ? ` (build ${info.versionCode})` : ""}`];

  if (info.distribution) {
    parts.push(DISTRIBUTION_LABEL[info.distribution.channel]);
    parts.push(info.updateId ? `update ${info.updateId.slice(0, 8)}` : "built-in code");
  }

  return parts.join(" · ");
}
