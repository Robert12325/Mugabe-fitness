import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { colors, radius, spacing } from "@/theme";

/** Which days they trained: gold = done, red outline = skipped, empty =
 *  not logged. Each square carries its word for screen readers. */
export function WorkoutRow({
  days,
  done,
  answered,
}: {
  days: { on: string; workout: boolean | null }[];
  done: number;
  answered: number;
}) {
  return (
    <Card testID="workout-row">
      <View style={styles.header}>
        <AppText variant="eyebrow" tone="muted">
          Workout consistency
        </AppText>
        <AppText variant="bodyStrong">
          {done} of {answered} days
        </AppText>
      </View>

      <View style={styles.grid}>
        {days.map((day) => (
          <View
            key={day.on}
            accessible
            accessibilityLabel={`${day.on}: ${day.workout === true ? "trained" : day.workout === false ? "skipped" : "not logged"}`}
            style={[
              styles.cell,
              { width: days.length > 7 ? "8.4%" : "12.4%" },
              day.workout === true ? styles.done : day.workout === false ? styles.skipped : styles.none,
            ]}
          >
            <AppText variant="small" tone={day.workout === true ? "onGold" : "danger"}>
              {day.workout === true ? "✓" : day.workout === false ? "×" : ""}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Legend swatch={styles.done} label="Done" />
        <Legend swatch={styles.skipped} label="Skipped" />
        <Legend swatch={styles.none} label="Not logged" />
      </View>
    </Card>
  );
}

function Legend({ swatch, label }: { swatch: object; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch]} />
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cell: { aspectRatio: 1, borderRadius: radius.sm / 2, alignItems: "center", justifyContent: "center" },
  done: { backgroundColor: colors.gold },
  skipped: { borderWidth: 1, borderColor: "rgba(240,146,140,0.6)", backgroundColor: colors.dangerTint },
  none: { borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.03)" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  swatch: { width: 10, height: 10, borderRadius: 2 },
});
