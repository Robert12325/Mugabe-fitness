import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { formatCount, formatDeltaKg, formatKg, fromUnits, type Summary } from "@/lib/daily";
import { spacing } from "@/theme";

function avg(value: number | null, unit: string, scale = 1) {
  if (value === null) return "—";

  return scale === 1 ? `${formatCount(value)} ${unit}`.trim() : `${fromUnits(Math.round(value), scale)} ${unit}`;
}

/** Averages over the days that logged each value, as on the website. */
export function SummaryCard({ title, summary, days }: { title: string; summary: Summary; days: number }) {
  const rows: { label: string; value: string }[] = [
    { label: "Avg calories", value: avg(summary.caloriesKcal, "kcal") },
    { label: "Avg protein", value: avg(summary.proteinG, "g") },
    { label: "Avg water", value: avg(summary.waterMl, "L", 1000) },
    { label: "Avg steps", value: summary.steps === null ? "—" : `${formatCount(summary.steps)}/day` },
    { label: "Avg sleep", value: avg(summary.sleepMin, "h", 60) },
    {
      label: "Avg energy",
      value: summary.energy === null ? "—" : `${Math.round(summary.energy * 10) / 10}/10`,
    },
    { label: "Workouts", value: `${summary.workoutsDone}/${summary.workoutsAnswered}` },
    {
      label: "Weight",
      value:
        summary.weight === null
          ? "—"
          : summary.weight.from === summary.weight.to
            ? `${formatKg(summary.weight.to)} kg`
            : `${formatKg(summary.weight.from)} → ${formatKg(summary.weight.to)} kg (${formatDeltaKg(summary.weight.to - summary.weight.from)})`,
    },
    {
      label: "Waist",
      value:
        summary.waist === null
          ? "—"
          : summary.waist.from === summary.waist.to
            ? `${fromUnits(summary.waist.to, 10)} cm`
            : `${fromUnits(summary.waist.from, 10)} → ${fromUnits(summary.waist.to, 10)} cm`,
    },
  ];

  return (
    <Card testID="summary-card">
      <View style={styles.header}>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="small" tone="muted">
          {summary.daysLogged} of {days} days logged
        </AppText>
      </View>

      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.cell}>
            <AppText variant="eyebrow" tone="muted" style={styles.label}>
              {row.label}
            </AppText>
            <AppText variant="bodyStrong">{row.value}</AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg },
  cell: { width: "50%", paddingRight: spacing.sm, gap: 2 },
  label: { letterSpacing: 1.4 },
});
