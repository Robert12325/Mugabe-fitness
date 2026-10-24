import type { CategorySlug, Difficulty, FormatWords, WorkoutModeId } from "@mugabe/fitness-content";
import type { IconName } from "@/components/icons";
import type { StringKey } from "@/lib/i18n";

/**
 * Translation keys for the shared catalogue's modes and categories. Typed
 * as complete records, so a mode or category added to the catalogue fails
 * the type check until it has a label in every language.
 */
export const MODE_TEXT: Record<
  WorkoutModeId,
  { name: StringKey; summary: StringKey; kit: StringKey; icon: IconName }
> = {
  equipment: {
    name: "wk.mode.equipment",
    summary: "wk.mode.equipment.summary",
    kit: "wk.mode.equipment.kit",
    icon: "dumbbell",
  },
  "no-equipment": {
    name: "wk.mode.no-equipment",
    summary: "wk.mode.no-equipment.summary",
    kit: "wk.mode.no-equipment.kit",
    icon: "user",
  },
};

export const CATEGORY_TEXT: Record<CategorySlug, StringKey> = {
  chest: "wk.cat.chest",
  back: "wk.cat.back",
  shoulders: "wk.cat.shoulders",
  "biceps-triceps": "wk.cat.biceps-triceps",
  arms: "wk.cat.arms",
  "legs-glutes": "wk.cat.legs-glutes",
  "abs-core": "wk.cat.abs-core",
  "full-body": "wk.cat.full-body",
  "cardio-conditioning": "wk.cat.cardio-conditioning",
};

/** One line describing what each category trains, for its page's hero. */
export const CATEGORY_DESCRIPTION: Record<CategorySlug, StringKey> = {
  chest: "wk.catText.chest",
  back: "wk.catText.back",
  shoulders: "wk.catText.shoulders",
  "biceps-triceps": "wk.catText.biceps-triceps",
  arms: "wk.catText.arms",
  "legs-glutes": "wk.catText.legs-glutes",
  "abs-core": "wk.catText.abs-core",
  "full-body": "wk.catText.full-body",
  "cardio-conditioning": "wk.catText.cardio-conditioning",
};

/** Short mode labels: "With equipment", "Without equipment". */
export const MODE_SHORT: Record<WorkoutModeId, StringKey> = {
  equipment: "wk.mode.with",
  "no-equipment": "wk.mode.without",
};

export const DIFFICULTY_TEXT: Record<Difficulty, StringKey> = {
  beginner: "wk.diff.beginner",
  intermediate: "wk.diff.intermediate",
  advanced: "wk.diff.advanced",
};

/** The words "3 × 8–12 reps" is written with, in the visitor's language. */
export function formatWords(t: (key: StringKey) => string): FormatWords {
  return {
    reps: t("wk.unit.reps"),
    seconds: t("wk.unit.seconds"),
    perSide: t("wk.unit.perSide"),
    minutes: t("wk.unit.min"),
    secondsShort: t("wk.unit.sec"),
  };
}
