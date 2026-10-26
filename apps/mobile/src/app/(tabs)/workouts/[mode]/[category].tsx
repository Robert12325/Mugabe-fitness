import Ionicons from "@expo/vector-icons/Ionicons";
import { CATALOGUE, DIFFICULTY_NAMES, getCategory, getMode, type Difficulty } from "@mugabe/fitness-content";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Glow } from "@/components/Glow";
import { Screen } from "@/components/Screen";
import { ExerciseRow } from "@/components/workouts/ExerciseRow";
import { CATEGORY_ICONS, DIFFICULTY_COLORS } from "@/components/workouts/look";
import { WorkoutNotFound } from "@/components/workouts/WorkoutNotFound";
import { colors, radius, spacing } from "@/theme";

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

/** A category's exercises: only those the coach has approved. */
export default function WorkoutCategoryScreen() {
  const params = useLocalSearchParams<{ mode: string; category: string }>();
  const mode = getMode(String(params.mode));
  const category = getCategory(String(params.mode), String(params.category));
  const [level, setLevel] = useState<Difficulty | "all">("all");

  if (!mode || !category) return <WorkoutNotFound title="Category not found" testID="screen-workout-category" />;

  const exercises = CATALOGUE.published(mode.id, category.slug);
  // Filters only for difficulties this list actually has.
  const levels = DIFFICULTY_ORDER.filter((difficulty) => exercises.some((exercise) => exercise.difficulty === difficulty));
  const shown = level === "all" ? exercises : exercises.filter((exercise) => exercise.difficulty === level);

  return (
    <Screen testID="screen-workout-category" edges={["left", "right"]}>
      <Stack.Screen options={{ title: "" }} />

      <View style={styles.hero}>
        <Glow size={150} />
        <View style={styles.heroRow}>
          <View style={styles.icon}>
            <Ionicons name={CATEGORY_ICONS[category.slug]} size={26} color={colors.gold} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="eyebrow" tone="gold">
              {mode.name}
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {category.name}
            </AppText>
          </View>
        </View>
        <AppText variant="small" tone="secondary">
          {exercises.length
            ? `${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}, each with steps, breathing and common mistakes.`
            : "Exercises appear here once your coach has checked them."}
        </AppText>
      </View>

      {levels.length > 1 && (
        <View style={styles.filters} accessibilityRole="tablist">
          {(["all", ...levels] as const).map((value) => {
            const selected = value === level;
            const color = value === "all" ? colors.gold : DIFFICULTY_COLORS[value];
            return (
              <Pressable
                key={value}
                onPress={() => setLevel(value)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                testID={`filter-${value}`}
                style={[styles.filter, selected && { backgroundColor: color, borderColor: color }]}
              >
                <AppText variant="small" style={{ fontWeight: "700", color: selected ? colors.onGold : colors.textSecondary }}>
                  {value === "all" ? "All" : DIFFICULTY_NAMES[value]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      {exercises.length ? (
        <View style={{ gap: spacing.md }} testID="exercise-list">
          {shown.map((exercise) => (
            <ExerciseRow
              key={exercise.slug}
              exercise={exercise}
              onPress={() =>
                router.push({
                  pathname: "/workouts/[mode]/exercises/[slug]",
                  params: { mode: mode.id, slug: exercise.slug },
                })
              }
            />
          ))}
        </View>
      ) : (
        <Card testID="exercises-empty">
          <AppText variant="heading">No exercises published here yet</AppText>
          <AppText tone="secondary">Each exercise appears once your coach has checked it.</AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroText: { flex: 1, gap: 2 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
});
