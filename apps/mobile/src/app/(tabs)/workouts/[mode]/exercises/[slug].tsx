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
  isPendingReview,
} from "@mugabe/fitness-content";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Glow } from "@/components/Glow";
import { Screen } from "@/components/Screen";
import { DifficultyPill } from "@/components/workouts/DifficultyPill";
import { CATEGORY_ICONS } from "@/components/workouts/look";
import { RestTimer } from "@/components/workouts/RestTimer";
import { Lines, Section } from "@/components/workouts/Section";
import { WorkoutNotFound } from "@/components/workouts/WorkoutNotFound";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

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
  const facts: [label: string, value: string, testID: string, icon: IconName][] = [
    ["Difficulty", DIFFICULTY_NAMES[exercise.difficulty], "fact-difficulty", "speedometer-outline"],
    [
      exercise.prescription.kind === "time" ? "Duration" : "Sets and reps",
      formatPrescription(exercise.prescription),
      "fact-prescription",
      exercise.prescription.kind === "time" ? "time-outline" : "repeat",
    ],
    ["Rest between sets", formatRest(exercise.restSeconds), "fact-rest", "hourglass-outline"],
    ["Equipment", equipment.length ? equipment.join(", ") : "None needed", "fact-equipment", "barbell-outline"],
  ];

  return (
    <Screen testID="screen-exercise" edges={["left", "right"]}>
      <Stack.Screen options={{ title: "" }} />

      <View style={styles.titleBlock}>
        <AppText variant="eyebrow" tone="gold">
          {mode.name} · {exercise.categories.map((slug) => CATEGORY_NAMES[slug]).join(", ")}
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {exercise.name}
        </AppText>
        <DifficultyPill difficulty={exercise.difficulty} />
      </View>

      {isPendingReview(exercise) && (
        <View style={styles.pending} testID="pending-review" accessibilityRole="text">
          <Ionicons name="information-circle-outline" size={18} color={colors.gold} />
          <AppText variant="small" tone="gold" style={styles.flex}>
            Not yet reviewed by your coach. The instructions and suggested amounts may change.
          </AppText>
        </View>
      )}

      <View style={styles.demo} testID="exercise-demo">
        <Glow size={220} strength={0.12} />
        <Ionicons name={CATEGORY_ICONS[exercise.categories[0]] ?? "fitness"} size={120} color="rgba(212,175,55,0.08)" style={styles.watermark} />
        <View style={styles.play}>
          <Ionicons name="videocam-outline" size={26} color={colors.gold} />
        </View>
        <AppText variant="bodyStrong">Demonstration coming soon</AppText>
        <AppText variant="small" tone="secondary" style={styles.center}>
          {exercise.demo.kind === "diagram" ? exercise.demo.alt : "Your coach will record this one."}
        </AppText>
      </View>

      <View style={styles.facts}>
        {facts.map(([label, value, testID, icon]) => (
          <View key={label} style={styles.factCell}>
            <View style={styles.fact} testID={testID}>
              <Ionicons name={icon} size={18} color={colors.gold} />
              <AppText variant="eyebrow" tone="muted" style={styles.factLabel}>
                {label}
              </AppText>
              <AppText variant="bodyStrong">{value}</AppText>
            </View>
          </View>
        ))}
      </View>

      {exercise.restSeconds > 0 ? <RestTimer key={exercise.slug} seconds={exercise.restSeconds} /> : null}

      <Section title="Target muscles" icon="body-outline" testID="section-muscles">
        <View style={styles.chips}>
          {exercise.primaryMuscles.map((muscle) => (
            <View key={muscle} style={styles.chip}>
              <AppText variant="small" style={styles.chipText}>
                {MUSCLE_NAMES[muscle]}
              </AppText>
            </View>
          ))}
        </View>
        {exercise.secondaryMuscles.length > 0 && (
          <AppText variant="small" tone="muted">
            Also works: {exercise.secondaryMuscles.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}
          </AppText>
        )}
      </Section>

      <Section title="How to do it" icon="list-outline" testID="section-steps">
        <Lines lines={exercise.steps} numbered />
      </Section>

      <Section title="Breathing" icon="leaf-outline" testID="section-breathing">
        <Lines lines={exercise.breathing} />
      </Section>

      {exercise.tips.length > 0 && (
        <Section title="Technique tips" icon="bulb-outline" testID="section-tips">
          <Lines lines={exercise.tips} />
        </Section>
      )}

      <Section title="Common mistakes" icon="warning-outline" testID="section-mistakes">
        <Lines lines={exercise.mistakes} />
      </Section>

      {alternatives.length > 0 && (
        <Section title="Alternatives" icon="swap-horizontal-outline" testID="section-alternatives">
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
              <View style={styles.altIcon}>
                <Ionicons name={CATEGORY_ICONS[alternative.categories[0]] ?? "fitness"} size={18} color={colors.gold} />
              </View>
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
  titleBlock: { gap: spacing.sm },
  pending: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    backgroundColor: colors.goldTint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  demo: {
    aspectRatio: 16 / 10,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
  watermark: { position: "absolute", left: -10, bottom: -20 },
  play: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.5)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  facts: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs },
  factCell: { width: "50%", padding: spacing.xs },
  fact: {
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 96,
  },
  factLabel: { letterSpacing: 1.2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
  },
  chipText: { color: colors.goldLight, fontWeight: "700" },
  alternative: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  altIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { borderColor: colors.gold },
  flex: { flex: 1 },
});
