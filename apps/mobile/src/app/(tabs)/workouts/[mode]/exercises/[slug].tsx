import Ionicons from "@expo/vector-icons/Ionicons";
import {
  CATALOGUE,
  CATEGORY_NAMES,
  DIFFICULTY_NAMES,
  MUSCLE_NAMES,
  equipmentNames,
  formatPrescription,
  formatRest,
  getMode,
} from "@mugabe/fitness-content";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Lines, Section } from "@/components/workouts/Section";
import { WorkoutNotFound } from "@/components/workouts/WorkoutNotFound";
import { colors, radius, spacing } from "@/theme";

/**
 * How to do one exercise. Only a coach-approved exercise of this mode
 * opens; a draft's address shows "not found", like any unknown link.
 */
export default function ExerciseScreen() {
  const params = useLocalSearchParams<{ mode: string; slug: string }>();
  const mode = getMode(String(params.mode));
  const exercise = mode ? CATALOGUE.find(mode.id, String(params.slug)) : undefined;

  if (!mode || !exercise) return <WorkoutNotFound title="Exercise not found" testID="screen-exercise" />;

  const equipment = equipmentNames(exercise);
  const alternatives = CATALOGUE.alternativesOf(exercise);
  const facts: [label: string, value: string, testID: string][] = [
    ["Difficulty", DIFFICULTY_NAMES[exercise.difficulty], "fact-difficulty"],
    [exercise.prescription.kind === "time" ? "Duration" : "Sets and reps", formatPrescription(exercise.prescription), "fact-prescription"],
    ["Rest between sets", formatRest(exercise.restSeconds), "fact-rest"],
    ["Equipment", equipment.length ? equipment.join(", ") : "None needed", "fact-equipment"],
  ];

  return (
    <Screen testID="screen-exercise" edges={["left", "right"]}>
      <Stack.Screen options={{ title: exercise.name }} />

      <AppText variant="eyebrow" tone="gold">
        {mode.name} · {exercise.categories.map((slug) => CATEGORY_NAMES[slug]).join(", ")}
      </AppText>

      <Card style={styles.demo} testID="exercise-demo">
        <Ionicons name="videocam-outline" size={28} color={colors.gold} />
        <AppText variant="bodyStrong">Demonstration coming soon</AppText>
        <AppText variant="small" tone="secondary" style={styles.center}>
          {exercise.demo.kind === "diagram" ? exercise.demo.alt : "Your coach will record this one."}
        </AppText>
      </Card>

      <View style={styles.facts}>
        {facts.map(([label, value, testID]) => (
          <View key={label} style={styles.factCell}>
            <View style={styles.fact} testID={testID}>
              <AppText variant="eyebrow" tone="muted">
                {label}
              </AppText>
              <AppText variant="bodyStrong">{value}</AppText>
            </View>
          </View>
        ))}
      </View>

      <Section title="Target muscles" testID="section-muscles">
        <AppText tone="secondary">{exercise.primaryMuscles.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}</AppText>
        {exercise.secondaryMuscles.length > 0 && (
          <AppText variant="small" tone="muted">
            Also works: {exercise.secondaryMuscles.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}
          </AppText>
        )}
      </Section>

      <Section title="How to do it" testID="section-steps">
        <Lines lines={exercise.steps} numbered />
      </Section>

      <Section title="Breathing" testID="section-breathing">
        <Lines lines={exercise.breathing} />
      </Section>

      {exercise.tips.length > 0 && (
        <Section title="Technique tips" testID="section-tips">
          <Lines lines={exercise.tips} />
        </Section>
      )}

      <Section title="Common mistakes" testID="section-mistakes">
        <Lines lines={exercise.mistakes} />
      </Section>

      {alternatives.length > 0 && (
        <Section title="Alternatives" testID="section-alternatives">
          {alternatives.map((alternative) => (
            <Pressable
              key={alternative.slug}
              onPress={() =>
                router.push({
                  pathname: "/workouts/[mode]/exercises/[slug]",
                  params: { mode: mode.id, slug: alternative.slug },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Alternative: ${alternative.name}`}
              testID={`alternative-${alternative.slug}`}
              style={({ pressed }) => [styles.alternative, pressed && styles.pressed]}
            >
              <AppText variant="bodyStrong" style={styles.flex}>
                {alternative.name}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.gold} />
            </Pressable>
          ))}
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  center: { textAlign: "center" },
  facts: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs },
  factCell: { width: "50%", padding: spacing.xs },
  fact: {
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 72,
  },
  alternative: {
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
  flex: { flex: 1 },
});
