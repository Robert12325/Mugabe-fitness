import { act, configure, fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { renderRouter, testRouter } from "expo-router/testing-library";

/**
 * The exercise screens: a category's list, an exercise's details, and the
 * links between them. The real catalogue is all drafts, so it shows
 * nothing; here a few real exercises are marked approved, and their
 * neighbours left as drafts, to check both sides of the rule.
 *
 * Approved here: Push-up, Incline push-up and Chair dip (no equipment),
 * and Barbell bench press and Pull-up (equipment). Still drafts:
 * everything else, including Decline push-up, which Push-up lists as an
 * alternative.
 */

jest.mock("@mugabe/fitness-content", () => {
  const actual = jest.requireActual("@mugabe/fitness-content");
  const { DRAFT_EXERCISES } = jest.requireActual("@mugabe/fitness-content/exercises");
  const approved = new Set(["push-up", "incline-push-up", "chair-dip", "barbell-bench-press", "pull-up"]);
  const exercises = DRAFT_EXERCISES.map((exercise: { slug: string }) =>
    approved.has(exercise.slug) ? { ...exercise, review: "coach-approved" } : exercise,
  );
  // The other drafts go in too, still as drafts: the catalogue must hide them.
  return { ...actual, CATALOGUE: actual.createCatalogue(exercises) };
});

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const APP_DIR = "./src/app";

jest.setTimeout(60_000);
configure({ asyncUtilTimeout: 10_000 });

describe("categories", () => {
  it("counts only approved exercises on each body part", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/no-equipment" });

    expect(await screen.findByRole("button", { name: "Chest, 2 exercises" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Arms, 1 exercise" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back, Exercises coming soon" })).toBeTruthy();
  });

  it("lists a mode's own approved exercises: no drafts, nothing from the other mode", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/no-equipment" });

    await fireEvent.press(await screen.findByTestId("category-chest"));
    await waitFor(() => expect(screen).toHavePathname("/workouts/no-equipment/chest"));

    const list = await screen.findByTestId("exercise-list");
    expect(within(list).getByTestId("exercise-push-up")).toBeTruthy();
    expect(within(list).getByTestId("exercise-incline-push-up")).toBeTruthy();
    expect(within(list).queryByTestId("exercise-decline-push-up")).toBeNull(); // draft
    expect(within(list).queryByTestId("exercise-barbell-bench-press")).toBeNull(); // other mode
    expect(screen.getByText("Workouts without Equipment")).toBeTruthy();
  });

  it("keeps the equipment mode's chest list to its own exercises", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/equipment/chest" });

    const list = await screen.findByTestId("exercise-list");
    expect(within(list).getByTestId("exercise-barbell-bench-press")).toBeTruthy();
    expect(within(list).queryByTestId("exercise-push-up")).toBeNull();
    expect(within(list).queryByTestId("exercise-incline-dumbbell-press")).toBeNull(); // draft
    expect(within(list).getByText("Needs: Barbell, Bench, Rack or bench uprights with safety arms")).toBeTruthy();
  });

  it("names what a no-equipment exercise still needs", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/no-equipment/arms" });

    const row = await screen.findByTestId("exercise-chair-dip");
    expect(within(row).getByText("Needs: Sturdy chair or step")).toBeTruthy();
    expect(screen.queryByTestId("exercise-diamond-push-up")).toBeNull(); // draft
  });

  it("lists the pull-up under the equipment mode's Back, with its bar", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/equipment/back" });

    const row = await screen.findByTestId("exercise-pull-up");
    expect(within(row).getByText("Needs: Securely fixed pull-up bar")).toBeTruthy();
    expect(screen.queryByTestId("exercise-chin-up")).toBeNull(); // draft
  });
});

