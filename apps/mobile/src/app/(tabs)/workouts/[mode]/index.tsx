import Ionicons from "@expo/vector-icons/Ionicons";
import { CATALOGUE, getMode } from "@mugabe/fitness-content";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Glow } from "@/components/Glow";
import { Screen } from "@/components/Screen";
import { CATEGORY_ICONS, MODE_ICONS } from "@/components/workouts/look";
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
      <Stack.Screen options={{ title: "" }} />

      <View style={styles.hero}>
        <Glow size={170} />
        <View style={styles.icon}>
          <Ionicons name={MODE_ICONS[mode.id]} size={28} color={colors.gold} />
        </View>
        <AppText variant="title" accessibilityRole="header">
          {mode.name}
        </AppText>
        <AppText tone="secondary">{mode.summary}</AppText>

        <View style={styles.kit}>
          <Ionicons name="bag-handle-outline" size={18} color={colors.gold} />
          <View style={styles.kitText}>
            <AppText variant="eyebrow" tone="gold">
              You need
            </AppText>
            <AppText variant="small" tone="secondary">
              {mode.kit}
            </AppText>
          </View>
        </View>
      </View>

      <AppText variant="heading" accessibilityRole="header">
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
                <Glow size={100} strength={0.12} />
                <Ionicons name={CATEGORY_ICONS[category.slug]} size={30} color={colors.gold} />
                <View style={styles.tileText}>
                  <AppText variant="bodyStrong" numberOfLines={2}>
                    {category.name}
                  </AppText>
                  <AppText variant="small" tone={count ? "secondary" : "muted"}>
                    {count ? status : "Coming soon"}
                  </AppText>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.note}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
        <AppText variant="small" tone="muted" style={styles.noteText}>
          Every exercise is checked by your coach before it appears here.
        </AppText>
      </View>
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
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  kit: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  kitText: { flex: 1, gap: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs },
  cell: { width: "50%", padding: spacing.xs },
  tile: {
    minHeight: 132,
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderColor: "rgba(212,175,55,0.2)",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    overflow: "hidden",
  },
  tileText: { gap: 2 },
  pressed: { borderColor: colors.gold },
  note: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  noteText: { flex: 1 },
});
