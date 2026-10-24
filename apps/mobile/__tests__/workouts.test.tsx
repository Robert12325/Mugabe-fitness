import { CATALOGUE, MODES, getCategory, isModeId } from "@mugabe/fitness-content";
import { act, configure, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter, testRouter } from "expo-router/testing-library";

/**
 * The workout library's two modes and their categories, and the Workouts
 * tab that shows them, with the real catalogue. Every exercise in it is
 * still a draft, so clients see none yet; the exercise screens themselves
 * are tested with approved stand-ins in workout-exercises.test.tsx.
 */

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const APP_DIR = "./src/app";

jest.setTimeout(60_000);
configure({ asyncUtilTimeout: 10_000 });

describe("shared catalogue — modes and categories", () => {
  it("has exactly the two modes, in order", () => {
    expect(MODES.map((mode) => [mode.id, mode.name])).toEqual([
      ["equipment", "Workouts with Equipment"],
      ["no-equipment", "Workouts without Equipment"],
    ]);
  });

  it("gives Workouts with Equipment its eight categories", () => {
    expect(MODES[0].categories.map((category) => category.name)).toEqual([
      "Chest",
      "Back",
      "Shoulders",
      "Biceps and triceps",
      "Legs and glutes",
      "Abs and core",
      "Full body",
      "Cardio and conditioning",
    ]);
  });

  it("gives Workouts without Equipment its eight categories", () => {
    expect(MODES[1].categories.map((category) => category.name)).toEqual([
      "Chest",
      "Back",
      "Shoulders",
      "Arms",
      "Legs and glutes",
      "Abs and core",
      "Full body",
      "Cardio and conditioning",
    ]);
  });

  it("looks modes and categories up by their URL segment, and nothing else", () => {
    expect(isModeId("equipment")).toBe(true);
    expect(isModeId("no-equipment")).toBe(true);
    expect(isModeId("bodyweight")).toBe(false);
    expect(isModeId(undefined)).toBe(false);
    expect(getCategory("equipment", "biceps-triceps")?.name).toBe("Biceps and triceps");
    expect(getCategory("no-equipment", "biceps-triceps")).toBeUndefined();
    expect(getCategory("no-equipment", "arms")?.name).toBe("Arms");
  });

  it("shows clients no exercise until the coach approves one", () => {
    for (const mode of MODES) expect(CATALOGUE.published(mode.id)).toEqual([]);
  });
});

describe("Workouts tab", () => {
  it("shows both modes without signing in", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts" });

    expect(await screen.findByTestId("screen-workouts")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Workouts with Equipment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Workouts without Equipment" })).toBeTruthy();
  });

  it("opens Workouts with Equipment on its categories, and comes back", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts" });

    await fireEvent.press(await screen.findByTestId("mode-equipment"));
    await waitFor(() => expect(screen).toHavePathname("/workouts/equipment"));

    expect(await screen.findByTestId("screen-workout-mode")).toBeTruthy();
    expect(screen.getByTestId("category-biceps-triceps")).toBeTruthy();
    expect(screen.queryByTestId("category-arms")).toBeNull();
    expect(screen.getAllByText("Exercises coming soon")).toHaveLength(8);

    // Awaited, so the navigation settles before the next test renders.
    await act(async () => {
      testRouter.back();
    });
    await waitFor(() => expect(screen).toHavePathname("/workouts"));
    expect(screen.getByTestId("mode-no-equipment")).toBeTruthy();
  });

  it("opens Workouts without Equipment on its own categories", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts" });

    await fireEvent.press(await screen.findByTestId("mode-no-equipment"));
    await waitFor(() => expect(screen).toHavePathname("/workouts/no-equipment"));

    expect(await screen.findByTestId("category-arms")).toBeTruthy();
    expect(screen.queryByTestId("category-biceps-triceps")).toBeNull();
    expect(screen.getByText(/needs a sturdy chair, table or towel says so/)).toBeTruthy();
  });

  it("opens a category and says honestly that nothing is published there yet", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/no-equipment" });

    await fireEvent.press(await screen.findByTestId("category-back"));
    await waitFor(() => expect(screen).toHavePathname("/workouts/no-equipment/back"));

    expect(await screen.findByTestId("exercises-empty")).toBeTruthy();
    expect(screen.getByText("No exercises published here yet")).toBeTruthy();
    // The drafts written for Back exist, but none of them shows.
    expect(screen.queryByText("Pull-up")).toBeNull();
    expect(screen.queryByTestId("exercise-pull-up")).toBeNull();
  });

  it("won't open a draft exercise by its address", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/no-equipment/exercises/pull-up" });

    expect(await screen.findByText("Exercise not found")).toBeTruthy();
    expect(screen.queryByText("How to do it")).toBeNull();
  });

  it("says so when a link names a mode that doesn't exist", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/bodyweight" });

    expect(await screen.findByText("Workout mode not found")).toBeTruthy();
    expect(screen.queryByTestId("category-chest")).toBeNull();
  });
});
