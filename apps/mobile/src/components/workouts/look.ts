import type Ionicons from "@expo/vector-icons/Ionicons";
import type { CategorySlug, Difficulty, WorkoutModeId } from "@mugabe/fitness-content";
import { colors } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** One icon per mode and per body part, used wherever they appear. */
export const MODE_ICONS: Record<WorkoutModeId, IconName> = {
  equipment: "barbell",
  "no-equipment": "body",
};

export const MODE_SHORT: Record<WorkoutModeId, string> = {
  equipment: "Gym",
  "no-equipment": "No equipment",
};

export const CATEGORY_ICONS: Record<CategorySlug, IconName> = {
  chest: "fitness",
  back: "body",
  shoulders: "barbell",
  "biceps-triceps": "barbell",
  arms: "hand-left",
  "legs-glutes": "walk",
  "abs-core": "flame",
  "full-body": "accessibility",
  "cardio-conditioning": "heart",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: colors.success,
  intermediate: colors.gold,
  advanced: colors.danger,
};
