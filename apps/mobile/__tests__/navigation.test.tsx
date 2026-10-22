import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter, testRouter } from "expo-router/testing-library";

/**
 * Renders the app's real routes (src/app) and moves between them, the way
 * a person tapping the tab bar and buttons would.
 *
 * The device's secure storage is empty here, so the app starts signed out.
 */

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// Resolved from the working directory, which Jest sets to apps/mobile.
const APP_DIR = "./src/app";

describe("navigation", () => {
  it("opens on Home with the sign-in and registration entry points", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/" });

    expect(screen).toHavePathname("/");
    expect(await screen.findByTestId("screen-home")).toBeTruthy();
    expect(await screen.findByTestId("home-sign-in")).toBeTruthy();
    expect(screen.getByTestId("home-register")).toBeTruthy();
  });

  it("has all five tabs, and each tab opens its screen", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/" });
    await screen.findByTestId("screen-home");

    const tabs: [label: string, path: string, testID: string][] = [
      ["Workouts", "/workouts", "screen-workouts"],
      ["My Program", "/program", "screen-program"],
      ["Progress", "/progress", "screen-progress"],
      ["Profile", "/profile", "screen-profile"],
      ["Home", "/", "screen-home"],
    ];

    for (const [label, pathname, testID] of tabs) {
      await fireEvent.press(screen.getByRole("button", { name: new RegExp(`^${label}`) }));

      await waitFor(() => expect(screen).toHavePathname(pathname));
      expect(screen.getByTestId(testID)).toBeTruthy();
    }
  });

  it("goes to sign-in from Home, and on to registration", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/" });

    await fireEvent.press(await screen.findByTestId("home-sign-in"));
    await waitFor(() => expect(screen).toHavePathname("/sign-in"));
    expect(screen.getByTestId("sign-in-email")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "New here? Create an account" }));
    await waitFor(() => expect(screen).toHavePathname("/register"));
    expect(screen.getByTestId("register-name")).toBeTruthy();
  });

  it("checks the fields before contacting the server", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/sign-in" });

    await fireEvent.press(await screen.findByTestId("sign-in-submit"));

    expect(await screen.findByText("Please enter a valid email.")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
    expect(screen).toHavePathname("/sign-in");
  });

  it("asks a signed-out visitor to sign in on account tabs", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/profile" });

    expect(await screen.findByText("Sign in to see your account.")).toBeTruthy();
  });

  it("supports deep links to each tab", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/progress" });
    expect(await screen.findByTestId("screen-progress")).toBeTruthy();

    await testRouter.navigate("/workouts");
    expect(screen).toHavePathname("/workouts");
  });
});
