import { websiteUrl } from "@/config/website";
import type { Distribution } from "./distribution";

/** The production app's Play listing (Play installs are always production). */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mugabefitness.app";

/**
 * Where to get a newer build of the app that is running: the website's
 * official download page for APK installs, Google Play for Play installs.
 *
 * Staging builds have no link. Testers install them from the Expo build
 * page, and the public download is the production app, a different app.
 */
export function newVersionLink(distribution: Distribution | null): { url: string; label: string } | null {
  if (!distribution || distribution.track !== "production") return null;

  if (distribution.source === "play") return { url: PLAY_STORE_URL, label: "Update on Google Play" };

  const url = websiteUrl("/download");
  return url ? { url, label: "Get the new version" } : null;
}
