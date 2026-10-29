import { CATALOGUE, EQUIPMENT, MODES, type EquipmentId } from "@mugabe/fitness-content";
import { configure, fireEvent, screen, within } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { NO_EQUIPMENT, equipmentOptions, matchesEquipment } from "@/components/workouts/filters";

/**
 * Equipment filters on a body part's list, built only from the catalogue's
 * own equipment metadata, and combined with the difficulty filter.
 */

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.setTimeout(60_000);
configure({ asyncUtilTimeout: 10_000 });

describe("equipment options from the catalogue", () => {
  it("offers exactly the equipment each list uses, with true counts, for every body part", () => {
    for (const mode of MODES) {
      for (const category of mode.categories) {
        const exercises = CATALOGUE.published(mode.id, category.slug);
        const options = equipmentOptions(exercises);

        for (const option of options) {
          expect(option.count).toBe(exercises.filter((exercise) => matchesEquipment(exercise, option.id)).length);
          expect(option.count).toBeGreaterThan(0);
          if (option.id !== NO_EQUIPMENT) expect(option.name).toBe(EQUIPMENT[option.id].name);
        }

        // Every item any exercise lists is offered; nothing else is.
        const used = new Set(exercises.flatMap((exercise) => exercise.equipment));
        expect(options.filter((option) => option.id !== NO_EQUIPMENT).map((option) => option.id).sort()).toEqual([...used].sort());
        expect(options.some((option) => option.id === NO_EQUIPMENT)).toBe(exercises.some((exercise) => exercise.equipment.length === 0));
      }
    }
  });

  it("lists No equipment first, then items in the catalogue's order", () => {
    const options = equipmentOptions(CATALOGUE.published("no-equipment", "chest"));
    const order = Object.keys(EQUIPMENT) as EquipmentId[];

    if (options[0]?.id === NO_EQUIPMENT) options.shift();
    const indexes = options.map((option) => order.indexOf(option.id as EquipmentId));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  it("matches everything for 'all'", () => {
    const exercises = CATALOGUE.published("equipment", "chest");
    expect(exercises.every((exercise) => matchesEquipment(exercise, "all"))).toBe(true);
  });
});

describe("equipment chips on a body part", () => {
  // A body part whose list uses at least two kinds of equipment.
  const target = MODES.flatMap((mode) => mode.categories.map((category) => ({ mode: mode.id, category: category.slug })))
    .map((pair) => ({ ...pair, options: equipmentOptions(CATALOGUE.published(pair.mode, pair.category)) }))
    .find((pair) => pair.options.length >= 2)!;

  it("filters the list to the chosen equipment, and back to everything", async () => {
    const exercises = CATALOGUE.published(target.mode, target.category);
    const choice = target.options[target.options.length - 1];

    await renderRouter("./src/app", { initialUrl: `/workouts/${target.mode}/${target.category}` });
    expect(await screen.findByTestId("equipment-filters")).toBeTruthy();

    await fireEvent.press(screen.getByTestId(`equipment-${choice.id}`));
    const list = screen.getByTestId("exercise-list");
    for (const exercise of exercises) {
      const shown = within(list).queryByTestId(`exercise-${exercise.slug}`) !== null;
      expect(shown).toBe(matchesEquipment(exercise, choice.id));
    }

    await fireEvent.press(screen.getByTestId("equipment-all"));
    for (const exercise of exercises) {
      expect(within(screen.getByTestId("exercise-list")).getByTestId(`exercise-${exercise.slug}`)).toBeTruthy();
    }
  });

  it("explains an empty combination and clears both filters", async () => {
    // Find equipment and a difficulty that never occur together here.
    const exercises = CATALOGUE.published(target.mode, target.category);
    const levels = [...new Set(exercises.map((exercise) => exercise.difficulty))];
    const empty = target.options
      .flatMap((option) => levels.map((level) => ({ option, level })))
      .find(({ option, level }) => !exercises.some((exercise) => exercise.difficulty === level && matchesEquipment(exercise, option.id)));

    if (!empty || levels.length < 2) return; // every combination has an exercise here: nothing to show

    await renderRouter("./src/app", { initialUrl: `/workouts/${target.mode}/${target.category}` });
    await fireEvent.press(await screen.findByTestId(`equipment-${empty.option.id}`));
    await fireEvent.press(screen.getByTestId(`filter-${empty.level}`));

    expect(screen.getByTestId("exercises-no-match")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("filters-clear"));
    expect(screen.queryByTestId("exercises-no-match")).toBeNull();
    expect(within(screen.getByTestId("exercise-list")).getAllByRole("button")).toHaveLength(exercises.length);
  });
});
