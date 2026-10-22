// Jest has no bundler to register font files, so expo-font can't load the
// Montserrat assets here. The tests are about behaviour, not typography:
// report the fonts as loaded and let the app render.
jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn(async () => undefined),
}));
