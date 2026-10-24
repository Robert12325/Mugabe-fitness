import { CATALOGUE, getCategory, getMode } from "@mugabe/fitness-content";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ExerciseRow } from "@/components/workouts/ExerciseRow";
import { WorkoutNotFound } from "@/components/workouts/WorkoutNotFound";
import { spacing } from "@/theme";

/** A category's exercises: only those the coach has approved. */
export default function WorkoutCategoryScreen() {
  const params = useLocalSearchParams<{ mode: string; category: string }>();
  const mode = getMode(String(params.mode));
  const category = getCategory(String(params.mode), String(params.category));

  if (!mode || !category) return <WorkoutNotFound title="Category not found" testID="screen-workout-category" />;

  const exercises = CATALOGUE.published(mode.id, category.slug);

  return (
    <Screen testID="screen-workout-category" edges={["left", "right"]}>
      <Stack.Screen options={{ title: category.name }} />

      <AppText variant="eyebrow" tone="gold">
        {mode.name}
      </AppText>

      {exercises.length ? (
        <View style={{ gap: spacing.md }} testID="exercise-list">
          {exercises.map((exercise) => (
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
