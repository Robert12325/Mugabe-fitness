import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Glow } from "./Glow";

/** A raised dark panel; `highlight` adds the gold border and glow. */
export function Card({
  highlight = false,
  style,
  children,
  ...props
}: ViewProps & { highlight?: boolean }) {
  return (
    <View {...props} style={[styles.card, highlight && styles.highlight, style]}>
      {highlight ? <Glow size={190} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  highlight: {
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
});
