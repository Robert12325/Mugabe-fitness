import type { Category, CategorySlug, EquipmentId, EquipmentKind, WorkoutMode, WorkoutModeId } from "./types";

/**
 * English category names: the one place they are written. The website's
 * English labels point here; its Hindi and Hinglish live in its i18n file.
 */
export const CATEGORY_NAMES: Readonly<Record<CategorySlug, string>> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  "biceps-triceps": "Biceps and triceps",
  arms: "Arms",
  "legs-glutes": "Legs and glutes",
  "abs-core": "Abs and core",
  "full-body": "Full body",
  "cardio-conditioning": "Cardio and conditioning",
};

const categories = (...slugs: CategorySlug[]): Category[] =>
  slugs.map((slug) => ({ slug, name: CATEGORY_NAMES[slug] }));

/** The two workout modes and their body-part categories, in display order. */
export const MODES: readonly WorkoutMode[] = [
  {
    id: "equipment",
    name: "Workouts with Equipment",
    summary: "Gym training with free weights, cables and machines.",
    kit: "Dumbbells, barbells, cables, machines, benches and resistance bands.",
    categories: categories(
      "chest",
      "back",
      "shoulders",
      "biceps-triceps",
      "legs-glutes",
      "abs-core",
      "full-body",
      "cardio-conditioning",
    ),
  },
  {
    id: "no-equipment",
    name: "Workouts without Equipment",
    summary: "Bodyweight training for home, outdoors and travel.",
    kit: "Just your body. Any exercise that needs a sturdy chair, table or towel says so.",
    categories: categories(
      "chest",
      "back",
      "shoulders",
      "arms",
      "legs-glutes",
      "abs-core",
      "full-body",
      "cardio-conditioning",
    ),
  },
];

export const MODE_IDS: readonly WorkoutModeId[] = MODES.map((mode) => mode.id);

/** Each mode by its id, for exhaustive lookups. */
export const MODE_BY_ID = Object.fromEntries(MODES.map((mode) => [mode.id, mode])) as Readonly<
  Record<WorkoutModeId, WorkoutMode>
>;

export function isModeId(value: unknown): value is WorkoutModeId {
  return typeof value === "string" && MODE_IDS.some((id) => id === value);
}

export function getMode(id: string): WorkoutMode | undefined {
  return MODES.find((mode) => mode.id === id);
}

export function getCategory(mode: string, slug: string): Category | undefined {
  return getMode(mode)?.categories.find((category) => category.slug === slug);
}

export const EQUIPMENT: Readonly<Record<EquipmentId, { name: string; kind: EquipmentKind }>> = {
  dumbbells: { name: "Dumbbells", kind: "gym" },
  barbell: { name: "Barbell", kind: "gym" },
  "ez-bar": { name: "EZ bar", kind: "gym" },
  kettlebell: { name: "Kettlebell", kind: "gym" },
  "cable-machine": { name: "Cable machine", kind: "gym" },
  bench: { name: "Bench", kind: "gym" },
  "squat-rack": { name: "Squat rack with safety arms", kind: "gym" },
  "rack-with-safeties": { name: "Rack or bench uprights with safety arms", kind: "gym" },
  "lat-pulldown-machine": { name: "Lat pulldown machine", kind: "gym" },
  "leg-press-machine": { name: "Leg press machine", kind: "gym" },
  "rowing-machine": { name: "Rowing machine", kind: "gym" },
  "air-bike": { name: "Air bike", kind: "gym" },
  "battle-ropes": { name: "Battle ropes", kind: "gym" },
  "hanging-station": { name: "Pull-up bar or hanging station", kind: "gym" },
  "pull-up-bar": { name: "Securely fixed pull-up bar", kind: "home" },
  "resistance-band": { name: "Resistance band", kind: "home" },
  "door-anchor": { name: "Secure door anchor (for a resistance band)", kind: "home" },
  "sturdy-table": { name: "Sturdy table", kind: "household" },
  "towel": { name: "Towel", kind: "household" },
  "sturdy-chair": { name: "Sturdy chair or step", kind: "household" },
};

/** Every category slug in either mode, for exhaustive maps. */
export const CATEGORY_SLUGS: readonly CategorySlug[] = Array.from(
  new Set(MODES.flatMap((mode) => mode.categories.map((category) => category.slug))),
);
