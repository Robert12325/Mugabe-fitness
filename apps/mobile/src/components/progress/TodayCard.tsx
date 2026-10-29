import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { formatDay } from "@/components/progress/DayRow";
import { formatKg, type DailyEntry } from "@/lib/daily";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * Today, exactly as the member's own log says: whether anything is logged
 * and whether they trained. It never suggests a workout was assigned; the
 * app has no coach-assigned plan yet.
 */
export function TodayCard({
  today,
  entry,
  weightGrams,
  onStartWorkout,
  onLogToday,
}: {
  today: string;
  entry: DailyEntry | null;
  weightGrams: number | null;
  onStartWorkout: () => void;
  onLogToday: () => void;
}) {
  const logged = entry !== null || weightGrams !== null;

  const training: { icon: IconName; text: string; tone: "gold" | "secondary" | "muted" } =
    entry?.workout === true
      ? { icon: "checkmark-circle", text: "You trained today", tone: "gold" }
      : entry?.workout === false
        ? { icon: "remove-circle-outline", text: "Logged as no workout today", tone: "secondary" }
        : { icon: "ellipse-outline", text: "Training not logged yet", tone: "muted" };

  return (
    <Card highlight testID="home-today">
      <View style={styles.head}>
        <AppText variant="eyebrow" tone="gold">
          Today
        </AppText>
        <AppText variant="small" tone="muted">
          {formatDay(today)}
        </AppText>
      </View>

      <View style={styles.lines}>
        <Line
          icon={logged ? "checkmark-circle" : "ellipse-outline"}
          text={logged ? "Today is logged" : "Not logged yet"}
          tone={logged ? "gold" : "muted"}
          testID="today-logged"
        />
        <Line icon={training.icon} text={training.text} tone={training.tone} testID="today-trained" />
        {weightGrams !== null ? (
          <Line icon="scale-outline" text={`Weighed in at ${formatKg(weightGrams)} kg`} tone="secondary" testID="today-weight" />
        ) : null}
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label="Start workout" onPress={onStartWorkout} testID="today-start-workout" />
        </View>
        <View style={styles.action}>
          <Button label={logged ? "Edit today" : "Log today"} variant="outline" onPress={onLogToday} testID="today-log" />
        </View>
      </View>
    </Card>
  );
}

function Line({ icon, text, tone, testID }: { icon: IconName; text: string; tone: "gold" | "secondary" | "muted"; testID: string }) {
  const color = tone === "gold" ? colors.gold : tone === "secondary" ? colors.textSecondary : colors.textMuted;
  return (
    <View style={styles.line} testID={testID}>
      <Ionicons name={icon} size={18} color={color} />
      <AppText tone={tone === "gold" ? "default" : tone} style={styles.lineText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lines: { gap: spacing.sm },
  line: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  lineText: { flex: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  action: { flexGrow: 1, flexBasis: 140, borderRadius: radius.pill },
});
