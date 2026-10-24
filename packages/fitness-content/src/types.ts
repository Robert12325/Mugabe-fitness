/**
 * The shape of the Mugabe Fitness exercise catalogue, shared by the website
 * and the mobile app so both show the same content.
 *
 * Plain data and types only: no React, no platform code, no dependencies.
 */

/** The two ways to train. Also the URL segment: /workouts/<mode>. */
export type WorkoutModeId = "equipment" | "no-equipment";

/**
 * A body-part category within a mode. Also the URL segment:
 * /workouts/<mode>/<category>. Arms are split differently per mode, so
 * "biceps-triceps" is gym-only and "arms" is bodyweight-only.
 */
export type CategorySlug =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps-triceps"
  | "arms"
  | "legs-glutes"
  | "abs-core"
  | "full-body"
  | "cardio-conditioning";

export type Category = {
  slug: CategorySlug;
  /** English name. The website translates it; the app shows it as is. */
  name: string;
};

export type WorkoutMode = {
  id: WorkoutModeId;
  name: string;
  /** One line under the name. */
  summary: string;
  /** What you need, in plain words. */
  kit: string;
  categories: readonly Category[];
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * Equipment an exercise needs, always named on the exercise.
 *
 * - gym: machines and free weights.
 * - home: training kit for home (a pull-up bar, a resistance band and its
 *   door anchor). Still equipment: these exercises belong to the equipment
 *   mode.
 * - household: everyday things a bodyweight exercise may use (a sturdy
 *   chair, table or towel). The only kind the no-equipment mode allows.
 */
export type EquipmentId =
  // Gym
  | "dumbbells"
  | "barbell"
  | "ez-bar"
  | "kettlebell"
  | "cable-machine"
  | "bench"
  | "squat-rack"
  | "rack-with-safeties"
  | "lat-pulldown-machine"
  | "leg-press-machine"
  | "rowing-machine"
  | "air-bike"
  | "battle-ropes"
  | "hanging-station"
  // Home
  | "pull-up-bar"
  | "resistance-band"
  // Holds a resistance band in a door: an exercise using it lists the band too.
  | "door-anchor"
  // Household
  | "sturdy-table"
  | "towel"
  | "sturdy-chair";

export type EquipmentKind = "gym" | "home" | "household";

export type Muscle =
  | "chest"
  | "upper-chest"
  | "lats"
  | "upper-back"
  | "lower-back"
  | "traps"
  | "front-delts"
  | "side-delts"
  | "rear-delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "adductors"
  | "calves"
  | "abs"
  | "obliques"
  | "hip-flexors"
  | "heart-and-lungs";

/** How much of it to do. Ranges are inclusive. */
export type Prescription =
  | { kind: "reps"; sets: number; reps: readonly [min: number, max: number]; perSide?: boolean }
  | { kind: "time"; sets: number; seconds: number; perSide?: boolean };

/**
 * How the movement is shown. Only original artwork made for Mugabe Fitness
 * or clips the coach records; never copied media.
 */
export type Demonstration =
  | { kind: "diagram"; id: string; alt: string }
  | { kind: "coming-soon" };

export type Exercise = {
  /** Unique across the whole catalogue; also the URL segment. */
  slug: string;
  name: string;
  mode: WorkoutModeId;
  categories: readonly CategorySlug[];
  primaryMuscles: readonly Muscle[];
  secondaryMuscles: readonly Muscle[];
  /** Empty means truly nothing needed. */
  equipment: readonly EquipmentId[];
  difficulty: Difficulty;
  /** Sets and reps, or a duration. A draft recommendation until `amountsConfirmed`. */
  prescription: Prescription;
  /** A draft recommendation until `amountsConfirmed`. */
  restSeconds: number;
  /**
   * Set only when the coach has confirmed the sets, reps, duration and rest.
   * Until then they are draft recommendations, and the exercise can't be
   * approved.
   */
  amountsConfirmed?: true;
  /** Execution, in order. */
  steps: readonly string[];
  breathing: readonly string[];
  tips: readonly string[];
  mistakes: readonly string[];
  /** Slugs of other exercises in the catalogue. */
  alternatives: readonly string[];
  demo: Demonstration;
  /** Only "coach-approved" exercises are shown to clients. */
  review: "draft" | "coach-approved";
  /**
   * For the coach only, never shown to clients: how the technical review
   * left this draft, and what to check before approving it. A draft with
   * no entry is unchanged since it was first written.
   */
  coachReview?: CoachReview;
};

export type CoachReview = {
  /** "removed": taken out of the proposed catalogue; kept on record only. */
  status: "new" | "changed" | "recommend-removal" | "removed";
  /** What changed, in plain words. */
  changes: readonly string[];
  /** What the coach should check before deciding. */
  check: readonly string[];
};
