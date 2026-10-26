import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { formatCount, formatKg, fromUnits, type DailyEntry } from "@/lib/daily";
import { colors, spacing } from "@/theme";

export function formatDay(on: string) {
  const [year, month, day] = on.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** One logged day in the history list. Tapping it opens it for editing. */
export function DayRow({
  on,
  entry,
  weightGrams,
  onPress,
}: {
  on: string;
  entry: DailyEntry | null;
  weightGrams: number | null;
  onPress: () => void;
}) {
  const bits = [
    entry?.caloriesKcal != null ? `${formatCount(entry.caloriesKcal)} kcal` : "",
    entry?.proteinG != null ? `${entry.proteinG} g protein` : "",
    entry?.waterMl != null ? `${fromUnits(entry.waterMl, 1000)} L` : "",
    entry?.steps != null ? `${formatCount(entry.steps)} steps` : "",
    weightGrams !== null ? `${formatKg(weightGrams)} kg` : "",
    entry?.workout === true ? "Trained" : entry?.workout === false ? "Skipped" : "",
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${formatDay(on)}`}
      accessibilityHint={bits.join(", ")}
      testID={`day-row-${on}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <AppText variant="bodyStrong">{formatDay(on)}</AppText>
        <AppText variant="small" tone="secondary">
          {bits.join(" · ") || "Notes only"}
        </AppText>
        {entry?.notes ? (
          <AppText variant="small" tone="muted" numberOfLines={1}>
            {entry.notes}
          </AppText>
        ) : null}
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
});
