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

/** What an exercise needs, in a few words: "No equipment" or the items. */
export function equipmentLine(exercise: Exercise) {
  const names = equipmentNames(exercise);
  return names.length ? `Needs: ${names.join(", ")}` : "No equipment";
}

/** One exercise in a category's list. */
export function ExerciseRow({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}, ${DIFFICULTY_NAMES[exercise.difficulty]}`}
      accessibilityHint="Opens how to do this exercise"
      testID={`exercise-${exercise.slug}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <AppText variant="bodyStrong">{exercise.name}</AppText>
        <AppText variant="small" tone="secondary">
          {formatPrescription(exercise.prescription)} · {DIFFICULTY_NAMES[exercise.difficulty]}
        </AppText>
        <AppText variant="small" tone="muted">
          {equipmentLine(exercise)}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  pressed: { borderColor: colors.gold },
  text: { flex: 1, gap: spacing.xs },
});
