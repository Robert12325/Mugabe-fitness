// Jest has no bundler to register font files, so expo-font can't load the
// Montserrat assets here. The tests are about behaviour, not typography:
// report the fonts as loaded and let the app render.
jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn(async () => undefined),
}));

// Tests run as a development build: no update channel and no installed
// version, so the app never checks the website for new versions. Tests of
// the update features mock these themselves.
jest.mock("expo-updates", () => ({
  isEnabled: false,
  isEmbeddedLaunch: true,
  channel: null,
  updateId: null,
  runtimeVersion: null,
  useUpdates: () => ({ isUpdateAvailable: false, isUpdatePending: false }),
  reloadAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: null,
  nativeBuildVersion: null,
  applicationId: null,
}));
