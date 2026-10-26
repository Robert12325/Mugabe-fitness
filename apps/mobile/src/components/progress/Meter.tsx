import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, radius, spacing } from "@/theme";

/**
 * One amount against the coach's target. Over or under is drawn the same
 * way: these are records, not verdicts.
 */
export function Meter({
  label,
  value,
  target,
  percent,
  testID,
}: {
  label: string;
  /** e.g. "1,850" — or "" when nothing is logged. */
  value: string;
  /** e.g. "2,000 kcal" — or "" when the coach set none. */
  target: string;
  /** null when either side is missing. */
  percent: number | null;
  testID?: string;
}) {
  const width = percent === null ? 0 : Math.min(100, Math.max(0, percent));

  return (
    <View
      style={styles.box}
      testID={testID}
      accessible
      accessibilityLabel={`${label}: ${value || "not logged"} of ${target || "no target yet"}`}
    >
      <AppText variant="eyebrow" tone="muted" style={styles.label}>
        {label}
      </AppText>
      <AppText variant="heading">{value || "—"}</AppText>
      <AppText variant="small" tone="muted">
        / {target || "no target yet"}
      </AppText>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${width}%` }]} />
      </View>

      {percent !== null && (
        <AppText variant="small" tone="muted">
          {Math.round(percent)}%
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexGrow: 1,
    flexBasis: "45%",
    gap: 2,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { letterSpacing: 1.6 },
  track: {
    height: 6,
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.gold },
});
