import Ionicons from "@expo/vector-icons/Ionicons";
import { CATALOGUE, CATEGORY_NAMES, MODES, MUSCLE_NAMES, type Exercise } from "@mugabe/fitness-content";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/components/AppText";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { ExerciseRow } from "@/components/workouts/ExerciseRow";
import { ModeCard } from "@/components/workouts/ModeCard";
import { colors, fonts, radius, spacing } from "@/theme";

/** Every published exercise of both modes, searchable by name, body part or muscle. */
const ALL: readonly Exercise[] = MODES.flatMap((mode) => CATALOGUE.published(mode.id));

function matches(exercise: Exercise, query: string) {
  const words = [
    exercise.name,
    ...exercise.categories.map((slug) => CATEGORY_NAMES[slug]),
    ...exercise.primaryMuscles.map((muscle) => MUSCLE_NAMES[muscle]),
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => words.includes(word));
}

/**
 * The two workout modes, from the catalogue the website also uses, and a
 * search across all of their exercises.
 *
 * Free and open without signing in. Premium content, if it comes, needs its
 * own server-side entitlement; a coaching membership does not unlock it.
 */
export default function WorkoutsScreen() {
  const [query, setQuery] = useState("");
  const searching = query.trim().length >= 2;
  const results = useMemo(() => (searching ? ALL.filter((exercise) => matches(exercise, query.trim())) : []), [query, searching]);

  return (
    <Screen testID="screen-workouts">
      <PageHeader eyebrow="Train" title="Workouts" />

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${ALL.length} exercises`}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search exercises"
          testID="workouts-search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <View style={styles.results} testID="search-results">
          <AppText variant="small" tone="secondary">
            {results.length
              ? `${results.length} ${results.length === 1 ? "exercise" : "exercises"}`
              : `No exercises match “${query.trim()}”. Try a body part, like “chest”.`}
          </AppText>
          {results.map((exercise) => (
            <ExerciseRow
              key={`${exercise.mode}-${exercise.slug}`}
              exercise={exercise}
              showMode
              onPress={() =>
                router.push({ pathname: "/workouts/[mode]/exercises/[slug]", params: { mode: exercise.mode, slug: exercise.slug } })
              }
            />
          ))}
        </View>
      ) : (
        <>
          <AppText tone="secondary">
            Two complete ways to train: in the gym with equipment, or anywhere with just your body.
          </AppText>

          {MODES.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              onPress={() => router.push({ pathname: "/workouts/[mode]", params: { mode: mode.id } })}
            />
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 },
  results: { gap: spacing.md },
});
