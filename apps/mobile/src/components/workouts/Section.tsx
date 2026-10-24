import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, spacing } from "@/theme";

/** A titled block on the exercise screen. */
export function Section({ title, children, testID }: { title: string; children: ReactNode; testID?: string }) {
  return (
    <View style={styles.section} testID={testID}>
      <AppText variant="eyebrow" tone="gold" accessibilityRole="header">
        {title}
      </AppText>
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
          <AppText tone="gold" style={styles.marker}>
            {numbered ? `${index + 1}.` : "•"}
          </AppText>
          <AppText tone="secondary" style={styles.lineText}>
            {line}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  lines: { gap: spacing.sm },
  line: { flexDirection: "row", gap: spacing.sm },
  marker: { minWidth: 20, color: colors.gold },
  lineText: { flex: 1 },
});
