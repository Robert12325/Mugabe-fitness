import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { latestWeight, loggedStreak, workoutsThisWeek } from "@/daily/stats";
import { formatKg, type DailyEntry, type WeightEntry } from "@/lib/daily";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** Three numbers from the member's own log: streak, workouts, weight. */
export function StatStrip({ log, weights, today }: { log: DailyEntry[]; weights: WeightEntry[]; today: string }) {
  const streak = loggedStreak(log, weights, today);
  const workouts = workoutsThisWeek(log, today);
  const weight = latestWeight(weights);

  return (
    <View style={styles.strip} testID="stat-strip">
      <Stat icon="flame" value={`${streak}`} label="day streak" testID="stat-streak" />
      <Stat icon="barbell" value={`${workouts}/7`} label="workouts this week" testID="stat-workouts" />
      <Stat icon="scale-outline" value={weight ? `${formatKg(weight.grams)}` : "—"} label={weight ? "kg, latest" : "no weigh-in yet"} testID="stat-weight" />
    </View>
  );
}

function Stat({ icon, value, label, testID }: { icon: IconName; value: string; label: string; testID: string }) {
  return (
    <View style={styles.stat} testID={testID} accessible accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <AppText variant="title" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="small" tone="secondary" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  value: { fontSize: 24, lineHeight: 28 },
});
