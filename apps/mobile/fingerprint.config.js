// The fingerprint is the app's runtime version: an update only reaches
// builds whose native code it matches (https://docs.expo.dev/eas-update/runtime-versions/).
//
// These are Expo's default ("balanced") skips plus the four fields that
// app.config.ts changes for the staging variant, so staging and production
// builds of one commit get the same fingerprint and can run the same
// update. Setting sourceSkips replaces the defaults, so they are all listed.
const { SourceSkips } = require("expo/fingerprint");

/** @type {import("expo/fingerprint").Config} */
module.exports = {
  sourceSkips:
    // Expo's defaults.
    SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun |
    SourceSkips.ExpoConfigVersions |
    SourceSkips.ExpoConfigRuntimeVersionIfString |
    SourceSkips.EasJson |
    SourceSkips.Easignore |
    SourceSkips.AutolinkingConfigPaths |
    // What differs between the production and staging variants.
    SourceSkips.ExpoConfigNames |
    SourceSkips.ExpoConfigAndroidPackage |
    SourceSkips.ExpoConfigIosBundleIdentifier,
};