describe("exercise details", () => {
  it("opens from the list and shows everything needed to do it", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/no-equipment/chest" });

    await fireEvent.press(await screen.findByTestId("exercise-push-up"));
    await waitFor(() => expect(screen).toHavePathname("/workouts/no-equipment/exercises/push-up"));

    await screen.findByTestId("screen-exercise");
    expect(within(screen.getByTestId("exercise-demo")).getByText("Demonstration coming soon")).toBeTruthy();
    expect(within(screen.getByTestId("fact-difficulty")).getByText("Beginner")).toBeTruthy();
    expect(within(screen.getByTestId("fact-prescription")).getByText("Sets and reps")).toBeTruthy();
    expect(within(screen.getByTestId("fact-prescription")).getByText("3 × 8–15 reps")).toBeTruthy();
    expect(within(screen.getByTestId("fact-rest")).getByText("1 min")).toBeTruthy();
    expect(within(screen.getByTestId("fact-equipment")).getByText("None needed")).toBeTruthy();

    const muscles = screen.getByTestId("section-muscles");
    expect(within(muscles).getByText("Chest")).toBeTruthy();
    expect(within(muscles).getByText("Also works: Triceps, Front shoulders, Abs")).toBeTruthy();

    const steps = screen.getByTestId("section-steps");
    expect(within(steps).getByText("1.")).toBeTruthy();
    expect(within(steps).getByText("4.")).toBeTruthy();
    expect(within(steps).getByText("Push the floor away to straighten your arms.")).toBeTruthy();

    expect(within(screen.getByTestId("section-breathing")).getByText(/Breathe in as you lower/)).toBeTruthy();
    expect(within(screen.getByTestId("section-tips")).getByText(/incline push-ups/)).toBeTruthy();
    expect(within(screen.getByTestId("section-mistakes")).getByText("Letting your hips sag.")).toBeTruthy();
  });

  it("offers only approved alternatives, and opens them", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/no-equipment/exercises/push-up" });

    const alternatives = await screen.findByTestId("section-alternatives");
    expect(within(alternatives).getByTestId("alternative-incline-push-up")).toBeTruthy();
    expect(within(alternatives).queryByTestId("alternative-decline-push-up")).toBeNull(); // draft

    await fireEvent.press(within(alternatives).getByTestId("alternative-incline-push-up"));
    await waitFor(() => expect(screen).toHavePathname("/workouts/no-equipment/exercises/incline-push-up"));
    expect(await screen.findByText("Sturdy table")).toBeTruthy();

    await act(async () => {
      testRouter.back();
    });
    await waitFor(() => expect(screen).toHavePathname("/workouts/no-equipment/exercises/push-up"));
  });

  it("shows a timed exercise's duration and a gym exercise's equipment", async () => {
    await renderRouter(APP_DIR, { initialUrl: "/workouts/equipment/exercises/barbell-bench-press" });

    await screen.findByTestId("screen-exercise");
    expect(
      within(screen.getByTestId("fact-equipment")).getByText("Barbell, Bench, Rack or bench uprights with safety arms"),
    ).toBeTruthy();
    expect(within(screen.getByTestId("section-steps")).getByText(/Set the safety arms/)).toBeTruthy();
    expect(within(screen.getByTestId("fact-rest")).getByText("2 min")).toBeTruthy();
    expect(within(screen.getByTestId("fact-difficulty")).getByText("Intermediate")).toBeTruthy();
    // Its alternatives are drafts, so the section isn't there at all.
    expect(screen.queryByTestId("section-alternatives")).toBeNull();
  });
});

describe("addresses that lead nowhere", () => {
  it.each([
    ["a category from the other mode", "/workouts/no-equipment/biceps-triceps", "Category not found"],
    ["an unknown category", "/workouts/equipment/neck", "Category not found"],
    ["a category under an unknown mode", "/workouts/bodyweight/chest", "Category not found"],
    ["an exercise under the other mode", "/workouts/equipment/exercises/push-up", "Exercise not found"],
    ["the pull-up under the no-equipment mode", "/workouts/no-equipment/exercises/pull-up", "Exercise not found"],
    ["a draft exercise", "/workouts/no-equipment/exercises/decline-push-up", "Exercise not found"],
    ["an unknown exercise", "/workouts/no-equipment/exercises/nope", "Exercise not found"],
  ])("shows not found for %s", async (_, url, message) => {
    await renderRouter(APP_DIR, { initialUrl: url });

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText("How to do it")).toBeNull();
    expect(screen.queryByTestId("exercise-list")).toBeNull();
  });
});
