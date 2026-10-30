import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Two installable variants of the one app, chosen by APP_VARIANT when a
 * build or an update is made (eas.json sets it for each build profile, and
 * scripts/publish-update.mjs for updates):
 *
 * - production (the default): com.mugabefitness.app, the app members use.
 * - staging: com.mugabefitness.app.staging, a separate app for testing new
 *   builds and updates. It installs beside the production app, never over
 *   it, so a test build can't replace a member's app.
 *
 * Only the name and the store identifiers differ. The fingerprint ignores
 * exactly those fields (fingerprint.config.js), so both variants share one
 * runtime version, and an update tested on staging can be republished to
 * production byte for byte. __tests__/app-config.test.ts holds this.
 *
 * Because a republished update carries the staging copy of this config,
 * app code must read its identity from the native build (expo-application,
 * expo-updates' channel), never from Constants.expoConfig.
 */

export type AppVariant = "production" | "staging";

export function appVariant(raw = process.env.APP_VARIANT): AppVariant {
  const value = raw?.trim() || "production";

  if (value !== "production" && value !== "staging") {
    throw new Error(`APP_VARIANT must be "production" or "staging", not "${value}".`);
  }

  return value;
}

export function withVariant(config: ExpoConfig, variant: AppVariant): ExpoConfig {
  if (variant === "production") return config;

  return {
    ...config,
    name: `${config.name} Staging`,
    ios: { ...config.ios, bundleIdentifier: `${config.ios?.bundleIdentifier}.staging` },
    android: { ...config.android, package: `${config.android?.package}.staging` },
  };
}

export default ({ config }: ConfigContext): ExpoConfig =>
  withVariant(config as ExpoConfig, appVariant());
