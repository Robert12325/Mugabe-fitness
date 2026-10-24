import Ionicons from "@expo/vector-icons/Ionicons";
import { CATALOGUE, getMode } from "@mugabe/fitness-content";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { MODE_ICONS } from "@/components/workouts/ModeCard";
import { WorkoutNotFound } from "@/components/workouts/WorkoutNotFound";
import { colors, radius, spacing } from "@/theme";

/** One workout mode and its body-part categories. */
export default function WorkoutModeScreen() {
  const params = useLocalSearchParams<{ mode: string }>();
  const mode = getMode(String(params.mode));

  if (!mode) return <WorkoutNotFound title="Workout mode not found" testID="screen-workout-mode" />;

  // The stack header sits above, so only the sides need safe-area padding.
  return (
    <Screen testID="screen-workout-mode" edges={["left", "right"]}>
      <Stack.Screen options={{ title: mode.name }} />

      <View style={styles.intro}>
        <View style={styles.icon}>
          <Ionicons name={MODE_ICONS[mode.id]} size={24} color={colors.gold} />
        </View>
        <AppText tone="secondary" style={styles.summary}>
          {mode.summary}
        </AppText>
      </View>

      <View style={styles.kit}>
        <AppText variant="eyebrow" tone="gold">
          You need
        </AppText>
        <AppText variant="small" tone="secondary">
          {mode.kit}
        </AppText>
      </View>

      <AppText variant="eyebrow" tone="gold" accessibilityRole="header">
        Body parts
      </AppText>

      <View style={styles.grid}>
        {mode.categories.map((category) => {
          const count = CATALOGUE.published(mode.id, category.slug).length;
          const status = count ? `${count} ${count === 1 ? "exercise" : "exercises"}` : "Exercises coming soon";

          return (
            <View key={category.slug} style={styles.cell}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/workouts/[mode]/[category]",
                    params: { mode: mode.id, category: category.slug },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${category.name}, ${status}`}
                testID={`category-${category.slug}`}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <AppText variant="bodyStrong">{category.name}</AppText>
                <AppText variant="small" tone={count ? "gold" : "muted"}>
                  {status}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </View>

      <AppText variant="small" tone="muted">
        Every exercise is checked by your coach before it appears here.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: { flex: 1 },
  kit: { gap: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs },
  cell: { width: "50%", padding: spacing.xs },
  tile: {
    minHeight: 96,
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  pressed: { borderColor: colors.gold },
});
