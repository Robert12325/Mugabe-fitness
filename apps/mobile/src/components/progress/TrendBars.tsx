import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { daysBetween } from "@/lib/daily";
import { colors, radius, spacing } from "@/theme";

/**
 * A value over the range, one bar per day at its real position, so a gap
 * in logging shows as a gap. Built from plain views — no chart library.
 * The scale is padded by at least `minSpan` so a steady week reads as
 * steady rather than as noise blown up to fill the box.
 */
export function TrendBars({
  title,
  points,
  from,
  to,
  format,
  unit,
  minSpan,
  target,
  empty,
  testID,
}: {
  title: string;
  points: { on: string; value: number }[];
  from: string;
  to: string;
  format: (value: number) => string;
  unit: string;
  minSpan: number;
  /** The coach's target, shown as a line when set. */
  target?: number | null;
  empty: string;
  testID?: string;
}) {
  const days = daysBetween(from, to) + 1;

  if (points.length === 0) {
    return (
      <Card testID={testID}>
        <AppText variant="eyebrow" tone="muted">
          {title}
        </AppText>
        <AppText tone="muted">{empty}</AppText>
      </Card>
    );
  }

  const values = points.map((point) => point.value);
  const withTarget = target ? [...values, target] : values;
  const low = Math.min(...withTarget);
  const high = Math.max(...withTarget);
  const span = Math.max(high - low, minSpan);
  const floor = (low + high) / 2 - span / 2;

  // 12%..100% of the height, so the lowest bar is still visible.
  const height = (value: number) => 12 + ((value - floor) / span) * 88;
  const byDay = new Map(points.map((point) => [daysBetween(from, point.on), point.value]));

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <Card testID={testID}>
      <View style={styles.header}>
        <AppText variant="eyebrow" tone="muted">
          {title}
        </AppText>
        <AppText variant="bodyStrong">
          {format(first.value)}
          {points.length > 1 ? ` → ${format(last.value)}` : ""} {unit}
        </AppText>
      </View>

      <View
        style={styles.chart}
        accessible
        accessibilityLabel={`${title}: ${format(first.value)} to ${format(last.value)} ${unit}`}
      >
        {target ? <View style={[styles.target, { bottom: `${height(target)}%` }]} /> : null}

        {Array.from({ length: days }, (_, index) => {
          const value = byDay.get(index);

          return (
            <View key={index} style={styles.slot}>
              {value !== undefined && (
                <View style={[styles.bar, { height: `${height(value)}%` }]} />
              )}
            </View>
          );
        })}
      </View>

      {target ? (
        <AppText variant="small" tone="muted">
          Dashed line: your coach&apos;s target, {format(target)} {unit}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: spacing.sm },
  chart: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginTop: spacing.sm,
  },
  slot: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: radius.sm / 3, backgroundColor: colors.gold },
  target: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.45)",
  },
});
