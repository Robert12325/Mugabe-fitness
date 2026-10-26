import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DIFFICULTY_NAMES,
  equipmentNames,
  formatPrescription,
  type Exercise,
} from "@mugabe/fitness-content";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, radius, spacing } from "@/theme";
import { DifficultyPill } from "./DifficultyPill";
import { CATEGORY_ICONS, MODE_SHORT } from "./look";

/** What an exercise needs, in a few words: "No equipment" or the items. */
export function equipmentLine(exercise: Exercise) {
  const names = equipmentNames(exercise);
  return names.length ? `Needs: ${names.join(", ")}` : "No equipment";
}

/** One exercise in a list: its body-part icon, amounts, kit and difficulty. */
export function ExerciseRow({
  exercise,
  onPress,
  showMode = false,
}: {
  exercise: Exercise;
  onPress: () => void;
  /** Search results mix both modes, so they say which one. */
  showMode?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}, ${DIFFICULTY_NAMES[exercise.difficulty]}`}
      accessibilityHint="Opens how to do this exercise"
      testID={`exercise-${exercise.slug}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name={CATEGORY_ICONS[exercise.categories[0]] ?? "fitness"} size={22} color={colors.gold} />
      </View>

      <View style={styles.text}>
        <AppText variant="bodyStrong">{exercise.name}</AppText>
        <AppText variant="small" tone="secondary">
          {showMode ? `${MODE_SHORT[exercise.mode]} · ` : ""}
          {formatPrescription(exercise.prescription)}
        </AppText>
        <AppText variant="small" tone="muted" numberOfLines={2}>
          {equipmentLine(exercise)}
        </AppText>
      </View>

      <View style={styles.end}>
        <DifficultyPill difficulty={exercise.difficulty} />
        <Ionicons name="chevron-forward" size={18} color={colors.gold} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pressed: { borderColor: colors.gold },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  end: { alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm, alignSelf: "stretch" },
});
