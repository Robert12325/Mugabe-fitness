// Reads the config files from disk, so this file uses Node's types (the
// app's tsconfig loads only Jest's).
/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import type { ExpoConfig } from "expo/config";
import { appVariant, withVariant } from "../app.config";

/**
 * The update set-up rests on a few facts about the configuration. If one
 * of them changes, an update could reach builds it wasn't tested on, or a
 * test build could replace a member's app, so they are held here.
 */

const ROOT = path.resolve(__dirname, "..");
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, "app.json"), "utf8")).expo as ExpoConfig;
const easJson = JSON.parse(fs.readFileSync(path.join(ROOT, "eas.json"), "utf8"));

describe("app variants", () => {
  it("leaves the production app exactly as app.json describes it", () => {
    expect(withVariant(appJson, "production")).toEqual(appJson);
    expect(appJson.android?.package).toBe("com.mugabefitness.app");
  });

  it("gives staging its own app ID and name and changes nothing else", () => {
    const staging = withVariant(appJson, "staging");

    expect(staging.android?.package).toBe("com.mugabefitness.app.staging");
    expect(staging.ios?.bundleIdentifier).toBe("com.mugabefitness.app.staging");
    expect(staging.name).toBe("Mugabe Fitness Staging");

    // These are the only fields fingerprint.config.js skips. Anything else
    // that differed would give staging another runtime version, and a
    // tested update could no longer be promoted unchanged.
    const strip = (config: ExpoConfig) => ({
      ...config,
      name: undefined,
      android: { ...config.android, package: undefined },
      ios: { ...config.ios, bundleIdentifier: undefined },
    });
    expect(strip(staging)).toEqual(strip(appJson));
    expect(staging.scheme).toBe(appJson.scheme);
  });

  it("defaults to production and refuses an unknown variant", () => {
    expect(appVariant(undefined)).toBe("production");
    expect(appVariant("")).toBe("production");
    expect(appVariant("staging")).toBe("staging");
    expect(() => appVariant("Production")).toThrow(/APP_VARIANT/);
    expect(() => appVariant("preview")).toThrow(/APP_VARIANT/);
  });

  it("skips exactly the variant fields in the fingerprint", () => {
    const { SourceSkips } = jest.requireActual("expo/fingerprint");
    const { sourceSkips } = jest.requireActual("../fingerprint.config.js");

    for (const skip of ["ExpoConfigNames", "ExpoConfigAndroidPackage", "ExpoConfigIosBundleIdentifier"]) {
      expect(sourceSkips & SourceSkips[skip]).toBe(SourceSkips[skip]);
    }
    // Icons, splash, schemes and plugins still count as native changes.
    for (const kept of ["ExpoConfigAll", "ExpoConfigAssets", "ExpoConfigSchemes", "ExpoConfigExtraSection"]) {
      expect(sourceSkips & SourceSkips[kept]).toBe(0);
    }
  });
});

describe("expo-updates configuration", () => {
  it("uses the fingerprint runtime version and this project's update URL", () => {
    expect(appJson.runtimeVersion).toEqual({ policy: "fingerprint" });
    expect(appJson.updates?.url).toBe(`https://u.expo.dev/${appJson.extra?.eas?.projectId}`);
    // Download in the background; never hold the launch for the network.
    expect(appJson.updates?.fallbackToCacheTimeout).toBe(0);
  });
});

describe("build profiles", () => {
  const profile = (name: string) => {
    const own = easJson.build[name];
    const base = own.extends ? easJson.build[own.extends] : {};
    return { ...base, ...own, env: { ...base.env, ...own.env }, android: { ...base.android, ...own.android } };
  };

  it.each([
    // name, channel, variant, Android output, distribution
    ["staging", "staging", "staging", "apk", "internal"],
    ["production-apk", "production-apk", "production", "apk", "internal"],
    ["production", "production-play", "production", "app-bundle", "store"],
  ])("%s builds the %s channel's %s app as an %s", (name, channel, variant, buildType, distribution) => {
    const p = profile(name);

    expect(p.channel).toBe(channel);
    expect(p.env.APP_VARIANT).toBe(variant);
    expect(p.android.buildType).toBe(buildType);
    expect(p.distribution).toBe(distribution);
    expect(p.autoIncrement).toBe(true);
    expect(p.env.EXPO_PUBLIC_API_URL).toBe("https://mugabe-fitness.vercel.app");
  });

  // "base" only holds shared settings and is never built itself: it has no
  // channel, so a build of it could never be updated.
  it("has exactly these profiles, so every build has an update channel", () => {
    expect(Object.keys(easJson.build).sort()).toEqual(["base", "production", "production-apk", "staging"]);
  });

  it("submits to Google Play only as a draft on the internal testing track", () => {
    expect(easJson.submit.production.android).toEqual({ track: "internal", releaseStatus: "draft" });
  });
});

describe("app code", () => {
  // A republished update carries staging's copy of the config, so the app's
  // identity must come from the native build. See app.config.ts.
  it("never reads its name or store IDs from Constants.expoConfig", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (/\.tsx?$/.test(entry.name) && /expoConfig\??\.(name|android|ios|slug)/.test(fs.readFileSync(file, "utf8"))) {
          offenders.push(path.relative(ROOT, file));
        }
      }
    };
    walk(path.join(ROOT, "src"));

    expect(offenders).toEqual([]);
  });
});
