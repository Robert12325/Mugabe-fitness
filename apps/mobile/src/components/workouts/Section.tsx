import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** A titled card on the exercise screen. */
export function Section({ title, icon, children, testID }: { title: string; icon?: IconName; children: ReactNode; testID?: string }) {
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.head}>
        {icon ? <Ionicons name={icon} size={16} color={colors.gold} /> : null}
        <AppText variant="eyebrow" tone="gold" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}

/** Lines of text, numbered (steps) or bulleted (everything else). */
export function Lines({ lines, numbered = false }: { lines: readonly string[]; numbered?: boolean }) {
  return (
    <View style={styles.lines}>
      {lines.map((line, index) => (
        <View key={`${index}:${line}`} style={styles.line}>
          {numbered ? (
            <View style={styles.number}>
              <AppText variant="small" tone="gold" style={styles.numberText}>
                {`${index + 1}.`}
              </AppText>
            </View>
          ) : (
            <View style={styles.bullet} />
          )}
          <AppText tone="secondary" style={styles.lineText}>
            {line}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  lines: { gap: spacing.md },
  line: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { fontWeight: "800" },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold, marginTop: 8, marginHorizontal: 4 },
  lineText: { flex: 1 },
});
