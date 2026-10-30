/**
 * How this copy of the app was installed, read from the update channel the
 * build was made with (eas.json). The channel is part of the native build,
 * so an over-the-air update can't change it.
 *
 * Expo Go, development builds, the web version and anything unrecognised
 * have no distribution: they never check for, or ask for, new versions.
 */

export type Track = "production" | "staging";

/** Where a newer build comes from: the website's APK, or Google Play. */
export type Source = "apk" | "play";

export type Distribution = { channel: string; track: Track; source: Source };

const CHANNELS: Record<string, Omit<Distribution, "channel">> = {
  staging: { track: "staging", source: "apk" },
  "production-apk": { track: "production", source: "apk" },
  "production-play": { track: "production", source: "play" },
};

export function distributionFor(channel: string | null | undefined): Distribution | null {
  // An own-property check, so "constructor" and friends aren't channels.
  if (!channel || !Object.prototype.hasOwnProperty.call(CHANNELS, channel)) return null;

  return { channel, ...CHANNELS[channel] };
}

/** A short name for the build's source, for the version line in Profile. */
export const DISTRIBUTION_LABEL: Record<string, string> = {
  staging: "Staging",
  "production-apk": "Direct download",
  "production-play": "Google Play",
};
