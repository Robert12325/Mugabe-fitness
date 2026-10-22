import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radius, spacing } from "@/theme";

/** The dark, hairline-bordered panel the website uses for every section. */
export function Card({
  highlight = false,
  style,
  ...props
}: ViewProps & { highlight?: boolean }) {
  return (
    <View
      {...props}
      style={[styles.card, highlight && styles.highlight, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  highlight: {
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
  },
});
