import Ionicons from "@expo/vector-icons/Ionicons";
import { CATALOGUE, type WorkoutMode } from "@mugabe/fitness-content";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Glow } from "@/components/Glow";
import { colors, radius, spacing } from "@/theme";
import { MODE_ICONS } from "./look";

/** One of the two workout modes, as a large tappable card with its real counts. */
export function ModeCard({ mode, onPress }: { mode: WorkoutMode; onPress: () => void }) {
  const exercises = CATALOGUE.published(mode.id).length;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={mode.name}
      accessibilityHint="Shows this mode's body-part categories"
      testID={`mode-${mode.id}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Glow size={180} strength={0.16} />

      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name={MODE_ICONS[mode.id]} size={28} color={colors.gold} />
        </View>
        <View style={styles.free}>
          <AppText variant="eyebrow" tone="gold" style={styles.freeText}>
            Free
          </AppText>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="title">{mode.name}</AppText>
        <AppText tone="secondary">{mode.summary}</AppText>
      </View>

      <View style={styles.stats}>
        <Stat icon="list" value={`${exercises}`} label="exercises" />
        <Stat icon="grid" value={`${mode.categories.length}`} label="body parts" />
      </View>

      <View style={styles.chips}>
        {mode.categories.map((category) => (
          <View key={category.slug} style={styles.chip}>
            <AppText variant="small" tone="secondary">
              {category.name}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <AppText variant="button" tone="onGold">
          Choose a body part
        </AppText>
        <Ionicons name="arrow-forward" size={16} color={colors.onGold} />
      </View>
    </Pressable>
  );
}

function Stat({ icon, value, label }: { icon: React.ComponentProps<typeof Ionicons>["name"]; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={colors.gold} />
      <AppText variant="bodyStrong">{value}</AppText>
      <AppText variant="small" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#100d05",
    borderColor: "rgba(212,175,55,0.35)",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    overflow: "hidden",
  },
  pressed: { borderColor: colors.gold, opacity: 0.92 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
  free: {
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  freeText: { letterSpacing: 1.5 },
  titleBlock: { gap: spacing.xs },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
  },
});
