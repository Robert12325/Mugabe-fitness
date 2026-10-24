import Ionicons from "@expo/vector-icons/Ionicons";
import type { WorkoutMode, WorkoutModeId } from "@mugabe/fitness-content";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export const MODE_ICONS: Record<WorkoutModeId, IconName> = {
  equipment: "barbell",
  "no-equipment": "body",
};

/** One of the two workout modes, as a large tappable card. */
export function ModeCard({ mode, onPress }: { mode: WorkoutMode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={mode.name}
      accessibilityHint="Shows this mode's body-part categories"
      testID={`mode-${mode.id}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name={MODE_ICONS[mode.id]} size={24} color={colors.gold} />
        </View>
        <View style={styles.free}>
          <AppText variant="eyebrow" tone="secondary">
            Free
          </AppText>
        </View>
      </View>

      <AppText variant="heading">{mode.name}</AppText>
      <AppText tone="secondary">{mode.summary}</AppText>

      <View style={styles.chips}>
        {mode.categories.map((category) => (
          <View key={category.slug} style={styles.chip}>
            <AppText variant="small">{category.name}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <AppText variant="button" tone="gold">
          Choose a body part
        </AppText>
        <Ionicons name="arrow-forward" size={16} color={colors.gold} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#100d05",
    borderColor: "rgba(212,175,55,0.35)",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  pressed: { borderColor: colors.gold, opacity: 0.9 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
  free: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
});
